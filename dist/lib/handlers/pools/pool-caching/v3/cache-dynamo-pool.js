import { DynamoCaching } from "../cache-dynamo";
import { log, metric, MetricLoggerUnit } from "@votopia/smart-order-router";
import { PoolMarshaller } from "../../../marshalling/pool-marshaller";
export class DynamoCachingV3Pool extends DynamoCaching {
    constructor({ tableName, ttlMinutes }) {
        super({ tableName, ttlMinutes });
    }
    async get(partitionKey, sortKey) {
        var _a, _b;
        if (sortKey) {
            const getParams = {
                TableName: this.tableName,
                Key: {
                    poolAddress: partitionKey,
                    blockNumber: sortKey,
                },
            };
            const cachedPoolBinary = (_b = (_a = (await this.ddbClient
                .get(getParams)
                .promise()
                .catch((error) => {
                log.error({ error, getParams }, `[DynamoCachingV3Pool] Cached pool failed to get`);
                return undefined;
            }))) === null || _a === void 0 ? void 0 : _a.Item) === null || _b === void 0 ? void 0 : _b.item;
            if (cachedPoolBinary) {
                metric.putMetric("V3_DYNAMO_CACHING_POOL_HIT_IN_TABLE", 1, MetricLoggerUnit.None);
                const cachedPoolBuffer = Buffer.from(cachedPoolBinary);
                const marshalledPool = JSON.parse(cachedPoolBuffer.toString());
                return PoolMarshaller.unmarshal(marshalledPool);
            }
            else {
                metric.putMetric("V3_DYNAMO_CACHING_POOL_MISS_NOT_IN_TABLE", 1, MetricLoggerUnit.None);
                return undefined;
            }
        }
        else {
            metric.putMetric("V3_DYNAMO_CACHING_POOL_MISS_NO_BLOCK_NUMBER", 1, MetricLoggerUnit.None);
            return undefined;
        }
    }
    async set(pool, partitionKey, sortKey) {
        if (sortKey) {
            const marshalledPool = PoolMarshaller.marshal(pool);
            const binaryCachedPool = Buffer.from(JSON.stringify(marshalledPool));
            // TTL is minutes from now. multiply ttlMinutes times 60 to convert to seconds, since ttl is in seconds.
            const ttl = Math.floor(Date.now() / 1000) + 60 * this.ttlMinutes;
            const putParams = {
                TableName: this.tableName,
                Item: {
                    poolAddress: partitionKey,
                    blockNumber: sortKey,
                    item: binaryCachedPool,
                    ttl: ttl,
                },
            };
            await this.ddbClient
                .put(putParams)
                .promise()
                .catch((error) => {
                log.error({ error, putParams }, `[DynamoCachingV3Pool] Cached pool failed to insert`);
                return false;
            });
            return true;
        }
        else {
            return false;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGUtZHluYW1vLXBvb2wuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9saWIvaGFuZGxlcnMvcG9vbHMvcG9vbC1jYWNoaW5nL3YzL2NhY2hlLWR5bmFtby1wb29sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxhQUFhLEVBQXNCLE1BQU0saUJBQWlCLENBQUM7QUFFcEUsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSw2QkFBNkIsQ0FBQztBQUM1RSxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sc0NBQXNDLENBQUM7QUFJdEUsTUFBTSxPQUFPLG1CQUFvQixTQUFRLGFBQW1DO0lBQzFFLFlBQVksRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUE0QjtRQUM3RCxLQUFLLENBQUMsRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBRVEsS0FBSyxDQUFDLEdBQUcsQ0FBQyxZQUFvQixFQUFFLE9BQWdCOztRQUN2RCxJQUFJLE9BQU8sRUFBRTtZQUNYLE1BQU0sU0FBUyxHQUFHO2dCQUNoQixTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVM7Z0JBQ3pCLEdBQUcsRUFBRTtvQkFDSCxXQUFXLEVBQUUsWUFBWTtvQkFDekIsV0FBVyxFQUFFLE9BQU87aUJBQ3JCO2FBQ0YsQ0FBQztZQUVGLE1BQU0sZ0JBQWdCLEdBQXVCLE1BQUEsTUFBQSxDQUMzQyxNQUFNLElBQUksQ0FBQyxTQUFTO2lCQUNqQixHQUFHLENBQUMsU0FBUyxDQUFDO2lCQUNkLE9BQU8sRUFBRTtpQkFDVCxLQUFLLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtnQkFDZixHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFLGlEQUFpRCxDQUFDLENBQUM7Z0JBQ25GLE9BQU8sU0FBUyxDQUFDO1lBQ25CLENBQUMsQ0FBQyxDQUNMLDBDQUFFLElBQUksMENBQUUsSUFBSSxDQUFDO1lBRWQsSUFBSSxnQkFBZ0IsRUFBRTtnQkFDcEIsTUFBTSxDQUFDLFNBQVMsQ0FBQyxxQ0FBcUMsRUFBRSxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ2xGLE1BQU0sZ0JBQWdCLEdBQVcsTUFBTSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO2dCQUMvRCxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7Z0JBQy9ELE9BQU8sY0FBYyxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUMsQ0FBQzthQUNqRDtpQkFBTTtnQkFDTCxNQUFNLENBQUMsU0FBUyxDQUFDLDBDQUEwQyxFQUFFLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDdkYsT0FBTyxTQUFTLENBQUM7YUFDbEI7U0FDRjthQUFNO1lBQ0wsTUFBTSxDQUFDLFNBQVMsQ0FBQyw2Q0FBNkMsRUFBRSxDQUFDLEVBQUUsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDMUYsT0FBTyxTQUFTLENBQUM7U0FDbEI7SUFDSCxDQUFDO0lBRVEsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFVLEVBQUUsWUFBb0IsRUFBRSxPQUFnQjtRQUNuRSxJQUFJLE9BQU8sRUFBRTtZQUNYLE1BQU0sY0FBYyxHQUFHLGNBQWMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDcEQsTUFBTSxnQkFBZ0IsR0FBVyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztZQUM3RSx3R0FBd0c7WUFDeEcsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7WUFFakUsTUFBTSxTQUFTLEdBQUc7Z0JBQ2hCLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUztnQkFDekIsSUFBSSxFQUFFO29CQUNKLFdBQVcsRUFBRSxZQUFZO29CQUN6QixXQUFXLEVBQUUsT0FBTztvQkFDcEIsSUFBSSxFQUFFLGdCQUFnQjtvQkFDdEIsR0FBRyxFQUFFLEdBQUc7aUJBQ1Q7YUFDRixDQUFDO1lBRUYsTUFBTSxJQUFJLENBQUMsU0FBUztpQkFDakIsR0FBRyxDQUFDLFNBQVMsQ0FBQztpQkFDZCxPQUFPLEVBQUU7aUJBQ1QsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7Z0JBQ2YsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRSxvREFBb0QsQ0FBQyxDQUFDO2dCQUN0RixPQUFPLEtBQUssQ0FBQztZQUNmLENBQUMsQ0FBQyxDQUFDO1lBRUwsT0FBTyxJQUFJLENBQUM7U0FDYjthQUFNO1lBQ0wsT0FBTyxLQUFLLENBQUM7U0FDZDtJQUNILENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IER5bmFtb0NhY2hpbmcsIER5bmFtb0NhY2hpbmdQcm9wcyB9IGZyb20gXCIuLi9jYWNoZS1keW5hbW9cIjtcbmltcG9ydCB7IFBvb2wgfSBmcm9tIFwiQHZvdG9waWEvc2RrLWNvcmVcIjtcbmltcG9ydCB7IGxvZywgbWV0cmljLCBNZXRyaWNMb2dnZXJVbml0IH0gZnJvbSBcIkB2b3RvcGlhL3NtYXJ0LW9yZGVyLXJvdXRlclwiO1xuaW1wb3J0IHsgUG9vbE1hcnNoYWxsZXIgfSBmcm9tIFwiLi4vLi4vLi4vbWFyc2hhbGxpbmcvcG9vbC1tYXJzaGFsbGVyXCI7XG5cbmludGVyZmFjZSBEeW5hbW9DYWNoaW5nVjNQb29sUHJvcHMgZXh0ZW5kcyBEeW5hbW9DYWNoaW5nUHJvcHMge31cblxuZXhwb3J0IGNsYXNzIER5bmFtb0NhY2hpbmdWM1Bvb2wgZXh0ZW5kcyBEeW5hbW9DYWNoaW5nPHN0cmluZywgbnVtYmVyLCBQb29sPiB7XG4gIGNvbnN0cnVjdG9yKHsgdGFibGVOYW1lLCB0dGxNaW51dGVzIH06IER5bmFtb0NhY2hpbmdWM1Bvb2xQcm9wcykge1xuICAgIHN1cGVyKHsgdGFibGVOYW1lLCB0dGxNaW51dGVzIH0pO1xuICB9XG5cbiAgb3ZlcnJpZGUgYXN5bmMgZ2V0KHBhcnRpdGlvbktleTogc3RyaW5nLCBzb3J0S2V5PzogbnVtYmVyKTogUHJvbWlzZTxQb29sIHwgdW5kZWZpbmVkPiB7XG4gICAgaWYgKHNvcnRLZXkpIHtcbiAgICAgIGNvbnN0IGdldFBhcmFtcyA9IHtcbiAgICAgICAgVGFibGVOYW1lOiB0aGlzLnRhYmxlTmFtZSxcbiAgICAgICAgS2V5OiB7XG4gICAgICAgICAgcG9vbEFkZHJlc3M6IHBhcnRpdGlvbktleSxcbiAgICAgICAgICBibG9ja051bWJlcjogc29ydEtleSxcbiAgICAgICAgfSxcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGNhY2hlZFBvb2xCaW5hcnk6IEJ1ZmZlciB8IHVuZGVmaW5lZCA9IChcbiAgICAgICAgYXdhaXQgdGhpcy5kZGJDbGllbnRcbiAgICAgICAgICAuZ2V0KGdldFBhcmFtcylcbiAgICAgICAgICAucHJvbWlzZSgpXG4gICAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgICAgbG9nLmVycm9yKHsgZXJyb3IsIGdldFBhcmFtcyB9LCBgW0R5bmFtb0NhY2hpbmdWM1Bvb2xdIENhY2hlZCBwb29sIGZhaWxlZCB0byBnZXRgKTtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgfSlcbiAgICAgICk/Lkl0ZW0/Lml0ZW07XG5cbiAgICAgIGlmIChjYWNoZWRQb29sQmluYXJ5KSB7XG4gICAgICAgIG1ldHJpYy5wdXRNZXRyaWMoXCJWM19EWU5BTU9fQ0FDSElOR19QT09MX0hJVF9JTl9UQUJMRVwiLCAxLCBNZXRyaWNMb2dnZXJVbml0Lk5vbmUpO1xuICAgICAgICBjb25zdCBjYWNoZWRQb29sQnVmZmVyOiBCdWZmZXIgPSBCdWZmZXIuZnJvbShjYWNoZWRQb29sQmluYXJ5KTtcbiAgICAgICAgY29uc3QgbWFyc2hhbGxlZFBvb2wgPSBKU09OLnBhcnNlKGNhY2hlZFBvb2xCdWZmZXIudG9TdHJpbmcoKSk7XG4gICAgICAgIHJldHVybiBQb29sTWFyc2hhbGxlci51bm1hcnNoYWwobWFyc2hhbGxlZFBvb2wpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWV0cmljLnB1dE1ldHJpYyhcIlYzX0RZTkFNT19DQUNISU5HX1BPT0xfTUlTU19OT1RfSU5fVEFCTEVcIiwgMSwgTWV0cmljTG9nZ2VyVW5pdC5Ob25lKTtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbWV0cmljLnB1dE1ldHJpYyhcIlYzX0RZTkFNT19DQUNISU5HX1BPT0xfTUlTU19OT19CTE9DS19OVU1CRVJcIiwgMSwgTWV0cmljTG9nZ2VyVW5pdC5Ob25lKTtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICB9XG5cbiAgb3ZlcnJpZGUgYXN5bmMgc2V0KHBvb2w6IFBvb2wsIHBhcnRpdGlvbktleTogc3RyaW5nLCBzb3J0S2V5PzogbnVtYmVyKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHNvcnRLZXkpIHtcbiAgICAgIGNvbnN0IG1hcnNoYWxsZWRQb29sID0gUG9vbE1hcnNoYWxsZXIubWFyc2hhbChwb29sKTtcbiAgICAgIGNvbnN0IGJpbmFyeUNhY2hlZFBvb2w6IEJ1ZmZlciA9IEJ1ZmZlci5mcm9tKEpTT04uc3RyaW5naWZ5KG1hcnNoYWxsZWRQb29sKSk7XG4gICAgICAvLyBUVEwgaXMgbWludXRlcyBmcm9tIG5vdy4gbXVsdGlwbHkgdHRsTWludXRlcyB0aW1lcyA2MCB0byBjb252ZXJ0IHRvIHNlY29uZHMsIHNpbmNlIHR0bCBpcyBpbiBzZWNvbmRzLlxuICAgICAgY29uc3QgdHRsID0gTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMTAwMCkgKyA2MCAqIHRoaXMudHRsTWludXRlcztcblxuICAgICAgY29uc3QgcHV0UGFyYW1zID0ge1xuICAgICAgICBUYWJsZU5hbWU6IHRoaXMudGFibGVOYW1lLFxuICAgICAgICBJdGVtOiB7XG4gICAgICAgICAgcG9vbEFkZHJlc3M6IHBhcnRpdGlvbktleSxcbiAgICAgICAgICBibG9ja051bWJlcjogc29ydEtleSxcbiAgICAgICAgICBpdGVtOiBiaW5hcnlDYWNoZWRQb29sLFxuICAgICAgICAgIHR0bDogdHRsLFxuICAgICAgICB9LFxuICAgICAgfTtcblxuICAgICAgYXdhaXQgdGhpcy5kZGJDbGllbnRcbiAgICAgICAgLnB1dChwdXRQYXJhbXMpXG4gICAgICAgIC5wcm9taXNlKClcbiAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgIGxvZy5lcnJvcih7IGVycm9yLCBwdXRQYXJhbXMgfSwgYFtEeW5hbW9DYWNoaW5nVjNQb29sXSBDYWNoZWQgcG9vbCBmYWlsZWQgdG8gaW5zZXJ0YCk7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==