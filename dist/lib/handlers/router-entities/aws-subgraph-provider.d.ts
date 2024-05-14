import { Protocol } from "@votopia/sdk-core";
import { IV3SubgraphProvider, V3SubgraphPool } from "@votopia/smart-order-router";
import { S3 } from "aws-sdk";
export declare class AWSSubgraphProvider<TSubgraphPool extends V3SubgraphPool> {
    private protocol;
    private bucket;
    private baseKey;
    constructor(protocol: Protocol, bucket: string, baseKey: string);
    getPools(): Promise<TSubgraphPool[]>;
}
export declare const cachePoolsFromS3: <TSubgraphPool>(s3: S3, bucket: string, baseKey: string, protocol: Protocol) => Promise<TSubgraphPool[]>;
export declare class V3AWSSubgraphProvider extends AWSSubgraphProvider<V3SubgraphPool> implements IV3SubgraphProvider {
    constructor(bucket: string, baseKey: string);
    static EagerBuild(bucket: string, baseKey: string): Promise<V3AWSSubgraphProvider>;
}
