import { CachedRoutes, CacheMode, IRouteCachingProvider, log, metric, MetricLoggerUnit, routeToString, } from "@votopia/smart-order-router";
import { DynamoDB, Lambda } from "aws-sdk";
import { Fraction, TradeType, NETWORK_NAME, Protocol } from "@votopia/sdk-core";
import { PairTradeTypeChainId } from "./model/pair-trade-type-chain-id";
import { CachedRoutesMarshaller } from "../../marshalling/cached-routes-marshaller";
export class DynamoRouteCachingProvider extends IRouteCachingProvider {
    constructor({ routesTableName, routesCachingRequestFlagTableName, cachingQuoteLambdaName }) {
        super();
        this.DEFAULT_CACHEMODE_ROUTES_DB = CacheMode.Livemode;
        this.ROUTES_DB_TTL = 24 * 60 * 60; // 24 hours
        this.ROUTES_DB_FLAG_TTL = 2 * 60; // 2 minutes
        // heuristic is within 30 seconds we find a route.
        // we know each chain block time
        // divide those two
        this.DEFAULT_BLOCKS_TO_LIVE_ROUTES_DB = () => 60;
        // For the Ratio we are approximating Phi (Golden Ratio) by creating a fraction with 2 consecutive Fibonacci numbers
        this.ROUTES_DB_BUCKET_RATIO = new Fraction(514229, 317811);
        this.ROUTES_TO_TAKE_FROM_ROUTES_DB = 8;
        // Since this DDB Table is used for Cache, we will fail fast and limit the timeout.
        this.ddbClient = new DynamoDB.DocumentClient({
            maxRetries: 1,
            retryDelayOptions: {
                base: 20,
            },
            httpOptions: {
                timeout: 100,
            },
        });
        this.lambdaClient = new Lambda();
        this.routesTableName = routesTableName;
        this.routesCachingRequestFlagTableName = routesCachingRequestFlagTableName;
        this.cachingQuoteLambdaName = cachingQuoteLambdaName;
    }
    /**
     * Implementation of the abstract method defined in `IRouteCachingProvider`
     * Given a CachedRoutesStrategy (from CACHED_ROUTES_CONFIGURATION),
     * we will find the BlocksToLive associated to the bucket.
     *
     * @param cachedRoutes
     * @param _
     * @protected
     */
    async _getBlocksToLive(_) {
        return this.DEFAULT_BLOCKS_TO_LIVE_ROUTES_DB();
    }
    /**
     * Implementation of the abstract method defined in `IRouteCachingProvider`
     * Fetch the most recent entry from the DynamoDB table for that pair, tradeType, chainId, protocols and bucket
     *
     * @param chainId
     * @param amount
     * @param quoteToken
     * @param tradeType
     * @param _protocols
     * @protected
     */
    async _getCachedRoute(amount, quoteToken, tradeType, protocols, currentBlockNumber, optimistic) {
        const { tokenIn, tokenOut } = this.determineTokenInOut(amount, quoteToken, tradeType);
        const partitionKey = new PairTradeTypeChainId({
            tokenIn: tokenIn.address,
            tokenOut: tokenOut.address,
            tradeType,
        });
        // If no cachedRoutes were found, we try to fetch from the RoutesDb
        metric.putMetric("RoutesDbQuery", 1, MetricLoggerUnit.Count);
        try {
            const queryParams = {
                TableName: this.routesTableName,
                KeyConditionExpression: "#pk = :pk",
                ExpressionAttributeNames: {
                    "#pk": "pairTradeTypeChainId",
                },
                ExpressionAttributeValues: {
                    ":pk": partitionKey.toString(),
                },
            };
            const result = await this.ddbClient.query(queryParams).promise();
            if (result.Items && result.Items.length > 0) {
                metric.putMetric("RoutesDbPreFilterEntriesFound", result.Items.length, MetricLoggerUnit.Count);
                // At this point we might have gotten all the routes we have discovered in the last 24 hours for this pair
                // We will sort the routes by blockNumber, and take the first `ROUTES_TO_TAKE_FROM_ROUTES_DB` routes
                const filteredItems = result.Items
                    // Older routes might not have the protocol field, so we keep them if they don't have it
                    .filter((record) => !record.protocol || protocols.includes(record.protocol))
                    .sort((a, b) => b.blockNumber - a.blockNumber)
                    .slice(0, this.ROUTES_TO_TAKE_FROM_ROUTES_DB);
                result.Items = filteredItems;
                return this.parseCachedRoutes(result, currentBlockNumber, optimistic, partitionKey, amount, protocols);
            }
            else {
                metric.putMetric("RoutesDbEntriesNotFound", 1, MetricLoggerUnit.Count);
                log.warn(`[DynamoRouteCachingProvider] No items found in the query response for ${partitionKey.toString()}`);
            }
        }
        catch (error) {
            metric.putMetric("RoutesDbFetchError", 1, MetricLoggerUnit.Count);
            log.error({ partitionKey, error }, `[DynamoRouteCachingProvider] Error while fetching route from RouteDb`);
        }
        return undefined;
    }
    parseCachedRoutes(result, currentBlockNumber, optimistic, partitionKey, amount, protocols) {
        metric.putMetric(`RoutesDbEntriesFound`, result.Items.length, MetricLoggerUnit.Count);
        const cachedRoutesArr = result.Items.map((record) => {
            // If we got a response with more than 1 item, we extract the binary field from the response
            const itemBinary = record.item;
            // Then we convert it into a Buffer
            const cachedRoutesBuffer = Buffer.from(itemBinary);
            // We convert that buffer into string and parse as JSON (it was encoded as JSON when it was inserted into cache)
            const cachedRoutesJson = JSON.parse(cachedRoutesBuffer.toString());
            // Finally we unmarshal that JSON into a `CachedRoutes` object
            return CachedRoutesMarshaller.unmarshal(cachedRoutesJson);
        });
        const routesMap = new Map();
        let blockNumber = 0;
        let originalAmount = "";
        cachedRoutesArr.forEach((cachedRoutes) => {
            metric.putMetric(`RoutesDbPerBlockFound`, cachedRoutes.routes.length, MetricLoggerUnit.Count);
            cachedRoutes.routes.forEach((cachedRoute) => {
                // we use the stringified route as identifier
                const routeId = routeToString(cachedRoute.route);
                // Using a map to remove duplicates, we will the different percents of different routes.
                // We also filter by protocol, in case we are loading a route from a protocol that wasn't requested
                if (!routesMap.has(routeId) && protocols.includes(cachedRoute.protocol)) {
                    routesMap.set(routeId, cachedRoute);
                }
            });
            // Find the latest blockNumber
            blockNumber = Math.max(blockNumber, cachedRoutes.blockNumber);
            // Keep track of all the originalAmounts
            if (originalAmount === "") {
                originalAmount = `${cachedRoutes.originalAmount} | ${routesMap.size} | ${cachedRoutes.blockNumber}`;
            }
            else {
                originalAmount = `${originalAmount}, ${cachedRoutes.originalAmount} | ${routesMap.size} | ${cachedRoutes.blockNumber}`;
            }
        });
        const first = cachedRoutesArr[0];
        // Build a new CachedRoutes object with the values calculated earlier
        const cachedRoutes = new CachedRoutes({
            routes: Array.from(routesMap.values()),
            tokenIn: first.tokenIn,
            tokenOut: first.tokenOut,
            protocolsCovered: first.protocolsCovered,
            blockNumber,
            tradeType: first.tradeType,
            originalAmount,
            blocksToLive: first.blocksToLive,
        });
        metric.putMetric(`UniqueRoutesDbFound`, cachedRoutes.routes.length, MetricLoggerUnit.Count);
        log.info({ cachedRoutes }, `[DynamoRouteCachingProvider] Returning the cached and unmarshalled route.`);
        // Normalize blocks difference, if the route is from a new block (which could happen in L2s), consider it same block
        const blocksDifference = Math.max(0, currentBlockNumber - blockNumber);
        metric.putMetric(`RoutesDbBlockDifference`, blocksDifference, MetricLoggerUnit.Count);
        metric.putMetric(`RoutesDbBlockDifference_${NETWORK_NAME}`, blocksDifference, MetricLoggerUnit.Count);
        const notExpiredCachedRoute = cachedRoutes.notExpired(currentBlockNumber, optimistic);
        if (notExpiredCachedRoute) {
            metric.putMetric(`RoutesDbNotExpired`, 1, MetricLoggerUnit.Count);
        }
        else {
            metric.putMetric(`RoutesDbExpired`, 1, MetricLoggerUnit.Count);
        }
        // Caching requests are not `optimistic`, we need to be careful of not removing this flag
        // This condition is protecting us against firing another caching request from inside a caching request
        if (optimistic) {
            // We send an async caching quote
            // we do not await on this function, it's a fire and forget
            this.maybeSendCachingQuoteForRoutesDb(partitionKey, amount, currentBlockNumber);
        }
        return cachedRoutes;
    }
    async maybeSendCachingQuoteForRoutesDb(partitionKey, amount, currentBlockNumber) {
        try {
            const queryParams = {
                TableName: this.routesCachingRequestFlagTableName,
                // We use a ratio to get a range of amounts that are close to the amount we are thinking about inserting
                // If there's an item in the table which range covers our amount, we don't need to send a caching request
                KeyConditionExpression: "#pk = :pk AND #amount BETWEEN :amount AND :amount_ratio",
                ExpressionAttributeNames: {
                    "#pk": "pairTradeTypeChainId",
                    "#amount": "amount",
                },
                ExpressionAttributeValues: {
                    ":pk": partitionKey.toString(),
                    ":amount": parseFloat(amount.toExact()),
                    ":amount_ratio": parseFloat(amount.multiply(this.ROUTES_DB_BUCKET_RATIO).toExact()),
                },
            };
            metric.putMetric("CachingQuoteForRoutesDbCheck", 1, MetricLoggerUnit.Count);
            const result = await this.ddbClient.query(queryParams).promise();
            const shouldSendCachingRequest = result.Items &&
                (result.Items.length == 0 || // no caching request has been sent recently
                    // or there is not a single sample for the current block
                    result.Items.every((record) => { var _a; return ((_a = record.blockNumber) !== null && _a !== void 0 ? _a : 0) < currentBlockNumber; }));
            // if no Item is found it means we need to send a caching request
            if (shouldSendCachingRequest) {
                metric.putMetric("CachingQuoteForRoutesDbRequestSent", 1, MetricLoggerUnit.Count);
                this.sendAsyncCachingRequest(partitionKey, [Protocol.V2, Protocol.V3, Protocol.MIXED], amount);
                this.setRoutesDbCachingIntentFlag(partitionKey, amount, currentBlockNumber);
            }
            else {
                metric.putMetric("CachingQuoteForRoutesDbRequestNotNeeded", 1, MetricLoggerUnit.Count);
            }
        }
        catch (e) {
            log.error(`[DynamoRouteCachingProvider] Error checking if caching request for RoutesDb was sent: ${e}.`);
        }
    }
    sendAsyncCachingRequest(partitionKey, protocols, amount) {
        const payload = {
            queryStringParameters: {
                tokenInAddress: partitionKey.tokenIn,
                tokenOutAddress: partitionKey.tokenOut,
                amount: amount.quotient.toString(),
                type: partitionKey.tradeType === 0 ? "exactIn" : "exactOut",
                protocols: protocols.map((protocol) => protocol.toLowerCase()).join(","),
                intent: "caching",
            },
        };
        const params = {
            FunctionName: this.cachingQuoteLambdaName,
            InvocationType: "Event",
            Payload: JSON.stringify(payload),
        };
        log.info(`[DynamoRouteCachingProvider] Sending async caching request to lambda ${JSON.stringify(params)}`);
        this.lambdaClient.invoke(params).promise();
    }
    setRoutesDbCachingIntentFlag(partitionKey, amount, currentBlockNumber) {
        const putParams = {
            TableName: this.routesCachingRequestFlagTableName,
            Item: {
                pairTradeTypeChainId: partitionKey.toString(),
                amount: parseFloat(amount.toExact()),
                ttl: Math.floor(Date.now() / 1000) + this.ROUTES_DB_FLAG_TTL,
                blockNumber: currentBlockNumber,
            },
        };
        this.ddbClient.put(putParams).promise();
    }
    /**
     * Implementation of the abstract method defined in `IRouteCachingProvider`
     * Attempts to insert the `CachedRoutes` object into cache, if the CachingStrategy returns the CachingParameters
     *
     * @param cachedRoutes
     * @protected
     */
    async _setCachedRoute(cachedRoutes) {
        const routesDbEntries = cachedRoutes.routes.map((route) => {
            const individualCachedRoutes = new CachedRoutes({
                routes: [route],
                tokenIn: cachedRoutes.tokenIn,
                tokenOut: cachedRoutes.tokenOut,
                protocolsCovered: cachedRoutes.protocolsCovered,
                blockNumber: cachedRoutes.blockNumber,
                tradeType: cachedRoutes.tradeType,
                originalAmount: cachedRoutes.originalAmount,
            });
            const ttl = Math.floor(Date.now() / 1000) + this.ROUTES_DB_TTL;
            // Marshal the CachedRoutes object in preparation for storing in DynamoDB
            const marshalledCachedRoutes = CachedRoutesMarshaller.marshal(individualCachedRoutes);
            // Convert the marshalledCachedRoutes to JSON string
            const jsonCachedRoutes = JSON.stringify(marshalledCachedRoutes);
            // Encode the jsonCachedRoutes into Binary
            const binaryCachedRoutes = Buffer.from(jsonCachedRoutes);
            const partitionKey = PairTradeTypeChainId.fromCachedRoutes(cachedRoutes);
            return {
                PutRequest: {
                    Item: {
                        pairTradeTypeChainId: partitionKey.toString(),
                        routeId: route.routeId,
                        blockNumber: cachedRoutes.blockNumber,
                        protocol: route.protocol.toString(),
                        item: binaryCachedRoutes,
                        ttl: ttl,
                    },
                },
            };
        });
        if (routesDbEntries.length > 0) {
            try {
                const batchWriteParams = {
                    RequestItems: {
                        [this.routesTableName]: routesDbEntries,
                    },
                };
                await this.ddbClient.batchWrite(batchWriteParams).promise();
                log.info(`[DynamoRouteCachingProvider] Route Entries inserted to database`);
                return true;
            }
            catch (error) {
                log.error({ error, routesDbEntries }, `[DynamoRouteCachingProvider] Route Entries failed to insert`);
                return false;
            }
        }
        else {
            log.warn(`[DynamoRouteCachingProvider] No Route Entries to insert`);
            return false;
        }
    }
    /**
     * Implementation of the abstract method defined in `IRouteCachingProvider`
     * Obtains the CacheMode from the CachingStrategy, if not found, then return Darkmode.
     *
     * @param _chainId
     * @param _amount
     * @param _quoteToken
     * @param _tradeType
     * @param _protocols
     */
    async getCacheMode(_amount, _quoteToken, _tradeType, _protocols) {
        return this.DEFAULT_CACHEMODE_ROUTES_DB;
    }
    /**
     * RoutesDB self-correcting mechanism allows us to look at routes that would have been considered expired
     * We override this method to increase our cache coverage.
     *
     * @param cachedRoutes
     * @param _blockNumber
     * @param _optimistic
     * @protected
     */
    filterExpiredCachedRoutes(cachedRoutes, _blockNumber, _optimistic) {
        return cachedRoutes;
    }
    /**
     * Helper function to determine the tokenIn and tokenOut given the tradeType, quoteToken and amount.currency
     *
     * @param amount
     * @param quoteToken
     * @param tradeType
     * @private
     */
    determineTokenInOut(amount, quoteToken, tradeType) {
        if (tradeType == TradeType.EXACT_INPUT) {
            return { tokenIn: amount.currency.wrapped, tokenOut: quoteToken };
        }
        else {
            return { tokenIn: quoteToken, tokenOut: amount.currency.wrapped };
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHluYW1vLXJvdXRlLWNhY2hpbmctcHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9saWIvaGFuZGxlcnMvcm91dGVyLWVudGl0aWVzL3JvdXRlLWNhY2hpbmcvZHluYW1vLXJvdXRlLWNhY2hpbmctcHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUVMLFlBQVksRUFDWixTQUFTLEVBQ1QscUJBQXFCLEVBQ3JCLEdBQUcsRUFDSCxNQUFNLEVBQ04sZ0JBQWdCLEVBQ2hCLGFBQWEsR0FDZCxNQUFNLDZCQUE2QixDQUFDO0FBQ3JDLE9BQU8sRUFBWSxRQUFRLEVBQUUsTUFBTSxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBQ3JELE9BQU8sRUFBNEIsUUFBUSxFQUFTLFNBQVMsRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFFakgsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sa0NBQWtDLENBQUM7QUFDeEUsT0FBTyxFQUFFLHNCQUFzQixFQUFFLE1BQU0sNENBQTRDLENBQUM7QUFtQnBGLE1BQU0sT0FBTywwQkFBMkIsU0FBUSxxQkFBcUI7SUFtQm5FLFlBQVksRUFBRSxlQUFlLEVBQUUsaUNBQWlDLEVBQUUsc0JBQXNCLEVBQXFCO1FBQzNHLEtBQUssRUFBRSxDQUFDO1FBYk8sZ0NBQTJCLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQztRQUNqRCxrQkFBYSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsV0FBVztRQUN6Qyx1QkFBa0IsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsWUFBWTtRQUUxRCxrREFBa0Q7UUFDbEQsZ0NBQWdDO1FBQ2hDLG1CQUFtQjtRQUNGLHFDQUFnQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQztRQUM3RCxvSEFBb0g7UUFDbkcsMkJBQXNCLEdBQWEsSUFBSSxRQUFRLENBQUMs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WSxDQUN2QixPQUFpQyxFQUNqQyxXQUFrQixFQUNsQixVQUFxQixFQUNyQixVQUFzQjtRQUV0QixPQUFPLElBQUksQ0FBQywyQkFBMkIsQ0FBQztJQUMxQyxDQUFDO0lBRUQ7Ozs7Ozs7O09BUUc7SUFDZ0IseUJBQXlCLENBQzFDLFlBQXNDLEVBQ3RDLFlBQW9CLEVBQ3BCLFdBQW9CO1FBRXBCLE9BQU8sWUFBWSxDQUFDO0lBQ3RCLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0ssbUJBQW1CLENBQ3pCLE1BQWdDLEVBQ2hDLFVBQWlCLEVBQ2pCLFNBQW9CO1FBRXBCLElBQUksU0FBUyxJQUFJLFNBQVMsQ0FBQyxXQUFXLEVBQUU7WUFDdEMsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLENBQUM7U0FDbkU7YUFBTTtZQUNMLE9BQU8sRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQ25FO0lBQ0gsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQ2FjaGVkUm91dGUsXG4gIENhY2hlZFJvdXRlcyxcbiAgQ2FjaGVNb2RlLFxuICBJUm91dGVDYWNoaW5nUHJvdmlkZXIsXG4gIGxvZyxcbiAgbWV0cmljLFxuICBNZXRyaWNMb2dnZXJVbml0LFxuICByb3V0ZVRvU3RyaW5nLFxufSBmcm9tIFwiQHZvdG9waWEvc21hcnQtb3JkZXItcm91dGVyXCI7XG5pbXBvcnQgeyBBV1NFcnJvciwgRHluYW1vREIsIExhbWJkYSB9IGZyb20gXCJhd3Mtc2RrXCI7XG5pbXBvcnQgeyBDdXJyZW5jeSwgQ3VycmVuY3lBbW91bnQsIEZyYWN0aW9uLCBUb2tlbiwgVHJhZGVUeXBlLCBORVRXT1JLX05BTUUsIFByb3RvY29sIH0gZnJvbSBcIkB2b3RvcGlhL3Nkay1jb3JlXCI7XG5cbmltcG9ydCB7IFBhaXJUcmFkZVR5cGVDaGFpbklkIH0gZnJvbSBcIi4vbW9kZWwvcGFpci10cmFkZS10eXBlLWNoYWluLWlkXCI7XG5pbXBvcnQgeyBDYWNoZWRSb3V0ZXNNYXJzaGFsbGVyIH0gZnJvbSBcIi4uLy4uL21hcnNoYWxsaW5nL2NhY2hlZC1yb3V0ZXMtbWFyc2hhbGxlclwiO1xuaW1wb3J0IHsgVjNSb3V0ZSB9IGZyb20gXCJAdm90b3BpYS9zbWFydC1vcmRlci1yb3V0ZXJcIjtcbmltcG9ydCB7IFByb21pc2VSZXN1bHQgfSBmcm9tIFwiYXdzLXNkay9saWIvcmVxdWVzdFwiO1xuXG5pbnRlcmZhY2UgQ29uc3RydWN0b3JQYXJhbXMge1xuICAvKipcbiAgICogVGhlIFRhYmxlTmFtZSBmb3IgdGhlIER5bmFtb0RCIFRhYmxlIHRoYXQgc3RvcmVzIHJvdXRlc1xuICAgKi9cbiAgcm91dGVzVGFibGVOYW1lOiBzdHJpbmc7XG4gIC8qKlxuICAgKiBUaGUgVGFibGVOYW1lIGZvciB0aGUgRHluYW1vREIgVGFibGUgdGhhdCBzdG9yZXMgd2hldGhlciBhIHJlcXVlc3QgaGFzIGJlZW4gc2VudCBmb3IgY2FjaGluZyByZWxhdGVkIHRvIHJvdXRlc0RiXG4gICAqL1xuICByb3V0ZXNDYWNoaW5nUmVxdWVzdEZsYWdUYWJsZU5hbWU6IHN0cmluZztcbiAgLyoqXG4gICAqIFRoZSBMYW1iZGEgRnVuY3Rpb24gTmFtZSBmb3IgdGhlIExhbWJkYSB0aGF0IHdpbGwgYmUgaW52b2tlZCB0byBmaWxsIHRoZSBjYWNoZVxuICAgKi9cbiAgY2FjaGluZ1F1b3RlTGFtYmRhTmFtZTogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgRHluYW1vUm91dGVDYWNoaW5nUHJvdmlkZXIgZXh0ZW5kcyBJUm91dGVDYWNoaW5nUHJvdmlkZXIge1xuICBwcml2YXRlIHJlYWRvbmx5IGRkYkNsaWVudDogRHluYW1vREIuRG9jdW1lbnRDbGllbnQ7XG4gIHByaXZhdGUgcmVhZG9ubHkgbGFtYmRhQ2xpZW50OiBMYW1iZGE7XG4gIHByaXZhdGUgcmVhZG9ubHkgcm91dGVzVGFibGVOYW1lOiBzdHJpbmc7XG4gIHByaXZhdGUgcmVhZG9ubHkgcm91dGVzQ2FjaGluZ1JlcXVlc3RGbGFnVGFibGVOYW1lOiBzdHJpbmc7XG4gIHByaXZhdGUgcmVhZG9ubHkgY2FjaGluZ1F1b3RlTGFtYmRhTmFtZTogc3RyaW5nO1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgREVGQVVMVF9DQUNIRU1PREVfUk9VVEVTX0RCID0gQ2FjaGVNb2RlLkxpdmVtb2RlO1xuICBwcml2YXRlIHJlYWRvbmx5IFJPVVRFU19EQl9UVEwgPSAyNCAqIDYwICogNjA7IC8vIDI0IGhvdXJzXG4gIHByaXZhdGUgcmVhZG9ubHkgUk9VVEVTX0RCX0ZMQUdfVFRMID0gMiAqIDYwOyAvLyAyIG1pbnV0ZXNcblxuICAvLyBoZXVyaXN0aWMgaXMgd2l0aGluIDMwIHNlY29uZHMgd2UgZmluZCBhIHJvdXRlLlxuICAvLyB3ZSBrbm93IGVhY2ggY2hhaW4gYmxvY2sgdGltZVxuICAvLyBkaXZpZGUgdGhvc2UgdHdvXG4gIHByaXZhdGUgcmVhZG9ubHkgREVGQVVMVF9CTE9DS1NfVE9fTElWRV9ST1VURVNfREIgPSAoKSA9PiA2MDtcbiAgLy8gRm9yIHRoZSBSYXRpbyB3ZSBhcmUgYXBwcm94aW1hdGluZyBQaGkgKEdvbGRlbiBSYXRpbykgYnkgY3JlYXRpbmcgYSBmcmFjdGlvbiB3aXRoIDIgY29uc2VjdXRpdmUgRmlib25hY2NpIG51bWJlcnNcbiAgcHJpdmF0ZSByZWFkb25seSBST1VURVNfREJfQlVDS0VUX1JBVElPOiBGcmFjdGlvbiA9IG5ldyBGcmFjdGlvbig1MTQyMjksIDMxNzgxMSk7XG4gIHByaXZhdGUgcmVhZG9ubHkgUk9VVEVTX1RPX1RBS0VfRlJPTV9ST1VURVNfREIgPSA4O1xuXG4gIGNvbnN0cnVjdG9yKHsgcm91dGVzVGFibGVOYW1lLCByb3V0ZXNDYWNoaW5nUmVxdWVzdEZsYWdUYWJsZU5hbWUsIGNhY2hpbmdRdW90ZUxhbWJkYU5hbWUgfTogQ29uc3RydWN0b3JQYXJhbXMpIHtcbiAgICBzdXBlcigpO1xuICAgIC8vIFNpbmNlIHRoaXMgRERCIFRhYmxlIGlzIHVzZWQgZm9yIENhY2hlLCB3ZSB3aWxsIGZhaWwgZmFzdCBhbmQgbGltaXQgdGhlIHRpbWVvdXQuXG4gICAgdGhpcy5kZGJDbGllbnQgPSBuZXcgRHluYW1vREIuRG9jdW1lbnRDbGllbnQoe1xuICAgICAgbWF4UmV0cmllczogMSxcbiAgICAgIHJldHJ5RGVsYXlPcHRpb25zOiB7XG4gICAgICAgIGJhc2U6IDIwLFxuICAgICAgfSxcbiAgICAgIGh0dHBPcHRpb25zOiB7XG4gICAgICAgIHRpbWVvdXQ6IDEwMCxcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgdGhpcy5sYW1iZGFDbGllbnQgPSBuZXcgTGFtYmRhKCk7XG4gICAgdGhpcy5yb3V0ZXNUYWJsZU5hbWUgPSByb3V0ZXNUYWJsZU5hbWU7XG4gICAgdGhpcy5yb3V0ZXNDYWNoaW5nUmVxdWVzdEZsYWdUYWJsZU5hbWUgPSByb3V0ZXNDYWNoaW5nUmVxdWVzdEZsYWdUYWJsZU5hbWU7XG4gICAgdGhpcy5jYWNoaW5nUXVvdGVMYW1iZGFOYW1lID0gY2FjaGluZ1F1b3RlTGFtYmRhTmFtZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbXBsZW1lbnRhdGlvbiBvZiB0aGUgYWJzdHJhY3QgbWV0aG9kIGRlZmluZWQgaW4gYElSb3V0ZUNhY2hpbmdQcm92aWRlcmBcbiAgICogR2l2ZW4gYSBDYWNoZWRSb3V0ZXNTdHJhdGVneSAoZnJvbSBDQUNIRURfUk9VVEVTX0NPTkZJR1VSQVRJT04pLFxuICAgKiB3ZSB3aWxsIGZpbmQgdGhlIEJsb2Nrc1RvTGl2ZSBhc3NvY2lhdGVkIHRvIHRoZSBidWNrZXQuXG4gICAqXG4gICAqIEBwYXJhbSBjYWNoZWRSb3V0ZXNcbiAgICogQHBhcmFtIF9cbiAgICogQHByb3RlY3RlZFxuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIF9nZXRCbG9ja3NUb0xpdmUoXzogYW55KTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICByZXR1cm4gdGhpcy5ERUZBVUxUX0JMT0NLU19UT19MSVZFX1JPVVRFU19EQigpO1xuICB9XG5cbiAgLyoqXG4gICAqIEltcGxlbWVudGF0aW9uIG9mIHRoZSBhYnN0cmFjdCBtZXRob2QgZGVmaW5lZCBpbiBgSVJvdXRlQ2FjaGluZ1Byb3ZpZGVyYFxuICAgKiBGZXRjaCB0aGUgbW9zdCByZWNlbnQgZW50cnkgZnJvbSB0aGUgRHluYW1vREIgdGFibGUgZm9yIHRoYXQgcGFpciwgdHJhZGVUeXBlLCBjaGFpbklkLCBwcm90b2NvbHMgYW5kIGJ1Y2tldFxuICAgKlxuICAgKiBAcGFyYW0gY2hhaW5JZFxuICAgKiBAcGFyYW0gYW1vdW50XG4gICAqIEBwYXJhbSBxdW90ZVRva2VuXG4gICAqIEBwYXJhbSB0cmFkZVR5cGVcbiAgICogQHBhcmFtIF9wcm90b2NvbHNcbiAgICogQHByb3RlY3RlZFxuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIF9nZXRDYWNoZWRSb3V0ZShcbiAgICBhbW91bnQ6IEN1cnJlbmN5QW1vdW50PEN1cnJlbmN5PixcbiAgICBxdW90ZVRva2VuOiBUb2tlbixcbiAgICB0cmFkZVR5cGU6IFRyYWRlVHlwZSxcbiAgICBwcm90b2NvbHM6IFByb3RvY29sW10sXG4gICAgY3VycmVudEJsb2NrTnVtYmVyOiBudW1iZXIsXG4gICAgb3B0aW1pc3RpYzogYm9vbGVhblxuICApOiBQcm9taXNlPENhY2hlZFJvdXRlcyB8IHVuZGVmaW5lZD4ge1xuICAgIGNvbnN0IHsgdG9rZW5JbiwgdG9rZW5PdXQgfSA9IHRoaXMuZGV0ZXJtaW5lVG9rZW5Jbk91dChhbW91bnQsIHF1b3RlVG9rZW4sIHRyYWRlVHlwZSk7XG5cbiAgICBjb25zdCBwYXJ0aXRpb25LZXkgPSBuZXcgUGFpclRyYWRlVHlwZUNoYWluSWQoe1xuICAgICAgdG9rZW5JbjogdG9rZW5Jbi5hZGRyZXNzLFxuICAgICAgdG9rZW5PdXQ6IHRva2VuT3V0LmFkZHJlc3MsXG4gICAgICB0cmFkZVR5cGUsXG4gICAgfSk7XG5cbiAgICAvLyBJZiBubyBjYWNoZWRSb3V0ZXMgd2VyZSBmb3VuZCwgd2UgdHJ5IHRvIGZldGNoIGZyb20gdGhlIFJvdXRlc0RiXG4gICAgbWV0cmljLnB1dE1ldHJpYyhcIlJvdXRlc0RiUXVlcnlcIiwgMSwgTWV0cmljTG9nZ2VyVW5pdC5Db3VudCk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcXVlcnlQYXJhbXMgPSB7XG4gICAgICAgIFRhYmxlTmFtZTogdGhpcy5yb3V0ZXNUYWJsZU5hbWUsXG4gICAgICAgIEtleUNvbmRpdGlvbkV4cHJlc3Npb246IFwiI3BrID0gOnBrXCIsXG4gICAgICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lczoge1xuICAgICAgICAgIFwiI3BrXCI6IFwicGFpclRyYWRlVHlwZUNoYWluSWRcIixcbiAgICAgICAgfSxcbiAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczoge1xuICAgICAgICAgIFwiOnBrXCI6IHBhcnRpdGlvbktleS50b1N0cmluZygpLFxuICAgICAgICB9LFxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5kZGJDbGllbnQucXVlcnkocXVlcnlQYXJhbXMpLnByb21pc2UoKTtcbiAgICAgIGlmIChyZXN1bHQuSXRlbXMgJiYgcmVzdWx0Lkl0ZW1zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgbWV0cmljLnB1dE1ldHJpYyhcIlJvdXRlc0RiUHJlRmlsdGVyRW50cmllc0ZvdW5kXCIsIHJlc3VsdC5JdGVtcy5sZW5ndGgsIE1ldHJpY0xvZ2dlclVuaXQuQ291bnQpO1xuICAgICAgICAvLyBBdCB0aGlzIHBvaW50IHdlIG1pZ2h0IGhhdmUgZ290dGVuIGFsbCB0aGUgcm91dGVzIHdlIGhhdmUgZGlzY292ZXJlZCBpbiB0aGUgbGFzdCAyNCBob3VycyBmb3IgdGhpcyBwYWlyXG4gICAgICAgIC8vIFdlIHdpbGwgc29ydCB0aGUgcm91dGVzIGJ5IGJsb2NrTnVtYmVyLCBhbmQgdGFrZSB0aGUgZmlyc3QgYFJPVVRFU19UT19UQUtFX0ZST01fUk9VVEVTX0RCYCByb3V0ZXNcbiAgICAgICAgY29uc3QgZmlsdGVyZWRJdGVtcyA9IHJlc3VsdC5JdGVtc1xuICAgICAgICAgIC8vIE9sZGVyIHJvdXRlcyBtaWdodCBub3QgaGF2ZSB0aGUgcHJvdG9jb2wgZmllbGQsIHNvIHdlIGtlZXAgdGhlbSBpZiB0aGV5IGRvbid0IGhhdmUgaXRcbiAgICAgICAgICAuZmlsdGVyKChyZWNvcmQpID0+ICFyZWNvcmQucHJvdG9jb2wgfHwgcHJvdG9jb2xzLmluY2x1ZGVzKHJlY29yZC5wcm90b2NvbCkpXG4gICAgICAgICAgLnNvcnQoKGEsIGIpID0+IGIuYmxvY2tOdW1iZXIgLSBhLmJsb2NrTnVtYmVyKVxuICAgICAgICAgIC5zbGljZSgwLCB0aGlzLlJPVVRFU19UT19UQUtFX0ZST01fUk9VVEVTX0RCKTtcblxuICAgICAgICByZXN1bHQuSXRlbXMgPSBmaWx0ZXJlZEl0ZW1zO1xuXG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlQ2FjaGVkUm91dGVzKHJlc3VsdCwgY3VycmVudEJsb2NrTnVtYmVyLCBvcHRpbWlzdGljLCBwYXJ0aXRpb25LZXksIGFtb3VudCwgcHJvdG9jb2xzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1ldHJpYy5wdXRNZXRyaWMoXCJSb3V0ZXNEYkVudHJpZXNOb3RGb3VuZFwiLCAxLCBNZXRyaWNMb2dnZXJVbml0LkNvdW50KTtcbiAgICAgICAgbG9nLndhcm4oYFtEeW5hbW9Sb3V0ZUNhY2hpbmdQcm92aWRlcl0gTm8gaXRlbXMgZm91bmQgaW4gdGhlIHF1ZXJ5IHJlc3BvbnNlIGZvciAke3BhcnRpdGlvbktleS50b1N0cmluZygpfWApO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBtZXRyaWMucHV0TWV0cmljKFwiUm91dGVzRGJGZXRjaEVycm9yXCIsIDEsIE1ldHJpY0xvZ2dlclVuaXQuQ291bnQpO1xuICAgICAgbG9nLmVycm9yKHsgcGFydGl0aW9uS2V5LCBlcnJvciB9LCBgW0R5bmFtb1JvdXRlQ2FjaGluZ1Byb3ZpZGVyXSBFcnJvciB3aGlsZSBmZXRjaGluZyByb3V0ZSBmcm9tIFJvdXRlRGJgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgcHJpdmF0ZSBwYXJzZUNhY2hlZFJvdXRlcyhcbiAgICByZXN1bHQ6IFByb21pc2VSZXN1bHQ8RHluYW1vREIuRG9jdW1lbnRDbGllbnQuUXVlcnlPdXRwdXQsIEFXU0Vycm9yPixcblxuICAgIGN1cnJlbnRCbG9ja051bWJlcjogbnVtYmVyLFxuICAgIG9wdGltaXN0aWM6IGJvb2xlYW4sXG4gICAgcGFydGl0aW9uS2V5OiBQYWlyVHJhZGVUeXBlQ2hhaW5JZCxcbiAgICBhbW91bnQ6IEN1cnJlbmN5QW1vdW50PEN1cnJlbmN5PixcbiAgICBwcm90b2NvbHM6IFByb3RvY29sW11cbiAgKTogQ2FjaGVkUm91dGVzIHtcbiAgICBtZXRyaWMucHV0TWV0cmljKGBSb3V0ZXNEYkVudHJpZXNGb3VuZGAsIHJlc3VsdC5JdGVtcyEubGVuZ3RoLCBNZXRyaWNMb2dnZXJVbml0LkNvdW50KTtcbiAgICBjb25zdCBjYWNoZWRSb3V0ZXNBcnI6IENhY2hlZFJvdXRlc1tdID0gcmVzdWx0Lkl0ZW1zIS5tYXAoKHJlY29yZCkgPT4ge1xuICAgICAgLy8gSWYgd2UgZ290IGEgcmVzcG9uc2Ugd2l0aCBtb3JlIHRoYW4gMSBpdGVtLCB3ZSBleHRyYWN0IHRoZSBiaW5hcnkgZmllbGQgZnJvbSB0aGUgcmVzcG9uc2VcbiAgICAgIGNvbnN0IGl0ZW1CaW5hcnkgPSByZWNvcmQuaXRlbTtcbiAgICAgIC8vIFRoZW4gd2UgY29udmVydCBpdCBpbnRvIGEgQnVmZmVyXG4gICAgICBjb25zdCBjYWNoZWRSb3V0ZXNCdWZmZXIgPSBCdWZmZXIuZnJvbShpdGVtQmluYXJ5KTtcbiAgICAgIC8vIFdlIGNvbnZlcnQgdGhhdCBidWZmZXIgaW50byBzdHJpbmcgYW5kIHBhcnNlIGFzIEpTT04gKGl0IHdhcyBlbmNvZGVkIGFzIEpTT04gd2hlbiBpdCB3YXMgaW5zZXJ0ZWQgaW50byBjYWNoZSlcbiAgICAgIGNvbnN0IGNhY2hlZFJvdXRlc0pzb24gPSBKU09OLnBhcnNlKGNhY2hlZFJvdXRlc0J1ZmZlci50b1N0cmluZygpKTtcbiAgICAgIC8vIEZpbmFsbHkgd2UgdW5tYXJzaGFsIHRoYXQgSlNPTiBpbnRvIGEgYENhY2hlZFJvdXRlc2Agb2JqZWN0XG4gICAgICByZXR1cm4gQ2FjaGVkUm91dGVzTWFyc2hhbGxlci51bm1hcnNoYWwoY2FjaGVkUm91dGVzSnNvbik7XG4gICAgfSk7XG5cbiAgICBjb25zdCByb3V0ZXNNYXA6IE1hcDxzdHJpbmcsIENhY2hlZFJvdXRlPFYzUm91dGU+PiA9IG5ldyBNYXAoKTtcbiAgICBsZXQgYmxvY2tOdW1iZXI6IG51bWJlciA9IDA7XG4gICAgbGV0IG9yaWdpbmFsQW1vdW50OiBzdHJpbmcgPSBcIlwiO1xuXG4gICAgY2FjaGVkUm91dGVzQXJyLmZvckVhY2goKGNhY2hlZFJvdXRlcykgPT4ge1xuICAgICAgbWV0cmljLnB1dE1ldHJpYyhgUm91dGVzRGJQZXJCbG9ja0ZvdW5kYCwgY2FjaGVkUm91dGVzLnJvdXRlcy5sZW5ndGgsIE1ldHJpY0xvZ2dlclVuaXQuQ291bnQpO1xuICAgICAgY2FjaGVkUm91dGVzLnJvdXRlcy5mb3JFYWNoKChjYWNoZWRSb3V0ZSkgPT4ge1xuICAgICAgICAvLyB3ZSB1c2UgdGhlIHN0cmluZ2lmaWVkIHJvdXRlIGFzIGlkZW50aWZpZXJcbiAgICAgICAgY29uc3Qgcm91dGVJZCA9IHJvdXRlVG9TdHJpbmcoY2FjaGVkUm91dGUucm91dGUpO1xuICAgICAgICAvLyBVc2luZyBhIG1hcCB0byByZW1vdmUgZHVwbGljYXRlcywgd2Ugd2lsbCB0aGUgZGlmZmVyZW50IHBlcmNlbnRzIG9mIGRpZmZlcmVudCByb3V0ZXMuXG4gICAgICAgIC8vIFdlIGFsc28gZmlsdGVyIGJ5IHByb3RvY29sLCBpbiBjYXNlIHdlIGFyZSBsb2FkaW5nIGEgcm91dGUgZnJvbSBhIHByb3RvY29sIHRoYXQgd2Fzbid0IHJlcXVlc3RlZFxuICAgICAgICBpZiAoIXJvdXRlc01hcC5oYXMocm91dGVJZCkgJiYgcHJvdG9jb2xzLmluY2x1ZGVzKGNhY2hlZFJvdXRlLnByb3RvY29sKSkge1xuICAgICAgICAgIHJvdXRlc01hcC5zZXQocm91dGVJZCwgY2FjaGVkUm91dGUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIC8vIEZpbmQgdGhlIGxhdGVzdCBibG9ja051bWJlclxuICAgICAgYmxvY2tOdW1iZXIgPSBNYXRoLm1heChibG9ja051bWJlciwgY2FjaGVkUm91dGVzLmJsb2NrTnVtYmVyKTtcbiAgICAgIC8vIEtlZXAgdHJhY2sgb2YgYWxsIHRoZSBvcmlnaW5hbEFtb3VudHNcbiAgICAgIGlmIChvcmlnaW5hbEFtb3VudCA9PT0gXCJcIikge1xuICAgICAgICBvcmlnaW5hbEFtb3VudCA9IGAke2NhY2hlZFJvdXRlcy5vcmlnaW5hbEFtb3VudH0gfCAke3JvdXRlc01hcC5zaXplfSB8ICR7Y2FjaGVkUm91dGVzLmJsb2NrTnVtYmVyfWA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvcmlnaW5hbEFtb3VudCA9IGAke29yaWdpbmFsQW1vdW50fSwgJHtjYWNoZWRSb3V0ZXMub3JpZ2luYWxBbW91bnR9IHwgJHtyb3V0ZXNNYXAuc2l6ZX0gfCAke2NhY2hlZFJvdXRlcy5ibG9ja051bWJlcn1gO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgZmlyc3QgPSBjYWNoZWRSb3V0ZXNBcnJbMF07XG5cbiAgICAvLyBCdWlsZCBhIG5ldyBDYWNoZWRSb3V0ZXMgb2JqZWN0IHdpdGggdGhlIHZhbHVlcyBjYWxjdWxhdGVkIGVhcmxpZXJcbiAgICBjb25zdCBjYWNoZWRSb3V0ZXMgPSBuZXcgQ2FjaGVkUm91dGVzKHtcbiAgICAgIHJvdXRlczogQXJyYXkuZnJvbShyb3V0ZXNNYXAudmFsdWVzKCkpLFxuXG4gICAgICB0b2tlbkluOiBmaXJzdC50b2tlbkluLFxuICAgICAgdG9rZW5PdXQ6IGZpcnN0LnRva2VuT3V0LFxuICAgICAgcHJvdG9jb2xzQ292ZXJlZDogZmlyc3QucHJvdG9jb2xzQ292ZXJlZCxcbiAgICAgIGJsb2NrTnVtYmVyLFxuICAgICAgdHJhZGVUeXBlOiBmaXJzdC50cmFkZVR5cGUsXG4gICAgICBvcmlnaW5hbEFtb3VudCxcbiAgICAgIGJsb2Nrc1RvTGl2ZTogZmlyc3QuYmxvY2tzVG9MaXZlLFxuICAgIH0pO1xuXG4gICAgbWV0cmljLnB1dE1ldHJpYyhgVW5pcXVlUm91dGVzRGJGb3VuZGAsIGNhY2hlZFJvdXRlcy5yb3V0ZXMubGVuZ3RoLCBNZXRyaWNMb2dnZXJVbml0LkNvdW50KTtcblxuICAgIGxvZy5pbmZvKHsgY2FjaGVkUm91dGVzIH0sIGBbRHluYW1vUm91dGVDYWNoaW5nUHJvdmlkZXJdIFJldHVybmluZyB0aGUgY2FjaGVkIGFuZCB1bm1hcnNoYWxsZWQgcm91dGUuYCk7XG5cbiAgICAvLyBOb3JtYWxpemUgYmxvY2tzIGRpZmZlcmVuY2UsIGlmIHRoZSByb3V0ZSBpcyBmcm9tIGEgbmV3IGJsb2NrICh3aGljaCBjb3VsZCBoYXBwZW4gaW4gTDJzKSwgY29uc2lkZXIgaXQgc2FtZSBibG9ja1xuICAgIGNvbnN0IGJsb2Nrc0RpZmZlcmVuY2UgPSBNYXRoLm1heCgwLCBjdXJyZW50QmxvY2tOdW1iZXIgLSBibG9ja051bWJlcik7XG4gICAgbWV0cmljLnB1dE1ldHJpYyhgUm91dGVzRGJCbG9ja0RpZmZlcmVuY2VgLCBibG9ja3NEaWZmZXJlbmNlLCBNZXRyaWNMb2dnZXJVbml0LkNvdW50KTtcbiAgICBtZXRyaWMucHV0TWV0cmljKGBSb3V0ZXNEYkJsb2NrRGlmZmVyZW5jZV8ke05FVFdPUktfTkFNRX1gLCBibG9ja3NEaWZmZXJlbmNlLCBNZXRyaWNMb2dnZXJVbml0LkNvdW50KTtcblxuICAgIGNvbnN0IG5vdEV4cGlyZWRDYWNoZWRSb3V0ZSA9IGNhY2hlZFJvdXRlcy5ub3RFeHBpcmVkKGN1cnJlbnRCbG9ja051bWJlciwgb3B0aW1pc3RpYyk7XG4gICAgaWYgKG5vdEV4cGlyZWRDYWNoZWRSb3V0ZSkge1xuICAgICAgbWV0cmljLnB1dE1ldHJpYyhgUm91dGVzRGJOb3RFeHBpcmVkYCwgMSwgTWV0cmljTG9nZ2VyVW5pdC5Db3VudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1ldHJpYy5wdXRNZXRyaWMoYFJvdXRlc0RiRXhwaXJlZGAsIDEsIE1ldHJpY0xvZ2dlclVuaXQuQ291bnQpO1xuICAgIH1cblxuICAgIC8vIENhY2hpbmcgcmVxdWVzdHMgYXJlIG5vdCBgb3B0aW1pc3RpY2AsIHdlIG5lZWQgdG8gYmUgY2FyZWZ1bCBvZiBub3QgcmVtb3ZpbmcgdGhpcyBmbGFnXG4gICAgLy8gVGhpcyBjb25kaXRpb24gaXMgcHJvdGVjdGluZyB1cyBhZ2FpbnN0IGZpcmluZyBhbm90aGVyIGNhY2hpbmcgcmVxdWVzdCBmcm9tIGluc2lkZSBhIGNhY2hpbmcgcmVxdWVzdFxuICAgIGlmIChvcHRpbWlzdGljKSB7XG4gICAgICAvLyBXZSBzZW5kIGFuIGFzeW5jIGNhY2hpbmcgcXVvdGVcbiAgICAgIC8vIHdlIGRvIG5vdCBhd2FpdCBvbiB0aGlzIGZ1bmN0aW9uLCBpdCdzIGEgZmlyZSBhbmQgZm9yZ2V0XG4gICAgICB0aGlzLm1heWJlU2VuZENhY2hpbmdRdW90ZUZvclJvdXRlc0RiKHBhcnRpdGlvbktleSwgYW1vdW50LCBjdXJyZW50QmxvY2tOdW1iZXIpO1xuICAgIH1cblxuICAgIHJldHVybiBjYWNoZWRSb3V0ZXM7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIG1heWJlU2VuZENhY2hpbmdRdW90ZUZvclJvdXRlc0RiKFxuICAgIHBhcnRpdGlvbktleTogUGFpclRyYWRlVHlwZUNoYWluSWQsXG4gICAgYW1vdW50OiBDdXJyZW5jeUFtb3VudDxDdXJyZW5jeT4sXG4gICAgY3VycmVudEJsb2NrTnVtYmVyOiBudW1iZXJcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHF1ZXJ5UGFyYW1zID0ge1xuICAgICAgICBUYWJsZU5hbWU6IHRoaXMucm91dGVzQ2FjaGluZ1JlcXVlc3RGbGFnVGFibGVOYW1lLFxuICAgICAgICAvLyBXZSB1c2UgYSByYXRpbyB0byBnZXQgYSByYW5nZSBvZiBhbW91bnRzIHRoYXQgYXJlIGNsb3NlIHRvIHRoZSBhbW91bnQgd2UgYXJlIHRoaW5raW5nIGFib3V0IGluc2VydGluZ1xuICAgICAgICAvLyBJZiB0aGVyZSdzIGFuIGl0ZW0gaW4gdGhlIHRhYmxlIHdoaWNoIHJhbmdlIGNvdmVycyBvdXIgYW1vdW50LCB3ZSBkb24ndCBuZWVkIHRvIHNlbmQgYSBjYWNoaW5nIHJlcXVlc3RcbiAgICAgICAgS2V5Q29uZGl0aW9uRXhwcmVzc2lvbjogXCIjcGsgPSA6cGsgQU5EICNhbW91bnQgQkVUV0VFTiA6YW1vdW50IEFORCA6YW1vdW50X3JhdGlvXCIsXG4gICAgICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVOYW1lczoge1xuICAgICAgICAgIFwiI3BrXCI6IFwicGFpclRyYWRlVHlwZUNoYWluSWRcIixcbiAgICAgICAgICBcIiNhbW91bnRcIjogXCJhbW91bnRcIixcbiAgICAgICAgfSxcbiAgICAgICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczoge1xuICAgICAgICAgIFwiOnBrXCI6IHBhcnRpdGlvbktleS50b1N0cmluZygpLFxuICAgICAgICAgIFwiOmFtb3VudFwiOiBwYXJzZUZsb2F0KGFtb3VudC50b0V4YWN0KCkpLFxuICAgICAgICAgIFwiOmFtb3VudF9yYXRpb1wiOiBwYXJzZUZsb2F0KGFtb3VudC5tdWx0aXBseSh0aGlzLlJPVVRFU19EQl9CVUNLRVRfUkFUSU8pLnRvRXhhY3QoKSksXG4gICAgICAgIH0sXG4gICAgICB9O1xuXG4gICAgICBtZXRyaWMucHV0TWV0cmljKFwiQ2FjaGluZ1F1b3RlRm9yUm91dGVzRGJDaGVja1wiLCAxLCBNZXRyaWNMb2dnZXJVbml0LkNvdW50KTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5kZGJDbGllbnQucXVlcnkocXVlcnlQYXJhbXMpLnByb21pc2UoKTtcbiAgICAgIGNvbnN0IHNob3VsZFNlbmRDYWNoaW5nUmVxdWVzdCA9XG4gICAgICAgIHJlc3VsdC5JdGVtcyAmJlxuICAgICAgICAocmVzdWx0Lkl0ZW1zLmxlbmd0aCA9PSAwIHx8IC8vIG5vIGNhY2hpbmcgcmVxdWVzdCBoYXMgYmVlbiBzZW50IHJlY2VudGx5XG4gICAgICAgICAgLy8gb3IgdGhlcmUgaXMgbm90IGEgc2luZ2xlIHNhbXBsZSBmb3IgdGhlIGN1cnJlbnQgYmxvY2tcbiAgICAgICAgICByZXN1bHQuSXRlbXMuZXZlcnkoKHJlY29yZCkgPT4gKHJlY29yZC5ibG9ja051bWJlciA/PyAwKSA8IGN1cnJlbnRCbG9ja051bWJlcikpO1xuXG4gICAgICAvLyBpZiBubyBJdGVtIGlzIGZvdW5kIGl0IG1lYW5zIHdlIG5lZWQgdG8gc2VuZCBhIGNhY2hpbmcgcmVxdWVzdFxuICAgICAgaWYgKHNob3VsZFNlbmRDYWNoaW5nUmVxdWVzdCkge1xuICAgICAgICBtZXRyaWMucHV0TWV0cmljKFwiQ2FjaGluZ1F1b3RlRm9yUm91dGVzRGJSZXF1ZXN0U2VudFwiLCAxLCBNZXRyaWNMb2dnZXJVbml0LkNvdW50KTtcbiAgICAgICAgdGhpcy5zZW5kQXN5bmNDYWNoaW5nUmVxdWVzdChwYXJ0aXRpb25LZXksIFtQcm90b2NvbC5WMiwgUHJvdG9jb2wuVjMsIFByb3RvY29sLk1JWEVEXSwgYW1vdW50KTtcbiAgICAgICAgdGhpcy5zZXRSb3V0ZXNEYkNhY2hpbmdJbnRlbnRGbGFnKHBhcnRpdGlvbktleSwgYW1vdW50LCBjdXJyZW50QmxvY2tOdW1iZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWV0cmljLnB1dE1ldHJpYyhcIkNhY2hpbmdRdW90ZUZvclJvdXRlc0RiUmVxdWVzdE5vdE5lZWRlZFwiLCAxLCBNZXRyaWNMb2dnZXJVbml0LkNvdW50KTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBsb2cuZXJyb3IoYFtEeW5hbW9Sb3V0ZUNhY2hpbmdQcm92aWRlcl0gRXJyb3IgY2hlY2tpbmcgaWYgY2FjaGluZyByZXF1ZXN0IGZvciBSb3V0ZXNEYiB3YXMgc2VudDogJHtlfS5gKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNlbmRBc3luY0NhY2hpbmdSZXF1ZXN0KFxuICAgIHBhcnRpdGlvbktleTogUGFpclRyYWRlVHlwZUNoYWluSWQsXG4gICAgcHJvdG9jb2xzOiBQcm90b2NvbFtdLFxuICAgIGFtb3VudDogQ3VycmVuY3lBbW91bnQ8Q3VycmVuY3k+XG4gICk6IHZvaWQge1xuICAgIGNvbnN0IHBheWxvYWQgPSB7XG4gICAgICBxdWVyeVN0cmluZ1BhcmFtZXRlcnM6IHtcbiAgICAgICAgdG9rZW5JbkFkZHJlc3M6IHBhcnRpdGlvbktleS50b2tlbkluLFxuICAgICAgICB0b2tlbk91dEFkZHJlc3M6IHBhcnRpdGlvbktleS50b2tlbk91dCxcbiAgICAgICAgYW1vdW50OiBhbW91bnQucXVvdGllbnQudG9TdHJpbmcoKSxcbiAgICAgICAgdHlwZTogcGFydGl0aW9uS2V5LnRyYWRlVHlwZSA9PT0gMCA/IFwiZXhhY3RJblwiIDogXCJleGFjdE91dFwiLFxuICAgICAgICBwcm90b2NvbHM6IHByb3RvY29scy5tYXAoKHByb3RvY29sKSA9PiBwcm90b2NvbC50b0xvd2VyQ2FzZSgpKS5qb2luKFwiLFwiKSxcbiAgICAgICAgaW50ZW50OiBcImNhY2hpbmdcIixcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIGNvbnN0IHBhcmFtcyA9IHtcbiAgICAgIEZ1bmN0aW9uTmFtZTogdGhpcy5jYWNoaW5nUXVvdGVMYW1iZGFOYW1lLFxuICAgICAgSW52b2NhdGlvblR5cGU6IFwiRXZlbnRcIixcbiAgICAgIFBheWxvYWQ6IEpTT04uc3RyaW5naWZ5KHBheWxvYWQpLFxuICAgIH07XG5cbiAgICBsb2cuaW5mbyhgW0R5bmFtb1JvdXRlQ2FjaGluZ1Byb3ZpZGVyXSBTZW5kaW5nIGFzeW5jIGNhY2hpbmcgcmVxdWVzdCB0byBsYW1iZGEgJHtKU09OLnN0cmluZ2lmeShwYXJhbXMpfWApO1xuXG4gICAgdGhpcy5sYW1iZGFDbGllbnQuaW52b2tlKHBhcmFtcykucHJvbWlzZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBzZXRSb3V0ZXNEYkNhY2hpbmdJbnRlbnRGbGFnKFxuICAgIHBhcnRpdGlvbktleTogUGFpclRyYWRlVHlwZUNoYWluSWQsXG4gICAgYW1vdW50OiBDdXJyZW5jeUFtb3VudDxDdXJyZW5jeT4sXG4gICAgY3VycmVudEJsb2NrTnVtYmVyOiBudW1iZXJcbiAgKTogdm9pZCB7XG4gICAgY29uc3QgcHV0UGFyYW1zID0ge1xuICAgICAgVGFibGVOYW1lOiB0aGlzLnJvdXRlc0NhY2hpbmdSZXF1ZXN0RmxhZ1RhYmxlTmFtZSxcbiAgICAgIEl0ZW06IHtcbiAgICAgICAgcGFpclRyYWRlVHlwZUNoYWluSWQ6IHBhcnRpdGlvbktleS50b1N0cmluZygpLFxuICAgICAgICBhbW91bnQ6IHBhcnNlRmxvYXQoYW1vdW50LnRvRXhhY3QoKSksXG4gICAgICAgIHR0bDogTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMTAwMCkgKyB0aGlzLlJPVVRFU19EQl9GTEFHX1RUTCxcbiAgICAgICAgYmxvY2tOdW1iZXI6IGN1cnJlbnRCbG9ja051bWJlcixcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIHRoaXMuZGRiQ2xpZW50LnB1dChwdXRQYXJhbXMpLnByb21pc2UoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbXBsZW1lbnRhdGlvbiBvZiB0aGUgYWJzdHJhY3QgbWV0aG9kIGRlZmluZWQgaW4gYElSb3V0ZUNhY2hpbmdQcm92aWRlcmBcbiAgICogQXR0ZW1wdHMgdG8gaW5zZXJ0IHRoZSBgQ2FjaGVkUm91dGVzYCBvYmplY3QgaW50byBjYWNoZSwgaWYgdGhlIENhY2hpbmdTdHJhdGVneSByZXR1cm5zIHRoZSBDYWNoaW5nUGFyYW1ldGVyc1xuICAgKlxuICAgKiBAcGFyYW0gY2FjaGVkUm91dGVzXG4gICAqIEBwcm90ZWN0ZWRcbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyBfc2V0Q2FjaGVkUm91dGUoY2FjaGVkUm91dGVzOiBDYWNoZWRSb3V0ZXMpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCByb3V0ZXNEYkVudHJpZXMgPSBjYWNoZWRSb3V0ZXMucm91dGVzLm1hcCgocm91dGUpID0+IHtcbiAgICAgIGNvbnN0IGluZGl2aWR1YWxDYWNoZWRSb3V0ZXMgPSBuZXcgQ2FjaGVkUm91dGVzKHtcbiAgICAgICAgcm91dGVzOiBbcm91dGVdLFxuICAgICAgICB0b2tlbkluOiBjYWNoZWRSb3V0ZXMudG9rZW5JbixcbiAgICAgICAgdG9rZW5PdXQ6IGNhY2hlZFJvdXRlcy50b2tlbk91dCxcbiAgICAgICAgcHJvdG9jb2xzQ292ZXJlZDogY2FjaGVkUm91dGVzLnByb3RvY29sc0NvdmVyZWQsXG4gICAgICAgIGJsb2NrTnVtYmVyOiBjYWNoZWRSb3V0ZXMuYmxvY2tOdW1iZXIsXG4gICAgICAgIHRyYWRlVHlwZTogY2FjaGVkUm91dGVzLnRyYWRlVHlwZSxcbiAgICAgICAgb3JpZ2luYWxBbW91bnQ6IGNhY2hlZFJvdXRlcy5vcmlnaW5hbEFtb3VudCxcbiAgICAgIH0pO1xuICAgICAgY29uc3QgdHRsID0gTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMTAwMCkgKyB0aGlzLlJPVVRFU19EQl9UVEw7XG4gICAgICAvLyBNYXJzaGFsIHRoZSBDYWNoZWRSb3V0ZXMgb2JqZWN0IGluIHByZXBhcmF0aW9uIGZvciBzdG9yaW5nIGluIER5bmFtb0RCXG4gICAgICBjb25zdCBtYXJzaGFsbGVkQ2FjaGVkUm91dGVzID0gQ2FjaGVkUm91dGVzTWFyc2hhbGxlci5tYXJzaGFsKGluZGl2aWR1YWxDYWNoZWRSb3V0ZXMpO1xuICAgICAgLy8gQ29udmVydCB0aGUgbWFyc2hhbGxlZENhY2hlZFJvdXRlcyB0byBKU09OIHN0cmluZ1xuICAgICAgY29uc3QganNvbkNhY2hlZFJvdXRlcyA9IEpTT04uc3RyaW5naWZ5KG1hcnNoYWxsZWRDYWNoZWRSb3V0ZXMpO1xuICAgICAgLy8gRW5jb2RlIHRoZSBqc29uQ2FjaGVkUm91dGVzIGludG8gQmluYXJ5XG4gICAgICBjb25zdCBiaW5hcnlDYWNoZWRSb3V0ZXMgPSBCdWZmZXIuZnJvbShqc29uQ2FjaGVkUm91dGVzKTtcblxuICAgICAgY29uc3QgcGFydGl0aW9uS2V5ID0gUGFpclRyYWRlVHlwZUNoYWluSWQuZnJvbUNhY2hlZFJvdXRlcyhjYWNoZWRSb3V0ZXMpO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBQdXRSZXF1ZXN0OiB7XG4gICAgICAgICAgSXRlbToge1xuICAgICAgICAgICAgcGFpclRyYWRlVHlwZUNoYWluSWQ6IHBhcnRpdGlvbktleS50b1N0cmluZygpLFxuICAgICAgICAgICAgcm91dGVJZDogcm91dGUucm91dGVJZCxcbiAgICAgICAgICAgIGJsb2NrTnVtYmVyOiBjYWNoZWRSb3V0ZXMuYmxvY2tOdW1iZXIsXG4gICAgICAgICAgICBwcm90b2NvbDogcm91dGUucHJvdG9jb2wudG9TdHJpbmcoKSxcbiAgICAgICAgICAgIGl0ZW06IGJpbmFyeUNhY2hlZFJvdXRlcyxcbiAgICAgICAgICAgIHR0bDogdHRsLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9O1xuICAgIH0pO1xuXG4gICAgaWYgKHJvdXRlc0RiRW50cmllcy5sZW5ndGggPiAwKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBiYXRjaFdyaXRlUGFyYW1zID0ge1xuICAgICAgICAgIFJlcXVlc3RJdGVtczoge1xuICAgICAgICAgICAgW3RoaXMucm91dGVzVGFibGVOYW1lXTogcm91dGVzRGJFbnRyaWVzLFxuICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICAgIGF3YWl0IHRoaXMuZGRiQ2xpZW50LmJhdGNoV3JpdGUoYmF0Y2hXcml0ZVBhcmFtcykucHJvbWlzZSgpO1xuICAgICAgICBsb2cuaW5mbyhgW0R5bmFtb1JvdXRlQ2FjaGluZ1Byb3ZpZGVyXSBSb3V0ZSBFbnRyaWVzIGluc2VydGVkIHRvIGRhdGFiYXNlYCk7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBsb2cuZXJyb3IoeyBlcnJvciwgcm91dGVzRGJFbnRyaWVzIH0sIGBbRHluYW1vUm91dGVDYWNoaW5nUHJvdmlkZXJdIFJvdXRlIEVudHJpZXMgZmFpbGVkIHRvIGluc2VydGApO1xuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbG9nLndhcm4oYFtEeW5hbW9Sb3V0ZUNhY2hpbmdQcm92aWRlcl0gTm8gUm91dGUgRW50cmllcyB0byBpbnNlcnRgKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSW1wbGVtZW50YXRpb24gb2YgdGhlIGFic3RyYWN0IG1ldGhvZCBkZWZpbmVkIGluIGBJUm91dGVDYWNoaW5nUHJvdmlkZXJgXG4gICAqIE9idGFpbnMgdGhlIENhY2hlTW9kZSBmcm9tIHRoZSBDYWNoaW5nU3RyYXRlZ3ksIGlmIG5vdCBmb3VuZCwgdGhlbiByZXR1cm4gRGFya21vZGUuXG4gICAqXG4gICAqIEBwYXJhbSBfY2hhaW5JZFxuICAgKiBAcGFyYW0gX2Ftb3VudFxuICAgKiBAcGFyYW0gX3F1b3RlVG9rZW5cbiAgICogQHBhcmFtIF90cmFkZVR5cGVcbiAgICogQHBhcmFtIF9wcm90b2NvbHNcbiAgICovXG4gIHB1YmxpYyBhc3luYyBnZXRDYWNoZU1vZGUoXG4gICAgX2Ftb3VudDogQ3VycmVuY3lBbW91bnQ8Q3VycmVuY3k+LFxuICAgIF9xdW90ZVRva2VuOiBUb2tlbixcbiAgICBfdHJhZGVUeXBlOiBUcmFkZVR5cGUsXG4gICAgX3Byb3RvY29sczogUHJvdG9jb2xbXVxuICApOiBQcm9taXNlPENhY2hlTW9kZT4ge1xuICAgIHJldHVybiB0aGlzLkRFRkFVTFRfQ0FDSEVNT0RFX1JPVVRFU19EQjtcbiAgfVxuXG4gIC8qKlxuICAgKiBSb3V0ZXNEQiBzZWxmLWNvcnJlY3RpbmcgbWVjaGFuaXNtIGFsbG93cyB1cyB0byBsb29rIGF0IHJvdXRlcyB0aGF0IHdvdWxkIGhhdmUgYmVlbiBjb25zaWRlcmVkIGV4cGlyZWRcbiAgICogV2Ugb3ZlcnJpZGUgdGhpcyBtZXRob2QgdG8gaW5jcmVhc2Ugb3VyIGNhY2hlIGNvdmVyYWdlLlxuICAgKlxuICAgKiBAcGFyYW0gY2FjaGVkUm91dGVzXG4gICAqIEBwYXJhbSBfYmxvY2tOdW1iZXJcbiAgICogQHBhcmFtIF9vcHRpbWlzdGljXG4gICAqIEBwcm90ZWN0ZWRcbiAgICovXG4gIHByb3RlY3RlZCBvdmVycmlkZSBmaWx0ZXJFeHBpcmVkQ2FjaGVkUm91dGVzKFxuICAgIGNhY2hlZFJvdXRlczogQ2FjaGVkUm91dGVzIHwgdW5kZWZpbmVkLFxuICAgIF9ibG9ja051bWJlcjogbnVtYmVyLFxuICAgIF9vcHRpbWlzdGljOiBib29sZWFuXG4gICk6IENhY2hlZFJvdXRlcyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIGNhY2hlZFJvdXRlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBIZWxwZXIgZnVuY3Rpb24gdG8gZGV0ZXJtaW5lIHRoZSB0b2tlbkluIGFuZCB0b2tlbk91dCBnaXZlbiB0aGUgdHJhZGVUeXBlLCBxdW90ZVRva2VuIGFuZCBhbW91bnQuY3VycmVuY3lcbiAgICpcbiAgICogQHBhcmFtIGFtb3VudFxuICAgKiBAcGFyYW0gcXVvdGVUb2tlblxuICAgKiBAcGFyYW0gdHJhZGVUeXBlXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBwcml2YXRlIGRldGVybWluZVRva2VuSW5PdXQoXG4gICAgYW1vdW50OiBDdXJyZW5jeUFtb3VudDxDdXJyZW5jeT4sXG4gICAgcXVvdGVUb2tlbjogVG9rZW4sXG4gICAgdHJhZGVUeXBlOiBUcmFkZVR5cGVcbiAgKTogeyB0b2tlbkluOiBUb2tlbjsgdG9rZW5PdXQ6IFRva2VuIH0ge1xuICAgIGlmICh0cmFkZVR5cGUgPT0gVHJhZGVUeXBlLkVYQUNUX0lOUFVUKSB7XG4gICAgICByZXR1cm4geyB0b2tlbkluOiBhbW91bnQuY3VycmVuY3kud3JhcHBlZCwgdG9rZW5PdXQ6IHF1b3RlVG9rZW4gfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHsgdG9rZW5JbjogcXVvdGVUb2tlbiwgdG9rZW5PdXQ6IGFtb3VudC5jdXJyZW5jeS53cmFwcGVkIH07XG4gICAgfVxuICB9XG59XG4iXX0=