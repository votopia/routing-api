import { CurrencyAmount, TradeType, Pool, Protocol, NETWORK_NAME } from "@votopia/sdk-core";
import { MetricLoggerUnit, routeAmountsToString, SwapType, SimulationStatus, } from "@votopia/smart-order-router";
import JSBI from "jsbi";
import _ from "lodash";
import { APIGLambdaHandler } from "../handler";
import { QuoteResponseSchemaJoi } from "../schema";
import { DEFAULT_ROUTING_CONFIG, parseDeadline, parseSlippageTolerance, tokenStringToCurrency, QUOTE_SPEED_CONFIG, INTENT_SPECIFIC_CONFIG, FEE_ON_TRANSFER_SPECIFIC_CONFIG, } from "../shared";
import { QuoteQueryParamsJoi } from "./schema/quote-schema";
import { simulationStatusToString } from "./util/simulation";
export class QuoteHandler extends APIGLambdaHandler {
    async handleRequest(params) {
        const { metric, log, quoteSpeed, intent } = params.requestInjected;
        const startTime = Date.now();
        let result;
        try {
            result = await this.handleRequestInternal(params);
            switch (result.statusCode) {
                case 200:
                case 202:
                    metric.putMetric(`GET_QUOTE_200`, 1, MetricLoggerUnit.Count);
                    break;
                case 400:
                case 403:
                case 404:
                case 408:
                case 409:
                    metric.putMetric(`GET_QUOTE_400`, 1, MetricLoggerUnit.Count);
                    log.error({
                        statusCode: result === null || result === void 0 ? void 0 : result.statusCode,
                        errorCode: result === null || result === void 0 ? void 0 : result.errorCode,
                        detail: result === null || result === void 0 ? void 0 : result.detail,
                    }, `Quote 4XX Error [${result === null || result === void 0 ? void 0 : result.statusCode}] on ${NETWORK_NAME} with errorCode '${result === null || result === void 0 ? void 0 : result.errorCode}': ${result === null || result === void 0 ? void 0 : result.detail}`);
                    break;
                case 500:
                    metric.putMetric(`GET_QUOTE_500`, 1, MetricLoggerUnit.Count);
                    break;
            }
        }
        catch (err) {
            metric.putMetric(`GET_QUOTE_500`, 1, MetricLoggerUnit.Count);
            throw err;
        }
        finally {
            // This metric is logged after calling the internal handler to correlate with the status metrics
            metric.putMetric(`GET_QUOTE_REQUESTED`, 1, MetricLoggerUnit.Count);
            metric.putMetric(`GET_QUOTE_LATENCY`, Date.now() - startTime, MetricLoggerUnit.Milliseconds);
            metric.putMetric(`GET_QUOTE_LATENCY_QUOTE_SPEED_${quoteSpeed !== null && quoteSpeed !== void 0 ? quoteSpeed : "standard"}`, Date.now() - startTime, MetricLoggerUnit.Milliseconds);
            metric.putMetric(`GET_QUOTE_LATENCY_INTENT_${intent !== null && intent !== void 0 ? intent : "quote"}`, Date.now() - startTime, MetricLoggerUnit.Milliseconds);
        }
        return result;
    }
    async handleRequestInternal(params) {
        const { requestQueryParams: { tokenInAddress, tokenOutAddress, amount: amountRaw, type, recipient, slippageTolerance, deadline, minSplits, forceCrossProtocol, forceMixedRoutes, protocols: protocolsStr, simulateFromAddress, quoteSpeed, debugRoutingConfig, unicornSecret, intent, enableFeeOnTransferFeeFetching, }, requestInjected: { router, log, id: quoteId, tokenProvider, tokenListProvider, v3PoolProvider: v3PoolProvider, metric, }, } = params;
        // Parse user provided token address/symbol to Currency object.
        let before = Date.now();
        const currencyIn = await tokenStringToCurrency(tokenListProvider, tokenProvider, tokenInAddress, log);
        const currencyOut = await tokenStringToCurrency(tokenListProvider, tokenProvider, tokenOutAddress, log);
        metric.putMetric("TokenInOutStrToToken", Date.now() - before, MetricLoggerUnit.Milliseconds);
        if (!currencyIn) {
            return {
                statusCode: 400,
                errorCode: "TOKEN_IN_INVALID",
                detail: `Could not find token with address "${tokenInAddress}"`,
            };
        }
        if (!currencyOut) {
            return {
                statusCode: 400,
                errorCode: "TOKEN_OUT_INVALID",
                detail: `Could not find token with address "${tokenOutAddress}"`,
            };
        }
        if (currencyIn.equals(currencyOut)) {
            return {
                statusCode: 400,
                errorCode: "TOKEN_IN_OUT_SAME",
                detail: `tokenIn and tokenOut must be different`,
            };
        }
        let protocols = [];
        if (protocolsStr) {
            for (const protocolStr of protocolsStr) {
                switch (protocolStr.toLowerCase()) {
                    case "v3":
                        protocols.push(Protocol.V3);
                        break;
                    default:
                        return {
                            statusCode: 400,
                            errorCode: "INVALID_PROTOCOL",
                            detail: `Invalid protocol specified. Supported protocols: ${JSON.stringify(Object.values(Protocol))}`,
                        };
                }
            }
        }
        else if (!forceCrossProtocol) {
            protocols = [Protocol.V3];
        }
        let parsedDebugRoutingConfig = {};
        if (debugRoutingConfig && unicornSecret && unicornSecret === process.env.UNICORN_SECRET) {
            parsedDebugRoutingConfig = JSON.parse(debugRoutingConfig);
        }
        const routingConfig = {
            ...DEFAULT_ROUTING_CONFIG,
            ...(minSplits ? { minSplits } : {}),
            ...(forceCrossProtocol ? { forceCrossProtocol } : {}),
            ...(forceMixedRoutes ? { forceMixedRoutes } : {}),
            protocols,
            ...(quoteSpeed ? QUOTE_SPEED_CONFIG[quoteSpeed] : {}),
            ...parsedDebugRoutingConfig,
            ...(intent ? INTENT_SPECIFIC_CONFIG[intent] : {}),
            // Only when enableFeeOnTransferFeeFetching is explicitly set to true, then we
            // override usedCachedRoutes to false. This is to ensure that we don't use
            // accidentally override usedCachedRoutes in the normal path.
            ...(enableFeeOnTransferFeeFetching ? FEE_ON_TRANSFER_SPECIFIC_CONFIG(enableFeeOnTransferFeeFetching) : {}),
        };
        metric.putMetric(`${intent}Intent`, 1, MetricLoggerUnit.Count);
        let swapParams = undefined;
        // e.g. Inputs of form "1.25%" with 2dp max. Convert to fractional representation => 1.25 => 125 / 10000
        if (slippageTolerance) {
            const slippageTolerancePercent = parseSlippageTolerance(slippageTolerance);
            if (deadline && recipient) {
                swapParams = {
                    type: SwapType.SWAP_ROUTER_02,
                    deadline: parseDeadline(deadline),
                    recipient: recipient,
                    slippageTolerance: slippageTolerancePercent,
                };
            }
            if (simulateFromAddress) {
                metric.putMetric("Simulation Requested", 1, MetricLoggerUnit.Count);
                if (swapParams) {
                    swapParams.simulate = { fromAddress: simulateFromAddress };
                }
            }
        }
        before = Date.now();
        let swapRoute;
        let amount;
        let tokenPairSymbol = "";
        let tokenPairSymbolChain = "";
        if (currencyIn.symbol && currencyOut.symbol) {
            tokenPairSymbol = _([currencyIn.symbol, currencyOut.symbol]).join("/");
            tokenPairSymbolChain = `${tokenPairSymbol}`;
        }
        const [token0Symbol, token0Address, token1Symbol, token1Address] = currencyIn.wrapped.sortsBefore(currencyOut.wrapped)
            ? [currencyIn.symbol, currencyIn.wrapped.address, currencyOut.symbol, currencyOut.wrapped.address]
            : [currencyOut.symbol, currencyOut.wrapped.address, currencyIn.symbol, currencyIn.wrapped.address];
        switch (type) {
            case "exactIn":
                amount = CurrencyAmount.fromRawAmount(currencyIn, JSBI.BigInt(amountRaw));
                log.info({
                    amountIn: amount.toExact(),
                    token0Address,
                    token1Address,
                    token0Symbol,
                    token1Symbol,
                    tokenInSymbol: currencyIn.symbol,
                    tokenOutSymbol: currencyOut.symbol,
                    tokenPairSymbol,
                    tokenPairSymbolChain,
                    type,
                    routingConfig: routingConfig,
                    swapParams,
                    intent,
                }, `Exact In Swap: Give ${amount.toExact()} ${amount.currency.symbol}, Want: ${currencyOut.symbol}.`);
                swapRoute = await router.route(amount, currencyOut, TradeType.EXACT_INPUT, swapParams, routingConfig);
                break;
            case "exactOut":
                amount = CurrencyAmount.fromRawAmount(currencyOut, JSBI.BigInt(amountRaw));
                log.info({
                    amountOut: amount.toExact(),
                    token0Address,
                    token1Address,
                    token0Symbol,
                    token1Symbol,
                    tokenInSymbol: currencyIn.symbol,
                    tokenOutSymbol: currencyOut.symbol,
                    tokenPairSymbol,
                    tokenPairSymbolChain,
                    type,
                    routingConfig: routingConfig,
                    swapParams,
                }, `Exact Out Swap: Want ${amount.toExact()} ${amount.currency.symbol} Give: ${currencyIn.symbol}.`);
                swapRoute = await router.route(amount, currencyIn, TradeType.EXACT_OUTPUT, swapParams, routingConfig);
                break;
            default:
                throw new Error("Invalid swap type");
        }
        if (!swapRoute) {
            log.info({
                type,
                tokenIn: currencyIn,
                tokenOut: currencyOut,
                amount: amount.quotient.toString(),
            }, `No route found. 404`);
            return {
                statusCode: 404,
                errorCode: "NO_ROUTE",
                detail: "No route found",
            };
        }
        const { quote, quoteGasAdjusted, quoteGasAndPortionAdjusted, route, estimatedGasUsed, estimatedGasUsedQuoteToken, estimatedGasUsedUSD, gasPriceWei, methodParameters, blockNumber, simulationStatus, hitsCachedRoute, portionAmount: outputPortionAmount, // TODO: name it back to portionAmount
         } = swapRoute;
        if (simulationStatus == SimulationStatus.Failed) {
            metric.putMetric("SimulationFailed", 1, MetricLoggerUnit.Count);
        }
        else if (simulationStatus == SimulationStatus.Succeeded) {
            metric.putMetric("SimulationSuccessful", 1, MetricLoggerUnit.Count);
        }
        else if (simulationStatus == SimulationStatus.InsufficientBalance) {
            metric.putMetric("SimulationInsufficientBalance", 1, MetricLoggerUnit.Count);
        }
        else if (simulationStatus == SimulationStatus.NotApproved) {
            metric.putMetric("SimulationNotApproved", 1, MetricLoggerUnit.Count);
        }
        else if (simulationStatus == SimulationStatus.NotSupported) {
            metric.putMetric("SimulationNotSupported", 1, MetricLoggerUnit.Count);
        }
        const routeResponse = [];
        for (const subRoute of route) {
            const { amount, quote, tokenPath } = subRoute;
            const pools = subRoute.route.pools;
            const curRoute = [];
            for (let i = 0; i < pools.length; i++) {
                const nextPool = pools[i];
                const tokenIn = tokenPath[i];
                const tokenOut = tokenPath[i + 1];
                let edgeAmountIn = undefined;
                if (i == 0) {
                    edgeAmountIn = type == "exactIn" ? amount.quotient.toString() : quote.quotient.toString();
                }
                let edgeAmountOut = undefined;
                if (i == pools.length - 1) {
                    edgeAmountOut = type == "exactIn" ? quote.quotient.toString() : amount.quotient.toString();
                }
                if (nextPool instanceof Pool) {
                    curRoute.push({
                        type: "v3-pool",
                        address: v3PoolProvider.getPoolAddress(nextPool.token0, nextPool.token1, nextPool.fee).poolAddress,
                        tokenIn: {
                            decimals: tokenIn.decimals.toString(),
                            address: tokenIn.address,
                            symbol: tokenIn.symbol,
                        },
                        tokenOut: {
                            decimals: tokenOut.decimals.toString(),
                            address: tokenOut.address,
                            symbol: tokenOut.symbol,
                        },
                        fee: nextPool.fee.toString(),
                        liquidity: nextPool.liquidity.toString(),
                        sqrtRatioX96: nextPool.sqrtRatioX96.toString(),
                        tickCurrent: nextPool.tickCurrent.toString(),
                        amountIn: edgeAmountIn,
                        amountOut: edgeAmountOut,
                    });
                }
            }
            routeResponse.push(curRoute);
        }
        const routeString = routeAmountsToString(route);
        const result = {
            methodParameters,
            blockNumber: blockNumber.toString(),
            amount: amount.quotient.toString(),
            amountDecimals: amount.toExact(),
            quote: quote.quotient.toString(),
            quoteDecimals: quote.toExact(),
            quoteGasAdjusted: quoteGasAdjusted.quotient.toString(),
            quoteGasAdjustedDecimals: quoteGasAdjusted.toExact(),
            quoteGasAndPortionAdjusted: quoteGasAndPortionAdjusted === null || quoteGasAndPortionAdjusted === void 0 ? void 0 : quoteGasAndPortionAdjusted.quotient.toString(),
            quoteGasAndPortionAdjustedDecimals: quoteGasAndPortionAdjusted === null || quoteGasAndPortionAdjusted === void 0 ? void 0 : quoteGasAndPortionAdjusted.toExact(),
            gasUseEstimateQuote: estimatedGasUsedQuoteToken.quotient.toString(),
            gasUseEstimateQuoteDecimals: estimatedGasUsedQuoteToken.toExact(),
            gasUseEstimate: estimatedGasUsed.toString(),
            gasUseEstimateUSD: estimatedGasUsedUSD.toExact(),
            simulationStatus: simulationStatusToString(simulationStatus, log),
            simulationError: simulationStatus == SimulationStatus.Failed,
            gasPriceWei: gasPriceWei.toString(),
            route: routeResponse,
            routeString,
            quoteId,
            hitsCachedRoutes: hitsCachedRoute,
            portionAmount: outputPortionAmount === null || outputPortionAmount === void 0 ? void 0 : outputPortionAmount.quotient.toString(),
            portionAmountDecimals: outputPortionAmount === null || outputPortionAmount === void 0 ? void 0 : outputPortionAmount.toExact(),
        };
        return {
            statusCode: 200,
            body: result,
        };
    }
    requestBodySchema() {
        return null;
    }
    requestQueryParamsSchema() {
        return QuoteQueryParamsJoi;
    }
    responseBodySchema() {
        return QuoteResponseSchemaJoi;
    }
    afterHandler(metric, response, requestStart) {
        metric.putMetric(`GET_QUOTE_LATENCY_TOP_LEVEL_${response.hitsCachedRoutes ? "CACHED_ROUTES_HIT" : "CACHED_ROUTES_MISS"}`, Date.now() - requestStart, MetricLoggerUnit.Milliseconds);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVvdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9saWIvaGFuZGxlcnMvcXVvdGUvcXVvdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsT0FBTyxFQUFZLGNBQWMsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUN0RyxPQUFPLEVBR0wsZ0JBQWdCLEVBQ2hCLG9CQUFvQixFQUdwQixRQUFRLEVBQ1IsZ0JBQWdCLEdBQ2pCLE1BQU0sNkJBQTZCLENBQUM7QUFFckMsT0FBTyxJQUFJLE1BQU0sTUFBTSxDQUFDO0FBQ3hCLE9BQU8sQ0FBQyxNQUFNLFFBQVEsQ0FBQztBQUN2QixPQUFPLEVBQUUsaUJBQWlCLEVBQWdELE1BQU0sWUFBWSxDQUFDO0FBRTdGLE9BQU8sRUFBaUIsc0JBQXNCLEVBQWlCLE1BQU0sV0FBVyxDQUFDO0FBQ2pGLE9BQU8sRUFDTCxzQkFBc0IsRUFDdEIsYUFBYSxFQUNiLHNCQUFzQixFQUN0QixxQkFBcUIsRUFDckIsa0JBQWtCLEVBQ2xCLHNCQUFzQixFQUN0QiwrQkFBK0IsR0FDaEMsTUFBTSxXQUFXLENBQUM7QUFDbkIsT0FBTyxFQUFvQixtQkFBbUIsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBRTlFLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBRzdELE1BQU0sT0FBTyxZQUFhLFNBQVEsaUJBTWpDO0lBQ1EsS0FBSyxDQUFDLGFBQWEsQ0FDeEIsTUFBcUc7UUFFckcsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQyxlQUFlLENBQUM7UUFDbkUsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBRTdCLElBQUksTUFBK0MsQ0FBQztRQUVwRCxJQUFJO1lBQ0YsTUFBTSxHQUFHLE1BQU0sSUFBSSxD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WCxPQUFPO1lBQ1AsZ0JBQWdCLEVBQUUsZUFBZTtZQUVqQyxhQUFhLEVBQUUsbUJBQW1CLGFBQW5CLG1CQUFtQix1QkFBbkIsbUJBQW1CLENBQUUsUUFBUSxDQUFDLFFBQVEsRUFBRTtZQUN2RCxxQkFBcUIsRUFBRSxtQkFBbUIsYUFBbkIsbUJBQW1CLHVCQUFuQixtQkFBbUIsQ0FBRSxPQUFPLEVBQUU7U0FDdEQsQ0FBQztRQUVGLE9BQU87WUFDTCxVQUFVLEVBQUUsR0FBRztZQUNmLElBQUksRUFBRSxNQUFNO1NBQ2IsQ0FBQztJQUNKLENBQUM7SUFFUyxpQkFBaUI7UUFDekIsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRVMsd0JBQXdCO1FBQ2hDLE9BQU8sbUJBQW1CLENBQUM7SUFDN0IsQ0FBQztJQUVTLGtCQUFrQjtRQUMxQixPQUFPLHNCQUFzQixDQUFDO0lBQ2hDLENBQUM7SUFFUyxZQUFZLENBQUMsTUFBcUIsRUFBRSxRQUF1QixFQUFFLFlBQW9CO1FBQ3pGLE1BQU0sQ0FBQyxTQUFTLENBQ2QsK0JBQStCLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixFQUFFLEVBQ3ZHLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxZQUFZLEVBQ3pCLGdCQUFnQixDQUFDLFlBQVksQ0FDOUIsQ0FBQztJQUNKLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBKb2kgZnJvbSBcIkBoYXBpL2pvaVwiO1xuXG5pbXBvcnQgeyBDdXJyZW5jeSwgQ3VycmVuY3lBbW91bnQsIFRyYWRlVHlwZSwgUG9vbCwgUHJvdG9jb2wsIE5FVFdPUktfTkFNRSB9IGZyb20gXCJAdm90b3BpYS9zZGstY29yZVwiO1xuaW1wb3J0IHtcbiAgQWxwaGFSb3V0ZXJDb25maWcsXG4gIElSb3V0ZXIsXG4gIE1ldHJpY0xvZ2dlclVuaXQsXG4gIHJvdXRlQW1vdW50c1RvU3RyaW5nLFxuICBTd2FwUm91dGUsXG4gIFN3YXBPcHRpb25zLFxuICBTd2FwVHlwZSxcbiAgU2ltdWxhdGlvblN0YXR1cyxcbn0gZnJvbSBcIkB2b3RvcGlhL3NtYXJ0LW9yZGVyLXJvdXRlclwiO1xuXG5pbXBvcnQgSlNCSSBmcm9tIFwianNiaVwiO1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgQVBJR0xhbWJkYUhhbmRsZXIsIEVycm9yUmVzcG9uc2UsIEhhbmRsZVJlcXVlc3RQYXJhbXMsIFJlc3BvbnNlIH0gZnJvbSBcIi4uL2hhbmRsZXJcIjtcbmltcG9ydCB7IENvbnRhaW5lckluamVjdGVkLCBSZXF1ZXN0SW5qZWN0ZWQgfSBmcm9tIFwiLi4vaW5qZWN0b3Itc29yXCI7XG5pbXBvcnQgeyBRdW90ZVJlc3BvbnNlLCBRdW90ZVJlc3BvbnNlU2NoZW1hSm9pLCBWM1Bvb2xJblJvdXRlIH0gZnJvbSBcIi4uL3NjaGVtYVwiO1xuaW1wb3J0IHtcbiAgREVGQVVMVF9ST1VUSU5HX0NPTkZJRyxcbiAgcGFyc2VEZWFkbGluZSxcbiAgcGFyc2VTbGlwcGFnZVRvbGVyYW5jZSxcbiAgdG9rZW5TdHJpbmdUb0N1cnJlbmN5LFxuICBRVU9URV9TUEVFRF9DT05GSUcsXG4gIElOVEVOVF9TUEVDSUZJQ19DT05GSUcsXG4gIEZFRV9PTl9UUkFOU0ZFUl9TUEVDSUZJQ19DT05GSUcsXG59IGZyb20gXCIuLi9zaGFyZWRcIjtcbmltcG9ydCB7IFF1b3RlUXVlcnlQYXJhbXMsIFF1b3RlUXVlcnlQYXJhbXNKb2kgfSBmcm9tIFwiLi9zY2hlbWEvcXVvdGUtc2NoZW1hXCI7XG5cbmltcG9ydCB7IHNpbXVsYXRpb25TdGF0dXNUb1N0cmluZyB9IGZyb20gXCIuL3V0aWwvc2ltdWxhdGlvblwiO1xuaW1wb3J0IHsgTWV0cmljc0xvZ2dlciB9IGZyb20gXCJhd3MtZW1iZWRkZWQtbWV0cmljc1wiO1xuXG5leHBvcnQgY2xhc3MgUXVvdGVIYW5kbGVyIGV4dGVuZHMgQVBJR0xhbWJkYUhhbmRsZXI8XG4gIENvbnRhaW5lckluamVjdGVkLFxuICBSZXF1ZXN0SW5qZWN0ZWQ8SVJvdXRlcjxBbHBoYVJvdXRlckNvbmZpZz4+LFxuICB2b2lkLFxuICBRdW90ZVF1ZXJ5UGFyYW1zLFxuICBRdW90ZVJlc3BvbnNlXG4+IHtcbiAgcHVibGljIGFzeW5jIGhhbmRsZVJlcXVlc3QoXG4gICAgcGFyYW1zOiBIYW5kbGVSZXF1ZXN0UGFyYW1zPENvbnRhaW5lckluamVjdGVkLCBSZXF1ZXN0SW5qZWN0ZWQ8SVJvdXRlcjxhbnk+Piwgdm9pZCwgUXVvdGVRdWVyeVBhcmFtcz5cbiAgKTogUHJvbWlzZTxSZXNwb25zZTxRdW90ZVJlc3BvbnNlPiB8IEVycm9yUmVzcG9uc2U+IHtcbiAgICBjb25zdCB7IG1ldHJpYywgbG9nLCBxdW90ZVNwZWVkLCBpbnRlbnQgfSA9IHBhcmFtcy5yZXF1ZXN0SW5qZWN0ZWQ7XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcblxuICAgIGxldCByZXN1bHQ6IFJlc3BvbnNlPFF1b3RlUmVzcG9uc2U+IHwgRXJyb3JSZXNwb25zZTtcblxuICAgIHRyeSB7XG4gICAgICByZXN1bHQgPSBhd2FpdCB0aGlzLmhhbmRsZVJlcXVlc3RJbnRlcm5hbChwYXJhbXMpO1xuXG4gICAgICBzd2l0Y2ggKHJlc3VsdC5zdGF0dXNDb2RlKSB7XG4gICAgICAgIGNhc2UgMjAwOlxuICAgICAgICBjYXNlIDIwMjpcbiAgICAgICAgICBtZXRyaWMucHV0TWV0cmljKGBHRVRfUVVPVEVfMjAwYCwgMSwgTWV0cmljTG9nZ2VyVW5pdC5Db3VudCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgNDAwOlxuICAgICAgICBjYXNlIDQwMzpcbiAgICAgICAgY2FzZSA0MDQ6XG4gICAgICAgIGNhc2UgNDA4OlxuICAgICAgICBjYXNlIDQwOTpcbiAgICAgICAgICBtZXRyaWMucHV0TWV0cmljKGBHRVRfUVVPVEVfNDAwYCwgMSwgTWV0cmljTG9nZ2VyVW5pdC5Db3VudCk7XG4gICAgICAgICAgbG9nLmVycm9yKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzdGF0dXNDb2RlOiByZXN1bHQ/LnN0YXR1c0NvZGUsXG4gICAgICAgICAgICAgIGVycm9yQ29kZTogcmVzdWx0Py5lcnJvckNvZGUsXG4gICAgICAgICAgICAgIGRldGFpbDogcmVzdWx0Py5kZXRhaWwsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYFF1b3RlIDRYWCBFcnJvciBbJHtyZXN1bHQ/LnN0YXR1c0NvZGV9XSBvbiAke05FVFdPUktfTkFNRX0gd2l0aCBlcnJvckNvZGUgJyR7cmVzdWx0Py5lcnJvckNvZGV9JzogJHtyZXN1bHQ/LmRldGFpbH1gXG4gICAgICAgICAgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSA1MDA6XG4gICAgICAgICAgbWV0cmljLnB1dE1ldHJpYyhgR0VUX1FVT1RFXzUwMGAsIDEsIE1ldHJpY0xvZ2dlclVuaXQuQ291bnQpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgbWV0cmljLnB1dE1ldHJpYyhgR0VUX1FVT1RFXzUwMGAsIDEsIE1ldHJpY0xvZ2dlclVuaXQuQ291bnQpO1xuXG4gICAgICB0aHJvdyBlcnI7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIC8vIFRoaXMgbWV0cmljIGlzIGxvZ2dlZCBhZnRlciBjYWxsaW5nIHRoZSBpbnRlcm5hbCBoYW5kbGVyIHRvIGNvcnJlbGF0ZSB3aXRoIHRoZSBzdGF0dXMgbWV0cmljc1xuICAgICAgbWV0cmljLnB1dE1ldHJpYyhgR0VUX1FVT1RFX1JFUVVFU1RFRGAsIDEsIE1ldHJpY0xvZ2dlclVuaXQuQ291bnQpO1xuICAgICAgbWV0cmljLnB1dE1ldHJpYyhgR0VUX1FVT1RFX0xBVEVOQ1lgLCBEYXRlLm5vdygpIC0gc3RhcnRUaW1lLCBNZXRyaWNMb2dnZXJVbml0Lk1pbGxpc2Vjb25kcyk7XG5cbiAgICAgIG1ldHJpYy5wdXRNZXRyaWMoXG4gICAgICAgIGBHRVRfUVVPVEVfTEFURU5DWV9RVU9URV9TUEVFRF8ke3F1b3RlU3BlZWQgPz8gXCJzdGFuZGFyZFwifWAsXG4gICAgICAgIERhdGUubm93KCkgLSBzdGFydFRpbWUsXG4gICAgICAgIE1ldHJpY0xvZ2dlclVuaXQuTWlsbGlzZWNvbmRzXG4gICAgICApO1xuICAgICAgbWV0cmljLnB1dE1ldHJpYyhcbiAgICAgICAgYEdFVF9RVU9URV9MQVRFTkNZX0lOVEVOVF8ke2ludGVudCA/PyBcInF1b3RlXCJ9YCxcbiAgICAgICAgRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSxcbiAgICAgICAgTWV0cmljTG9nZ2VyVW5pdC5NaWxsaXNlY29uZHNcbiAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgaGFuZGxlUmVxdWVzdEludGVybmFsKFxuICAgIHBhcmFtczogSGFuZGxlUmVxdWVzdFBhcmFtczxDb250YWluZXJJbmplY3RlZCwgUmVxdWVzdEluamVjdGVkPElSb3V0ZXI8YW55Pj4sIHZvaWQsIFF1b3RlUXVlcnlQYXJhbXM+XG4gICk6IFByb21pc2U8UmVzcG9uc2U8UXVvdGVSZXNwb25zZT4gfCBFcnJvclJlc3BvbnNlPiB7XG4gICAgY29uc3Qge1xuICAgICAgcmVxdWVzdFF1ZXJ5UGFyYW1zOiB7XG4gICAgICAgIHRva2VuSW5BZGRyZXNzLFxuXG4gICAgICAgIHRva2VuT3V0QWRkcmVzcyxcblxuICAgICAgICBhbW91bnQ6IGFtb3VudFJhdyxcbiAgICAgICAgdHlwZSxcbiAgICAgICAgcmVjaXBpZW50LFxuICAgICAgICBzbGlwcGFnZVRvbGVyYW5jZSxcbiAgICAgICAgZGVhZGxpbmUsXG4gICAgICAgIG1pblNwbGl0cyxcbiAgICAgICAgZm9yY2VDcm9zc1Byb3RvY29sLFxuICAgICAgICBmb3JjZU1peGVkUm91dGVzLFxuICAgICAgICBwcm90b2NvbHM6IHByb3RvY29sc1N0cixcbiAgICAgICAgc2ltdWxhdGVGcm9tQWRkcmVzcyxcblxuICAgICAgICBxdW90ZVNwZWVkLFxuICAgICAgICBkZWJ1Z1JvdXRpbmdDb25maWcsXG4gICAgICAgIHVuaWNvcm5TZWNyZXQsXG4gICAgICAgIGludGVudCxcbiAgICAgICAgZW5hYmxlRmVlT25UcmFuc2ZlckZlZUZldGNoaW5nLFxuICAgICAgfSxcbiAgICAgIHJlcXVlc3RJbmplY3RlZDoge1xuICAgICAgICByb3V0ZXIsXG4gICAgICAgIGxvZyxcbiAgICAgICAgaWQ6IHF1b3RlSWQsXG5cbiAgICAgICAgdG9rZW5Qcm92aWRlcixcbiAgICAgICAgdG9rZW5MaXN0UHJvdmlkZXIsXG4gICAgICAgIHYzUG9vbFByb3ZpZGVyOiB2M1Bvb2xQcm92aWRlcixcblxuICAgICAgICBtZXRyaWMsXG4gICAgICB9LFxuICAgIH0gPSBwYXJhbXM7XG5cbiAgICAvLyBQYXJzZSB1c2VyIHByb3ZpZGVkIHRva2VuIGFkZHJlc3Mvc3ltYm9sIHRvIEN1cnJlbmN5IG9iamVjdC5cbiAgICBsZXQgYmVmb3JlID0gRGF0ZS5ub3coKTtcblxuICAgIGNvbnN0IGN1cnJlbmN5SW4gPSBhd2FpdCB0b2tlblN0cmluZ1RvQ3VycmVuY3kodG9rZW5MaXN0UHJvdmlkZXIsIHRva2VuUHJvdmlkZXIsIHRva2VuSW5BZGRyZXNzLCBsb2cpO1xuXG4gICAgY29uc3QgY3VycmVuY3lPdXQgPSBhd2FpdCB0b2tlblN0cmluZ1RvQ3VycmVuY3kodG9rZW5MaXN0UHJvdmlkZXIsIHRva2VuUHJvdmlkZXIsIHRva2VuT3V0QWRkcmVzcywgbG9nKTtcblxuICAgIG1ldHJpYy5wdXRNZXRyaWMoXCJUb2tlbkluT3V0U3RyVG9Ub2tlblwiLCBEYXRlLm5vdygpIC0gYmVmb3JlLCBNZXRyaWNMb2dnZXJVbml0Lk1pbGxpc2Vjb25kcyk7XG5cbiAgICBpZiAoIWN1cnJlbmN5SW4pIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN0YXR1c0NvZGU6IDQwMCxcbiAgICAgICAgZXJyb3JDb2RlOiBcIlRPS0VOX0lOX0lOVkFMSURcIixcbiAgICAgICAgZGV0YWlsOiBgQ291bGQgbm90IGZpbmQgdG9rZW4gd2l0aCBhZGRyZXNzIFwiJHt0b2tlbkluQWRkcmVzc31cImAsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmICghY3VycmVuY3lPdXQpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN0YXR1c0NvZGU6IDQwMCxcbiAgICAgICAgZXJyb3JDb2RlOiBcIlRPS0VOX09VVF9JTlZBTElEXCIsXG4gICAgICAgIGRldGFpbDogYENvdWxkIG5vdCBmaW5kIHRva2VuIHdpdGggYWRkcmVzcyBcIiR7dG9rZW5PdXRBZGRyZXNzfVwiYCxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbmN5SW4uZXF1YWxzKGN1cnJlbmN5T3V0KSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3RhdHVzQ29kZTogNDAwLFxuICAgICAgICBlcnJvckNvZGU6IFwiVE9LRU5fSU5fT1VUX1NBTUVcIixcbiAgICAgICAgZGV0YWlsOiBgdG9rZW5JbiBhbmQgdG9rZW5PdXQgbXVzdCBiZSBkaWZmZXJlbnRgLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBsZXQgcHJvdG9jb2xzOiBQcm90b2NvbFtdID0gW107XG4gICAgaWYgKHByb3RvY29sc1N0cikge1xuICAgICAgZm9yIChjb25zdCBwcm90b2NvbFN0ciBvZiBwcm90b2NvbHNTdHIpIHtcbiAgICAgICAgc3dpdGNoIChwcm90b2NvbFN0ci50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgY2FzZSBcInYzXCI6XG4gICAgICAgICAgICBwcm90b2NvbHMucHVzaChQcm90b2NvbC5WMyk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBzdGF0dXNDb2RlOiA0MDAsXG4gICAgICAgICAgICAgIGVycm9yQ29kZTogXCJJTlZBTElEX1BST1RPQ09MXCIsXG4gICAgICAgICAgICAgIGRldGFpbDogYEludmFsaWQgcHJvdG9jb2wgc3BlY2lmaWVkLiBTdXBwb3J0ZWQgcHJvdG9jb2xzOiAke0pTT04uc3RyaW5naWZ5KE9iamVjdC52YWx1ZXMoUHJvdG9jb2wpKX1gLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoIWZvcmNlQ3Jvc3NQcm90b2NvbCkge1xuICAgICAgcHJvdG9jb2xzID0gW1Byb3RvY29sLlYzXTtcbiAgICB9XG5cbiAgICBsZXQgcGFyc2VkRGVidWdSb3V0aW5nQ29uZmlnID0ge307XG4gICAgaWYgKGRlYnVnUm91dGluZ0NvbmZpZyAmJiB1bmljb3JuU2VjcmV0ICYmIHVuaWNvcm5TZWNyZXQgPT09IHByb2Nlc3MuZW52LlVOSUNPUk5fU0VDUkVUKSB7XG4gICAgICBwYXJzZWREZWJ1Z1JvdXRpbmdDb25maWcgPSBKU09OLnBhcnNlKGRlYnVnUm91dGluZ0NvbmZpZyk7XG4gICAgfVxuXG4gICAgY29uc3Qgcm91dGluZ0NvbmZpZzogQWxwaGFSb3V0ZXJDb25maWcgPSB7XG4gICAgICAuLi5ERUZBVUxUX1JPVVRJTkdfQ09ORklHLFxuICAgICAgLi4uKG1pblNwbGl0cyA/IHsgbWluU3BsaXRzIH0gOiB7fSksXG4gICAgICAuLi4oZm9yY2VDcm9zc1Byb3RvY29sID8geyBmb3JjZUNyb3NzUHJvdG9jb2wgfSA6IHt9KSxcbiAgICAgIC4uLihmb3JjZU1peGVkUm91dGVzID8geyBmb3JjZU1peGVkUm91dGVzIH0gOiB7fSksXG4gICAgICBwcm90b2NvbHMsXG4gICAgICAuLi4ocXVvdGVTcGVlZCA/IFFVT1RFX1NQRUVEX0NPTkZJR1txdW90ZVNwZWVkXSA6IHt9KSxcbiAgICAgIC4uLnBhcnNlZERlYnVnUm91dGluZ0NvbmZpZyxcbiAgICAgIC4uLihpbnRlbnQgPyBJTlRFTlRfU1BFQ0lGSUNfQ09ORklHW2ludGVudF0gOiB7fSksXG4gICAgICAvLyBPbmx5IHdoZW4gZW5hYmxlRmVlT25UcmFuc2ZlckZlZUZldGNoaW5nIGlzIGV4cGxpY2l0bHkgc2V0IHRvIHRydWUsIHRoZW4gd2VcbiAgICAgIC8vIG92ZXJyaWRlIHVzZWRDYWNoZWRSb3V0ZXMgdG8gZmFsc2UuIFRoaXMgaXMgdG8gZW5zdXJlIHRoYXQgd2UgZG9uJ3QgdXNlXG4gICAgICAvLyBhY2NpZGVudGFsbHkgb3ZlcnJpZGUgdXNlZENhY2hlZFJvdXRlcyBpbiB0aGUgbm9ybWFsIHBhdGguXG4gICAgICAuLi4oZW5hYmxlRmVlT25UcmFuc2ZlckZlZUZldGNoaW5nID8gRkVFX09OX1RSQU5TRkVSX1NQRUNJRklDX0NPTkZJRyhlbmFibGVGZWVPblRyYW5zZmVyRmVlRmV0Y2hpbmcpIDoge30pLFxuICAgIH07XG5cbiAgICBtZXRyaWMucHV0TWV0cmljKGAke2ludGVudH1JbnRlbnRgLCAxLCBNZXRyaWNMb2dnZXJVbml0LkNvdW50KTtcblxuICAgIGxldCBzd2FwUGFyYW1zOiBTd2FwT3B0aW9ucyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuICAgIC8vIGUuZy4gSW5wdXRzIG9mIGZvcm0gXCIxLjI1JVwiIHdpdGggMmRwIG1heC4gQ29udmVydCB0byBmcmFjdGlvbmFsIHJlcHJlc2VudGF0aW9uID0+IDEuMjUgPT4gMTI1IC8gMTAwMDBcbiAgICBpZiAoc2xpcHBhZ2VUb2xlcmFuY2UpIHtcbiAgICAgIGNvbnN0IHNsaXBwYWdlVG9sZXJhbmNlUGVyY2VudCA9IHBhcnNlU2xpcHBhZ2VUb2xlcmFuY2Uoc2xpcHBhZ2VUb2xlcmFuY2UpO1xuXG4gICAgICBpZiAoZGVhZGxpbmUgJiYgcmVjaXBpZW50KSB7XG4gICAgICAgIHN3YXBQYXJhbXMgPSB7XG4gICAgICAgICAgdHlwZTogU3dhcFR5cGUuU1dBUF9ST1VURVJfMDIsXG4gICAgICAgICAgZGVhZGxpbmU6IHBhcnNlRGVhZGxpbmUoZGVhZGxpbmUpLFxuICAgICAgICAgIHJlY2lwaWVudDogcmVjaXBpZW50LFxuICAgICAgICAgIHNsaXBwYWdlVG9sZXJhbmNlOiBzbGlwcGFnZVRvbGVyYW5jZVBlcmNlbnQsXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIGlmIChzaW11bGF0ZUZyb21BZGRyZXNzKSB7XG4gICAgICAgIG1ldHJpYy5wdXRNZXRyaWMoXCJTaW11bGF0aW9uIFJlcXVlc3RlZFwiLCAxLCBNZXRyaWNMb2dnZXJVbml0LkNvdW50KTtcblxuICAgICAgICBpZiAoc3dhcFBhcmFtcykge1xuICAgICAgICAgIHN3YXBQYXJhbXMuc2ltdWxhdGUgPSB7IGZyb21BZGRyZXNzOiBzaW11bGF0ZUZyb21BZGRyZXNzIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBiZWZvcmUgPSBEYXRlLm5vdygpO1xuXG4gICAgbGV0IHN3YXBSb3V0ZTogU3dhcFJvdXRlIHwgbnVsbDtcbiAgICBsZXQgYW1vdW50OiBDdXJyZW5jeUFtb3VudDxDdXJyZW5jeT47XG5cbiAgICBsZXQgdG9rZW5QYWlyU3ltYm9sID0gXCJcIjtcbiAgICBsZXQgdG9rZW5QYWlyU3ltYm9sQ2hhaW4gPSBcIlwiO1xuICAgIGlmIChjdXJyZW5jeUluLnN5bWJvbCAmJiBjdXJyZW5jeU91dC5zeW1ib2wpIHtcbiAgICAgIHRva2VuUGFpclN5bWJvbCA9IF8oW2N1cnJlbmN5SW4uc3ltYm9sLCBjdXJyZW5jeU91dC5zeW1ib2xdKS5qb2luKFwiL1wiKTtcbiAgICAgIHRva2VuUGFpclN5bWJvbENoYWluID0gYCR7dG9rZW5QYWlyU3ltYm9sfWA7XG4gICAgfVxuXG4gICAgY29uc3QgW3Rva2VuMFN5bWJvbCwgdG9rZW4wQWRkcmVzcywgdG9rZW4xU3ltYm9sLCB0b2tlbjFBZGRyZXNzXSA9IGN1cnJlbmN5SW4ud3JhcHBlZC5zb3J0c0JlZm9yZShcbiAgICAgIGN1cnJlbmN5T3V0LndyYXBwZWRcbiAgICApXG4gICAgICA/IFtjdXJyZW5jeUluLnN5bWJvbCwgY3VycmVuY3lJbi53cmFwcGVkLmFkZHJlc3MsIGN1cnJlbmN5T3V0LnN5bWJvbCwgY3VycmVuY3lPdXQud3JhcHBlZC5hZGRyZXNzXVxuICAgICAgOiBbY3VycmVuY3lPdXQuc3ltYm9sLCBjdXJyZW5jeU91dC53cmFwcGVkLmFkZHJlc3MsIGN1cnJlbmN5SW4uc3ltYm9sLCBjdXJyZW5jeUluLndyYXBwZWQuYWRkcmVzc107XG5cbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgXCJleGFjdEluXCI6XG4gICAgICAgIGFtb3VudCA9IEN1cnJlbmN5QW1vdW50LmZyb21SYXdBbW91bnQoY3VycmVuY3lJbiwgSlNCSS5CaWdJbnQoYW1vdW50UmF3KSk7XG5cbiAgICAgICAgbG9nLmluZm8oXG4gICAgICAgICAge1xuICAgICAgICAgICAgYW1vdW50SW46IGFtb3VudC50b0V4YWN0KCksXG4gICAgICAgICAgICB0b2tlbjBBZGRyZXNzLFxuICAgICAgICAgICAgdG9rZW4xQWRkcmVzcyxcbiAgICAgICAgICAgIHRva2VuMFN5bWJvbCxcbiAgICAgICAgICAgIHRva2VuMVN5bWJvbCxcbiAgICAgICAgICAgIHRva2VuSW5TeW1ib2w6IGN1cnJlbmN5SW4uc3ltYm9sLFxuICAgICAgICAgICAgdG9rZW5PdXRTeW1ib2w6IGN1cnJlbmN5T3V0LnN5bWJvbCxcbiAgICAgICAgICAgIHRva2VuUGFpclN5bWJvbCxcbiAgICAgICAgICAgIHRva2VuUGFpclN5bWJvbENoYWluLFxuICAgICAgICAgICAgdHlwZSxcbiAgICAgICAgICAgIHJvdXRpbmdDb25maWc6IHJvdXRpbmdDb25maWcsXG4gICAgICAgICAgICBzd2FwUGFyYW1zLFxuICAgICAgICAgICAgaW50ZW50LFxuICAgICAgICAgIH0sXG4gICAgICAgICAgYEV4YWN0IEluIFN3YXA6IEdpdmUgJHthbW91bnQudG9FeGFjdCgpfSAke2Ftb3VudC5jdXJyZW5jeS5zeW1ib2x9LCBXYW50OiAke2N1cnJlbmN5T3V0LnN5bWJvbH0uYFxuICAgICAgICApO1xuXG4gICAgICAgIHN3YXBSb3V0ZSA9IGF3YWl0IHJvdXRlci5yb3V0ZShhbW91bnQsIGN1cnJlbmN5T3V0LCBUcmFkZVR5cGUuRVhBQ1RfSU5QVVQsIHN3YXBQYXJhbXMsIHJvdXRpbmdDb25maWcpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJleGFjdE91dFwiOlxuICAgICAgICBhbW91bnQgPSBDdXJyZW5jeUFtb3VudC5mcm9tUmF3QW1vdW50KGN1cnJlbmN5T3V0LCBKU0JJLkJpZ0ludChhbW91bnRSYXcpKTtcblxuICAgICAgICBsb2cuaW5mbyhcbiAgICAgICAgICB7XG4gICAgICAgICAgICBhbW91bnRPdXQ6IGFtb3VudC50b0V4YWN0KCksXG4gICAgICAgICAgICB0b2tlbjBBZGRyZXNzLFxuICAgICAgICAgICAgdG9rZW4xQWRkcmVzcyxcbiAgICAgICAgICAgIHRva2VuMFN5bWJvbCxcbiAgICAgICAgICAgIHRva2VuMVN5bWJvbCxcbiAgICAgICAgICAgIHRva2VuSW5TeW1ib2w6IGN1cnJlbmN5SW4uc3ltYm9sLFxuICAgICAgICAgICAgdG9rZW5PdXRTeW1ib2w6IGN1cnJlbmN5T3V0LnN5bWJvbCxcbiAgICAgICAgICAgIHRva2VuUGFpclN5bWJvbCxcbiAgICAgICAgICAgIHRva2VuUGFpclN5bWJvbENoYWluLFxuICAgICAgICAgICAgdHlwZSxcbiAgICAgICAgICAgIHJvdXRpbmdDb25maWc6IHJvdXRpbmdDb25maWcsXG4gICAgICAgICAgICBzd2FwUGFyYW1zLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgYEV4YWN0IE91dCBTd2FwOiBXYW50ICR7YW1vdW50LnRvRXhhY3QoKX0gJHthbW91bnQuY3VycmVuY3kuc3ltYm9sfSBHaXZlOiAke2N1cnJlbmN5SW4uc3ltYm9sfS5gXG4gICAgICAgICk7XG5cbiAgICAgICAgc3dhcFJvdXRlID0gYXdhaXQgcm91dGVyLnJvdXRlKGFtb3VudCwgY3VycmVuY3lJbiwgVHJhZGVUeXBlLkVYQUNUX09VVFBVVCwgc3dhcFBhcmFtcywgcm91dGluZ0NvbmZpZyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBzd2FwIHR5cGVcIik7XG4gICAgfVxuXG4gICAgaWYgKCFzd2FwUm91dGUpIHtcbiAgICAgIGxvZy5pbmZvKFxuICAgICAgICB7XG4gICAgICAgICAgdHlwZSxcbiAgICAgICAgICB0b2tlbkluOiBjdXJyZW5jeUluLFxuICAgICAgICAgIHRva2VuT3V0OiBjdXJyZW5jeU91dCxcbiAgICAgICAgICBhbW91bnQ6IGFtb3VudC5xdW90aWVudC50b1N0cmluZygpLFxuICAgICAgICB9LFxuICAgICAgICBgTm8gcm91dGUgZm91bmQuIDQwNGBcbiAgICAgICk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN0YXR1c0NvZGU6IDQwNCxcbiAgICAgICAgZXJyb3JDb2RlOiBcIk5PX1JPVVRFXCIsXG4gICAgICAgIGRldGFpbDogXCJObyByb3V0ZSBmb3VuZFwiLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zdCB7XG4gICAgICBxdW90ZSxcbiAgICAgIHF1b3RlR2FzQWRqdXN0ZWQsXG4gICAgICBxdW90ZUdhc0FuZFBvcnRpb25BZGp1c3RlZCxcbiAgICAgIHJvdXRlLFxuICAgICAgZXN0aW1hdGVkR2FzVXNlZCxcbiAgICAgIGVzdGltYXRlZEdhc1VzZWRRdW90ZVRva2VuLFxuICAgICAgZXN0aW1hdGVkR2FzVXNlZFVTRCxcbiAgICAgIGdhc1ByaWNlV2VpLFxuICAgICAgbWV0aG9kUGFyYW1ldGVycyxcbiAgICAgIGJsb2NrTnVtYmVyLFxuICAgICAgc2ltdWxhdGlvblN0YXR1cyxcbiAgICAgIGhpdHNDYWNoZWRSb3V0ZSxcbiAgICAgIHBvcnRpb25BbW91bnQ6IG91dHB1dFBvcnRpb25BbW91bnQsIC8vIFRPRE86IG5hbWUgaXQgYmFjayB0byBwb3J0aW9uQW1vdW50XG4gICAgfSA9IHN3YXBSb3V0ZTtcblxuICAgIGlmIChzaW11bGF0aW9uU3RhdHVzID09IFNpbXVsYXRpb25TdGF0dXMuRmFpbGVkKSB7XG4gICAgICBtZXRyaWMucHV0TWV0cmljKFwiU2ltdWxhdGlvbkZhaWxlZFwiLCAxLCBNZXRyaWNMb2dnZXJVbml0LkNvdW50KTtcbiAgICB9IGVsc2UgaWYgKHNpbXVsYXRpb25TdGF0dXMgPT0gU2ltdWxhdGlvblN0YXR1cy5TdWNjZWVkZWQpIHtcbiAgICAgIG1ldHJpYy5wdXRNZXRyaWMoXCJTaW11bGF0aW9uU3VjY2Vzc2Z1bFwiLCAxLCBNZXRyaWNMb2dnZXJVbml0LkNvdW50KTtcbiAgICB9IGVsc2UgaWYgKHNpbXVsYXRpb25TdGF0dXMgPT0gU2ltdWxhdGlvblN0YXR1cy5JbnN1ZmZpY2llbnRCYWxhbmNlKSB7XG4gICAgICBtZXRyaWMucHV0TWV0cmljKFwiU2ltdWxhdGlvbkluc3VmZmljaWVudEJhbGFuY2VcIiwgMSwgTWV0cmljTG9nZ2VyVW5pdC5Db3VudCk7XG4gICAgfSBlbHNlIGlmIChzaW11bGF0aW9uU3RhdHVzID09IFNpbXVsYXRpb25TdGF0dXMuTm90QXBwcm92ZWQpIHtcbiAgICAgIG1ldHJpYy5wdXRNZXRyaWMoXCJTaW11bGF0aW9uTm90QXBwcm92ZWRcIiwgMSwgTWV0cmljTG9nZ2VyVW5pdC5Db3VudCk7XG4gICAgfSBlbHNlIGlmIChzaW11bGF0aW9uU3RhdHVzID09IFNpbXVsYXRpb25TdGF0dXMuTm90U3VwcG9ydGVkKSB7XG4gICAgICBtZXRyaWMucHV0TWV0cmljKFwiU2ltdWxhdGlvbk5vdFN1cHBvcnRlZFwiLCAxLCBNZXRyaWNMb2dnZXJVbml0LkNvdW50KTtcbiAgICB9XG5cbiAgICBjb25zdCByb3V0ZVJlc3BvbnNlOiBBcnJheTxWM1Bvb2xJblJvdXRlW10+ID0gW107XG5cbiAgICBmb3IgKGNvbnN0IHN1YlJvdXRlIG9mIHJvdXRlKSB7XG4gICAgICBjb25zdCB7IGFtb3VudCwgcXVvdGUsIHRva2VuUGF0aCB9ID0gc3ViUm91dGU7XG5cbiAgICAgIGNvbnN0IHBvb2xzID0gc3ViUm91dGUucm91dGUucG9vbHM7XG4gICAgICBjb25zdCBjdXJSb3V0ZTogVjNQb29sSW5Sb3V0ZVtdID0gW107XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBvb2xzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IG5leHRQb29sID0gcG9vbHNbaV07XG4gICAgICAgIGNvbnN0IHRva2VuSW4gPSB0b2tlblBhdGhbaV07XG4gICAgICAgIGNvbnN0IHRva2VuT3V0ID0gdG9rZW5QYXRoW2kgKyAxXTtcblxuICAgICAgICBsZXQgZWRnZUFtb3VudEluID0gdW5kZWZpbmVkO1xuICAgICAgICBpZiAoaSA9PSAwKSB7XG4gICAgICAgICAgZWRnZUFtb3VudEluID0gdHlwZSA9PSBcImV4YWN0SW5cIiA/IGFtb3VudC5xdW90aWVudC50b1N0cmluZygpIDogcXVvdGUucXVvdGllbnQudG9TdHJpbmcoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBlZGdlQW1vdW50T3V0ID0gdW5kZWZpbmVkO1xuICAgICAgICBpZiAoaSA9PSBwb29scy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgZWRnZUFtb3VudE91dCA9IHR5cGUgPT0gXCJleGFjdEluXCIgPyBxdW90ZS5xdW90aWVudC50b1N0cmluZygpIDogYW1vdW50LnF1b3RpZW50LnRvU3RyaW5nKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobmV4dFBvb2wgaW5zdGFuY2VvZiBQb29sKSB7XG4gICAgICAgICAgY3VyUm91dGUucHVzaCh7XG4gICAgICAgICAgICB0eXBlOiBcInYzLXBvb2xcIixcbiAgICAgICAgICAgIGFkZHJlc3M6IHYzUG9vbFByb3ZpZGVyLmdldFBvb2xBZGRyZXNzKG5leHRQb29sLnRva2VuMCwgbmV4dFBvb2wudG9rZW4xLCBuZXh0UG9vbC5mZWUpLnBvb2xBZGRyZXNzLFxuICAgICAgICAgICAgdG9rZW5Jbjoge1xuICAgICAgICAgICAgICBkZWNpbWFsczogdG9rZW5Jbi5kZWNpbWFscy50b1N0cmluZygpLFxuICAgICAgICAgICAgICBhZGRyZXNzOiB0b2tlbkluLmFkZHJlc3MsXG4gICAgICAgICAgICAgIHN5bWJvbDogdG9rZW5Jbi5zeW1ib2whLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRva2VuT3V0OiB7XG4gICAgICAgICAgICAgIGRlY2ltYWxzOiB0b2tlbk91dC5kZWNpbWFscy50b1N0cmluZygpLFxuICAgICAgICAgICAgICBhZGRyZXNzOiB0b2tlbk91dC5hZGRyZXNzLFxuICAgICAgICAgICAgICBzeW1ib2w6IHRva2VuT3V0LnN5bWJvbCEsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlOiBuZXh0UG9vbC5mZWUudG9TdHJpbmcoKSxcbiAgICAgICAgICAgIGxpcXVpZGl0eTogbmV4dFBvb2wubGlxdWlkaXR5LnRvU3RyaW5nKCksXG4gICAgICAgICAgICBzcXJ0UmF0aW9YOTY6IG5leHRQb29sLnNxcnRSYXRpb1g5Ni50b1N0cmluZygpLFxuICAgICAgICAgICAgdGlja0N1cnJlbnQ6IG5leHRQb29sLnRpY2tDdXJyZW50LnRvU3RyaW5nKCksXG4gICAgICAgICAgICBhbW91bnRJbjogZWRnZUFtb3VudEluLFxuICAgICAgICAgICAgYW1vdW50T3V0OiBlZGdlQW1vdW50T3V0LFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByb3V0ZVJlc3BvbnNlLnB1c2goY3VyUm91dGUpO1xuICAgIH1cbiAgICBjb25zdCByb3V0ZVN0cmluZyA9IHJvdXRlQW1vdW50c1RvU3RyaW5nKHJvdXRlKTtcblxuICAgIGNvbnN0IHJlc3VsdDogUXVvdGVSZXNwb25zZSA9IHtcbiAgICAgIG1ldGhvZFBhcmFtZXRlcnMsXG4gICAgICBibG9ja051bWJlcjogYmxvY2tOdW1iZXIudG9TdHJpbmcoKSxcbiAgICAgIGFtb3VudDogYW1vdW50LnF1b3RpZW50LnRvU3RyaW5nKCksXG4gICAgICBhbW91bnREZWNpbWFsczogYW1vdW50LnRvRXhhY3QoKSxcbiAgICAgIHF1b3RlOiBxdW90ZS5xdW90aWVudC50b1N0cmluZygpLFxuICAgICAgcXVvdGVEZWNpbWFsczogcXVvdGUudG9FeGFjdCgpLFxuICAgICAgcXVvdGVHYXNBZGp1c3RlZDogcXVvdGVHYXNBZGp1c3RlZC5xdW90aWVudC50b1N0cmluZygpLFxuICAgICAgcXVvdGVHYXNBZGp1c3RlZERlY2ltYWxzOiBxdW90ZUdhc0FkanVzdGVkLnRvRXhhY3QoKSxcbiAgICAgIHF1b3RlR2FzQW5kUG9ydGlvbkFkanVzdGVkOiBxdW90ZUdhc0FuZFBvcnRpb25BZGp1c3RlZD8ucXVvdGllbnQudG9TdHJpbmcoKSxcbiAgICAgIHF1b3RlR2FzQW5kUG9ydGlvbkFkanVzdGVkRGVjaW1hbHM6IHF1b3RlR2FzQW5kUG9ydGlvbkFkanVzdGVkPy50b0V4YWN0KCksXG4gICAgICBnYXNVc2VFc3RpbWF0ZVF1b3RlOiBlc3RpbWF0ZWRHYXNVc2VkUXVvdGVUb2tlbi5xdW90aWVudC50b1N0cmluZygpLFxuICAgICAgZ2FzVXNlRXN0aW1hdGVRdW90ZURlY2ltYWxzOiBlc3RpbWF0ZWRHYXNVc2VkUXVvdGVUb2tlbi50b0V4YWN0KCksXG4gICAgICBnYXNVc2VFc3RpbWF0ZTogZXN0aW1hdGVkR2FzVXNlZC50b1N0cmluZygpLFxuICAgICAgZ2FzVXNlRXN0aW1hdGVVU0Q6IGVzdGltYXRlZEdhc1VzZWRVU0QudG9FeGFjdCgpLFxuICAgICAgc2ltdWxhdGlvblN0YXR1czogc2ltdWxhdGlvblN0YXR1c1RvU3RyaW5nKHNpbXVsYXRpb25TdGF0dXMsIGxvZyksXG4gICAgICBzaW11bGF0aW9uRXJyb3I6IHNpbXVsYXRpb25TdGF0dXMgPT0gU2ltdWxhdGlvblN0YXR1cy5GYWlsZWQsXG4gICAgICBnYXNQcmljZVdlaTogZ2FzUHJpY2VXZWkudG9TdHJpbmcoKSxcbiAgICAgIHJvdXRlOiByb3V0ZVJlc3BvbnNlLFxuICAgICAgcm91dGVTdHJpbmcsXG4gICAgICBxdW90ZUlkLFxuICAgICAgaGl0c0NhY2hlZFJvdXRlczogaGl0c0NhY2hlZFJvdXRlLFxuXG4gICAgICBwb3J0aW9uQW1vdW50OiBvdXRwdXRQb3J0aW9uQW1vdW50Py5xdW90aWVudC50b1N0cmluZygpLFxuICAgICAgcG9ydGlvbkFtb3VudERlY2ltYWxzOiBvdXRwdXRQb3J0aW9uQW1vdW50Py50b0V4YWN0KCksXG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICBzdGF0dXNDb2RlOiAyMDAsXG4gICAgICBib2R5OiByZXN1bHQsXG4gICAgfTtcbiAgfVxuXG4gIHByb3RlY3RlZCByZXF1ZXN0Qm9keVNjaGVtYSgpOiBKb2kuT2JqZWN0U2NoZW1hIHwgbnVsbCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBwcm90ZWN0ZWQgcmVxdWVzdFF1ZXJ5UGFyYW1zU2NoZW1hKCk6IEpvaS5PYmplY3RTY2hlbWEgfCBudWxsIHtcbiAgICByZXR1cm4gUXVvdGVRdWVyeVBhcmFtc0pvaTtcbiAgfVxuXG4gIHByb3RlY3RlZCByZXNwb25zZUJvZHlTY2hlbWEoKTogSm9pLk9iamVjdFNjaGVtYSB8IG51bGwge1xuICAgIHJldHVybiBRdW90ZVJlc3BvbnNlU2NoZW1hSm9pO1xuICB9XG5cbiAgcHJvdGVjdGVkIGFmdGVySGFuZGxlcihtZXRyaWM6IE1ldHJpY3NMb2dnZXIsIHJlc3BvbnNlOiBRdW90ZVJlc3BvbnNlLCByZXF1ZXN0U3RhcnQ6IG51bWJlcik6IHZvaWQge1xuICAgIG1ldHJpYy5wdXRNZXRyaWMoXG4gICAgICBgR0VUX1FVT1RFX0xBVEVOQ1lfVE9QX0xFVkVMXyR7cmVzcG9uc2UuaGl0c0NhY2hlZFJvdXRlcyA/IFwiQ0FDSEVEX1JPVVRFU19ISVRcIiA6IFwiQ0FDSEVEX1JPVVRFU19NSVNTXCJ9YCxcbiAgICAgIERhdGUubm93KCkgLSByZXF1ZXN0U3RhcnQsXG4gICAgICBNZXRyaWNMb2dnZXJVbml0Lk1pbGxpc2Vjb25kc1xuICAgICk7XG4gIH1cbn1cbiJdfQ==