import { V3Route, CachedRoute } from "@votopia/smart-order-router";
import { MarshalledRoute } from "./route-marshaller";
export interface MarshalledCachedRoute {
    route: MarshalledRoute;
    percent: number;
}
export declare class CachedRouteMarshaller {
    static marshal(cachedRoute: CachedRoute<V3Route>): MarshalledCachedRoute;
    static unmarshal(marshalledCachedRoute: MarshalledCachedRoute): CachedRoute<V3Route>;
}
