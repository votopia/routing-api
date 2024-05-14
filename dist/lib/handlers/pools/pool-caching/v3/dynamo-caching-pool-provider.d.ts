import { IV3PoolProvider, V3PoolAccessor } from "@votopia/smart-order-router";
import { Token, FeeAmount } from "@votopia/sdk-core";
import { ProviderConfig } from "@votopia/smart-order-router/build/main/providers/provider";
export declare class DynamoDBCachingV3PoolProvider implements IV3PoolProvider {
    protected poolProvider: IV3PoolProvider;
    private readonly dynamoCache;
    private readonly POOL_CACHE_KEY;
    constructor(poolProvider: IV3PoolProvider, tableName: string);
    getPoolAddress(tokenA: Token, tokenB: Token, feeAmount: FeeAmount): {
        poolAddress: string;
        token0: Token;
        token1: Token;
    };
    getPools(tokenPairs: [Token, Token, FeeAmount][], providerConfig?: ProviderConfig): Promise<V3PoolAccessor>;
}
