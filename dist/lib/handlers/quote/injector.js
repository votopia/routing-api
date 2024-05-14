import { AlphaRouter, setGlobalLogger, setGlobalMetric } from "@votopia/smart-order-router";
import { V3HeuristicGasModelFactory } from "@votopia/smart-order-router/build/main/routers/alpha-router/gas-models/v3/v3-heuristic-gas-model";
import { default as bunyan } from "bunyan";
import { BigNumber } from "ethers";
import { InjectorSOR } from "../injector-sor";
import { AWSMetricsLogger } from "../router-entities/aws-metrics-logger";
import { StaticGasPriceProvider } from "../router-entities/static-gas-price-provider";
import { ChainId } from "../injector-sor";
export class QuoteHandlerInjector extends InjectorSOR {
    async getRequestInjected(containerInjected, _requestBody, requestQueryParams, _event, context, log, metricsLogger) {
        const requestId = context.awsRequestId;
        const quoteId = requestId.substring(0, 5);
        // Sample 10% of all requests at the INFO log level for debugging purposes.
        // All other requests will only log warnings and errors.
        // Note that we use WARN as a default rather than ERROR
        // to capture Tapcompare logs in the smart-order-router.
        const logLevel = Math.random() < 0.1 ? bunyan.INFO : bunyan.WARN;
        const { tokenInAddress, tokenOutAddress, amount, type, algorithm, gasPriceWei, quoteSpeed, intent, } = requestQueryParams;
        log = log.child({
            serializers: bunyan.stdSerializers,
            level: logLevel,
            requestId,
            quoteId,
            tokenInAddress,
            tokenOutAddress,
            amount,
            type,
            algorithm,
        });
        setGlobalLogger(log);
        metricsLogger.setNamespace("Uniswap");
        metricsLogger.setDimensions({ Service: "RoutingAPI" });
        const metric = new AWSMetricsLogger(metricsLogger);
        setGlobalMetric(metric);
        const { dependencies } = containerInjected;
        if (!dependencies) {
            // Request validation should prevent reject unsupported chains with 4xx already, so this should not be possible.
            throw new Error(`No container injected dependencies`);
        }
        const { provider, v3PoolProvider, multicallProvider, tokenProvider, tokenListProvider, v3SubgraphProvider, blockedTokenListProvider, tokenValidatorProvider, tokenPropertiesProvider, gasPriceProvider: gasPriceProviderOnChain, simulator, routeCachingProvider, } = dependencies[ChainId.OPTOPIA];
        let onChainQuoteProvider = dependencies[ChainId.OPTOPIA].onChainQuoteProvider;
        let gasPriceProvider = gasPriceProviderOnChain;
        if (gasPriceWei) {
            const gasPriceWeiBN = BigNumber.from(gasPriceWei);
            gasPriceProvider = new StaticGasPriceProvider(gasPriceWeiBN);
        }
        let router;
        switch (algorithm) {
            case "alpha":
            default:
                router = new AlphaRouter({
                    provider,
                    v3SubgraphProvider,
                    multicall2Provider: multicallProvider,
                    v3PoolProvider,
                    onChainQuoteProvider,
                    gasPriceProvider,
                    v3GasModelFactory: new V3HeuristicGasModelFactory(),
                    blockedTokenListProvider,
                    tokenProvider,
                    simulator,
                    routeCachingProvider,
                    tokenValidatorProvider,
                    tokenPropertiesProvider,
                });
                break;
        }
        return {
            id: quoteId,
            log,
            metric,
            router,
            v3PoolProvider,
            tokenProvider,
            tokenListProvider,
            quoteSpeed,
            intent,
        };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9saWIvaGFuZGxlcnMvcXVvdGUvaW5qZWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFdBQVcsRUFBOEIsZUFBZSxFQUFFLGVBQWUsRUFBRSxNQUFNLDZCQUE2QixDQUFDO0FBRXhILE9BQU8sRUFBRSwwQkFBMEIsRUFBRSxNQUFNLGtHQUFrRyxDQUFDO0FBRzlJLE9BQU8sRUFBRSxPQUFPLElBQUksTUFBTSxFQUFxQixNQUFNLFFBQVEsQ0FBQztBQUM5RCxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sUUFBUSxDQUFDO0FBQ25DLE9BQU8sRUFBcUIsV0FBVyxFQUFtQixNQUFNLGlCQUFpQixDQUFDO0FBQ2xGLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLHVDQUF1QyxDQUFDO0FBQ3pFLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxNQUFNLDhDQUE4QyxDQUFDO0FBR3RGLE9BQU8sRUFBRSxPQUFPLEVBQXlCLE1BQU0saUJBQWlCLENBQUM7QUFFakUsTUFBTSxPQUFPLG9CQUFxQixTQUFRLFdBQXlEO0lBQzFGLEtBQUssQ0FBQyxrQkFBa0IsQ0FDN0IsaUJBQW9DLEVBQ3BDLFlBQWtCLEVBQ2xCLGtCQUFvQyxFQUNwQyxNQUE0QixFQUM1QixPQUFnQixFQUNoQixHQUFXLEVBQ1gsYUFBNEI7UUFFNUIsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQztRQUN2QyxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMxQywyRUFBMkU7UUFDM0Usd0RBQXdEO1FBQ3hELHVEQUF1RDtRQUN2RCx3REFBd0Q7UUFDeEQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztRQUVqRSxNQUFNLEVBQ0osY0FBYyxFQUVkLGVBQWUsRUFDZixNQUFNLEVBQ04sSUFBSSxFQUNKLFNBQVMsRUFDVCxXQUFXLEVBQ1gsVUFBVSxFQUNWLE1BQU0sR0FDUCxHQUFHLGtCQUFrQixDQUFDO1FBRXZCLEdBQUcsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDO1lBQ2QsV0FBVyxFQUFFLE1BQU0sQ0FBQyxjQUFjO1lBQ2xDLEtBQUssRUFBRSxRQUFRO1lBQ2YsU0FBUztZQUNULE9BQU87WUFDUCxjQUFjO1lBQ2QsZUFBZTtZQUNmLE1BQU07WUFDTixJQUFJO1lBQ0osU0FBUztTQUNWLENBQUMsQ0FBQztRQUNILGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUVyQixhQUFhLENBQUMsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3RDLGFBQWEsQ0FBQyxhQUFhLENBQUMsRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUN2RCxNQUFNLE1BQU0sR0FBRyxJQUFJLGdCQUFnQixDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ25ELGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUV4QixNQUFNLEVBQUUsWUFBWSxFQUFFLEdBQUcsaUJBQWlCLENBQUM7UUFFM0MsSUFBSSxDQUFDLFlBQVksRUFBRTtZQUNqQixnSEFBZ0g7WUFDaEgsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO1NBQ3ZEO1FBRUQsTUFBTSxFQUNKLFFBQVEsRUFDUixjQUFjLEVBQ2QsaUJBQWlCLEVBQ2pCLGFBQWEsRUFDYixpQkFBaUIsRUFDakIsa0JBQWtCLEVBQ2xCLHdCQUF3QixFQUV4QixzQkFBc0IsRUFDdEIsdUJBQXVCLEVBRXZCLGdCQUFnQixFQUFFLHVCQUF1QixFQUN6QyxTQUFTLEVBQ1Qsb0JBQW9CLEdBQ3JCLEdBQUcsWUFBYSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQTBCLENBQUM7UUFFNUQsSUFBSSxvQkFBb0IsR0FBRyxZQUFhLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBRSxDQUFDLG9CQUFvQixDQUFDO1FBQ2hGLElBQUksZ0JBQWdCLEdBQUcsdUJBQXVCLENBQUM7UUFDL0MsSUFBSSxXQUFXLEVBQUU7WUFDZixNQUFNLGFBQWEsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ2xELGdCQUFnQixHQUFHLElBQUksc0JBQXNCLENBQUMsYUFBYSxDQUFDLENBQUM7U0FDOUQ7UUFFRCxJQUFJLE1BQU0sQ0FBQztRQUNYLFFBQVEsU0FBUyxFQUFFO1lBQ2pCLEtBQUssT0FBTyxDQUFDO1lBQ2I7Z0JBQ0UsTUFBTSxHQUFHLElBQUksV0FBVyxDQUFDO29CQUN2QixRQUFRO29CQUNSLGtCQUFrQjtvQkFDbEIsa0JBQWtCLEVBQUUsaUJBQWlCO29CQUNyQyxjQUFjO29CQUNkLG9CQUFvQjtvQkFDcEIsZ0JBQWdCO29CQUNoQixpQkFBaUIsRUFBRSxJQUFJLDBCQUEwQixFQUFFO29CQUNuRCx3QkFBd0I7b0JBQ3hCLGFBQWE7b0JBRWIsU0FBUztvQkFDVCxvQkFBb0I7b0JBQ3BCLHNCQUFzQjtvQkFDdEIsdUJBQXVCO2lCQUN4QixDQUFDLENBQUM7Z0JBQ0gsTUFBTTtTQUNUO1FBRUQsT0FBTztZQUNMLEVBQUUsRUFBRSxPQUFPO1lBQ1gsR0FBRztZQUNILE1BQU07WUFDTixNQUFNO1lBQ04sY0FBYztZQUNkLGFBQWE7WUFDYixpQkFBaUI7WUFDakIsVUFBVTtZQUNWLE1BQU07U0FDUCxDQUFDO0lBQ0osQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWxwaGFSb3V0ZXIsIEFscGhhUm91dGVyQ29uZmlnLCBJUm91dGVyLCBzZXRHbG9iYWxMb2dnZXIsIHNldEdsb2JhbE1ldHJpYyB9IGZyb20gXCJAdm90b3BpYS9zbWFydC1vcmRlci1yb3V0ZXJcIjtcblxuaW1wb3J0IHsgVjNIZXVyaXN0aWNHYXNNb2RlbEZhY3RvcnkgfSBmcm9tIFwiQHZvdG9waWEvc21hcnQtb3JkZXItcm91dGVyL2J1aWxkL21haW4vcm91dGVycy9hbHBoYS1yb3V0ZXIvZ2FzLW1vZGVscy92My92My1oZXVyaXN0aWMtZ2FzLW1vZGVsXCI7XG5pbXBvcnQgeyBNZXRyaWNzTG9nZ2VyIH0gZnJvbSBcImF3cy1lbWJlZGRlZC1tZXRyaWNzXCI7XG5pbXBvcnQgeyBBUElHYXRld2F5UHJveHlFdmVudCwgQ29udGV4dCB9IGZyb20gXCJhd3MtbGFtYmRhXCI7XG5pbXBvcnQgeyBkZWZhdWx0IGFzIGJ1bnlhbiwgZGVmYXVsdCBhcyBMb2dnZXIgfSBmcm9tIFwiYnVueWFuXCI7XG5pbXBvcnQgeyBCaWdOdW1iZXIgfSBmcm9tIFwiZXRoZXJzXCI7XG5pbXBvcnQgeyBDb250YWluZXJJbmplY3RlZCwgSW5qZWN0b3JTT1IsIFJlcXVlc3RJbmplY3RlZCB9IGZyb20gXCIuLi9pbmplY3Rvci1zb3JcIjtcbmltcG9ydCB7IEFXU01ldHJpY3NMb2dnZXIgfSBmcm9tIFwiLi4vcm91dGVyLWVudGl0aWVzL2F3cy1tZXRyaWNzLWxvZ2dlclwiO1xuaW1wb3J0IHsgU3RhdGljR2FzUHJpY2VQcm92aWRlciB9IGZyb20gXCIuLi9yb3V0ZXItZW50aXRpZXMvc3RhdGljLWdhcy1wcmljZS1wcm92aWRlclwiO1xuaW1wb3J0IHsgUXVvdGVRdWVyeVBhcmFtcyB9IGZyb20gXCIuL3NjaGVtYS9xdW90ZS1zY2hlbWFcIjtcblxuaW1wb3J0IHsgQ2hhaW5JZCwgQ29udGFpbmVyRGVwZW5kZW5jaWVzIH0gZnJvbSBcIi4uL2luamVjdG9yLXNvclwiO1xuXG5leHBvcnQgY2xhc3MgUXVvdGVIYW5kbGVySW5qZWN0b3IgZXh0ZW5kcyBJbmplY3RvclNPUjxJUm91dGVyPEFscGhhUm91dGVyQ29uZmlnPiwgUXVvdGVRdWVyeVBhcmFtcz4ge1xuICBwdWJsaWMgYXN5bmMgZ2V0UmVxdWVzdEluamVjdGVkKFxuICAgIGNvbnRhaW5lckluamVjdGVkOiBDb250YWluZXJJbmplY3RlZCxcbiAgICBfcmVxdWVzdEJvZHk6IHZvaWQsXG4gICAgcmVxdWVzdFF1ZXJ5UGFyYW1zOiBRdW90ZVF1ZXJ5UGFyYW1zLFxuICAgIF9ldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQsXG4gICAgY29udGV4dDogQ29udGV4dCxcbiAgICBsb2c6IExvZ2dlcixcbiAgICBtZXRyaWNzTG9nZ2VyOiBNZXRyaWNzTG9nZ2VyXG4gICk6IFByb21pc2U8UmVxdWVzdEluamVjdGVkPElSb3V0ZXI8QWxwaGFSb3V0ZXJDb25maWc+Pj4ge1xuICAgIGNvbnN0IHJlcXVlc3RJZCA9IGNvbnRleHQuYXdzUmVxdWVzdElkO1xuICAgIGNvbnN0IHF1b3RlSWQgPSByZXF1ZXN0SWQuc3Vic3RyaW5nKDAsIDUpO1xuICAgIC8vIFNhbXBsZSAxMCUgb2YgYWxsIHJlcXVlc3RzIGF0IHRoZSBJTkZPIGxvZyBsZXZlbCBmb3IgZGVidWdnaW5nIHB1cnBvc2VzLlxuICAgIC8vIEFsbCBvdGhlciByZXF1ZXN0cyB3aWxsIG9ubHkgbG9nIHdhcm5pbmdzIGFuZCBlcnJvcnMuXG4gICAgLy8gTm90ZSB0aGF0IHdlIHVzZSBXQVJOIGFzIGEgZGVmYXVsdCByYXRoZXIgdGhhbiBFUlJPUlxuICAgIC8vIHRvIGNhcHR1cmUgVGFwY29tcGFyZSBsb2dzIGluIHRoZSBzbWFydC1vcmRlci1yb3V0ZXIuXG4gICAgY29uc3QgbG9nTGV2ZWwgPSBNYXRoLnJhbmRvbSgpIDwgMC4xID8gYnVueWFuLklORk8gOiBidW55YW4uV0FSTjtcblxuICAgIGNvbnN0IHtcbiAgICAgIHRva2VuSW5BZGRyZXNzLFxuXG4gICAgICB0b2tlbk91dEFkZHJlc3MsXG4gICAgICBhbW91bnQsXG4gICAgICB0eXBlLFxuICAgICAgYWxnb3JpdGhtLFxuICAgICAgZ2FzUHJpY2VXZWksXG4gICAgICBxdW90ZVNwZWVkLFxuICAgICAgaW50ZW50LFxuICAgIH0gPSByZXF1ZXN0UXVlcnlQYXJhbXM7XG5cbiAgICBsb2cgPSBsb2cuY2hpbGQoe1xuICAgICAgc2VyaWFsaXplcnM6IGJ1bnlhbi5zdGRTZXJpYWxpemVycyxcbiAgICAgIGxldmVsOiBsb2dMZXZlbCxcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIHF1b3RlSWQsXG4gICAgICB0b2tlbkluQWRkcmVzcyxcbiAgICAgIHRva2VuT3V0QWRkcmVzcyxcbiAgICAgIGFtb3VudCxcbiAgICAgIHR5cGUsXG4gICAgICBhbGdvcml0aG0sXG4gICAgfSk7XG4gICAgc2V0R2xvYmFsTG9nZ2VyKGxvZyk7XG5cbiAgICBtZXRyaWNzTG9nZ2VyLnNldE5hbWVzcGFjZShcIlVuaXN3YXBcIik7XG4gICAgbWV0cmljc0xvZ2dlci5zZXREaW1lbnNpb25zKHsgU2VydmljZTogXCJSb3V0aW5nQVBJXCIgfSk7XG4gICAgY29uc3QgbWV0cmljID0gbmV3IEFXU01ldHJpY3NMb2dnZXIobWV0cmljc0xvZ2dlcik7XG4gICAgc2V0R2xvYmFsTWV0cmljKG1ldHJpYyk7XG5cbiAgICBjb25zdCB7IGRlcGVuZGVuY2llcyB9ID0gY29udGFpbmVySW5qZWN0ZWQ7XG5cbiAgICBpZiAoIWRlcGVuZGVuY2llcykge1xuICAgICAgLy8gUmVxdWVzdCB2YWxpZGF0aW9uIHNob3VsZCBwcmV2ZW50IHJlamVjdCB1bnN1cHBvcnRlZCBjaGFpbnMgd2l0aCA0eHggYWxyZWFkeSwgc28gdGhpcyBzaG91bGQgbm90IGJlIHBvc3NpYmxlLlxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBjb250YWluZXIgaW5qZWN0ZWQgZGVwZW5kZW5jaWVzYCk7XG4gICAgfVxuXG4gICAgY29uc3Qge1xuICAgICAgcHJvdmlkZXIsXG4gICAgICB2M1Bvb2xQcm92aWRlcixcbiAgICAgIG11bHRpY2FsbFByb3ZpZGVyLFxuICAgICAgdG9rZW5Qcm92aWRlcixcbiAgICAgIHRva2VuTGlzdFByb3ZpZGVyLFxuICAgICAgdjNTdWJncmFwaFByb3ZpZGVyLFxuICAgICAgYmxvY2tlZFRva2VuTGlzdFByb3ZpZGVyLFxuXG4gICAgICB0b2tlblZhbGlkYXRvclByb3ZpZGVyLFxuICAgICAgdG9rZW5Qcm9wZXJ0aWVzUHJvdmlkZXIsXG5cbiAgICAgIGdhc1ByaWNlUHJvdmlkZXI6IGdhc1ByaWNlUHJvdmlkZXJPbkNoYWluLFxuICAgICAgc2ltdWxhdG9yLFxuICAgICAgcm91dGVDYWNoaW5nUHJvdmlkZXIsXG4gICAgfSA9IGRlcGVuZGVuY2llcyFbQ2hhaW5JZC5PUFRPUElBXSBhcyBDb250YWluZXJEZXBlbmRlbmNpZXM7XG5cbiAgICBsZXQgb25DaGFpblF1b3RlUHJvdmlkZXIgPSBkZXBlbmRlbmNpZXMhW0NoYWluSWQuT1BUT1BJQV0hLm9uQ2hhaW5RdW90ZVByb3ZpZGVyO1xuICAgIGxldCBnYXNQcmljZVByb3ZpZGVyID0gZ2FzUHJpY2VQcm92aWRlck9uQ2hhaW47XG4gICAgaWYgKGdhc1ByaWNlV2VpKSB7XG4gICAgICBjb25zdCBnYXNQcmljZVdlaUJOID0gQmlnTnVtYmVyLmZyb20oZ2FzUHJpY2VXZWkpO1xuICAgICAgZ2FzUHJpY2VQcm92aWRlciA9IG5ldyBTdGF0aWNHYXNQcmljZVByb3ZpZGVyKGdhc1ByaWNlV2VpQk4pO1xuICAgIH1cblxuICAgIGxldCByb3V0ZXI7XG4gICAgc3dpdGNoIChhbGdvcml0aG0pIHtcbiAgICAgIGNhc2UgXCJhbHBoYVwiOlxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcm91dGVyID0gbmV3IEFscGhhUm91dGVyKHtcbiAgICAgICAgICBwcm92aWRlcixcbiAgICAgICAgICB2M1N1YmdyYXBoUHJvdmlkZXIsXG4gICAgICAgICAgbXVsdGljYWxsMlByb3ZpZGVyOiBtdWx0aWNhbGxQcm92aWRlcixcbiAgICAgICAgICB2M1Bvb2xQcm92aWRlcixcbiAgICAgICAgICBvbkNoYWluUXVvdGVQcm92aWRlcixcbiAgICAgICAgICBnYXNQcmljZVByb3ZpZGVyLFxuICAgICAgICAgIHYzR2FzTW9kZWxGYWN0b3J5OiBuZXcgVjNIZXVyaXN0aWNHYXNNb2RlbEZhY3RvcnkoKSxcbiAgICAgICAgICBibG9ja2VkVG9rZW5MaXN0UHJvdmlkZXIsXG4gICAgICAgICAgdG9rZW5Qcm92aWRlcixcblxuICAgICAgICAgIHNpbXVsYXRvcixcbiAgICAgICAgICByb3V0ZUNhY2hpbmdQcm92aWRlcixcbiAgICAgICAgICB0b2tlblZhbGlkYXRvclByb3ZpZGVyLFxuICAgICAgICAgIHRva2VuUHJvcGVydGllc1Byb3ZpZGVyLFxuICAgICAgICB9KTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiBxdW90ZUlkLFxuICAgICAgbG9nLFxuICAgICAgbWV0cmljLFxuICAgICAgcm91dGVyLFxuICAgICAgdjNQb29sUHJvdmlkZXIsXG4gICAgICB0b2tlblByb3ZpZGVyLFxuICAgICAgdG9rZW5MaXN0UHJvdmlkZXIsXG4gICAgICBxdW90ZVNwZWVkLFxuICAgICAgaW50ZW50LFxuICAgIH07XG4gIH1cbn1cbiJdfQ==