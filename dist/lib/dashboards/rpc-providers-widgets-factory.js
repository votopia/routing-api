import { NETWORK_NAME, JSON_RPC_PROVIER } from "@votopia/sdk-core";
export class RpcProvidersWidgetsFactory {
    constructor(namespace, region) {
        this.namespace = namespace;
        this.region = region;
    }
    generateWidgets() {
        return this.generateWidgetsForMethod("CALL")
            .concat(this.generateWidgetsForMethod("GETBLOCKNUMBER"))
            .concat(this.generateWidgetsForMethod("GETGASPRICE"))
            .concat(this.generateWidgetsForMethod("GETNETWORK"))
            .concat(this.generateWidgetsForMethod("RESOLVENAME"));
    }
    generateWidgetsForMethod(rpcMethod) {
        return this.generateRequestsWidgetForMethod(rpcMethod).concat(this.generateSuccessRateForMethod(rpcMethod));
    }
    generateSuccessRateForMethod(rpcMethod) {
        const metrics = () => {
            const providerName = JSON_RPC_PROVIER;
            const metric1 = `m${0 * 2 + 1}`;
            const metric2 = `m${0 * 2 + 2}`;
            const expression = `e${0}`;
            return [
                [
                    {
                        expression: `${metric1} / (${metric1} + ${metric2}) * 100`,
                        label: `RPC ${providerName} Chain ${NETWORK_NAME} ${rpcMethod} Success Rate`,
                        id: expression,
                    },
                ],
                [
                    this.namespace,
                    `RPC_${providerName}_${rpcMethod}_SUCCESS`,
                    "Service",
                    "RoutingAPI",
                    {
                        id: metric1,
                        visible: false,
                    },
                ],
                [
                    this.namespace,
                    `RPC_${providerName}_${rpcMethod}_FAILURE`,
                    "Service",
                    "RoutingAPI",
                    {
                        id: metric2,
                        visible: false,
                    },
                ],
            ];
        };
        return [
            {
                height: 10,
                width: 12,
                type: "metric",
                properties: {
                    metrics: metrics,
                    view: "timeSeries",
                    stacked: false,
                    region: this.region,
                    stat: "SampleCount",
                    period: 300,
                    title: `RPC ${rpcMethod} Success Rate`,
                },
            },
        ];
    }
    generateRequestsWidgetForMethod(rpcMethod) {
        const metrics = () => {
            const providerName = JSON_RPC_PROVIER;
            return [
                [this.namespace, `RPC_${providerName}_${rpcMethod}_SUCCESS`, "Service", "RoutingAPI"],
                [this.namespace, `RPC_${providerName}_${rpcMethod}_FAILURE`, "Service", "RoutingAPI"],
            ];
        };
        return [
            {
                height: 10,
                width: 12,
                type: "metric",
                properties: {
                    metrics: metrics,
                    view: "timeSeries",
                    stacked: true,
                    region: this.region,
                    stat: "SampleCount",
                    period: 300,
                    title: `RPC ${rpcMethod} Requests`,
                },
            },
        ];
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnBjLXByb3ZpZGVycy13aWRnZXRzLWZhY3RvcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvZGFzaGJvYXJkcy9ycGMtcHJvdmlkZXJzLXdpZGdldHMtZmFjdG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFJQSxPQUFPLEVBQUUsWUFBWSxFQUFFLGdCQUFnQixFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFFbkUsTUFBTSxPQUFPLDBCQUEwQjtJQUlyQyxZQUFZLFNBQWlCLEVBQUUsTUFBYztRQUMzQyxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztRQUMzQixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztJQUN2QixDQUFDO0lBRUQsZUFBZTtRQUNiLE9BQU8sSUFBSSxDQUFDLHdCQUF3QixDQUFDLE1BQU0sQ0FBQzthQUN6QyxNQUFNLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLGdCQUFnQixDQUFDLENBQUM7YUFDdkQsTUFBTSxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxhQUFhLENBQUMsQ0FBQzthQUNwRCxNQUFNLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLFlBQVksQ0FBQyxDQUFDO2FBQ25ELE1BQU0sQ0FBQyxJQUFJLENBQUMsd0JBQXdCLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztJQUMxRCxDQUFDO0lBRU8sd0JBQXdCLENBQUMsU0FBaUI7UUFDaEQsT0FBTyxJQUFJLENBQUMsK0JBQStCLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBQzlHLENBQUM7SUFFTyw0QkFBNEIsQ0FBQyxTQUFpQjtRQUNwRCxNQUFNLE9BQU8sR0FBRyxHQUFHLEVBQUU7WUFDbkIsTUFBTSxZQUFZLEdBQUcsZ0JBQWdCLENBQUM7WUFFdEMsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ2hDLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUNoQyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBRTNCLE9BQU87Z0JBQ0w7b0JBQ0U7d0JBQ0UsVUFBVSxFQUFFLEdBQUcsT0FBTyxPQUFPLE9BQU8sTUFBTSxPQUFPLFNBQVM7d0JBQzFELEtBQUssRUFBRSxPQUFPLFlBQVksVUFBVSxZQUFZLElBQUksU0FBUyxlQUFlO3dCQUM1RSxFQUFFLEVBQUUsVUFBVTtxQkFDZjtpQkFDRjtnQkFDRDtvQkFDRSxJQUFJLENBQUMsU0FBUztvQkFDZCxPQUFPLFlBQVksSUFBSSxTQUFTLFVBQVU7b0JBQzFDLFNBQVM7b0JBQ1QsWUFBWTtvQkFDWjt3QkFDRSxFQUFFLEVBQUUsT0FBTzt3QkFDWCxPQUFPLEVBQUUsS0FBSztxQkFDZjtpQkFDRjtnQkFDRDtvQkFDRSxJQUFJLENBQUMsU0FBUztvQkFDZCxPQUFPLFlBQVksSUFBSSxTQUFTLFVBQVU7b0JBQzFDLFNBQVM7b0JBQ1QsWUFBWTtvQkFDWjt3QkFDRSxFQUFFLEVBQUUsT0FBTzt3QkFDWCxPQUFPLEVBQUUsS0FBSztxQkFDZjtpQkFDRjthQUNGLENBQUM7UUFDSixDQUFDLENBQUM7UUFFRixPQUFPO1lBQ0w7Z0JBQ0UsTUFBTSxFQUFFLEVBQUU7Z0JBQ1YsS0FBSyxFQUFFLEVBQUU7Z0JBQ1QsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsVUFBVSxFQUFFO29CQUNWLE9BQU8sRUFBRSxPQUFPO29CQUNoQixJQUFJLEVBQUUsWUFBWTtvQkFDbEIsT0FBTyxFQUFFLEtBQUs7b0JBQ2QsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO29CQUNuQixJQUFJLEVBQUUsYUFBYTtvQkFDbkIsTUFBTSxFQUFFLEdBQUc7b0JBQ1gsS0FBSyxFQUFFLE9BQU8sU0FBUyxlQUFlO2lCQUN2QzthQUNGO1NBQ0YsQ0FBQztJQUNKLENBQUM7SUFFTywrQkFBK0IsQ0FBQyxTQUFpQjtRQUN2RCxNQUFNLE9BQU8sR0FBRyxHQUFHLEVBQUU7WUFDbkIsTUFBTSxZQUFZLEdBQUcsZ0JBQWdCLENBQUM7WUFFdEMsT0FBTztnQkFDTCxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsT0FBTyxZQUFZLElBQUksU0FBUyxVQUFVLEVBQUUsU0FBUyxFQUFFLFlBQVksQ0FBQztnQkFDckYsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLE9BQU8sWUFBWSxJQUFJLFNBQVMsVUFBVSxFQUFFLFNBQVMsRUFBRSxZQUFZLENBQUM7YUFDdEYsQ0FBQztRQUNKLENBQUMsQ0FBQztRQUVGLE9BQU87WUFDTDtnQkFDRSxNQUFNLEVBQUUsRUFBRTtnQkFDVixLQUFLLEVBQUUsRUFBRTtnQkFDVCxJQUFJLEVBQUUsUUFBUTtnQkFDZCxVQUFVLEVBQUU7b0JBQ1YsT0FBTyxFQUFFLE9BQU87b0JBQ2hCLElBQUksRUFBRSxZQUFZO29CQUNsQixPQUFPLEVBQUUsSUFBSTtvQkFDYixNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU07b0JBQ25CLElBQUksRUFBRSxhQUFhO29CQUNuQixNQUFNLEVBQUUsR0FBRztvQkFDWCxLQUFLLEVBQUUsT0FBTyxTQUFTLFdBQVc7aUJBQ25DO2FBQ0Y7U0FDRixDQUFDO0lBQ0osQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgV2lkZ2V0c0ZhY3RvcnkgfSBmcm9tIFwiLi9jb3JlL3dpZGdldHMtZmFjdG9yeVwiO1xuaW1wb3J0IHsgV2lkZ2V0IH0gZnJvbSBcIi4vY29yZS9tb2RlbC93aWRnZXRcIjtcblxuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgTkVUV09SS19OQU1FLCBKU09OX1JQQ19QUk9WSUVSIH0gZnJvbSBcIkB2b3RvcGlhL3Nkay1jb3JlXCI7XG5cbmV4cG9ydCBjbGFzcyBScGNQcm92aWRlcnNXaWRnZXRzRmFjdG9yeSBpbXBsZW1lbnRzIFdpZGdldHNGYWN0b3J5IHtcbiAgcmVnaW9uOiBzdHJpbmc7XG4gIG5hbWVzcGFjZTogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKG5hbWVzcGFjZTogc3RyaW5nLCByZWdpb246IHN0cmluZykge1xuICAgIHRoaXMubmFtZXNwYWNlID0gbmFtZXNwYWNlO1xuICAgIHRoaXMucmVnaW9uID0gcmVnaW9uO1xuICB9XG5cbiAgZ2VuZXJhdGVXaWRnZXRzKCk6IFdpZGdldFtdIHtcbiAgICByZXR1cm4gdGhpcy5nZW5lcmF0ZVdpZGdldHNGb3JNZXRob2QoXCJDQUxMXCIpXG4gICAgICAuY29uY2F0KHRoaXMuZ2VuZXJhdGVXaWRnZXRzRm9yTWV0aG9kKFwiR0VUQkxPQ0tOVU1CRVJcIikpXG4gICAgICAuY29uY2F0KHRoaXMuZ2VuZXJhdGVXaWRnZXRzRm9yTWV0aG9kKFwiR0VUR0FTUFJJQ0VcIikpXG4gICAgICAuY29uY2F0KHRoaXMuZ2VuZXJhdGVXaWRnZXRzRm9yTWV0aG9kKFwiR0VUTkVUV09SS1wiKSlcbiAgICAgIC5jb25jYXQodGhpcy5nZW5lcmF0ZVdpZGdldHNGb3JNZXRob2QoXCJSRVNPTFZFTkFNRVwiKSk7XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlV2lkZ2V0c0Zvck1ldGhvZChycGNNZXRob2Q6IHN0cmluZyk6IFdpZGdldFtdIHtcbiAgICByZXR1cm4gdGhpcy5nZW5lcmF0ZVJlcXVlc3RzV2lkZ2V0Rm9yTWV0aG9kKHJwY01ldGhvZCkuY29uY2F0KHRoaXMuZ2VuZXJhdGVTdWNjZXNzUmF0ZUZvck1ldGhvZChycGNNZXRob2QpKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVTdWNjZXNzUmF0ZUZvck1ldGhvZChycGNNZXRob2Q6IHN0cmluZyk6IFdpZGdldFtdIHtcbiAgICBjb25zdCBtZXRyaWNzID0gKCkgPT4ge1xuICAgICAgY29uc3QgcHJvdmlkZXJOYW1lID0gSlNPTl9SUENfUFJPVklFUjtcblxuICAgICAgY29uc3QgbWV0cmljMSA9IGBtJHswICogMiArIDF9YDtcbiAgICAgIGNvbnN0IG1ldHJpYzIgPSBgbSR7MCAqIDIgKyAyfWA7XG4gICAgICBjb25zdCBleHByZXNzaW9uID0gYGUkezB9YDtcblxuICAgICAgcmV0dXJuIFtcbiAgICAgICAgW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGV4cHJlc3Npb246IGAke21ldHJpYzF9IC8gKCR7bWV0cmljMX0gKyAke21ldHJpYzJ9KSAqIDEwMGAsXG4gICAgICAgICAgICBsYWJlbDogYFJQQyAke3Byb3ZpZGVyTmFtZX0gQ2hhaW4gJHtORVRXT1JLX05BTUV9ICR7cnBjTWV0aG9kfSBTdWNjZXNzIFJhdGVgLFxuICAgICAgICAgICAgaWQ6IGV4cHJlc3Npb24sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgW1xuICAgICAgICAgIHRoaXMubmFtZXNwYWNlLFxuICAgICAgICAgIGBSUENfJHtwcm92aWRlck5hbWV9XyR7cnBjTWV0aG9kfV9TVUNDRVNTYCxcbiAgICAgICAgICBcIlNlcnZpY2VcIixcbiAgICAgICAgICBcIlJvdXRpbmdBUElcIixcbiAgICAgICAgICB7XG4gICAgICAgICAgICBpZDogbWV0cmljMSxcbiAgICAgICAgICAgIHZpc2libGU6IGZhbHNlLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIFtcbiAgICAgICAgICB0aGlzLm5hbWVzcGFjZSxcbiAgICAgICAgICBgUlBDXyR7cHJvdmlkZXJOYW1lfV8ke3JwY01ldGhvZH1fRkFJTFVSRWAsXG4gICAgICAgICAgXCJTZXJ2aWNlXCIsXG4gICAgICAgICAgXCJSb3V0aW5nQVBJXCIsXG4gICAgICAgICAge1xuICAgICAgICAgICAgaWQ6IG1ldHJpYzIsXG4gICAgICAgICAgICB2aXNpYmxlOiBmYWxzZSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgXTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIFtcbiAgICAgIHtcbiAgICAgICAgaGVpZ2h0OiAxMCxcbiAgICAgICAgd2lkdGg6IDEyLFxuICAgICAgICB0eXBlOiBcIm1ldHJpY1wiLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgbWV0cmljczogbWV0cmljcyxcbiAgICAgICAgICB2aWV3OiBcInRpbWVTZXJpZXNcIixcbiAgICAgICAgICBzdGFja2VkOiBmYWxzZSxcbiAgICAgICAgICByZWdpb246IHRoaXMucmVnaW9uLFxuICAgICAgICAgIHN0YXQ6IFwiU2FtcGxlQ291bnRcIixcbiAgICAgICAgICBwZXJpb2Q6IDMwMCxcbiAgICAgICAgICB0aXRsZTogYFJQQyAke3JwY01ldGhvZH0gU3VjY2VzcyBSYXRlYCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXTtcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVSZXF1ZXN0c1dpZGdldEZvck1ldGhvZChycGNNZXRob2Q6IHN0cmluZyk6IFdpZGdldFtdIHtcbiAgICBjb25zdCBtZXRyaWNzID0gKCkgPT4ge1xuICAgICAgY29uc3QgcHJvdmlkZXJOYW1lID0gSlNPTl9SUENfUFJPVklFUjtcblxuICAgICAgcmV0dXJuIFtcbiAgICAgICAgW3RoaXMubmFtZXNwYWNlLCBgUlBDXyR7cHJvdmlkZXJOYW1lfV8ke3JwY01ldGhvZH1fU1VDQ0VTU2AsIFwiU2VydmljZVwiLCBcIlJvdXRpbmdBUElcIl0sXG4gICAgICAgIFt0aGlzLm5hbWVzcGFjZSwgYFJQQ18ke3Byb3ZpZGVyTmFtZX1fJHtycGNNZXRob2R9X0ZBSUxVUkVgLCBcIlNlcnZpY2VcIiwgXCJSb3V0aW5nQVBJXCJdLFxuICAgICAgXTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIFtcbiAgICAgIHtcbiAgICAgICAgaGVpZ2h0OiAxMCxcbiAgICAgICAgd2lkdGg6IDEyLFxuICAgICAgICB0eXBlOiBcIm1ldHJpY1wiLFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgbWV0cmljczogbWV0cmljcyxcbiAgICAgICAgICB2aWV3OiBcInRpbWVTZXJpZXNcIixcbiAgICAgICAgICBzdGFja2VkOiB0cnVlLFxuICAgICAgICAgIHJlZ2lvbjogdGhpcy5yZWdpb24sXG4gICAgICAgICAgc3RhdDogXCJTYW1wbGVDb3VudFwiLFxuICAgICAgICAgIHBlcmlvZDogMzAwLFxuICAgICAgICAgIHRpdGxlOiBgUlBDICR7cnBjTWV0aG9kfSBSZXF1ZXN0c2AsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIF07XG4gIH1cbn1cbiJdfQ==