import Joi from "@hapi/joi";

import { Currency, CurrencyAmount, TradeType, Pool, Protocol, NETWORK_NAME } from "@votopia/sdk-core";
import {
  AlphaRouterConfig,
  IRouter,
  MetricLoggerUnit,
  routeAmountsToString,
  SwapRoute,
  SwapOptions,
  SwapType,
  SimulationStatus,
} from "@votopia/smart-order-router";

import JSBI from "jsbi";
import _ from "lodash";
import { APIGLambdaHandler, ErrorResponse, HandleRequestParams, Response } from "../handler";
import { ContainerInjected, RequestInjected } from "../injector-sor";
import { QuoteResponse, QuoteResponseSchemaJoi, V3PoolInRoute } from "../schema";
import {
  DEFAULT_ROUTING_CONFIG,
  parseDeadline,
  parseSlippageTolerance,
  tokenStringToCurrency,
  QUOTE_SPEED_CONFIG,
  INTENT_SPECIFIC_CONFIG,
  FEE_ON_TRANSFER_SPECIFIC_CONFIG,
} from "../shared";
import { QuoteQueryParams, QuoteQueryParamsJoi } from "./schema/quote-schema";

import { simulationStatusToString } from "./util/simulation";
import { MetricsLogger } from "aws-embedded-metrics";

export class QuoteHandler extends APIGLambdaHandler<
  ContainerInjected,
  RequestInjected<IRouter<AlphaRouterConfig>>,
  void,
  QuoteQueryParams,
  QuoteResponse
> {
  public async handleRequest(
    params: HandleRequestParams<ContainerInjected, RequestInjected<IRouter<any>>, void, QuoteQueryParams>
  ): Promise<Response<QuoteResponse> | ErrorResponse> {
    const { metric, log, quoteSpeed, intent } = params.requestInjected;
    const startTime = Date.now();

    let result: Response<QuoteResponse> | ErrorResponse;

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
          log.error(
            {
              statusCode: result?.statusCode,
              errorCode: result?.errorCode,
              detail: result?.detail,
            },
            `Quote 4XX Error [${result?.statusCode}] on ${NETWORK_NAME} with errorCode '${result?.errorCode}': ${result?.detail}`
          );
          break;
        case 500:
          metric.putMetric(`GET_QUOTE_500`, 1, MetricLoggerUnit.Count);
          break;
      }
    } catch (err) {
      metric.putMetric(`GET_QUOTE_500`, 1, MetricLoggerUnit.Count);

      throw err;
    } finally {
      // This metric is logged after calling the internal handler to correlate with the status metrics
      metric.putMetric(`GET_QUOTE_REQUESTED`, 1, MetricLoggerUnit.Count);
      metric.putMetric(`GET_QUOTE_LATENCY`, Date.now() - startTime, MetricLoggerUnit.Milliseconds);

      metric.putMetric(
        `GET_QUOTE_LATENCY_QUOTE_SPEED_${quoteSpeed ?? "standard"}`,
        Date.now() - startTime,
        MetricLoggerUnit.Milliseconds
      );
      metric.putMetric(
        `GET_QUOTE_LATENCY_INTENT_${intent ?? "quote"}`,
        Date.now() - startTime,
        MetricLoggerUnit.Milliseconds
      );
    }

    return result;
  }

  private async handleRequestInternal(
    params: HandleRequestParams<ContainerInjected, RequestInjected<IRouter<any>>, void, QuoteQueryParams>
  ): Promise<Response<QuoteResponse> | ErrorResponse> {
    const {
      requestQueryParams: {
        tokenInAddress,

        tokenOutAddress,

        amount: amountRaw,
        type,
        recipient,
        slippageTolerance,
        deadline,
        minSplits,
        forceCrossProtocol,
        forceMixedRoutes,
        protocols: protocolsStr,
        simulateFromAddress,

        quoteSpeed,
        debugRoutingConfig,
        unicornSecret,
        intent,
        enableFeeOnTransferFeeFetching,
      },
      requestInjected: {
        router,
        log,
        id: quoteId,

        tokenProvider,
        tokenListProvider,
        v3PoolProvider: v3PoolProvider,

        metric,
      },
    } = params;

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

    let protocols: Protocol[] = [];
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
    } else if (!forceCrossProtocol) {
      protocols = [Protocol.V3];
    }

    let parsedDebugRoutingConfig = {};
    if (debugRoutingConfig && unicornSecret && unicornSecret === process.env.UNICORN_SECRET) {
      parsedDebugRoutingConfig = JSON.parse(debugRoutingConfig);
    }

    const routingConfig: AlphaRouterConfig = {
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

    let swapParams: SwapOptions | undefined = undefined;

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

    let swapRoute: SwapRoute | null;
    let amount: CurrencyAmount<Currency>;

    let tokenPairSymbol = "";
    let tokenPairSymbolChain = "";
    if (currencyIn.symbol && currencyOut.symbol) {
      tokenPairSymbol = _([currencyIn.symbol, currencyOut.symbol]).join("/");
      tokenPairSymbolChain = `${tokenPairSymbol}`;
    }

    const [token0Symbol, token0Address, token1Symbol, token1Address] = currencyIn.wrapped.sortsBefore(
      currencyOut.wrapped
    )
      ? [currencyIn.symbol, currencyIn.wrapped.address, currencyOut.symbol, currencyOut.wrapped.address]
      : [currencyOut.symbol, currencyOut.wrapped.address, currencyIn.symbol, currencyIn.wrapped.address];

    switch (type) {
      case "exactIn":
        amount = CurrencyAmount.fromRawAmount(currencyIn, JSBI.BigInt(amountRaw));

        log.info(
          {
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
          },
          `Exact In Swap: Give ${amount.toExact()} ${amount.currency.symbol}, Want: ${currencyOut.symbol}.`
        );

        swapRoute = await router.route(amount, currencyOut, TradeType.EXACT_INPUT, swapParams, routingConfig);
        break;
      case "exactOut":
        amount = CurrencyAmount.fromRawAmount(currencyOut, JSBI.BigInt(amountRaw));

        log.info(
          {
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
          },
          `Exact Out Swap: Want ${amount.toExact()} ${amount.currency.symbol} Give: ${currencyIn.symbol}.`
        );

        swapRoute = await router.route(amount, currencyIn, TradeType.EXACT_OUTPUT, swapParams, routingConfig);
        break;
      default:
        throw new Error("Invalid swap type");
    }

    if (!swapRoute) {
      log.info(
        {
          type,
          tokenIn: currencyIn,
          tokenOut: currencyOut,
          amount: amount.quotient.toString(),
        },
        `No route found. 404`
      );

      return {
        statusCode: 404,
        errorCode: "NO_ROUTE",
        detail: "No route found",
      };
    }

    const {
      quote,
      quoteGasAdjusted,
      quoteGasAndPortionAdjusted,
      route,
      estimatedGasUsed,
      estimatedGasUsedQuoteToken,
      estimatedGasUsedUSD,
      gasPriceWei,
      methodParameters,
      blockNumber,
      simulationStatus,
      hitsCachedRoute,
      portionAmount: outputPortionAmount, // TODO: name it back to portionAmount
    } = swapRoute;

    if (simulationStatus == SimulationStatus.Failed) {
      metric.putMetric("SimulationFailed", 1, MetricLoggerUnit.Count);
    } else if (simulationStatus == SimulationStatus.Succeeded) {
      metric.putMetric("SimulationSuccessful", 1, MetricLoggerUnit.Count);
    } else if (simulationStatus == SimulationStatus.InsufficientBalance) {
      metric.putMetric("SimulationInsufficientBalance", 1, MetricLoggerUnit.Count);
    } else if (simulationStatus == SimulationStatus.NotApproved) {
      metric.putMetric("SimulationNotApproved", 1, MetricLoggerUnit.Count);
    } else if (simulationStatus == SimulationStatus.NotSupported) {
      metric.putMetric("SimulationNotSupported", 1, MetricLoggerUnit.Count);
    }

    const routeResponse: Array<V3PoolInRoute[]> = [];

    for (const subRoute of route) {
      const { amount, quote, tokenPath } = subRoute;

      const pools = subRoute.route.pools;
      const curRoute: V3PoolInRoute[] = [];
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
              symbol: tokenIn.symbol!,
            },
            tokenOut: {
              decimals: tokenOut.decimals.toString(),
              address: tokenOut.address,
              symbol: tokenOut.symbol!,
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

    const result: QuoteResponse = {
      methodParameters,
      blockNumber: blockNumber.toString(),
      amount: amount.quotient.toString(),
      amountDecimals: amount.toExact(),
      quote: quote.quotient.toString(),
      quoteDecimals: quote.toExact(),
      quoteGasAdjusted: quoteGasAdjusted.quotient.toString(),
      quoteGasAdjustedDecimals: quoteGasAdjusted.toExact(),
      quoteGasAndPortionAdjusted: quoteGasAndPortionAdjusted?.quotient.toString(),
      quoteGasAndPortionAdjustedDecimals: quoteGasAndPortionAdjusted?.toExact(),
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

      portionAmount: outputPortionAmount?.quotient.toString(),
      portionAmountDecimals: outputPortionAmount?.toExact(),
    };

    return {
      statusCode: 200,
      body: result,
    };
  }

  protected requestBodySchema(): Joi.ObjectSchema | null {
    return null;
  }

  protected requestQueryParamsSchema(): Joi.ObjectSchema | null {
    return QuoteQueryParamsJoi;
  }

  protected responseBodySchema(): Joi.ObjectSchema | null {
    return QuoteResponseSchemaJoi;
  }

  protected afterHandler(metric: MetricsLogger, response: QuoteResponse, requestStart: number): void {
    metric.putMetric(
      `GET_QUOTE_LATENCY_TOP_LEVEL_${response.hitsCachedRoutes ? "CACHED_ROUTES_HIT" : "CACHED_ROUTES_MISS"}`,
      Date.now() - requestStart,
      MetricLoggerUnit.Milliseconds
    );
  }
}
