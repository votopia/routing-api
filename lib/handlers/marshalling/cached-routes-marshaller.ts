import { CachedRoutes } from "@votopia/smart-order-router";
import { TradeType, Protocol } from "@votopia/sdk-core";

import { MarshalledToken, TokenMarshaller } from "./token-marshaller";
import { CachedRouteMarshaller, MarshalledCachedRoute } from "./cached-route-marshaller";

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

export class CachedRoutesMarshaller {
  public static marshal(cachedRoutes: CachedRoutes): MarshalledCachedRoutes {
    return {
      routes: cachedRoutes.routes.map((route) => CachedRouteMarshaller.marshal(route)),

      tokenIn: TokenMarshaller.marshal(cachedRoutes.tokenIn),
      tokenOut: TokenMarshaller.marshal(cachedRoutes.tokenOut),
      protocolsCovered: cachedRoutes.protocolsCovered,
      blockNumber: cachedRoutes.blockNumber,
      tradeType: cachedRoutes.tradeType,
      originalAmount: cachedRoutes.originalAmount,
      blocksToLive: cachedRoutes.blocksToLive,
    };
  }

  public static unmarshal(marshalledCachedRoutes: MarshalledCachedRoutes): CachedRoutes {
    return new CachedRoutes({
      routes: marshalledCachedRoutes.routes.map((route) => CachedRouteMarshaller.unmarshal(route)),

      tokenIn: TokenMarshaller.unmarshal(marshalledCachedRoutes.tokenIn),
      tokenOut: TokenMarshaller.unmarshal(marshalledCachedRoutes.tokenOut),
      protocolsCovered: marshalledCachedRoutes.protocolsCovered,
      blockNumber: marshalledCachedRoutes.blockNumber,
      tradeType: marshalledCachedRoutes.tradeType,
      originalAmount: marshalledCachedRoutes.originalAmount,
      blocksToLive: marshalledCachedRoutes.blocksToLive,
    });
  }
}
