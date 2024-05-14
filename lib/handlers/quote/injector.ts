import { AlphaRouter, AlphaRouterConfig, IRouter, setGlobalLogger, setGlobalMetric } from "@votopia/smart-order-router";

import { V3HeuristicGasModelFactory } from "@votopia/smart-order-router/build/main/routers/alpha-router/gas-models/v3/v3-heuristic-gas-model";
import { MetricsLogger } from "aws-embedded-metrics";
import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { default as bunyan, default as Logger } from "bunyan";
import { BigNumber } from "ethers";
import { ContainerInjected, InjectorSOR, RequestInjected } from "../injector-sor";
import { AWSMetricsLogger } from "../router-entities/aws-metrics-logger";
import { StaticGasPriceProvider } from "../router-entities/static-gas-price-provider";
import { QuoteQueryParams } from "./schema/quote-schema";

import { ChainId, ContainerDependencies } from "../injector-sor";

export class QuoteHandlerInjector extends InjectorSOR<IRouter<AlphaRouterConfig>, QuoteQueryParams> {
  public async getRequestInjected(
    containerInjected: ContainerInjected,
    _requestBody: void,
    requestQueryParams: QuoteQueryParams,
    _event: APIGatewayProxyEvent,
    context: Context,
    log: Logger,
    metricsLogger: MetricsLogger
  ): Promise<RequestInjected<IRouter<AlphaRouterConfig>>> {
    const requestId = context.awsRequestId;
    const quoteId = requestId.substring(0, 5);
    // Sample 10% of all requests at the INFO log level for debugging purposes.
    // All other requests will only log warnings and errors.
    // Note that we use WARN as a default rather than ERROR
    // to capture Tapcompare logs in the smart-order-router.
    const logLevel = Math.random() < 0.1 ? bunyan.INFO : bunyan.WARN;

    const {
      tokenInAddress,

      tokenOutAddress,
      amount,
      type,
      algorithm,
      gasPriceWei,
      quoteSpeed,
      intent,
    } = requestQueryParams;

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

    const {
      provider,
      v3PoolProvider,
      multicallProvider,
      tokenProvider,
      tokenListProvider,
      v3SubgraphProvider,
      blockedTokenListProvider,

      tokenValidatorProvider,
      tokenPropertiesProvider,

      gasPriceProvider: gasPriceProviderOnChain,
      simulator,
      routeCachingProvider,
    } = dependencies![ChainId.OPTOPIA] as ContainerDependencies;

    let onChainQuoteProvider = dependencies![ChainId.OPTOPIA]!.onChainQuoteProvider;
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
