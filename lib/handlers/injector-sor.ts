import { Token, TokenList } from "@votopia/sdk-core";
import {
  CachingGasStationProvider,
  CachingTokenListProvider,
  CachingTokenProviderWithFallback,
  CachingV3PoolProvider,
  EIP1559GasPriceProvider,
  FallbackTenderlySimulator,
  TenderlySimulator,
  EthEstimateGasSimulator,
  IGasPriceProvider,
  IMetric,
  Simulator,
  ITokenListProvider,
  ITokenProvider,
  IV3PoolProvider,
  IV3SubgraphProvider,
  LegacyGasPriceProvider,
  NodeJSCache,
  OnChainGasPriceProvider,
  OnChainQuoteProvider,
  setGlobalLogger,
  StaticV3SubgraphProvider,
  TokenProvider,
  TokenPropertiesProvider,
  UniswapMulticallProvider,
  V3PoolProvider,
  IRouteCachingProvider,
  TokenValidatorProvider,
  ITokenPropertiesProvider,
} from "@votopia/smart-order-router";

import { default as bunyan, default as Logger } from "bunyan";
import { ethers } from "ethers";
import _ from "lodash";
import NodeCache from "node-cache";
import UNSUPPORTED_TOKEN_LIST from "./../config/unsupported.tokenlist.json";
import { BaseRInj, Injector } from "./handler";
import { V3AWSSubgraphProvider } from "./router-entities/aws-subgraph-provider";
import { AWSTokenListProvider } from "./router-entities/aws-token-list-provider";
import { DynamoRouteCachingProvider } from "./router-entities/route-caching/dynamo-route-caching-provider";
import { DynamoDBCachingV3PoolProvider } from "./pools/pool-caching/v3/dynamo-caching-pool-provider";
import { TrafficSwitchV3PoolProvider } from "./pools/provider-migration/v3/traffic-switch-v3-pool-provider";
import { DefaultEVMClient } from "./evm/EVMClient";
import { InstrumentedEVMProvider } from "./evm/provider/InstrumentedEVMProvider";
import { deriveProviderName } from "./evm/provider/ProviderName";

import { OnChainTokenFeeFetcher } from "@votopia/smart-order-router/build/main/providers/token-fee-fetcher";

const DEFAULT_TOKEN_LIST = "https://gateway.ipfs.io/ipns/tokens.uniswap.org";

export enum ChainId {
  OPTOPIA = 62050,
}

export const SUPPORTED_CHAINS = [ChainId.OPTOPIA];

export interface RequestInjected<Router> extends BaseRInj {
  metric: IMetric;
  v3PoolProvider: IV3PoolProvider;

  tokenProvider: ITokenProvider;
  tokenListProvider: ITokenListProvider;
  router: Router;
  quoteSpeed?: string;
  intent?: string;
}

export type ContainerDependencies = {
  provider: ethers.providers.StaticJsonRpcProvider;
  v3SubgraphProvider: IV3SubgraphProvider;

  tokenListProvider: ITokenListProvider;
  gasPriceProvider: IGasPriceProvider;
  tokenProviderFromTokenList: ITokenProvider;
  blockedTokenListProvider: ITokenListProvider;
  v3PoolProvider: IV3PoolProvider;

  tokenProvider: ITokenProvider;
  multicallProvider: UniswapMulticallProvider;
  onChainQuoteProvider?: OnChainQuoteProvider;

  simulator: Simulator;
  routeCachingProvider?: IRouteCachingProvider;
  tokenValidatorProvider: TokenValidatorProvider;
  tokenPropertiesProvider: ITokenPropertiesProvider;
};

export interface ContainerInjected {
  dependencies: {
    [chainId in ChainId]?: ContainerDependencies;
  };
}

export abstract class InjectorSOR<Router, QueryParams> extends Injector<
  ContainerInjected,
  RequestInjected<Router>,
  void,
  QueryParams
> {
  public async buildContainerInjected(): Promise<ContainerInjected> {
    const log: Logger = bunyan.createLogger({
      name: this.injectorName,
      serializers: bunyan.stdSerializers,
      level: bunyan.INFO,
    });
    setGlobalLogger(log);

    try {
      const {
        POOL_CACHE_BUCKET_2,
        POOL_CACHE_KEY,
        TOKEN_LIST_CACHE_BUCKET,
        ROUTES_TABLE_NAME,
        ROUTES_CACHING_REQUEST_FLAG_TABLE_NAME,
        CACHED_ROUTES_TABLE_NAME,
        AWS_LAMBDA_FUNCTION_NAME,
      } = process.env;

      const dependenciesByChain: {
        [chainId in ChainId]?: ContainerDependencies;
      } = {};

      const dependenciesByChainArray = await Promise.all(
        _.map(SUPPORTED_CHAINS, async (chainId) => {
          const url = process.env[`WEB3_RPC_${chainId.toString()}`]!;
          if (!url) {
            log.fatal({ chainId: chainId }, `Fatal: No Web3 RPC endpoint set for chain`);
            return { chainId, dependencies: {} as ContainerDependencies };
            // This router instance will not be able to route through any chain
            // for which RPC URL is not set
            // For now, if RPC URL is not set for a chain, a request to route
            // on the chain will return Err 500
          }

          let timeout: number;
          switch (chainId) {
            default:
              timeout = 5000;
              break;
          }

          const provider = new DefaultEVMClient({
            allProviders: [
              new InstrumentedEVMProvider({
                url: {
                  url: url,
                  timeout,
                },
                network: chainId,
                name: deriveProviderName(url),
              }),
            ],
          }).getProvider();

          const tokenCache = new NodeJSCache<Token>(new NodeCache({ stdTTL: 3600, useClones: false }));
          const blockedTokenCache = new NodeJSCache<Token>(new NodeCache({ stdTTL: 3600, useClones: false }));
          const multicall2Provider = new UniswapMulticallProvider(provider, 375_000);

          const noCacheV3PoolProvider = new V3PoolProvider(multicall2Provider);
          const inMemoryCachingV3PoolProvider = new CachingV3PoolProvider(
            noCacheV3PoolProvider,
            new NodeJSCache(new NodeCache({ stdTTL: 180, useClones: false }))
          );
          const dynamoCachingV3PoolProvider = new DynamoDBCachingV3PoolProvider(
            noCacheV3PoolProvider,
            "V3PoolsCachingDB"
          );

          const v3PoolProvider = new TrafficSwitchV3PoolProvider({
            currentPoolProvider: inMemoryCachingV3PoolProvider,
            targetPoolProvider: dynamoCachingV3PoolProvider,
            sourceOfTruthPoolProvider: noCacheV3PoolProvider,
          });

          const tokenFeeFetcher = new OnChainTokenFeeFetcher(provider);
          const tokenValidatorProvider = new TokenValidatorProvider(
            multicall2Provider,
            new NodeJSCache(new NodeCache({ stdTTL: 30000, useClones: false }))
          );
          const tokenPropertiesProvider = new TokenPropertiesProvider(
            new NodeJSCache(new NodeCache({ stdTTL: 30000, useClones: false })),
            tokenFeeFetcher
          );

          const [tokenListProvider, blockedTokenListProvider, v3SubgraphProvider] = await Promise.all([
            AWSTokenListProvider.fromTokenListS3Bucket(TOKEN_LIST_CACHE_BUCKET!, DEFAULT_TOKEN_LIST),
            CachingTokenListProvider.fromTokenList(UNSUPPORTED_TOKEN_LIST as TokenList, blockedTokenCache),
            (async () => {
              try {
                const subgraphProvider = await V3AWSSubgraphProvider.EagerBuild(POOL_CACHE_BUCKET_2!, POOL_CACHE_KEY!);
                return subgraphProvider;
              } catch (err) {
                log.error({ err }, "AWS Subgraph Provider unavailable, defaulting to Static Subgraph Provider");
                return new StaticV3SubgraphProvider(v3PoolProvider);
              }
            })(),
          ]);

          const tokenProvider = new CachingTokenProviderWithFallback(
            tokenCache,
            tokenListProvider,
            new TokenProvider(multicall2Provider)
          );

          // Some providers like Infura set a gas limit per call of 10x block gas which is approx 150m
          // 200*725k < 150m
          let quoteProvider: OnChainQuoteProvider | undefined = undefined;
          switch (chainId) {
            case ChainId.OPTOPIA:
              quoteProvider = new OnChainQuoteProvider(
                provider,
                multicall2Provider,
                {
                  retries: 2,
                  minTimeout: 100,
                  maxTimeout: 1000,
                },
                {
                  multicallChunk: 110,
                  gasLimitPerCall: 1_200_000,
                  quoteMinSuccessRate: 0.1,
                },
                {
                  gasLimitOverride: 3_000_000,
                  multicallChunk: 45,
                },
                {
                  gasLimitOverride: 3_000_000,
                  multicallChunk: 45,
                },
                {
                  baseBlockOffset: -25,
                  rollback: {
                    enabled: true,
                    attemptsBeforeRollback: 1,
                    rollbackBlockOffset: -20,
                  },
                }
              );
              break;
          }

          const tenderlySimulator = new TenderlySimulator(
            "https://api.tenderly.co",
            process.env.TENDERLY_USER!,
            process.env.TENDERLY_PROJECT!,
            process.env.TENDERLY_ACCESS_KEY!,
            v3PoolProvider,
            provider,
            undefined,
            // The timeout for the underlying axios call to Tenderly, measured in milliseconds.
            5 * 1000
          );

          const ethEstimateGasSimulator = new EthEstimateGasSimulator(provider, v3PoolProvider);

          const simulator = new FallbackTenderlySimulator(provider, tenderlySimulator, ethEstimateGasSimulator);

          let routeCachingProvider: IRouteCachingProvider | undefined = undefined;
          if (CACHED_ROUTES_TABLE_NAME && CACHED_ROUTES_TABLE_NAME !== "") {
            routeCachingProvider = new DynamoRouteCachingProvider({
              routesTableName: ROUTES_TABLE_NAME!,
              routesCachingRequestFlagTableName: ROUTES_CACHING_REQUEST_FLAG_TABLE_NAME!,
              cachingQuoteLambdaName: AWS_LAMBDA_FUNCTION_NAME!,
            });
          }

          return {
            chainId,
            dependencies: {
              provider,
              tokenListProvider,
              blockedTokenListProvider,
              multicallProvider: multicall2Provider,
              tokenProvider,
              tokenProviderFromTokenList: tokenListProvider,
              gasPriceProvider: new CachingGasStationProvider(
                new OnChainGasPriceProvider(
                  new EIP1559GasPriceProvider(provider),
                  new LegacyGasPriceProvider(provider)
                ),
                new NodeJSCache(new NodeCache({ stdTTL: 15, useClones: false }))
              ),
              v3SubgraphProvider,
              onChainQuoteProvider: quoteProvider,
              v3PoolProvider,
              simulator,
              routeCachingProvider,
              tokenValidatorProvider,
              tokenPropertiesProvider,
            },
          };
        })
      );

      for (const { chainId, dependencies } of dependenciesByChainArray) {
        (dependenciesByChain as any)[chainId] = dependencies;
      }

      return {
        dependencies: dependenciesByChain,
      };
    } catch (err) {
      log.fatal({ err }, `Fatal: Failed to build container`);
      throw err;
    }
  }
}
