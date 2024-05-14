import * as cdk from "aws-cdk-lib";
import { CfnOutput, Stage, StageProps } from "aws-cdk-lib";

import { Construct } from "constructs";
import dotenv from "dotenv";
import "source-map-support/register";

import { STAGE } from "../lib/util/stage";
import { RoutingAPIStack } from "./stacks/routing-api-stack";
dotenv.config();

export class RoutingAPIStage extends Stage {
  public readonly url: CfnOutput;

  constructor(
    scope: Construct,
    id: string,
    props: StageProps & {
      jsonRpcProviders: { [chainName: string]: string };
      provisionedConcurrency: number;
      ethGasStationInfoUrl: string;
      chatbotSNSArn?: string;
      stage: string;
      internalApiKey?: string;
      route53Arn?: string;
      pinata_key?: string;
      pinata_secret?: string;
      hosted_zone?: string;
      tenderlyUser: string;
      tenderlyProject: string;
      tenderlyAccessKey: string;
      unicornSecret: string;
    }
  ) {
    super(scope, id, props);
    const {
      jsonRpcProviders,
      provisionedConcurrency,
      ethGasStationInfoUrl,
      chatbotSNSArn,
      stage,
      internalApiKey,
      route53Arn,
      pinata_key,
      pinata_secret,
      hosted_zone,
      tenderlyUser,
      tenderlyProject,
      tenderlyAccessKey,
      unicornSecret,
    } = props;

    const { url } = new RoutingAPIStack(this, "RoutingAPI", {
      jsonRpcProviders,
      provisionedConcurrency,
      ethGasStationInfoUrl,
      chatbotSNSArn,
      stage,
      internalApiKey,
      route53Arn,
      pinata_key,
      pinata_secret,
      hosted_zone,
      tenderlyUser,
      tenderlyProject,
      tenderlyAccessKey,
      unicornSecret,
    });
    this.url = url;
  }
}

const app = new cdk.App();

const jsonRpcProviders = {
  WEB3_RPC_8453: process.env.JSON_RPC_PROVIDER_8453!,
};

// Local dev stack
new RoutingAPIStack(app, "RoutingAPIStack", {
  jsonRpcProviders,
  provisionedConcurrency: process.env.PROVISION_CONCURRENCY ? parseInt(process.env.PROVISION_CONCURRENCY) : 0,
  throttlingOverride: process.env.THROTTLE_PER_FIVE_MINS,
  ethGasStationInfoUrl: process.env.ETH_GAS_STATION_INFO_URL!,
  chatbotSNSArn: process.env.CHATBOT_SNS_ARN,
  stage: STAGE.LOCAL,
  internalApiKey: "test-api-key",
  route53Arn: process.env.ROLE_ARN,
  pinata_key: process.env.PINATA_API_KEY!,
  pinata_secret: process.env.PINATA_API_SECRET!,
  hosted_zone: process.env.HOSTED_ZONE!,
  tenderlyUser: process.env.TENDERLY_USER!,
  tenderlyProject: process.env.TENDERLY_PROJECT!,
  tenderlyAccessKey: process.env.TENDERLY_ACCESS_KEY!,
  unicornSecret: process.env.UNICORN_SECRET!,
});
