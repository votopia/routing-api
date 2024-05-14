import { V3Route } from "@votopia/smart-order-router";
import { Protocol } from "@votopia/sdk-core";
import { MarshalledToken } from "./token-marshaller";
import { MarshalledPool } from "./pool-marshaller";
export interface MarshalledV3Route {
    protocol: Protocol;
    input: MarshalledToken;
    output: MarshalledToken;
    pools: MarshalledPool[];
}
export type MarshalledRoute = MarshalledV3Route;
export declare class RouteMarshaller {
    static marshal(route: V3Route): MarshalledRoute;
    static unmarshal(marshalledRoute: MarshalledRoute): V3Route;
}
