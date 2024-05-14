import { V3Route, CachedRoute } from "@votopia/smart-order-router";
import { MarshalledRoute, RouteMarshaller } from "./route-marshaller";

export interface MarshalledCachedRoute {
  route: MarshalledRoute;
  percent: number;
}

export class CachedRouteMarshaller {
  public static marshal(cachedRoute: CachedRoute<V3Route>): MarshalledCachedRoute {
    return {
      route: RouteMarshaller.marshal(cachedRoute.route),
      percent: cachedRoute.percent,
    };
  }

  public static unmarshal(marshalledCachedRoute: MarshalledCachedRoute): CachedRoute<V3Route> {
    return new CachedRoute<V3Route>({
      route: RouteMarshaller.unmarshal(marshalledCachedRoute.route),
      percent: marshalledCachedRoute.percent,
    });
  }
}
