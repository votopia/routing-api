import { IV3PoolProvider, V3PoolAccessor } from "@votopia/smart-order-router";
import { Token, FeeAmount } from "@votopia/sdk-core";
import { ProviderConfig } from "@votopia/smart-order-router/build/main/providers/provider";
export type TrafficSwitchPoolProviderProps = {
    currentPoolProvider: IV3PoolProvider;
    targetPoolProvider: IV3PoolProvider;
    sourceOfTruthPoolProvider: IV3PoolProvider;
};
export declare class TrafficSwitchV3PoolProvider implements IV3PoolProvider {
    private readonly currentPoolProvider;
    private readonly targetPoolProvider;
    private readonly sourceOfTruthPoolProvider;
    protected readonly SHOULD_SWITCH_TRAFFIC: () => boolean;
    protected readonly SHOULD_SAMPLE_TRAFFIC: () => boolean;
    constructor({ currentPoolProvider, targetPoolProvider, sourceOfTruthPoolProvider }: TrafficSwitchPoolProviderProps);
    getPoolAddress(tokenA: Token, tokenB: Token, feeAmount: FeeAmount): {
        poolAddress: string;
        token0: Token;
        token1: Token;
    };
    getPools(tokenPairs: [Token, Token, FeeAmount][], providerConfig?: ProviderConfig): Promise<V3PoolAccessor>;
    private sampleTraffic;
    private getRandomPercentage;
}
