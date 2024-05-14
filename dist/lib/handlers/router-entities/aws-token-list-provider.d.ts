import { CachingTokenListProvider, ITokenListProvider, ITokenProvider } from "@votopia/smart-order-router";
export declare class AWSTokenListProvider extends CachingTokenListProvider {
    static fromTokenListS3Bucket(bucket: string, tokenListURI: string): Promise<ITokenListProvider & ITokenProvider>;
}
