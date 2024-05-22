import { IGasPriceProvider, IMetric, Simulator, ITokenListProvider, ITokenProvider, IV3PoolProvider, IV3SubgraphProvider, OnChainQuoteProvider, UniswapMulticallProvider, IRouteCachingProvider, TokenValidatorProvider, ITokenPropertiesProvider } from "@votopia/smart-order-router";
import { ethers } from "ethers";
import { BaseRInj, Injector } from "./handler";
export declare enum ChainId {
    OPTOPIA = 62050
}
export declare const SUPPORTED_CHAINS: ChainId[];
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
export declare abstract class InjectorSOR<Router, QueryParams> extends Injector<ContainerInjected, RequestInjected<Router>, void, QueryParams> {
    buildContainerInjected(): Promise<ContainerInjected>;
}
