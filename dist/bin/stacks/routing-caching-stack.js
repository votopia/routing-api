import { Protocol } from "@votopia/sdk-core";
import * as cdk from "aws-cdk-lib";
import { Duration } from "aws-cdk-lib";
import * as aws_cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import { MathExpression } from "aws-cdk-lib/aws-cloudwatch";
import * as aws_cloudwatch_actions from "aws-cdk-lib/aws-cloudwatch-actions";
import * as aws_events from "aws-cdk-lib/aws-events";
import * as aws_events_targets from "aws-cdk-lib/aws-events-targets";
import * as aws_iam from "aws-cdk-lib/aws-iam";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import * as aws_lambda from "aws-cdk-lib/aws-lambda";
import * as aws_lambda_nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as aws_s3 from "aws-cdk-lib/aws-s3";
import * as aws_sns from "aws-cdk-lib/aws-sns";
import * as path from "path";
import { chainProtocols } from "../../lib/cron/cache-config";
import { STAGE } from "../../lib/util/stage";
export class RoutingCachingStack extends cdk.NestedStack {
    constructor(scope, name, props) {
        super(scope, name, props);
        this.poolCacheLambdaNameArray = [];
        const { chatbotSNSArn } = props;
        const chatBotTopic = chatbotSNSArn ? aws_sns.Topic.fromTopicArn(this, "ChatbotTopic", chatbotSNSArn) : undefined;
        // TODO: Remove and swap to the new bucket below. Kept around for the rollout, but all requests will go to bucket 2.
        this.poolCacheBucket = new aws_s3.Bucket(this, "PoolCacheBucket");
        this.poolCacheBucket2 = new aws_s3.Bucket(this, "PoolCacheBucket2");
        this.poolCacheBucket2.addLifecycleRule({
            enabled: true,
            // This isn't the right fix in the long run, but it will prevent the outage that we experienced when the V2 pool
            // data expired (See https://www.notion.so/uniswaplabs/Routing-API-Mainnet-outage-V2-Subgraph-11527aab3bd540888f92b33017bf26b4 for more detail).
            // The better short-term solution is to bake resilience into the V2SubgraphProvider (https://linear.app/uniswap/issue/ROUTE-31/use-v2-v3-fallback-provider-in-routing-api),
            // instrument the pool cache lambda, and take measures to improve its success rate.
            // Note that there is a trade-off here: we may serve stale V2 pools which can result in a suboptimal routing path if the file hasn't been recently updated.
            // This stale data is preferred to no-data until we can implement the above measures.
            // For now, choose an arbitrarily large TTL (in this case, 10 years) to prevent the key from being deleted.
            expiration: cdk.Duration.days(365 * 10),
        });
        this.poolCacheKey = "poolCache.json";
        const { stage, route53Arn, pinata_key, pinata_secret, hosted_zone } = props;
        const lambdaRole = new aws_iam.Role(this, "RoutingLambdaRole", {
            assumedBy: new aws_iam.ServicePrincipal("lambda.amazonaws.com"),
            managedPolicies: [
                aws_iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
                aws_iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchFullAccess"),
            ],
        });
        if (stage == STAGE.BETA || stage == STAGE.PROD) {
            lambdaRole.addToPolicy(new PolicyStatement({
                resources: [route53Arn],
                actions: ["sts:AssumeRole"],
                sid: "1",
            }));
        }
        const region = cdk.Stack.of(this).region;
        const lambdaLayerVersion = aws_lambda.LayerVersion.fromLayerVersionArn(this, "InsightsLayerPools", `arn:aws:lambda:${region}:580247275435:layer:LambdaInsightsExtension:14`);
        // Spin up a new pool cache lambda for each config in chain X protocol
        for (let i = 0; i < chainProtocols.length; i++) {
            const { protocol, timeout } = chainProtocols[i];
            const lambda = new aws_lambda_nodejs.NodejsFunction(this, `PoolCacheLambda-Protocol${protocol}`, {
                role: lambdaRole,
                runtime: aws_lambda.Runtime.NODEJS_LATEST,
                entry: path.join(__dirname, "../../lib/cron/cache-pools.ts"),
                handler: "handler",
                timeout: Duration.seconds(900),
                memorySize: 1024,
                bundling: {
                    minify: true,
                    sourceMap: true,
                },
                description: `Pool Cache Lambda with Protocol ${protocol}`,
                layers: [lambdaLayerVersion],
                tracing: aws_lambda.Tracing.ACTIVE,
                environment: {
                    POOL_CACHE_BUCKET: this.poolCacheBucket.bucketName,
                    POOL_CACHE_BUCKET_2: this.poolCacheBucket2.bucketName,
                    POOL_CACHE_KEY: this.poolCacheKey,
                    protocol,
                    timeout: timeout.toString(),
                },
            });
            new aws_events.Rule(this, `SchedulePoolCache-Protocol${protocol}`, {
                schedule: aws_events.Schedule.rate(Duration.minutes(15)),
                targets: [new aws_events_targets.LambdaFunction(lambda)],
            });
            this.poolCacheBucket2.grantReadWrite(lambda);
            const lambdaAlarmErrorRate = new aws_cloudwatch.Alarm(this, `RoutingAPI-SEV4-PoolCacheToS3LambdaErrorRate-Protocol${protocol}`, {
                metric: new MathExpression({
                    expression: "(invocations - errors) < 1",
                    usingMetrics: {
                        invocations: lambda.metricInvocations({
                            period: Duration.minutes(60),
                            statistic: "sum",
                        }),
                        errors: lambda.metricErrors({
                            period: Duration.minutes(60),
                            statistic: "sum",
                        }),
                    },
                }),
                threshold: protocol === Protocol.V3 ? 50 : 85,
                evaluationPeriods: protocol === Protocol.V3 ? 12 : 144,
            });
            const lambdaThrottlesErrorRate = new aws_cloudwatch.Alarm(this, `RoutingAPI-PoolCacheToS3LambdaThrottles-Protocol${protocol}`, {
                metric: lambda.metricThrottles({
                    period: Duration.minutes(5),
                    statistic: "sum",
                }),
                threshold: 5,
                evaluationPeriods: 1,
            });
            if (chatBotTopic) {
                lambdaAlarmErrorRate.addAlarmAction(new aws_cloudwatch_actions.SnsAction(chatBotTopic));
                lambdaThrottlesErrorRate.addAlarmAction(new aws_cloudwatch_actions.SnsAction(chatBotTopic));
            }
            this.poolCacheLambdaNameArray.push(lambda.functionName);
        }
        if (stage == STAGE.BETA || stage == STAGE.PROD) {
            this.ipfsPoolCachingLambda = new aws_lambda_nodejs.NodejsFunction(this, "IpfsPoolCacheLambda", {
                role: lambdaRole,
                runtime: aws_lambda.Runtime.NODEJS_LATEST,
                entry: path.join(__dirname, "../../lib/cron/cache-pools-ipfs.ts"),
                handler: "handler",
                timeout: Duration.seconds(900),
                memorySize: 1024,
                bundling: {
                    minify: true,
                    sourceMap: true,
                },
                description: "IPFS Pool Cache Lambda",
                layers: [
                    aws_lambda.LayerVersion.fromLayerVersionArn(this, "InsightsLayerPoolsIPFS", `arn:aws:lambda:${region}:580247275435:layer:LambdaInsightsExtension:14`),
                ],
                tracing: aws_lambda.Tracing.ACTIVE,
                environment: {
                    PINATA_API_KEY: pinata_key,
                    PINATA_API_SECRET: pinata_secret,
                    ROLE_ARN: route53Arn,
                    HOSTED_ZONE: hosted_zone,
                    STAGE: stage,
                    REDEPLOY: "1",
                },
            });
            new aws_events.Rule(this, "ScheduleIpfsPoolCache", {
                schedule: aws_events.Schedule.rate(Duration.minutes(15)),
                targets: [new aws_events_targets.LambdaFunction(this.ipfsPoolCachingLambda)],
            });
            this.ipfsCleanPoolCachingLambda = new aws_lambda_nodejs.NodejsFunction(this, "CleanIpfsPoolCacheLambda", {
                role: lambdaRole,
                runtime: aws_lambda.Runtime.NODEJS_LATEST,
                entry: path.join(__dirname, "../../lib/cron/clean-pools-ipfs.ts"),
                handler: "handler",
                timeout: Duration.seconds(900),
                memorySize: 512,
                bundling: {
                    minify: true,
                    sourceMap: true,
                },
                description: "Clean IPFS Pool Cache Lambda",
                layers: [
                    aws_lambda.LayerVersion.fromLayerVersionArn(this, "InsightsLayerPoolsCleanIPFS", `arn:aws:lambda:${region}:580247275435:layer:LambdaInsightsExtension:14`),
                ],
                tracing: aws_lambda.Tracing.ACTIVE,
                environment: {
                    PINATA_API_KEY: pinata_key,
                    PINATA_API_SECRET: pinata_secret,
                    STAGE: stage,
                    REDEPLOY: "1",
                },
            });
            new aws_events.Rule(this, "ScheduleCleanIpfsPoolCache", {
                schedule: aws_events.Schedule.rate(Duration.minutes(30)),
                targets: [new aws_events_targets.LambdaFunction(this.ipfsCleanPoolCachingLambda)],
            });
        }
        if (chatBotTopic) {
            if (stage == "beta" || stage == "prod") {
                const lambdaIpfsAlarmErrorRate = new aws_cloudwatch.Alarm(this, "RoutingAPI-PoolCacheToIPFSLambdaError", {
                    metric: this.ipfsPoolCachingLambda.metricErrors({
                        period: Duration.minutes(60),
                        statistic: "sum",
                    }),
                    threshold: 13,
                    evaluationPeriods: 1,
                });
                lambdaIpfsAlarmErrorRate.addAlarmAction(new aws_cloudwatch_actions.SnsAction(chatBotTopic));
            }
        }
        this.tokenListCacheBucket = new aws_s3.Bucket(this, "TokenListCacheBucket");
        const tokenListCachingLambda = new aws_lambda_nodejs.NodejsFunction(this, "TokenListCacheLambda", {
            role: lambdaRole,
            runtime: aws_lambda.Runtime.NODEJS_LATEST,
            entry: path.join(__dirname, "../../lib/cron/cache-token-lists.ts"),
            handler: "handler",
            timeout: Duration.seconds(180),
            memorySize: 256,
            bundling: {
                minify: true,
                sourceMap: true,
            },
            layers: [
                aws_lambda.LayerVersion.fromLayerVersionArn(this, "InsightsLayerTokenList", `arn:aws:lambda:${region}:580247275435:layer:LambdaInsightsExtension:14`),
            ],
            description: "Token List Cache Lambda",
            tracing: aws_lambda.Tracing.ACTIVE,
            environment: {
                TOKEN_LIST_CACHE_BUCKET: this.tokenListCacheBucket.bucketName,
            },
        });
        this.tokenListCacheBucket.grantReadWrite(tokenListCachingLambda);
        new aws_events.Rule(this, "ScheduleTokenListCache", {
            schedule: aws_events.Schedule.rate(Duration.minutes(15)),
            targets: [new aws_events_targets.LambdaFunction(tokenListCachingLambda)],
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGluZy1jYWNoaW5nLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vYmluL3N0YWNrcy9yb3V0aW5nLWNhY2hpbmctc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBQzdDLE9BQU8sS0FBSyxHQUFHLE1BQU0sYUFBYSxDQUFDO0FBQ25DLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDdkMsT0FBTyxLQUFLLGNBQWMsTUFBTSw0QkFBNEIsQ0FBQztBQUM3RCxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFDNUQsT0FBTyxLQUFLLHNCQUFzQixNQUFNLG9DQUFvQyxDQUFDO0FBQzdFLE9BQU8sS0FBSyxVQUFVLE1BQU0sd0JBQXdCLENBQUM7QUFDckQsT0FBTyxLQUFLLGtCQUFrQixNQUFNLGdDQUFnQyxDQUFDO0FBQ3JFLE9BQU8sS0FBSyxPQUFPLE1BQU0scUJBQXFCLENBQUM7QUFDL0MsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLHFCQUFxQixDQUFDO0FBQ3RELE9BQU8sS0FBSyxVQUFVLE1BQU0sd0JBQXdCLENBQUM7QUFDckQsT0FBTyxLQUFLLGlCQUFpQixNQUFNLCtCQUErQixDQUFDO0FBQ25FLE9BQU8sS0FBSyxNQUFNLE1BQU0sb0JBQW9CLENBQUM7QUFDN0MsT0FBTyxLQUFLLE9BQU8sTUFBTSxxQkFBcUIsQ0FBQztBQUUvQyxPQUFPLEtBQUssSUFBSSxNQUFNLE1BQU0sQ0FBQztBQUM3QixPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sNkJBQTZCLENBQUM7QUFDN0QsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBVzdDLE1BQU0sT0FBTyxtQkFBb0IsU0FBUSxHQUFHLENBQUMsV0FBVztJQVN0RCxZQUFZLEtBQWdCLEVBQUUsSUFBWSxFQUFFLEtBQStC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QUc7WUFDZixRQUFRLEVBQUU7Z0JBQ1IsTUFBTSxFQUFFLElBQUk7Z0JBQ1osU0FBUyxFQUFFLElBQUk7YUFDaEI7WUFDRCxNQUFNLEVBQUU7Z0JBQ04sVUFBVSxDQUFDLFlBQVksQ0FBQyxtQkFBbUIsQ0FDekMsSUFBSSxFQUNKLHdCQUF3QixFQUN4QixrQkFBa0IsTUFBTSxnREFBZ0QsQ0FDekU7YUFDRjtZQUNELFdBQVcsRUFBRSx5QkFBeUI7WUFDdEMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxPQUFPLENBQUMsTUFBTTtZQUNsQyxXQUFXLEVBQUU7Z0JBQ1gsdUJBQXVCLEVBQUUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFVBQVU7YUFDOUQ7U0FDRixDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsb0JBQW9CLENBQUMsY0FBYyxDQUFDLHNCQUFzQixDQUFDLENBQUM7UUFFakUsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSx3QkFBd0IsRUFBRTtZQUNsRCxRQUFRLEVBQUUsVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN4RCxPQUFPLEVBQUUsQ0FBQyxJQUFJLGtCQUFrQixDQUFDLGNBQWMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1NBQ3pFLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFByb3RvY29sIH0gZnJvbSBcIkB2b3RvcGlhL3Nkay1jb3JlXCI7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSBcImF3cy1jZGstbGliXCI7XG5pbXBvcnQgeyBEdXJhdGlvbiB9IGZyb20gXCJhd3MtY2RrLWxpYlwiO1xuaW1wb3J0ICogYXMgYXdzX2Nsb3Vkd2F0Y2ggZnJvbSBcImF3cy1jZGstbGliL2F3cy1jbG91ZHdhdGNoXCI7XG5pbXBvcnQgeyBNYXRoRXhwcmVzc2lvbiB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaFwiO1xuaW1wb3J0ICogYXMgYXdzX2Nsb3Vkd2F0Y2hfYWN0aW9ucyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWNsb3Vkd2F0Y2gtYWN0aW9uc1wiO1xuaW1wb3J0ICogYXMgYXdzX2V2ZW50cyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWV2ZW50c1wiO1xuaW1wb3J0ICogYXMgYXdzX2V2ZW50c190YXJnZXRzIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtZXZlbnRzLXRhcmdldHNcIjtcbmltcG9ydCAqIGFzIGF3c19pYW0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1pYW1cIjtcbmltcG9ydCB7IFBvbGljeVN0YXRlbWVudCB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtaWFtXCI7XG5pbXBvcnQgKiBhcyBhd3NfbGFtYmRhIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtbGFtYmRhXCI7XG5pbXBvcnQgKiBhcyBhd3NfbGFtYmRhX25vZGVqcyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWxhbWJkYS1ub2RlanNcIjtcbmltcG9ydCAqIGFzIGF3c19zMyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLXMzXCI7XG5pbXBvcnQgKiBhcyBhd3Nfc25zIGZyb20gXCJhd3MtY2RrLWxpYi9hd3Mtc25zXCI7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tIFwiY29uc3RydWN0c1wiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgY2hhaW5Qcm90b2NvbHMgfSBmcm9tIFwiLi4vLi4vbGliL2Nyb24vY2FjaGUtY29uZmlnXCI7XG5pbXBvcnQgeyBTVEFHRSB9IGZyb20gXCIuLi8uLi9saWIvdXRpbC9zdGFnZVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJvdXRpbmdDYWNoaW5nU3RhY2tQcm9wcyBleHRlbmRzIGNkay5OZXN0ZWRTdGFja1Byb3BzIHtcbiAgc3RhZ2U6IHN0cmluZztcbiAgcm91dGU1M0Fybj86IHN0cmluZztcbiAgcGluYXRhX2tleT86IHN0cmluZztcbiAgcGluYXRhX3NlY3JldD86IHN0cmluZztcbiAgaG9zdGVkX3pvbmU/OiBzdHJpbmc7XG4gIGNoYXRib3RTTlNBcm4/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBSb3V0aW5nQ2FjaGluZ1N0YWNrIGV4dGVuZHMgY2RrLk5lc3RlZFN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IHBvb2xDYWNoZUJ1Y2tldDogYXdzX3MzLkJ1Y2tldDtcbiAgcHVibGljIHJlYWRvbmx5IHBvb2xDYWNoZUJ1Y2tldDI6IGF3c19zMy5CdWNrZXQ7XG4gIHB1YmxpYyByZWFkb25seSBwb29sQ2FjaGVLZXk6IHN0cmluZztcbiAgcHVibGljIHJlYWRvbmx5IHRva2VuTGlzdENhY2hlQnVja2V0OiBhd3NfczMuQnVja2V0O1xuICBwdWJsaWMgcmVhZG9ubHkgaXBmc1Bvb2xDYWNoaW5nTGFtYmRhOiBhd3NfbGFtYmRhX25vZGVqcy5Ob2RlanNGdW5jdGlvbjtcbiAgcHVibGljIHJlYWRvbmx5IGlwZnNDbGVhblBvb2xDYWNoaW5nTGFtYmRhOiBhd3NfbGFtYmRhX25vZGVqcy5Ob2RlanNGdW5jdGlvbjtcbiAgcHVibGljIHJlYWRvbmx5IHBvb2xDYWNoZUxhbWJkYU5hbWVBcnJheTogc3RyaW5nW10gPSBbXTtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBuYW1lOiBzdHJpbmcsIHByb3BzOiBSb3V0aW5nQ2FjaGluZ1N0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgbmFtZSwgcHJvcHMpO1xuXG4gICAgY29uc3QgeyBjaGF0Ym90U05TQXJuIH0gPSBwcm9wcztcblxuICAgIGNvbnN0IGNoYXRCb3RUb3BpYyA9IGNoYXRib3RTTlNBcm4gPyBhd3Nfc25zLlRvcGljLmZyb21Ub3BpY0Fybih0aGlzLCBcIkNoYXRib3RUb3BpY1wiLCBjaGF0Ym90U05TQXJuKSA6IHVuZGVmaW5lZDtcblxuICAgIC8vIFRPRE86IFJlbW92ZSBhbmQgc3dhcCB0byB0aGUgbmV3IGJ1Y2tldCBiZWxvdy4gS2VwdCBhcm91bmQgZm9yIHRoZSByb2xsb3V0LCBidXQgYWxsIHJlcXVlc3RzIHdpbGwgZ28gdG8gYnVja2V0IDIuXG4gICAgdGhpcy5wb29sQ2FjaGVCdWNrZXQgPSBuZXcgYXdzX3MzLkJ1Y2tldCh0aGlzLCBcIlBvb2xDYWNoZUJ1Y2tldFwiKTtcbiAgICB0aGlzLnBvb2xDYWNoZUJ1Y2tldDIgPSBuZXcgYXdzX3MzLkJ1Y2tldCh0aGlzLCBcIlBvb2xDYWNoZUJ1Y2tldDJcIik7XG5cbiAgICB0aGlzLnBvb2xDYWNoZUJ1Y2tldDIuYWRkTGlmZWN5Y2xlUnVsZSh7XG4gICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgLy8gVGhpcyBpc24ndCB0aGUgcmlnaHQgZml4IGluIHRoZSBsb25nIHJ1biwgYnV0IGl0IHdpbGwgcHJldmVudCB0aGUgb3V0YWdlIHRoYXQgd2UgZXhwZXJpZW5jZWQgd2hlbiB0aGUgVjIgcG9vbFxuICAgICAgLy8gZGF0YSBleHBpcmVkIChTZWUgaHR0cHM6Ly93d3cubm90aW9uLnNvL3VuaXN3YXBsYWJzL1JvdXRpbmctQVBJLU1haW5uZXQtb3V0YWdlLVYyLVN1YmdyYXBoLTExNTI3YWFiM2JkNTQwODg4ZjkyYjMzMDE3YmYyNmI0IGZvciBtb3JlIGRldGFpbCkuXG4gICAgICAvLyBUaGUgYmV0dGVyIHNob3J0LXRlcm0gc29sdXRpb24gaXMgdG8gYmFrZSByZXNpbGllbmNlIGludG8gdGhlIFYyU3ViZ3JhcGhQcm92aWRlciAoaHR0cHM6Ly9saW5lYXIuYXBwL3VuaXN3YXAvaXNzdWUvUk9VVEUtMzEvdXNlLXYyLXYzLWZhbGxiYWNrLXByb3ZpZGVyLWluLXJvdXRpbmctYXBpKSxcbiAgICAgIC8vIGluc3RydW1lbnQgdGhlIHBvb2wgY2FjaGUgbGFtYmRhLCBhbmQgdGFrZSBtZWFzdXJlcyB0byBpbXByb3ZlIGl0cyBzdWNjZXNzIHJhdGUuXG5cbiAgICAgIC8vIE5vdGUgdGhhdCB0aGVyZSBpcyBhIHRyYWRlLW9mZiBoZXJlOiB3ZSBtYXkgc2VydmUgc3RhbGUgVjIgcG9vbHMgd2hpY2ggY2FuIHJlc3VsdCBpbiBhIHN1Ym9wdGltYWwgcm91dGluZyBwYXRoIGlmIHRoZSBmaWxlIGhhc24ndCBiZWVuIHJlY2VudGx5IHVwZGF0ZWQuXG4gICAgICAvLyBUaGlzIHN0YWxlIGRhdGEgaXMgcHJlZmVycmVkIHRvIG5vLWRhdGEgdW50aWwgd2UgY2FuIGltcGxlbWVudCB0aGUgYWJvdmUgbWVhc3VyZXMuXG5cbiAgICAgIC8vIEZvciBub3csIGNob29zZSBhbiBhcmJpdHJhcmlseSBsYXJnZSBUVEwgKGluIHRoaXMgY2FzZSwgMTAgeWVhcnMpIHRvIHByZXZlbnQgdGhlIGtleSBmcm9tIGJlaW5nIGRlbGV0ZWQuXG4gICAgICBleHBpcmF0aW9uOiBjZGsuRHVyYXRpb24uZGF5cygzNjUgKiAxMCksXG4gICAgfSk7XG5cbiAgICB0aGlzLnBvb2xDYWNoZUtleSA9IFwicG9vbENhY2hlLmpzb25cIjtcblxuICAgIGNvbnN0IHsgc3RhZ2UsIHJvdXRlNTNBcm4sIHBpbmF0YV9rZXksIHBpbmF0YV9zZWNyZXQsIGhvc3RlZF96b25lIH0gPSBwcm9wcztcblxuICAgIGNvbnN0IGxhbWJkYVJvbGUgPSBuZXcgYXdzX2lhbS5Sb2xlKHRoaXMsIFwiUm91dGluZ0xhbWJkYVJvbGVcIiwge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgYXdzX2lhbS5TZXJ2aWNlUHJpbmNpcGFsKFwibGFtYmRhLmFtYXpvbmF3cy5jb21cIiksXG4gICAgICBtYW5hZ2VkUG9saWNpZXM6IFtcbiAgICAgICAgYXdzX2lhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZShcInNlcnZpY2Utcm9sZS9BV1NMYW1iZGFCYXNpY0V4ZWN1dGlvblJvbGVcIiksXG4gICAgICAgIGF3c19pYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoXCJDbG91ZFdhdGNoRnVsbEFjY2Vzc1wiKSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICBpZiAoc3RhZ2UgPT0gU1RBR0UuQkVUQSB8fCBzdGFnZSA9PSBTVEFHRS5QUk9EKSB7XG4gICAgICBsYW1iZGFSb2xlLmFkZFRvUG9saWN5KFxuICAgICAgICBuZXcgUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgICByZXNvdXJjZXM6IFtyb3V0ZTUzQXJuIV0sXG4gICAgICAgICAgYWN0aW9uczogW1wic3RzOkFzc3VtZVJvbGVcIl0sXG4gICAgICAgICAgc2lkOiBcIjFcIixcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVnaW9uID0gY2RrLlN0YWNrLm9mKHRoaXMpLnJlZ2lvbjtcblxuICAgIGNvbnN0IGxhbWJkYUxheWVyVmVyc2lvbiA9IGF3c19sYW1iZGEuTGF5ZXJWZXJzaW9uLmZyb21MYXllclZlcnNpb25Bcm4oXG4gICAgICB0aGlzLFxuICAgICAgXCJJbnNpZ2h0c0xheWVyUG9vbHNcIixcbiAgICAgIGBhcm46YXdzOmxhbWJkYToke3JlZ2lvbn06NTgwMjQ3Mjc1NDM1OmxheWVyOkxhbWJkYUluc2lnaHRzRXh0ZW5zaW9uOjE0YFxuICAgICk7XG5cbiAgICAvLyBTcGluIHVwIGEgbmV3IHBvb2wgY2FjaGUgbGFtYmRhIGZvciBlYWNoIGNvbmZpZyBpbiBjaGFpbiBYIHByb3RvY29sXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGFpblByb3RvY29scy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgeyBwcm90b2NvbCwgdGltZW91dCB9ID0gY2hhaW5Qcm90b2NvbHNbaV07XG4gICAgICBjb25zdCBsYW1iZGEgPSBuZXcgYXdzX2xhbWJkYV9ub2RlanMuTm9kZWpzRnVuY3Rpb24odGhpcywgYFBvb2xDYWNoZUxhbWJkYS1Qcm90b2NvbCR7cHJvdG9jb2x9YCwge1xuICAgICAgICByb2xlOiBsYW1iZGFSb2xlLFxuICAgICAgICBydW50aW1lOiBhd3NfbGFtYmRhLlJ1bnRpbWUuTk9ERUpTX0xBVEVTVCxcbiAgICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsIFwiLi4vLi4vbGliL2Nyb24vY2FjaGUtcG9vbHMudHNcIiksXG4gICAgICAgIGhhbmRsZXI6IFwiaGFuZGxlclwiLFxuICAgICAgICB0aW1lb3V0OiBEdXJhdGlvbi5zZWNvbmRzKDkwMCksXG4gICAgICAgIG1lbW9yeVNpemU6IDEwMjQsXG4gICAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgZGVzY3JpcHRpb246IGBQb29sIENhY2hlIExhbWJkYSB3aXRoIFByb3RvY29sICR7cHJvdG9jb2x9YCxcbiAgICAgICAgbGF5ZXJzOiBbbGFtYmRhTGF5ZXJWZXJzaW9uXSxcbiAgICAgICAgdHJhY2luZzogYXdzX2xhbWJkYS5UcmFjaW5nLkFDVElWRSxcbiAgICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgICBQT09MX0NBQ0hFX0JVQ0tFVDogdGhpcy5wb29sQ2FjaGVCdWNrZXQuYnVja2V0TmFtZSxcbiAgICAgICAgICBQT09MX0NBQ0hFX0JVQ0tFVF8yOiB0aGlzLnBvb2xDYWNoZUJ1Y2tldDIuYnVja2V0TmFtZSxcbiAgICAgICAgICBQT09MX0NBQ0hFX0tFWTogdGhpcy5wb29sQ2FjaGVLZXksXG5cbiAgICAgICAgICBwcm90b2NvbCxcbiAgICAgICAgICB0aW1lb3V0OiB0aW1lb3V0LnRvU3RyaW5nKCksXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIG5ldyBhd3NfZXZlbnRzLlJ1bGUodGhpcywgYFNjaGVkdWxlUG9vbENhY2hlLVByb3RvY29sJHtwcm90b2NvbH1gLCB7XG4gICAgICAgIHNjaGVkdWxlOiBhd3NfZXZlbnRzLlNjaGVkdWxlLnJhdGUoRHVyYXRpb24ubWludXRlcygxNSkpLFxuICAgICAgICB0YXJnZXRzOiBbbmV3IGF3c19ldmVudHNfdGFyZ2V0cy5MYW1iZGFGdW5jdGlvbihsYW1iZGEpXSxcbiAgICAgIH0pO1xuICAgICAgdGhpcy5wb29sQ2FjaGVCdWNrZXQyLmdyYW50UmVhZFdyaXRlKGxhbWJkYSk7XG4gICAgICBjb25zdCBsYW1iZGFBbGFybUVycm9yUmF0ZSA9IG5ldyBhd3NfY2xvdWR3YXRjaC5BbGFybShcbiAgICAgICAgdGhpcyxcbiAgICAgICAgYFJvdXRpbmdBUEktU0VWNC1Qb29sQ2FjaGVUb1MzTGFtYmRhRXJyb3JSYXRlLVByb3RvY29sJHtwcm90b2NvbH1gLFxuICAgICAgICB7XG4gICAgICAgICAgbWV0cmljOiBuZXcgTWF0aEV4cHJlc3Npb24oe1xuICAgICAgICAgICAgZXhwcmVzc2lvbjogXCIoaW52b2NhdGlvbnMgLSBlcnJvcnMpIDwgMVwiLFxuICAgICAgICAgICAgdXNpbmdNZXRyaWNzOiB7XG4gICAgICAgICAgICAgIGludm9jYXRpb25zOiBsYW1iZGEubWV0cmljSW52b2NhdGlvbnMoe1xuICAgICAgICAgICAgICAgIHBlcmlvZDogRHVyYXRpb24ubWludXRlcyg2MCksXG4gICAgICAgICAgICAgICAgc3RhdGlzdGljOiBcInN1bVwiLFxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgZXJyb3JzOiBsYW1iZGEubWV0cmljRXJyb3JzKHtcbiAgICAgICAgICAgICAgICBwZXJpb2Q6IER1cmF0aW9uLm1pbnV0ZXMoNjApLFxuICAgICAgICAgICAgICAgIHN0YXRpc3RpYzogXCJzdW1cIixcbiAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIHRocmVzaG9sZDogcHJvdG9jb2wgPT09IFByb3RvY29sLlYzID8gNTAgOiA4NSxcbiAgICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogcHJvdG9jb2wgPT09IFByb3RvY29sLlYzID8gMTIgOiAxNDQsXG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICBjb25zdCBsYW1iZGFUaHJvdHRsZXNFcnJvclJhdGUgPSBuZXcgYXdzX2Nsb3Vkd2F0Y2guQWxhcm0oXG4gICAgICAgIHRoaXMsXG4gICAgICAgIGBSb3V0aW5nQVBJLVBvb2xDYWNoZVRvUzNMYW1iZGFUaHJvdHRsZXMtUHJvdG9jb2wke3Byb3RvY29sfWAsXG4gICAgICAgIHtcbiAgICAgICAgICBtZXRyaWM6IGxhbWJkYS5tZXRyaWNUaHJvdHRsZXMoe1xuICAgICAgICAgICAgcGVyaW9kOiBEdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgICAgc3RhdGlzdGljOiBcInN1bVwiLFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIHRocmVzaG9sZDogNSxcbiAgICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMSxcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIGlmIChjaGF0Qm90VG9waWMpIHtcbiAgICAgICAgbGFtYmRhQWxhcm1FcnJvclJhdGUuYWRkQWxhcm1BY3Rpb24obmV3IGF3c19jbG91ZHdhdGNoX2FjdGlvbnMuU25zQWN0aW9uKGNoYXRCb3RUb3BpYykpO1xuICAgICAgICBsYW1iZGFUaHJvdHRsZXNFcnJvclJhdGUuYWRkQWxhcm1BY3Rpb24obmV3IGF3c19jbG91ZHdhdGNoX2FjdGlvbnMuU25zQWN0aW9uKGNoYXRCb3RUb3BpYykpO1xuICAgICAgfVxuICAgICAgdGhpcy5wb29sQ2FjaGVMYW1iZGFOYW1lQXJyYXkucHVzaChsYW1iZGEuZnVuY3Rpb25OYW1lKTtcbiAgICB9XG5cbiAgICBpZiAoc3RhZ2UgPT0gU1RBR0UuQkVUQSB8fCBzdGFnZSA9PSBTVEFHRS5QUk9EKSB7XG4gICAgICB0aGlzLmlwZnNQb29sQ2FjaGluZ0xhbWJkYSA9IG5ldyBhd3NfbGFtYmRhX25vZGVqcy5Ob2RlanNGdW5jdGlvbih0aGlzLCBcIklwZnNQb29sQ2FjaGVMYW1iZGFcIiwge1xuICAgICAgICByb2xlOiBsYW1iZGFSb2xlLFxuICAgICAgICBydW50aW1lOiBhd3NfbGFtYmRhLlJ1bnRpbWUuTk9ERUpTX0xBVEVTVCxcbiAgICAgICAgZW50cnk6IHBhdGguam9pbihfX2Rpcm5hbWUsIFwiLi4vLi4vbGliL2Nyb24vY2FjaGUtcG9vbHMtaXBmcy50c1wiKSxcbiAgICAgICAgaGFuZGxlcjogXCJoYW5kbGVyXCIsXG4gICAgICAgIHRpbWVvdXQ6IER1cmF0aW9uLnNlY29uZHMoOTAwKSxcbiAgICAgICAgbWVtb3J5U2l6ZTogMTAyNCxcbiAgICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgICAgc291cmNlTWFwOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBkZXNjcmlwdGlvbjogXCJJUEZTIFBvb2wgQ2FjaGUgTGFtYmRhXCIsXG4gICAgICAgIGxheWVyczogW1xuICAgICAgICAgIGF3c19sYW1iZGEuTGF5ZXJWZXJzaW9uLmZyb21MYXllclZlcnNpb25Bcm4oXG4gICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgXCJJbnNpZ2h0c0xheWVyUG9vbHNJUEZTXCIsXG4gICAgICAgICAgICBgYXJuOmF3czpsYW1iZGE6JHtyZWdpb259OjU4MDI0NzI3NTQzNTpsYXllcjpMYW1iZGFJbnNpZ2h0c0V4dGVuc2lvbjoxNGBcbiAgICAgICAgICApLFxuICAgICAgICBdLFxuICAgICAgICB0cmFjaW5nOiBhd3NfbGFtYmRhLlRyYWNpbmcuQUNUSVZFLFxuICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgIFBJTkFUQV9BUElfS0VZOiBwaW5hdGFfa2V5ISxcbiAgICAgICAgICBQSU5BVEFfQVBJX1NFQ1JFVDogcGluYXRhX3NlY3JldCEsXG4gICAgICAgICAgUk9MRV9BUk46IHJvdXRlNTNBcm4hLFxuICAgICAgICAgIEhPU1RFRF9aT05FOiBob3N0ZWRfem9uZSEsXG4gICAgICAgICAgU1RBR0U6IHN0YWdlLFxuICAgICAgICAgIFJFREVQTE9ZOiBcIjFcIixcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICBuZXcgYXdzX2V2ZW50cy5SdWxlKHRoaXMsIFwiU2NoZWR1bGVJcGZzUG9vbENhY2hlXCIsIHtcbiAgICAgICAgc2NoZWR1bGU6IGF3c19ldmVudHMuU2NoZWR1bGUucmF0ZShEdXJhdGlvbi5taW51dGVzKDE1KSksXG4gICAgICAgIHRhcmdldHM6IFtuZXcgYXdzX2V2ZW50c190YXJnZXRzLkxhbWJkYUZ1bmN0aW9uKHRoaXMuaXBmc1Bvb2xDYWNoaW5nTGFtYmRhKV0sXG4gICAgICB9KTtcblxuICAgICAgdGhpcy5pcGZzQ2xlYW5Qb29sQ2FjaGluZ0xhbWJkYSA9IG5ldyBhd3NfbGFtYmRhX25vZGVqcy5Ob2RlanNGdW5jdGlvbih0aGlzLCBcIkNsZWFuSXBmc1Bvb2xDYWNoZUxhbWJkYVwiLCB7XG4gICAgICAgIHJvbGU6IGxhbWJkYVJvbGUsXG4gICAgICAgIHJ1bnRpbWU6IGF3c19sYW1iZGEuUnVudGltZS5OT0RFSlNfTEFURVNULFxuICAgICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgXCIuLi8uLi9saWIvY3Jvbi9jbGVhbi1wb29scy1pcGZzLnRzXCIpLFxuICAgICAgICBoYW5kbGVyOiBcImhhbmRsZXJcIixcbiAgICAgICAgdGltZW91dDogRHVyYXRpb24uc2Vjb25kcyg5MDApLFxuICAgICAgICBtZW1vcnlTaXplOiA1MTIsXG4gICAgICAgIGJ1bmRsaW5nOiB7XG4gICAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgZGVzY3JpcHRpb246IFwiQ2xlYW4gSVBGUyBQb29sIENhY2hlIExhbWJkYVwiLFxuICAgICAgICBsYXllcnM6IFtcbiAgICAgICAgICBhd3NfbGFtYmRhLkxheWVyVmVyc2lvbi5mcm9tTGF5ZXJWZXJzaW9uQXJuKFxuICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgIFwiSW5zaWdodHNMYXllclBvb2xzQ2xlYW5JUEZTXCIsXG4gICAgICAgICAgICBgYXJuOmF3czpsYW1iZGE6JHtyZWdpb259OjU4MDI0NzI3NTQzNTpsYXllcjpMYW1iZGFJbnNpZ2h0c0V4dGVuc2lvbjoxNGBcbiAgICAgICAgICApLFxuICAgICAgICBdLFxuICAgICAgICB0cmFjaW5nOiBhd3NfbGFtYmRhLlRyYWNpbmcuQUNUSVZFLFxuICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgIFBJTkFUQV9BUElfS0VZOiBwaW5hdGFfa2V5ISxcbiAgICAgICAgICBQSU5BVEFfQVBJX1NFQ1JFVDogcGluYXRhX3NlY3JldCEsXG4gICAgICAgICAgU1RBR0U6IHN0YWdlLFxuICAgICAgICAgIFJFREVQTE9ZOiBcIjFcIixcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICBuZXcgYXdzX2V2ZW50cy5SdWxlKHRoaXMsIFwiU2NoZWR1bGVDbGVhbklwZnNQb29sQ2FjaGVcIiwge1xuICAgICAgICBzY2hlZHVsZTogYXdzX2V2ZW50cy5TY2hlZHVsZS5yYXRlKER1cmF0aW9uLm1pbnV0ZXMoMzApKSxcbiAgICAgICAgdGFyZ2V0czogW25ldyBhd3NfZXZlbnRzX3RhcmdldHMuTGFtYmRhRnVuY3Rpb24odGhpcy5pcGZzQ2xlYW5Qb29sQ2FjaGluZ0xhbWJkYSldLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGNoYXRCb3RUb3BpYykge1xuICAgICAgaWYgKHN0YWdlID09IFwiYmV0YVwiIHx8IHN0YWdlID09IFwicHJvZFwiKSB7XG4gICAgICAgIGNvbnN0IGxhbWJkYUlwZnNBbGFybUVycm9yUmF0ZSA9IG5ldyBhd3NfY2xvdWR3YXRjaC5BbGFybSh0aGlzLCBcIlJvdXRpbmdBUEktUG9vbENhY2hlVG9JUEZTTGFtYmRhRXJyb3JcIiwge1xuICAgICAgICAgIG1ldHJpYzogdGhpcy5pcGZzUG9vbENhY2hpbmdMYW1iZGEubWV0cmljRXJyb3JzKHtcbiAgICAgICAgICAgIHBlcmlvZDogRHVyYXRpb24ubWludXRlcyg2MCksXG4gICAgICAgICAgICBzdGF0aXN0aWM6IFwic3VtXCIsXG4gICAgICAgICAgfSksXG4gICAgICAgICAgdGhyZXNob2xkOiAxMyxcbiAgICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbGFtYmRhSXBmc0FsYXJtRXJyb3JSYXRlLmFkZEFsYXJtQWN0aW9uKG5ldyBhd3NfY2xvdWR3YXRjaF9hY3Rpb25zLlNuc0FjdGlvbihjaGF0Qm90VG9waWMpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnRva2VuTGlzdENhY2hlQnVja2V0ID0gbmV3IGF3c19zMy5CdWNrZXQodGhpcywgXCJUb2tlbkxpc3RDYWNoZUJ1Y2tldFwiKTtcblxuICAgIGNvbnN0IHRva2VuTGlzdENhY2hpbmdMYW1iZGEgPSBuZXcgYXdzX2xhbWJkYV9ub2RlanMuTm9kZWpzRnVuY3Rpb24odGhpcywgXCJUb2tlbkxpc3RDYWNoZUxhbWJkYVwiLCB7XG4gICAgICByb2xlOiBsYW1iZGFSb2xlLFxuICAgICAgcnVudGltZTogYXdzX2xhbWJkYS5SdW50aW1lLk5PREVKU19MQVRFU1QsXG4gICAgICBlbnRyeTogcGF0aC5qb2luKF9fZGlybmFtZSwgXCIuLi8uLi9saWIvY3Jvbi9jYWNoZS10b2tlbi1saXN0cy50c1wiKSxcbiAgICAgIGhhbmRsZXI6IFwiaGFuZGxlclwiLFxuICAgICAgdGltZW91dDogRHVyYXRpb24uc2Vjb25kcygxODApLFxuICAgICAgbWVtb3J5U2l6ZTogMjU2LFxuICAgICAgYnVuZGxpbmc6IHtcbiAgICAgICAgbWluaWZ5OiB0cnVlLFxuICAgICAgICBzb3VyY2VNYXA6IHRydWUsXG4gICAgICB9LFxuICAgICAgbGF5ZXJzOiBbXG4gICAgICAgIGF3c19sYW1iZGEuTGF5ZXJWZXJzaW9uLmZyb21MYXllclZlcnNpb25Bcm4oXG4gICAgICAgICAgdGhpcyxcbiAgICAgICAgICBcIkluc2lnaHRzTGF5ZXJUb2tlbkxpc3RcIixcbiAgICAgICAgICBgYXJuOmF3czpsYW1iZGE6JHtyZWdpb259OjU4MDI0NzI3NTQzNTpsYXllcjpMYW1iZGFJbnNpZ2h0c0V4dGVuc2lvbjoxNGBcbiAgICAgICAgKSxcbiAgICAgIF0sXG4gICAgICBkZXNjcmlwdGlvbjogXCJUb2tlbiBMaXN0IENhY2hlIExhbWJkYVwiLFxuICAgICAgdHJhY2luZzogYXdzX2xhbWJkYS5UcmFjaW5nLkFDVElWRSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRPS0VOX0xJU1RfQ0FDSEVfQlVDS0VUOiB0aGlzLnRva2VuTGlzdENhY2hlQnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgdGhpcy50b2tlbkxpc3RDYWNoZUJ1Y2tldC5ncmFudFJlYWRXcml0ZSh0b2tlbkxpc3RDYWNoaW5nTGFtYmRhKTtcblxuICAgIG5ldyBhd3NfZXZlbnRzLlJ1bGUodGhpcywgXCJTY2hlZHVsZVRva2VuTGlzdENhY2hlXCIsIHtcbiAgICAgIHNjaGVkdWxlOiBhd3NfZXZlbnRzLlNjaGVkdWxlLnJhdGUoRHVyYXRpb24ubWludXRlcygxNSkpLFxuICAgICAgdGFyZ2V0czogW25ldyBhd3NfZXZlbnRzX3RhcmdldHMuTGFtYmRhRnVuY3Rpb24odG9rZW5MaXN0Q2FjaGluZ0xhbWJkYSldLFxuICAgIH0pO1xuICB9XG59XG4iXX0=