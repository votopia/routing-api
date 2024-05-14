import { IV3SubgraphProvider, V3SubgraphPool, V3SubgraphProvider } from "@votopia/smart-order-router";
export declare class V3AWSSubgraphProviderWithFallback extends V3SubgraphProvider implements IV3SubgraphProvider {
    private bucket;
    private key;
    constructor(bucket: string, key: string);
    getPools(): Promise<V3SubgraphPool[]>;
}
