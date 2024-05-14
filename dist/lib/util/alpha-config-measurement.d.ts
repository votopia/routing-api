import { Currency, CurrencyAmount } from "@votopia/sdk-core";
import { SwapRoute } from "@votopia/smart-order-router";
export declare const getDistribution: (distributionPercent: number) => number[];
export declare const measureDistributionPercentChangeImpact: (distributionPercentBefore: number, distributionPercentAfter: number, bestSwapRoute: SwapRoute, currencyIn: Currency, currencyOut: Currency, tradeType: string, amount: CurrencyAmount<Currency>) => void;
