import { Pool, FeeAmount, Protocol } from "@votopia/sdk-core";
import { MarshalledToken } from "./token-marshaller";
export interface MarshalledPool {
    protocol: Protocol;
    token0: MarshalledToken;
    token1: MarshalledToken;
    fee: FeeAmount;
    sqrtRatioX96: string;
    liquidity: string;
    tickCurrent: number;
}
export declare class PoolMarshaller {
    static marshal(pool: Pool): MarshalledPool;
    static unmarshal(marshalledPool: MarshalledPool): Pool;
}
