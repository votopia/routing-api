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
export class PairTradeTypeChainId {
  public readonly tokenIn: string;
  public readonly tokenOut: string;
  public readonly tradeType: TradeType;

  constructor({ tokenIn, tokenOut, tradeType }: PairTradeTypeChainIdArgs) {
    this.tokenIn = tokenIn.toLowerCase(); // All token addresses should be lower case for normalization.
    this.tokenOut = tokenOut.toLowerCase(); // All token addresses should be lower case for normalization.
    this.tradeType = tradeType;
  }

  public toString(): string {
    return `${this.tokenIn}/${this.tokenOut}/${this.tradeType}`;
  }

  public static fromCachedRoutes(cachedRoutes: CachedRoutes): PairTradeTypeChainId {
    return new PairTradeTypeChainId({
      tokenIn: cachedRoutes.tokenIn.address,
      tokenOut: cachedRoutes.tokenOut.address,
      tradeType: cachedRoutes.tradeType,
    });
  }
}
