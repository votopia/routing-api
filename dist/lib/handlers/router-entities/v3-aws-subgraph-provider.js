import { log, V3SubgraphProvider } from "@votopia/smart-order-router";
import { S3 } from "aws-sdk";
import _ from "lodash";
import NodeCache from "node-cache";
const POOL_CACHE = new NodeCache({ stdTTL: 240, useClones: false });
const POOL_CACHE_KEY = () => `pools`;
export class V3AWSSubgraphProviderWithFallback extends V3SubgraphProvider {
    constructor(bucket, key) {
        super();
        this.bucket = bucket;
        this.key = `${key}`;
    }
    async getPools() {
        log.info(`In legacy AWS subgraph provider for protocol V3`);
        const s3 = new S3();
        const cachedPools = POOL_CACHE.get(POOL_CACHE_KEY());
        if (cachedPools) {
            log.info({ subgraphPoolsSample: cachedPools.slice(0, 5) }, `Subgraph pools fetched from local cache. Num: ${cachedPools.length}`);
            return cachedPools;
        }
        log.info({ bucket: this.bucket, key: this.key }, `Subgraph pools local cache miss. Getting subgraph pools from S3 ${this.bucket}/${this.key}`);
        try {
            const result = await s3.getObject({ Key: this.key, Bucket: this.bucket }).promise();
            const { Body: poolsBuffer } = result;
            if (!poolsBuffer) {
                throw new Error("Could not get subgraph pool cache from S3");
            }
            let pools = JSON.parse(poolsBuffer.toString("utf-8"));
            if (pools[0].totalValueLockedETH) {
                pools = _.map(pools, (pool) => ({
                    ...pool,
                    id: pool.id.toLowerCase(),
                    token0: {
                        id: pool.token0.id.toLowerCase(),
                    },
                    token1: {
                        id: pool.token1.id.toLowerCase(),
                    },
                    tvlETH: parseFloat(pool.totalValueLockedETH),
                    tvlUSD: parseFloat(pool.totalValueLockedUSD),
                }));
                log.info({ sample: pools.slice(0, 5) }, "Converted legacy schema to new schema");
            }
            log.info({ bucket: this.bucket, key: this.key, sample: pools.slice(0, 3) }, `Got subgraph pools from S3. Num: ${pools.length}`);
            POOL_CACHE.set(POOL_CACHE_KEY(), pools);
            return pools;
        }
        catch (err) {
            log.info({ bucket: this.bucket, key: this.key }, `Failed to get subgraph pools from S3 ${this.bucket}/${this.key}.`);
            return super.getPools();
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidjMtYXdzLXN1YmdyYXBoLXByb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vbGliL2hhbmRsZXJzL3JvdXRlci1lbnRpdGllcy92My1hd3Mtc3ViZ3JhcGgtcHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUF1QixHQUFHLEVBQWtCLGtCQUFrQixFQUFFLE1BQU0sNkJBQTZCLENBQUM7QUFDM0csT0FBTyxFQUFFLEVBQUUsRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUU3QixPQUFPLENBQUMsTUFBTSxRQUFRLENBQUM7QUFDdkIsT0FBTyxTQUFTLE1BQU0sWUFBWSxDQUFDO0FBRW5DLE1BQU0sVUFBVSxHQUFHLElBQUksU0FBUyxDQUFDLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztBQUNwRSxNQUFNLGNBQWMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUM7QUFFckMsTUFBTSxPQUFPLGlDQUFrQyxTQUFRLGtCQUFrQjtJQUd2RSxZQUFvQixNQUFjLEVBQUUsR0FBVztRQUM3QyxLQUFLLEVBQUUsQ0FBQztRQURVLFdBQU0sR0FBTixNQUFNLENBQVE7UUFFaEMsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsRUFBRSxDQUFDO0lBQ3RCLENBQUM7SUFFTSxLQUFLLENBQUMsUUFBUTtRQUNuQixHQUFHLENBQUMsSUFBSSxDQUFDLGlEQUFpRCxDQUFDLENBQUM7UUFFNUQsTUFBTSxFQUFFLEdBQUcsSUFBSSxFQUFFLEVBQUUsQ0FBQztRQUVwQixNQUFNLFdBQVcsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFtQixjQUFjLEVBQUUsQ0FBQyxDQUFDO1FBRXZFLElBQUksV0FBVyxFQUFFO1lBQ2YsR0FBRyxDQUFDLElBQUksQ0FDTixFQUFFLG1CQUFtQixFQUFFLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQ2hELGlEQUFpRCxXQUFXLENBQUMsTUFBTSxFQUFFLENBQ3RFLENBQUM7WUFFRixPQUFPLFdBQVcsQ0FBQztTQUNwQjtRQUVELEdBQUcsQ0FBQyxJQUFJLENBQ04sRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUN0QyxtRUFBbUUsSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQzdGLENBQUM7UUFDRixJQUFJO1lBQ0YsTUFBTSxNQUFNLEdBQUcsTUFBTSxFQUFFLENBQUMsU0FBUyxDQUFDLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBRXBGLE1BQU0sRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLEdBQUcsTUFBTSxDQUFDO1lBRXJDLElBQUksQ0FBQyxXQUFXLEVBQUU7Z0JBQ2hCLE1BQU0sSUFBSSxLQUFLLENBQUMsMkNBQTJDLENBQUMsQ0FBQzthQUM5RDtZQUVELElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBRXRELElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixFQUFFO2dCQUNoQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FDWCxLQUFLLEVBQ0wsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUNQLENBQUM7b0JBQ0MsR0FBRyxJQUFJO29CQUNQLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRTtvQkFDekIsTUFBTSxFQUFFO3dCQUNOLEVBQUUsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUU7cUJBQ2pDO29CQUNELE1BQU0sRUFBRTt3QkFDTixFQUFFLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFO3FCQUNqQztvQkFDRCxNQUFNLEVBQUUsVUFBVSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztvQkFDNUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUM7aUJBQzFCLENBQUEsQ0FDdkIsQ0FBQztnQkFDRixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsdUNBQXVDLENBQUMsQ0FBQzthQUNsRjtZQUVELEdBQUcsQ0FBQyxJQUFJLENBQ04sRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFDakUsb0NBQW9DLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FDbkQsQ0FBQztZQUVGLFVBQVUsQ0FBQyxHQUFHLENBQW1CLGNBQWMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBRTFELE9BQU8sS0FBSyxDQUFDO1NBQ2Q7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLEdBQUcsQ0FBQyxJQUFJLENBQ04sRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUN0Qyx3Q0FBd0MsSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsR0FBRyxHQUFHLENBQ25FLENBQUM7WUFFRixPQUFPLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztTQUN6QjtJQUNILENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IElWM1N1YmdyYXBoUHJvdmlkZXIsIGxvZywgVjNTdWJncmFwaFBvb2wsIFYzU3ViZ3JhcGhQcm92aWRlciB9IGZyb20gXCJAdm90b3BpYS9zbWFydC1vcmRlci1yb3V0ZXJcIjtcbmltcG9ydCB7IFMzIH0gZnJvbSBcImF3cy1zZGtcIjtcblxuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IE5vZGVDYWNoZSBmcm9tIFwibm9kZS1jYWNoZVwiO1xuXG5jb25zdCBQT09MX0NBQ0hFID0gbmV3IE5vZGVDYWNoZSh7IHN0ZFRUTDogMjQwLCB1c2VDbG9uZXM6IGZhbHNlIH0pO1xuY29uc3QgUE9PTF9DQUNIRV9LRVkgPSAoKSA9PiBgcG9vbHNgO1xuXG5leHBvcnQgY2xhc3MgVjNBV1NTdWJncmFwaFByb3ZpZGVyV2l0aEZhbGxiYWNrIGV4dGVuZHMgVjNTdWJncmFwaFByb3ZpZGVyIGltcGxlbWVudHMgSVYzU3ViZ3JhcGhQcm92aWRlciB7XG4gIHByaXZhdGUga2V5OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBidWNrZXQ6IHN0cmluZywga2V5OiBzdHJpbmcpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMua2V5ID0gYCR7a2V5fWA7XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgZ2V0UG9vbHMoKTogUHJvbWlzZTxWM1N1YmdyYXBoUG9vbFtdPiB7XG4gICAgbG9nLmluZm8oYEluIGxlZ2FjeSBBV1Mgc3ViZ3JhcGggcHJvdmlkZXIgZm9yIHByb3RvY29sIFYzYCk7XG5cbiAgICBjb25zdCBzMyA9IG5ldyBTMygpO1xuXG4gICAgY29uc3QgY2FjaGVkUG9vbHMgPSBQT09MX0NBQ0hFLmdldDxWM1N1YmdyYXBoUG9vbFtdPihQT09MX0NBQ0hFX0tFWSgpKTtcblxuICAgIGlmIChjYWNoZWRQb29scykge1xuICAgICAgbG9nLmluZm8oXG4gICAgICAgIHsgc3ViZ3JhcGhQb29sc1NhbXBsZTogY2FjaGVkUG9vbHMuc2xpY2UoMCwgNSkgfSxcbiAgICAgICAgYFN1YmdyYXBoIHBvb2xzIGZldGNoZWQgZnJvbSBsb2NhbCBjYWNoZS4gTnVtOiAke2NhY2hlZFBvb2xzLmxlbmd0aH1gXG4gICAgICApO1xuXG4gICAgICByZXR1cm4gY2FjaGVkUG9vbHM7XG4gICAgfVxuXG4gICAgbG9nLmluZm8oXG4gICAgICB7IGJ1Y2tldDogdGhpcy5idWNrZXQsIGtleTogdGhpcy5rZXkgfSxcbiAgICAgIGBTdWJncmFwaCBwb29scyBsb2NhbCBjYWNoZSBtaXNzLiBHZXR0aW5nIHN1YmdyYXBoIHBvb2xzIGZyb20gUzMgJHt0aGlzLmJ1Y2tldH0vJHt0aGlzLmtleX1gXG4gICAgKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgczMuZ2V0T2JqZWN0KHsgS2V5OiB0aGlzLmtleSwgQnVja2V0OiB0aGlzLmJ1Y2tldCB9KS5wcm9taXNlKCk7XG5cbiAgICAgIGNvbnN0IHsgQm9keTogcG9vbHNCdWZmZXIgfSA9IHJlc3VsdDtcblxuICAgICAgaWYgKCFwb29sc0J1ZmZlcikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZCBub3QgZ2V0IHN1YmdyYXBoIHBvb2wgY2FjaGUgZnJvbSBTM1wiKTtcbiAgICAgIH1cblxuICAgICAgbGV0IHBvb2xzID0gSlNPTi5wYXJzZShwb29sc0J1ZmZlci50b1N0cmluZyhcInV0Zi04XCIpKTtcblxuICAgICAgaWYgKHBvb2xzWzBdLnRvdGFsVmFsdWVMb2NrZWRFVEgpIHtcbiAgICAgICAgcG9vbHMgPSBfLm1hcChcbiAgICAgICAgICBwb29scyxcbiAgICAgICAgICAocG9vbCkgPT5cbiAgICAgICAgICAgICh7XG4gICAgICAgICAgICAgIC4uLnBvb2wsXG4gICAgICAgICAgICAgIGlkOiBwb29sLmlkLnRvTG93ZXJDYXNlKCksXG4gICAgICAgICAgICAgIHRva2VuMDoge1xuICAgICAgICAgICAgICAgIGlkOiBwb29sLnRva2VuMC5pZC50b0xvd2VyQ2FzZSgpLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB0b2tlbjE6IHtcbiAgICAgICAgICAgICAgICBpZDogcG9vbC50b2tlbjEuaWQudG9Mb3dlckNhc2UoKSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgdHZsRVRIOiBwYXJzZUZsb2F0KHBvb2wudG90YWxWYWx1ZUxvY2tlZEVUSCksXG4gICAgICAgICAgICAgIHR2bFVTRDogcGFyc2VGbG9hdChwb29sLnRvdGFsVmFsdWVMb2NrZWRVU0QpLFxuICAgICAgICAgICAgfSBhcyBWM1N1YmdyYXBoUG9vbClcbiAgICAgICAgKTtcbiAgICAgICAgbG9nLmluZm8oeyBzYW1wbGU6IHBvb2xzLnNsaWNlKDAsIDUpIH0sIFwiQ29udmVydGVkIGxlZ2FjeSBzY2hlbWEgdG8gbmV3IHNjaGVtYVwiKTtcbiAgICAgIH1cblxuICAgICAgbG9nLmluZm8oXG4gICAgICAgIHsgYnVja2V0OiB0aGlzLmJ1Y2tldCwga2V5OiB0aGlzLmtleSwgc2FtcGxlOiBwb29scy5zbGljZSgwLCAzKSB9LFxuICAgICAgICBgR290IHN1YmdyYXBoIHBvb2xzIGZyb20gUzMuIE51bTogJHtwb29scy5sZW5ndGh9YFxuICAgICAgKTtcblxuICAgICAgUE9PTF9DQUNIRS5zZXQ8VjNTdWJncmFwaFBvb2xbXT4oUE9PTF9DQUNIRV9LRVkoKSwgcG9vbHMpO1xuXG4gICAgICByZXR1cm4gcG9vbHM7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBsb2cuaW5mbyhcbiAgICAgICAgeyBidWNrZXQ6IHRoaXMuYnVja2V0LCBrZXk6IHRoaXMua2V5IH0sXG4gICAgICAgIGBGYWlsZWQgdG8gZ2V0IHN1YmdyYXBoIHBvb2xzIGZyb20gUzMgJHt0aGlzLmJ1Y2tldH0vJHt0aGlzLmtleX0uYFxuICAgICAgKTtcblxuICAgICAgcmV0dXJuIHN1cGVyLmdldFBvb2xzKCk7XG4gICAgfVxuICB9XG59XG4iXX0=