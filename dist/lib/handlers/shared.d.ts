import { Currency, CurrencyAmount, Percent, FeeOptions } from "@votopia/sdk-core";
import { AlphaRouterConfig, ITokenListProvider, ITokenProvider, ProtocolPoolSelection } from "@votopia/smart-order-router";
import Logger from "bunyan";
import { BigNumberish } from "ethers";
export declare const SECONDS_PER_BLOCK = 30;
export type FlatFeeOptions = {
    amount: BigNumberish;
    recipient: string;
};
export declare const DEFAULT_ROUTING_CONFIG: AlphaRouterConfig;
export type QuoteSpeedConfig = {
    v2PoolSelection?: ProtocolPoolSelection;
    v3PoolSelection?: ProtocolPoolSelection;
    maxSwapsPerPath?: number;
    maxSplits?: number;
    distributionPercent?: number;
    writeToCachedRoutes?: boolean;
};
export declare const QUOTE_SPEED_CONFIG: {
    [key: string]: QuoteSpeedConfig;
};
export type IntentSpecificConfig = {
    useCachedRoutes?: boolean;
    optimisticCachedRoutes?: boolean;
};
export declare const INTENT_SPECIFIC_CONFIG: {
    [key: string]: IntentSpecificConfig;
};
export type FeeOnTransferSpecificConfig = {
    enableFeeOnTransferFeeFetching?: boolean;
};
export declare const FEE_ON_TRANSFER_SPECIFIC_CONFIG: (enableFeeOnTransferFeeFetching?: boolean) => FeeOnTransferSpecificConfig;
export declare function tokenStringToCurrency(tokenListProvider: ITokenListProvider, tokenProvider: ITokenProvider, tokenRaw: string, log: Logger): Promise<Currency | undefined>;
export declare function parseSlippageTolerance(slippageTolerance: string): Percent;
export declare function parseDeadline(deadline: string): number;
export declare function parsePortionPercent(portionBips: number): Percent;
export declare function parseFeeOptions(portionBips?: number, portionRecipient?: string): FeeOptions | undefined;
export declare function parseFlatFeeOptions(portionAmount?: string, portionRecipient?: string): FlatFeeOptions | undefined;
export type AllFeeOptions = {
    fee?: FeeOptions;
    flatFee?: FlatFeeOptions;
};
export declare function populateFeeOptions(type: string, portionBips?: number, portionRecipient?: string, portionAmount?: string): AllFeeOptions | undefined;
export declare function computePortionAmount(currencyOut: CurrencyAmount<Currency>, portionBips?: number): string | undefined;
export declare const DEFAULT_DEADLINE = 600;
