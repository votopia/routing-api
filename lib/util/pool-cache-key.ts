import { Protocol } from "@votopia/sdk-core";

export const S3_POOL_CACHE_KEY = (baseKey: string, protocol: Protocol) => `${baseKey}-${protocol}`;
