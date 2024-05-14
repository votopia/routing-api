import { CachedRoutes } from "@votopia/smart-order-router";
import { TradeType, Protocol } from "@votopia/sdk-core";
import { MarshalledToken } from "./token-marshaller";
import { MarshalledCachedRoute } from "./cached-route-marshaller";
export interface MarshalledCachedRoutes {
    routes: MarshalledCachedRoute[];
    tokenIn: MarshalledToken;
    tokenOut: MarshalledToken;
    protocolsCovered: Protocol[];
    blockNumber: number;
    tradeType: TradeType;
    originalAmount: string;
    blocksToLive: number;
}
export declare class CachedRoutesMarshaller {
    static marshal(cachedRoutes: CachedRoutes): MarshalledCachedRoutes;
    static unmarshal(marshalledCachedRoutes: MarshalledCachedRoutes): CachedRoutes;
}
