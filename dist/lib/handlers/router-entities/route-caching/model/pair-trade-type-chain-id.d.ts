import { TradeType } from "@votopia/sdk-core";
import { CachedRoutes } from "@votopia/smart-order-router";
interface PairTradeTypeChainIdArgs {
    tokenIn: string;
    tokenOut: string;
    tradeType: TradeType;
}
/**
 * Class used to model the partition key of the CachedRoutes cache database and configuration.
 */
export declare class PairTradeTypeChainId {
    readonly tokenIn: string;
    readonly tokenOut: string;
    readonly tradeType: TradeType;
    constructor({ tokenIn, tokenOut, tradeType }: PairTradeTypeChainIdArgs);
    toString(): string;
    static fromCachedRoutes(cachedRoutes: CachedRoutes): PairTradeTypeChainId;
}
export {};
