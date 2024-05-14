import * as cdk from "aws-cdk-lib";
import { CfnOutput, Duration } from "aws-cdk-lib";
import * as aws_apigateway from "aws-cdk-lib/aws-apigateway";
import { MethodLoggingLevel } from "aws-cdk-lib/aws-apigateway";
import * as aws_cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import { ComparisonOperator, MathExpression } from "aws-cdk-lib/aws-cloudwatch";
import * as aws_cloudwatch_actions from "aws-cdk-lib/aws-cloudwatch-actions";
import * as aws_logs from "aws-cdk-lib/aws-logs";
import * as aws_sns from "aws-cdk-lib/aws-sns";
import * as aws_waf from "aws-cdk-lib/aws-wafv2";
import { STAGE } from "../../lib/util/stage";
import { RoutingCachingStack } from "./routing-caching-stack";
import { RoutingLambdaStack } from "./routing-lambda-stack";
import { RoutingDatabaseStack } from "./routing-database-stack";
export const CHAINS_NOT_MONITORED = [];
export class RoutingAPIStack extends cdk.Stack {
    constructor(parent, name, props) {
        super(parent, name, props);
        const { jsonRpcProviders, provisionedConcurrency, throttlingOverride, ethGasStationInfoUrl, chatbotSNSArn, stage, internalApiKey, route53Arn, pinata_key, pinata_secret, hosted_zone, tenderlyUser, tenderlyProject, tenderlyAccessKey, unicornSecret, } = props;
        const { poolCacheBucket, poolCacheBucket2, poolCacheKey, tokenListCacheBucket } = new RoutingCachingStack(this, "RoutingCachingStack", {
            chatbotSNSArn,
            stage,
            route53Arn,
            pinata_key,
            pinata_secret,
            hosted_zone,
        });
        const { routesDynamoDb, routesDbCachingRequestFlagDynamoDb, cachedRoutesDynamoDb, cachingRequestFlagDynamoDb, cachedV3PoolsDynamoDb, tokenPropertiesCachingDynamoDb, } = new RoutingDatabaseStack(this, "RoutingDatabaseStack", {});
        const { routingLambdaAlias } = new RoutingLambdaStack(this, "RoutingLambdaStack", {
            poolCacheBucket,
            poolCacheBucket2,
            poolCacheKey,
            jsonRpcProviders,
            tokenListCacheBucket,
            provisionedConcurrency,
            ethGasStationInfoUrl,
            chatbotSNSArn,
            tenderlyUser,
            tenderlyProject,
            tenderlyAccessKey,
            routesDynamoDb,
            routesDbCachingRequestFlagDynamoDb,
            cachedRoutesDynamoDb,
            cachingRequestFlagDynamoDb,
            cachedV3PoolsDynamoDb,
            tokenPropertiesCachingDynamoDb,
            unicornSecret,
        });
        const accessLogGroup = new aws_logs.LogGroup(this, "RoutingAPIGAccessLogs");
        const api = new aws_apigateway.RestApi(this, "routing-api", {
            restApiName: "Routing API",
            deployOptions: {
                tracingEnabled: true,
                loggingLevel: MethodLoggingLevel.ERROR,
                accessLogDestination: new aws_apigateway.LogGroupLogDestination(accessLogGroup),
                accessLogFormat: aws_apigateway.AccessLogFormat.jsonWithStandardFields({
                    ip: false,
                    caller: false,
                    user: false,
                    requestTime: true,
                    httpMethod: true,
                    resourcePath: true,
                    status: true,
                    protocol: true,
                    responseLength: true,
                }),
            },
            defaultCorsPreflightOptions: {
                allowOrigins: aws_apigateway.Cors.ALL_ORIGINS,
                allowMethods: aws_apigateway.Cors.ALL_METHODS,
            },
        });
        const ipThrottlingACL = new aws_waf.CfnWebACL(this, "RoutingAPIIPThrottlingACL", {
            defaultAction: { allow: {} },
            scope: "REGIONAL",
            visibilityConfig: {
                sampledRequestsEnabled: true,
                cloudWatchMetricsEnabled: true,
                metricName: "RoutingAPIIPBasedThrottling",
            },
            customResponseBodies: {
                RoutingAPIThrottledResponseBody: {
                    contentType: "APPLICATION_JSON",
                    content: '{"errorCode": "TOO_MANY_REQUESTS"}',
                },
            },
            name: "RoutingAPIIPThrottling",
            rules: [
                {
                    name: "ip",
                    priority: 0,
                    statement: {
                        rateBasedStatement: {
                            // Limit is per 5 mins, i.e. 120 requests every 5 mins
                            limit: throttlingOverride ? parseInt(throttlingOverride) : 120,
                            // API is of type EDGE so is fronted by Cloudfront as a proxy.
                            // Use the ip set in X-Forwarded-For by Cloudfront, not the regular IP
                            // which would just resolve to Cloudfronts IP.
                            aggregateKeyType: "FORWARDED_IP",
                            forwardedIpConfig: {
                                headerName: "X-Forwarded-For",
                                fallbackBehavior: "MATCH",
                            },
                            scopeDownStatement: {
                                notStatement: {
                                    statement: {
                                        byteMatchStatement: {
                                            fieldToMatch: {
                                                singleHeader: {
                                                    name: "x-api-key",
                                                },
                                            },
                                            positionalConstraint: "EXACTLY",
                                            searchString: internalApiKey,
                                            textTransformations: [
                                                {
                                                    type: "NONE",
                                                    priority: 0,
                                                },
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                    },
                    action: {
                        block: {
                            customResponse: {
                                responseCode: 429,
                                customResponseBodyKey: "RoutingAPIThrottledResponseBody",
                            },
                        },
                    },
                    visibilityConfig: {
                        sampledRequestsEnabled: true,
                        cloudWatchMetricsEnabled: true,
                        metricName: "RoutingAPIIPBasedThrottlingRule",
                    },
                },
            ],
        });
        const region = cdk.Stack.of(this).region;
        const apiArn = `arn:aws:apigateway:${region}::/restapis/${api.restApiId}/stages/${api.deploymentStage.stageName}`;
        new aws_waf.CfnWebACLAssociation(this, "RoutingAPIIPThrottlingAssociation", {
            resourceArn: apiArn,
            webAclArn: ipThrottlingACL.getAtt("Arn").toString(),
        });
        const lambdaIntegration = new aws_apigateway.LambdaIntegration(routingLambdaAlias);
        const quote = api.root.addResource("quote", {
            defaultCorsPreflightOptions: {
                allowOrigins: aws_apigateway.Cors.ALL_ORIGINS,
                allowMethods: aws_apigateway.Cors.ALL_METHODS,
            },
        });
        quote.addMethod("GET", lambdaIntegration);
        // All alarms default to GreaterThanOrEqualToThreshold for when to be triggered.
        const apiAlarm5xxSev2 = new aws_cloudwatch.Alarm(this, "RoutingAPI-SEV2-5XXAlarm", {
            alarmName: "RoutingAPI-SEV2-5XX",
            metric: api.metricServerError({
                period: Duration.minutes(5),
                // For this metric 'avg' represents error rate.
                statistic: "avg",
            }),
            threshold: 0.05,
            // Beta has much less traffic so is more susceptible to transient errors.
            evaluationPeriods: stage == STAGE.BETA ? 5 : 3,
        });
        const apiAlarm4xxSev2 = new aws_cloudwatch.Alarm(this, "RoutingAPI-SEV2-4XXAlarm", {
            alarmName: "RoutingAPI-SEV2-4XX",
            metric: api.metricClientError({
                period: Duration.minutes(5),
                statistic: "avg",
            }),
            threshold: 0.95,
            evaluationPeriods: 3,
        });
        const apiAlarmLatencySev2 = new aws_cloudwatch.Alarm(this, "RoutingAPI-SEV2-Latency", {
            alarmName: "RoutingAPI-SEV2-Latency",
            metric: api.metricLatency({
                period: Duration.minutes(5),
                statistic: "p90",
            }),
            threshold: 8500,
            evaluationPeriods: 3,
        });
        const apiAlarm5xxSev3 = new aws_cloudwatch.Alarm(this, "RoutingAPI-SEV3-5XXAlarm", {
            alarmName: "RoutingAPI-SEV3-5XX",
            metric: api.metricServerError({
                period: Duration.minutes(5),
                // For this metric 'avg' represents error rate.
                statistic: "avg",
            }),
            threshold: 0.03,
            // Beta has much less traffic so is more susceptible to transient errors.
            evaluationPeriods: stage == STAGE.BETA ? 5 : 3,
        });
        const apiAlarm4xxSev3 = new aws_cloudwatch.Alarm(this, "RoutingAPI-SEV3-4XXAlarm", {
            alarmName: "RoutingAPI-SEV3-4XX",
            metric: api.metricClientError({
                period: Duration.minutes(5),
                statistic: "avg",
            }),
            threshold: 0.8,
            evaluationPeriods: 3,
        });
        const apiAlarmLatencySev3 = new aws_cloudwatch.Alarm(this, "RoutingAPI-SEV3-Latency", {
            alarmName: "RoutingAPI-SEV3-Latency",
            metric: api.metricLatency({
                period: Duration.minutes(5),
                statistic: "p90",
            }),
            threshold: 5500,
            evaluationPeriods: 3,
        });
        // Simulations can fail for valid reasons. For example, if the simulation reverts due
        // to slippage checks (can happen with FOT tokens sometimes since our quoter does not
        // account for the fees taken during transfer when we show the user the quote).
        //
        // For this reason we only alert on SEV3 to avoid unnecessary pages.
        const simulationAlarmSev3 = new aws_cloudwatch.Alarm(this, "RoutingAPI-SEV3-Simulation", {
            alarmName: "RoutingAPI-SEV3-Simulation",
            metric: new MathExpression({
                expression: "100*(simulationFailed/simulationRequested)",
                period: Duration.minutes(30),
                usingMetrics: {
                    simulationRequested: new aws_cloudwatch.Metric({
                        namespace: "Uniswap",
                        metricName: `Simulation Requested`,
                        dimensionsMap: { Service: "RoutingAPI" },
                        unit: aws_cloudwatch.Unit.COUNT,
                        statistic: "sum",
                    }),
                    simulationFailed: new aws_cloudwatch.Metric({
                        namespace: "Uniswap",
                        metricName: `SimulationFailed`,
                        dimensionsMap: { Service: "RoutingAPI" },
                        unit: aws_cloudwatch.Unit.COUNT,
                        statistic: "sum",
                    }),
                },
            }),
            threshold: 75,
            evaluationPeriods: 3,
            treatMissingData: aws_cloudwatch.TreatMissingData.NOT_BREACHING, // Missing data points are treated as "good" and within the threshold
        });
        // Alarms for high 400 error rate for each chain
        const percent4XXByChainAlarm = [];
        [1].forEach(() => {
            const alarmName = `RoutingAPI-SEV3-4XXAlarm-GetQuote`;
            const metric = new MathExpression({
                expression: "100*(response400/invocations)",
                usingMetrics: {
                    invocations: api.metric(`GET_QUOTE_REQUESTED`, {
                        period: Duration.minutes(5),
                        statistic: "sum",
                    }),
                    response400: api.metric(`GET_QUOTE_400`, {
                        period: Duration.minutes(5),
                        statistic: "sum",
                    }),
                },
            });
            const alarm = new aws_cloudwatch.Alarm(this, alarmName, {
                alarmName,
                metric,
                threshold: 80,
                evaluationPeriods: 2,
            });
            percent4XXByChainAlarm.push(alarm);
        });
        // Alarms for high 500 error rate for each chain
        const successRateByChainAlarm = [];
        [1].forEach(() => {
            const alarmName = `RoutingAPI-SEV2-SuccessRate-Alarm`;
            const metric = new MathExpression({
                expression: "100*(response200/(invocations-response400))",
                usingMetrics: {
                    invocations: api.metric(`GET_QUOTE_REQUESTED`, {
                        period: Duration.minutes(5),
                        statistic: "sum",
                    }),
                    response400: api.metric(`GET_QUOTE_400`, {
                        period: Duration.minutes(5),
                        statistic: "sum",
                    }),
                    response200: api.metric(`GET_QUOTE_200`, {
                        period: Duration.minutes(5),
                        statistic: "sum",
                    }),
                },
            });
            const alarm = new aws_cloudwatch.Alarm(this, alarmName, {
                alarmName,
                metric,
                comparisonOperator: ComparisonOperator.LESS_THAN_OR_EQUAL_TO_THRESHOLD,
                threshold: 95,
                evaluationPeriods: 2,
            });
            successRateByChainAlarm.push(alarm);
        });
        if (chatbotSNSArn) {
            const chatBotTopic = aws_sns.Topic.fromTopicArn(this, "ChatbotTopic", chatbotSNSArn);
            apiAlarm5xxSev2.addAlarmAction(new aws_cloudwatch_actions.SnsAction(chatBotTopic));
            apiAlarm4xxSev2.addAlarmAction(new aws_cloudwatch_actions.SnsAction(chatBotTopic));
            apiAlarmLatencySev2.addAlarmAction(new aws_cloudwatch_actions.SnsAction(chatBotTopic));
            apiAlarm5xxSev3.addAlarmAction(new aws_cloudwatch_actions.SnsAction(chatBotTopic));
            apiAlarm4xxSev3.addAlarmAction(new aws_cloudwatch_actions.SnsAction(chatBotTopic));
            apiAlarmLatencySev3.addAlarmAction(new aws_cloudwatch_actions.SnsAction(chatBotTopic));
            simulationAlarmSev3.addAlarmAction(new aws_cloudwatch_actions.SnsAction(chatBotTopic));
            percent4XXByChainAlarm.forEach((alarm) => {
                alarm.addAlarmAction(new aws_cloudwatch_actions.SnsAction(chatBotTopic));
            });
            successRateByChainAlarm.forEach((alarm) => {
                alarm.addAlarmAction(new aws_cloudwatch_actions.SnsAction(chatBotTopic));
            });
        }
        this.url = new CfnOutput(this, "Url", {
            value: api.url,
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGluZy1hcGktc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9iaW4vc3RhY2tzL3JvdXRpbmctYXBpLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBSyxHQUFHLE1BQU0sYUFBYSxDQUFDO0FBRW5DLE9BQU8sRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBQ2xELE9BQU8sS0FBSyxjQUFjLE1BQU0sNEJBQTRCLENBQUM7QUFDN0QsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFDaEUsT0FBTyxLQUFLLGNBQWMsTUFBTSw0QkFBNEIsQ0FBQztBQUM3RCxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsY0FBYyxFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFDaEYsT0FBTyxLQUFLLHNCQUFzQixNQUFNLG9DQUFvQyxDQUFDO0FBQzdFLE9BQU8sS0FBSyxRQUFRLE1BQU0sc0JBQXNCLENBQUM7QUFDakQsT0FBTyxLQUFLLE9BQU8sTUFBTSxxQkFBcUIsQ0FBQztBQUMvQyxPQUFPLEtBQUssT0FBTyxNQUFNLHVCQUF1QixDQUFDO0FBRWpELE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUM3QyxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUU5RCxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSx3QkFBd0IsQ0FBQztBQUM1RCxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQztBQUVoRSxNQUFNLENBQUMsTUFBTSxvQkFBb0IsR0FBRyxFQUFFLENBQUM7QUFFdkMsTUFBTSxPQUFPLGVBQWdCLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFHNUMsWUFDRSxNQUFpQixFQUNqQixJQUFZLEVBQ1osS0FnQkM7UUFFRCxLQUFLLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMs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QUV2RixzQkFBc0IsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtnQkFDdkMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLHNCQUFzQixDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQzNFLENBQUMsQ0FBQyxDQUFDO1lBQ0gsdUJBQXVCLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7Z0JBQ3hDLEtBQUssQ0FBQyxjQUFjLENBQUMsSUFBSSxzQkFBc0IsQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUMzRSxDQUFDLENBQUMsQ0FBQztTQUNKO1FBRUQsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLFNBQVMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFO1lBQ3BDLEtBQUssRUFBRSxHQUFHLENBQUMsR0FBRztTQUNmLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tIFwiYXdzLWNkay1saWJcIjtcblxuaW1wb3J0IHsgQ2ZuT3V0cHV0LCBEdXJhdGlvbiB9IGZyb20gXCJhd3MtY2RrLWxpYlwiO1xuaW1wb3J0ICogYXMgYXdzX2FwaWdhdGV3YXkgZnJvbSBcImF3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5XCI7XG5pbXBvcnQgeyBNZXRob2RMb2dnaW5nTGV2ZWwgfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXlcIjtcbmltcG9ydCAqIGFzIGF3c19jbG91ZHdhdGNoIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaFwiO1xuaW1wb3J0IHsgQ29tcGFyaXNvbk9wZXJhdG9yLCBNYXRoRXhwcmVzc2lvbiB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaFwiO1xuaW1wb3J0ICogYXMgYXdzX2Nsb3Vkd2F0Y2hfYWN0aW9ucyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWNsb3Vkd2F0Y2gtYWN0aW9uc1wiO1xuaW1wb3J0ICogYXMgYXdzX2xvZ3MgZnJvbSBcImF3cy1jZGstbGliL2F3cy1sb2dzXCI7XG5pbXBvcnQgKiBhcyBhd3Nfc25zIGZyb20gXCJhd3MtY2RrLWxpYi9hd3Mtc25zXCI7XG5pbXBvcnQgKiBhcyBhd3Nfd2FmIGZyb20gXCJhd3MtY2RrLWxpYi9hd3Mtd2FmdjJcIjtcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gXCJjb25zdHJ1Y3RzXCI7XG5pbXBvcnQgeyBTVEFHRSB9IGZyb20gXCIuLi8uLi9saWIvdXRpbC9zdGFnZVwiO1xuaW1wb3J0IHsgUm91dGluZ0NhY2hpbmdTdGFjayB9IGZyb20gXCIuL3JvdXRpbmctY2FjaGluZy1zdGFja1wiO1xuXG5pbXBvcnQgeyBSb3V0aW5nTGFtYmRhU3RhY2sgfSBmcm9tIFwiLi9yb3V0aW5nLWxhbWJkYS1zdGFja1wiO1xuaW1wb3J0IHsgUm91dGluZ0RhdGFiYXNlU3RhY2sgfSBmcm9tIFwiLi9yb3V0aW5nLWRhdGFiYXNlLXN0YWNrXCI7XG5cbmV4cG9ydCBjb25zdCBDSEFJTlNfTk9UX01PTklUT1JFRCA9IFtdO1xuXG5leHBvcnQgY2xhc3MgUm91dGluZ0FQSVN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IHVybDogQ2ZuT3V0cHV0O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHBhcmVudDogQ29uc3RydWN0LFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBwcm9wczogY2RrLlN0YWNrUHJvcHMgJiB7XG4gICAgICBqc29uUnBjUHJvdmlkZXJzOiB7IFtjaGFpbk5hbWU6IHN0cmluZ106IHN0cmluZyB9O1xuICAgICAgcHJvdmlzaW9uZWRDb25jdXJyZW5jeTogbnVtYmVyO1xuICAgICAgdGhyb3R0bGluZ092ZXJyaWRlPzogc3RyaW5nO1xuICAgICAgZXRoR2FzU3RhdGlvbkluZm9Vcmw6IHN0cmluZztcbiAgICAgIGNoYXRib3RTTlNBcm4/OiBzdHJpbmc7XG4gICAgICBzdGFnZTogc3RyaW5nO1xuICAgICAgaW50ZXJuYWxBcGlLZXk/OiBzdHJpbmc7XG4gICAgICByb3V0ZTUzQXJuPzogc3RyaW5nO1xuICAgICAgcGluYXRhX2tleT86IHN0cmluZztcbiAgICAgIHBpbmF0YV9zZWNyZXQ/OiBzdHJpbmc7XG4gICAgICBob3N0ZWRfem9uZT86IHN0cmluZztcbiAgICAgIHRlbmRlcmx5VXNlcjogc3RyaW5nO1xuICAgICAgdGVuZGVybHlQcm9qZWN0OiBzdHJpbmc7XG4gICAgICB0ZW5kZXJseUFjY2Vzc0tleTogc3RyaW5nO1xuICAgICAgdW5pY29yblNlY3JldDogc3RyaW5nO1xuICAgIH1cbiAgKSB7XG4gICAgc3VwZXIocGFyZW50LCBuYW1lLCBwcm9wcyk7XG5cbiAgICBjb25zdCB7XG4gICAgICBqc29uUnBjUHJvdmlkZXJzLFxuICAgICAgcHJvdmlzaW9uZWRDb25jdXJyZW5jeSxcbiAgICAgIHRocm90dGxpbmdPdmVycmlkZSxcbiAgICAgIGV0aEdhc1N0YXRpb25JbmZvVXJsLFxuICAgICAgY2hhdGJvdFNOU0FybixcbiAgICAgIHN0YWdlLFxuICAgICAgaW50ZXJuYWxBcGlLZXksXG4gICAgICByb3V0ZTUzQXJuLFxuICAgICAgcGluYXRhX2tleSxcbiAgICAgIHBpbmF0YV9zZWNyZXQsXG4gICAgICBob3N0ZWRfem9uZSxcbiAgICAgIHRlbmRlcmx5VXNlcixcbiAgICAgIHRlbmRlcmx5UHJvamVjdCxcbiAgICAgIHRlbmRlcmx5QWNjZXNzS2V5LFxuICAgICAgdW5pY29yblNlY3JldCxcbiAgICB9ID0gcHJvcHM7XG5cbiAgICBjb25zdCB7IHBvb2xDYWNoZUJ1Y2tldCwgcG9vbENhY2hlQnVja2V0MiwgcG9vbENhY2hlS2V5LCB0b2tlbkxpc3RDYWNoZUJ1Y2tldCB9ID0gbmV3IFJvdXRpbmdDYWNoaW5nU3RhY2soXG4gICAgICB0aGlzLFxuICAgICAgXCJSb3V0aW5nQ2FjaGluZ1N0YWNrXCIsXG4gICAgICB7XG4gICAgICAgIGNoYXRib3RTTlNBcm4sXG4gICAgICAgIHN0YWdlLFxuICAgICAgICByb3V0ZTUzQXJuLFxuICAgICAgICBwaW5hdGFfa2V5LFxuICAgICAgICBwaW5hdGFfc2VjcmV0LFxuICAgICAgICBob3N0ZWRfem9uZSxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgY29uc3Qge1xuICAgICAgcm91dGVzRHluYW1vRGIsXG4gICAgICByb3V0ZXNEYkNhY2hpbmdSZXF1ZXN0RmxhZ0R5bmFtb0RiLFxuICAgICAgY2FjaGVkUm91dGVzRHluYW1vRGIsXG4gICAgICBjYWNoaW5nUmVxdWVzdEZsYWdEeW5hbW9EYixcbiAgICAgIGNhY2hlZFYzUG9vbHNEeW5hbW9EYixcbiAgICAgIHRva2VuUHJvcGVydGllc0NhY2hpbmdEeW5hbW9EYixcbiAgICB9ID0gbmV3IFJvdXRpbmdEYXRhYmFzZVN0YWNrKHRoaXMsIFwiUm91dGluZ0RhdGFiYXNlU3RhY2tcIiwge30pO1xuXG4gICAgY29uc3QgeyByb3V0aW5nTGFtYmRhQWxpYXMgfSA9IG5ldyBSb3V0aW5nTGFtYmRhU3RhY2sodGhpcywgXCJSb3V0aW5nTGFtYmRhU3RhY2tcIiwge1xuICAgICAgcG9vbENhY2hlQnVja2V0LFxuICAgICAgcG9vbENhY2hlQnVja2V0MixcbiAgICAgIHBvb2xDYWNoZUtleSxcbiAgICAgIGpzb25ScGNQcm92aWRlcnMsXG4gICAgICB0b2tlbkxpc3RDYWNoZUJ1Y2tldCxcbiAgICAgIHByb3Zpc2lvbmVkQ29uY3VycmVuY3ksXG4gICAgICBldGhHYXNTdGF0aW9uSW5mb1VybCxcbiAgICAgIGNoYXRib3RTTlNBcm4sXG4gICAgICB0ZW5kZXJseVVzZXIsXG4gICAgICB0ZW5kZXJseVByb2plY3QsXG4gICAgICB0ZW5kZXJseUFjY2Vzc0tleSxcbiAgICAgIHJvdXRlc0R5bmFtb0RiLFxuICAgICAgcm91dGVzRGJDYWNoaW5nUmVxdWVzdEZsYWdEeW5hbW9EYixcbiAgICAgIGNhY2hlZFJvdXRlc0R5bmFtb0RiLFxuICAgICAgY2FjaGluZ1JlcXVlc3RGbGFnRHluYW1vRGIsXG4gICAgICBjYWNoZWRWM1Bvb2xzRHluYW1vRGIsXG4gICAgICB0b2tlblByb3BlcnRpZXNDYWNoaW5nRHluYW1vRGIsXG4gICAgICB1bmljb3JuU2VjcmV0LFxuICAgIH0pO1xuXG4gICAgY29uc3QgYWNjZXNzTG9nR3JvdXAgPSBuZXcgYXdzX2xvZ3MuTG9nR3JvdXAodGhpcywgXCJSb3V0aW5nQVBJR0FjY2Vzc0xvZ3NcIik7XG5cbiAgICBjb25zdCBhcGkgPSBuZXcgYXdzX2FwaWdhdGV3YXkuUmVzdEFwaSh0aGlzLCBcInJvdXRpbmctYXBpXCIsIHtcbiAgICAgIHJlc3RBcGlOYW1lOiBcIlJvdXRpbmcgQVBJXCIsXG4gICAgICBkZXBsb3lPcHRpb25zOiB7XG4gICAgICAgIHRyYWNpbmdFbmFibGVkOiB0cnVlLFxuICAgICAgICBsb2dnaW5nTGV2ZWw6IE1ldGhvZExvZ2dpbmdMZXZlbC5FUlJPUixcbiAgICAgICAgYWNjZXNzTG9nRGVzdGluYXRpb246IG5ldyBhd3NfYXBpZ2F0ZXdheS5Mb2dHcm91cExvZ0Rlc3RpbmF0aW9uKGFjY2Vzc0xvZ0dyb3VwKSxcbiAgICAgICAgYWNjZXNzTG9nRm9ybWF0OiBhd3NfYXBpZ2F0ZXdheS5BY2Nlc3NMb2dGb3JtYXQuanNvbldpdGhTdGFuZGFyZEZpZWxkcyh7XG4gICAgICAgICAgaXA6IGZhbHNlLFxuICAgICAgICAgIGNhbGxlcjogZmFsc2UsXG4gICAgICAgICAgdXNlcjogZmFsc2UsXG4gICAgICAgICAgcmVxdWVzdFRpbWU6IHRydWUsXG4gICAgICAgICAgaHR0cE1ldGhvZDogdHJ1ZSxcbiAgICAgICAgICByZXNvdXJjZVBhdGg6IHRydWUsXG4gICAgICAgICAgc3RhdHVzOiB0cnVlLFxuICAgICAgICAgIHByb3RvY29sOiB0cnVlLFxuICAgICAgICAgIHJlc3BvbnNlTGVuZ3RoOiB0cnVlLFxuICAgICAgICB9KSxcbiAgICAgIH0sXG4gICAgICBkZWZhdWx0Q29yc1ByZWZsaWdodE9wdGlvbnM6IHtcbiAgICAgICAgYWxsb3dPcmlnaW5zOiBhd3NfYXBpZ2F0ZXdheS5Db3JzLkFMTF9PUklHSU5TLFxuICAgICAgICBhbGxvd01ldGhvZHM6IGF3c19hcGlnYXRld2F5LkNvcnMuQUxMX01FVEhPRFMsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgY29uc3QgaXBUaHJvdHRsaW5nQUNMID0gbmV3IGF3c193YWYuQ2ZuV2ViQUNMKHRoaXMsIFwiUm91dGluZ0FQSUlQVGhyb3R0bGluZ0FDTFwiLCB7XG4gICAgICBkZWZhdWx0QWN0aW9uOiB7IGFsbG93OiB7fSB9LFxuICAgICAgc2NvcGU6IFwiUkVHSU9OQUxcIixcbiAgICAgIHZpc2liaWxpdHlDb25maWc6IHtcbiAgICAgICAgc2FtcGxlZFJlcXVlc3RzRW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgY2xvdWRXYXRjaE1ldHJpY3NFbmFibGVkOiB0cnVlLFxuICAgICAgICBtZXRyaWNOYW1lOiBcIlJvdXRpbmdBUElJUEJhc2VkVGhyb3R0bGluZ1wiLFxuICAgICAgfSxcbiAgICAgIGN1c3RvbVJlc3BvbnNlQm9kaWVzOiB7XG4gICAgICAgIFJvdXRpbmdBUElUaHJvdHRsZWRSZXNwb25zZUJvZHk6IHtcbiAgICAgICAgICBjb250ZW50VHlwZTogXCJBUFBMSUNBVElPTl9KU09OXCIsXG4gICAgICAgICAgY29udGVudDogJ3tcImVycm9yQ29kZVwiOiBcIlRPT19NQU5ZX1JFUVVFU1RTXCJ9JyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBuYW1lOiBcIlJvdXRpbmdBUElJUFRocm90dGxpbmdcIixcbiAgICAgIHJ1bGVzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiBcImlwXCIsXG4gICAgICAgICAgcHJpb3JpdHk6IDAsXG4gICAgICAgICAgc3RhdGVtZW50OiB7XG4gICAgICAgICAgICByYXRlQmFzZWRTdGF0ZW1lbnQ6IHtcbiAgICAgICAgICAgICAgLy8gTGltaXQgaXMgcGVyIDUgbWlucywgaS5lLiAxMjAgcmVxdWVzdHMgZXZlcnkgNSBtaW5zXG4gICAgICAgICAgICAgIGxpbWl0OiB0aHJvdHRsaW5nT3ZlcnJpZGUgPyBwYXJzZUludCh0aHJvdHRsaW5nT3ZlcnJpZGUpIDogMTIwLFxuICAgICAgICAgICAgICAvLyBBUEkgaXMgb2YgdHlwZSBFREdFIHNvIGlzIGZyb250ZWQgYnkgQ2xvdWRmcm9udCBhcyBhIHByb3h5LlxuICAgICAgICAgICAgICAvLyBVc2UgdGhlIGlwIHNldCBpbiBYLUZvcndhcmRlZC1Gb3IgYnkgQ2xvdWRmcm9udCwgbm90IHRoZSByZWd1bGFyIElQXG4gICAgICAgICAgICAgIC8vIHdoaWNoIHdvdWxkIGp1c3QgcmVzb2x2ZSB0byBDbG91ZGZyb250cyBJUC5cbiAgICAgICAgICAgICAgYWdncmVnYXRlS2V5VHlwZTogXCJGT1JXQVJERURfSVBcIixcbiAgICAgICAgICAgICAgZm9yd2FyZGVkSXBDb25maWc6IHtcbiAgICAgICAgICAgICAgICBoZWFkZXJOYW1lOiBcIlgtRm9yd2FyZGVkLUZvclwiLFxuICAgICAgICAgICAgICAgIGZhbGxiYWNrQmVoYXZpb3I6IFwiTUFUQ0hcIixcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgc2NvcGVEb3duU3RhdGVtZW50OiB7XG4gICAgICAgICAgICAgICAgbm90U3RhdGVtZW50OiB7XG4gICAgICAgICAgICAgICAgICBzdGF0ZW1lbnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgYnl0ZU1hdGNoU3RhdGVtZW50OiB7XG4gICAgICAgICAgICAgICAgICAgICAgZmllbGRUb01hdGNoOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaW5nbGVIZWFkZXI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogXCJ4LWFwaS1rZXlcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbmFsQ29uc3RyYWludDogXCJFWEFDVExZXCIsXG4gICAgICAgICAgICAgICAgICAgICAgc2VhcmNoU3RyaW5nOiBpbnRlcm5hbEFwaUtleSxcbiAgICAgICAgICAgICAgICAgICAgICB0ZXh0VHJhbnNmb3JtYXRpb25zOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiTk9ORVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBwcmlvcml0eTogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBhY3Rpb246IHtcbiAgICAgICAgICAgIGJsb2NrOiB7XG4gICAgICAgICAgICAgIGN1c3RvbVJlc3BvbnNlOiB7XG4gICAgICAgICAgICAgICAgcmVzcG9uc2VDb2RlOiA0MjksXG4gICAgICAgICAgICAgICAgY3VzdG9tUmVzcG9uc2VCb2R5S2V5OiBcIlJvdXRpbmdBUElUaHJvdHRsZWRSZXNwb25zZUJvZHlcIixcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB2aXNpYmlsaXR5Q29uZmlnOiB7XG4gICAgICAgICAgICBzYW1wbGVkUmVxdWVzdHNFbmFibGVkOiB0cnVlLFxuICAgICAgICAgICAgY2xvdWRXYXRjaE1ldHJpY3NFbmFibGVkOiB0cnVlLFxuICAgICAgICAgICAgbWV0cmljTmFtZTogXCJSb3V0aW5nQVBJSVBCYXNlZFRocm90dGxpbmdSdWxlXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICBjb25zdCByZWdpb24gPSBjZGsuU3RhY2sub2YodGhpcykucmVnaW9uO1xuICAgIGNvbnN0IGFwaUFybiA9IGBhcm46YXdzOmFwaWdhdGV3YXk6JHtyZWdpb259OjovcmVzdGFwaXMvJHthcGkucmVzdEFwaUlkfS9zdGFnZXMvJHthcGkuZGVwbG95bWVudFN0YWdlLnN0YWdlTmFtZX1gO1xuXG4gICAgbmV3IGF3c193YWYuQ2ZuV2ViQUNMQXNzb2NpYXRpb24odGhpcywgXCJSb3V0aW5nQVBJSVBUaHJvdHRsaW5nQXNzb2NpYXRpb25cIiwge1xuICAgICAgcmVzb3VyY2VBcm46IGFwaUFybixcbiAgICAgIHdlYkFjbEFybjogaXBUaHJvdHRsaW5nQUNMLmdldEF0dChcIkFyblwiKS50b1N0cmluZygpLFxuICAgIH0pO1xuXG4gICAgY29uc3QgbGFtYmRhSW50ZWdyYXRpb24gPSBuZXcgYXdzX2FwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24ocm91dGluZ0xhbWJkYUFsaWFzKTtcblxuICAgIGNvbnN0IHF1b3RlID0gYXBpLnJvb3QuYWRkUmVzb3VyY2UoXCJxdW90ZVwiLCB7XG4gICAgICBkZWZhdWx0Q29yc1ByZWZsaWdodE9wdGlvbnM6IHtcbiAgICAgICAgYWxsb3dPcmlnaW5zOiBhd3NfYXBpZ2F0ZXdheS5Db3JzLkFMTF9PUklHSU5TLFxuICAgICAgICBhbGxvd01ldGhvZHM6IGF3c19hcGlnYXRld2F5LkNvcnMuQUxMX01FVEhPRFMsXG4gICAgICB9LFxuICAgIH0pO1xuICAgIHF1b3RlLmFkZE1ldGhvZChcIkdFVFwiLCBsYW1iZGFJbnRlZ3JhdGlvbik7XG5cbiAgICAvLyBBbGwgYWxhcm1zIGRlZmF1bHQgdG8gR3JlYXRlclRoYW5PckVxdWFsVG9UaHJlc2hvbGQgZm9yIHdoZW4gdG8gYmUgdHJpZ2dlcmVkLlxuICAgIGNvbnN0IGFwaUFsYXJtNXh4U2V2MiA9IG5ldyBhd3NfY2xvdWR3YXRjaC5BbGFybSh0aGlzLCBcIlJvdXRpbmdBUEktU0VWMi01WFhBbGFybVwiLCB7XG4gICAgICBhbGFybU5hbWU6IFwiUm91dGluZ0FQSS1TRVYyLTVYWFwiLFxuICAgICAgbWV0cmljOiBhcGkubWV0cmljU2VydmVyRXJyb3Ioe1xuICAgICAgICBwZXJpb2Q6IER1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgIC8vIEZvciB0aGlzIG1ldHJpYyAnYXZnJyByZXByZXNlbnRzIGVycm9yIHJhdGUuXG4gICAgICAgIHN0YXRpc3RpYzogXCJhdmdcIixcbiAgICAgIH0pLFxuICAgICAgdGhyZXNob2xkOiAwLjA1LFxuICAgICAgLy8gQmV0YSBoYXMgbXVjaCBsZXNzIHRyYWZmaWMgc28gaXMgbW9yZSBzdXNjZXB0aWJsZSB0byB0cmFuc2llbnQgZXJyb3JzLlxuICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IHN0YWdlID09IFNUQUdFLkJFVEEgPyA1IDogMyxcbiAgICB9KTtcblxuICAgIGNvbnN0IGFwaUFsYXJtNHh4U2V2MiA9IG5ldyBhd3NfY2xvdWR3YXRjaC5BbGFybSh0aGlzLCBcIlJvdXRpbmdBUEktU0VWMi00WFhBbGFybVwiLCB7XG4gICAgICBhbGFybU5hbWU6IFwiUm91dGluZ0FQSS1TRVYyLTRYWFwiLFxuICAgICAgbWV0cmljOiBhcGkubWV0cmljQ2xpZW50RXJyb3Ioe1xuICAgICAgICBwZXJpb2Q6IER1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgIHN0YXRpc3RpYzogXCJhdmdcIixcbiAgICAgIH0pLFxuICAgICAgdGhyZXNob2xkOiAwLjk1LFxuICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDMsXG4gICAgfSk7XG5cbiAgICBjb25zdCBhcGlBbGFybUxhdGVuY3lTZXYyID0gbmV3IGF3c19jbG91ZHdhdGNoLkFsYXJtKHRoaXMsIFwiUm91dGluZ0FQSS1TRVYyLUxhdGVuY3lcIiwge1xuICAgICAgYWxhcm1OYW1lOiBcIlJvdXRpbmdBUEktU0VWMi1MYXRlbmN5XCIsXG4gICAgICBtZXRyaWM6IGFwaS5tZXRyaWNMYXRlbmN5KHtcbiAgICAgICAgcGVyaW9kOiBEdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICBzdGF0aXN0aWM6IFwicDkwXCIsXG4gICAgICB9KSxcbiAgICAgIHRocmVzaG9sZDogODUwMCxcbiAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAzLFxuICAgIH0pO1xuXG4gICAgY29uc3QgYXBpQWxhcm01eHhTZXYzID0gbmV3IGF3c19jbG91ZHdhdGNoLkFsYXJtKHRoaXMsIFwiUm91dGluZ0FQSS1TRVYzLTVYWEFsYXJtXCIsIHtcbiAgICAgIGFsYXJtTmFtZTogXCJSb3V0aW5nQVBJLVNFVjMtNVhYXCIsXG4gICAgICBtZXRyaWM6IGFwaS5tZXRyaWNTZXJ2ZXJFcnJvcih7XG4gICAgICAgIHBlcmlvZDogRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgLy8gRm9yIHRoaXMgbWV0cmljICdhdmcnIHJlcHJlc2VudHMgZXJyb3IgcmF0ZS5cbiAgICAgICAgc3RhdGlzdGljOiBcImF2Z1wiLFxuICAgICAgfSksXG4gICAgICB0aHJlc2hvbGQ6IDAuMDMsXG4gICAgICAvLyBCZXRhIGhhcyBtdWNoIGxlc3MgdHJhZmZpYyBzbyBpcyBtb3JlIHN1c2NlcHRpYmxlIHRvIHRyYW5zaWVudCBlcnJvcnMuXG4gICAgICBldmFsdWF0aW9uUGVyaW9kczogc3RhZ2UgPT0gU1RBR0UuQkVUQSA/IDUgOiAzLFxuICAgIH0pO1xuXG4gICAgY29uc3QgYXBpQWxhcm00eHhTZXYzID0gbmV3IGF3c19jbG91ZHdhdGNoLkFsYXJtKHRoaXMsIFwiUm91dGluZ0FQSS1TRVYzLTRYWEFsYXJtXCIsIHtcbiAgICAgIGFsYXJtTmFtZTogXCJSb3V0aW5nQVBJLVNFVjMtNFhYXCIsXG4gICAgICBtZXRyaWM6IGFwaS5tZXRyaWNDbGllbnRFcnJvcih7XG4gICAgICAgIHBlcmlvZDogRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgc3RhdGlzdGljOiBcImF2Z1wiLFxuICAgICAgfSksXG4gICAgICB0aHJlc2hvbGQ6IDAuOCxcbiAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAzLFxuICAgIH0pO1xuXG4gICAgY29uc3QgYXBpQWxhcm1MYXRlbmN5U2V2MyA9IG5ldyBhd3NfY2xvdWR3YXRjaC5BbGFybSh0aGlzLCBcIlJvdXRpbmdBUEktU0VWMy1MYXRlbmN5XCIsIHtcbiAgICAgIGFsYXJtTmFtZTogXCJSb3V0aW5nQVBJLVNFVjMtTGF0ZW5jeVwiLFxuICAgICAgbWV0cmljOiBhcGkubWV0cmljTGF0ZW5jeSh7XG4gICAgICAgIHBlcmlvZDogRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgc3RhdGlzdGljOiBcInA5MFwiLFxuICAgICAgfSksXG4gICAgICB0aHJlc2hvbGQ6IDU1MDAsXG4gICAgICBldmFsdWF0aW9uUGVyaW9kczogMyxcbiAgICB9KTtcblxuICAgIC8vIFNpbXVsYXRpb25zIGNhbiBmYWlsIGZvciB2YWxpZCByZWFzb25zLiBGb3IgZXhhbXBsZSwgaWYgdGhlIHNpbXVsYXRpb24gcmV2ZXJ0cyBkdWVcbiAgICAvLyB0byBzbGlwcGFnZSBjaGVja3MgKGNhbiBoYXBwZW4gd2l0aCBGT1QgdG9rZW5zIHNvbWV0aW1lcyBzaW5jZSBvdXIgcXVvdGVyIGRvZXMgbm90XG4gICAgLy8gYWNjb3VudCBmb3IgdGhlIGZlZXMgdGFrZW4gZHVyaW5nIHRyYW5zZmVyIHdoZW4gd2Ugc2hvdyB0aGUgdXNlciB0aGUgcXVvdGUpLlxuICAgIC8vXG4gICAgLy8gRm9yIHRoaXMgcmVhc29uIHdlIG9ubHkgYWxlcnQgb24gU0VWMyB0byBhdm9pZCB1bm5lY2Vzc2FyeSBwYWdlcy5cbiAgICBjb25zdCBzaW11bGF0aW9uQWxhcm1TZXYzID0gbmV3IGF3c19jbG91ZHdhdGNoLkFsYXJtKHRoaXMsIFwiUm91dGluZ0FQSS1TRVYzLVNpbXVsYXRpb25cIiwge1xuICAgICAgYWxhcm1OYW1lOiBcIlJvdXRpbmdBUEktU0VWMy1TaW11bGF0aW9uXCIsXG4gICAgICBtZXRyaWM6IG5ldyBNYXRoRXhwcmVzc2lvbih7XG4gICAgICAgIGV4cHJlc3Npb246IFwiMTAwKihzaW11bGF0aW9uRmFpbGVkL3NpbXVsYXRpb25SZXF1ZXN0ZWQpXCIsXG4gICAgICAgIHBlcmlvZDogRHVyYXRpb24ubWludXRlcygzMCksXG4gICAgICAgIHVzaW5nTWV0cmljczoge1xuICAgICAgICAgIHNpbXVsYXRpb25SZXF1ZXN0ZWQ6IG5ldyBhd3NfY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgbmFtZXNwYWNlOiBcIlVuaXN3YXBcIixcbiAgICAgICAgICAgIG1ldHJpY05hbWU6IGBTaW11bGF0aW9uIFJlcXVlc3RlZGAsXG4gICAgICAgICAgICBkaW1lbnNpb25zTWFwOiB7IFNlcnZpY2U6IFwiUm91dGluZ0FQSVwiIH0sXG4gICAgICAgICAgICB1bml0OiBhd3NfY2xvdWR3YXRjaC5Vbml0LkNPVU5ULFxuICAgICAgICAgICAgc3RhdGlzdGljOiBcInN1bVwiLFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIHNpbXVsYXRpb25GYWlsZWQ6IG5ldyBhd3NfY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgbmFtZXNwYWNlOiBcIlVuaXN3YXBcIixcbiAgICAgICAgICAgIG1ldHJpY05hbWU6IGBTaW11bGF0aW9uRmFpbGVkYCxcbiAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHsgU2VydmljZTogXCJSb3V0aW5nQVBJXCIgfSxcbiAgICAgICAgICAgIHVuaXQ6IGF3c19jbG91ZHdhdGNoLlVuaXQuQ09VTlQsXG4gICAgICAgICAgICBzdGF0aXN0aWM6IFwic3VtXCIsXG4gICAgICAgICAgfSksXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICAgIHRocmVzaG9sZDogNzUsXG4gICAgICBldmFsdWF0aW9uUGVyaW9kczogMyxcbiAgICAgIHRyZWF0TWlzc2luZ0RhdGE6IGF3c19jbG91ZHdhdGNoLlRyZWF0TWlzc2luZ0RhdGEuTk9UX0JSRUFDSElORywgLy8gTWlzc2luZyBkYXRhIHBvaW50cyBhcmUgdHJlYXRlZCBhcyBcImdvb2RcIiBhbmQgd2l0aGluIHRoZSB0aHJlc2hvbGRcbiAgICB9KTtcblxuICAgIC8vIEFsYXJtcyBmb3IgaGlnaCA0MDAgZXJyb3IgcmF0ZSBmb3IgZWFjaCBjaGFpblxuICAgIGNvbnN0IHBlcmNlbnQ0WFhCeUNoYWluQWxhcm06IGNkay5hd3NfY2xvdWR3YXRjaC5BbGFybVtdID0gW107XG4gICAgWzFdLmZvckVhY2goKCkgPT4ge1xuICAgICAgY29uc3QgYWxhcm1OYW1lID0gYFJvdXRpbmdBUEktU0VWMy00WFhBbGFybS1HZXRRdW90ZWA7XG4gICAgICBjb25zdCBtZXRyaWMgPSBuZXcgTWF0aEV4cHJlc3Npb24oe1xuICAgICAgICBleHByZXNzaW9uOiBcIjEwMCoocmVzcG9uc2U0MDAvaW52b2NhdGlvbnMpXCIsXG4gICAgICAgIHVzaW5nTWV0cmljczoge1xuICAgICAgICAgIGludm9jYXRpb25zOiBhcGkubWV0cmljKGBHRVRfUVVPVEVfUkVRVUVTVEVEYCwge1xuICAgICAgICAgICAgcGVyaW9kOiBEdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgICAgc3RhdGlzdGljOiBcInN1bVwiLFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIHJlc3BvbnNlNDAwOiBhcGkubWV0cmljKGBHRVRfUVVPVEVfNDAwYCwge1xuICAgICAgICAgICAgcGVyaW9kOiBEdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgICAgc3RhdGlzdGljOiBcInN1bVwiLFxuICAgICAgICAgIH0pLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICBjb25zdCBhbGFybSA9IG5ldyBhd3NfY2xvdWR3YXRjaC5BbGFybSh0aGlzLCBhbGFybU5hbWUsIHtcbiAgICAgICAgYWxhcm1OYW1lLFxuICAgICAgICBtZXRyaWMsXG4gICAgICAgIHRocmVzaG9sZDogODAsXG4gICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAyLFxuICAgICAgfSk7XG4gICAgICBwZXJjZW50NFhYQnlDaGFpbkFsYXJtLnB1c2goYWxhcm0pO1xuICAgIH0pO1xuXG4gICAgLy8gQWxhcm1zIGZvciBoaWdoIDUwMCBlcnJvciByYXRlIGZvciBlYWNoIGNoYWluXG4gICAgY29uc3Qgc3VjY2Vzc1JhdGVCeUNoYWluQWxhcm06IGNkay5hd3NfY2xvdWR3YXRjaC5BbGFybVtdID0gW107XG4gICAgWzFdLmZvckVhY2goKCkgPT4ge1xuICAgICAgY29uc3QgYWxhcm1OYW1lID0gYFJvdXRpbmdBUEktU0VWMi1TdWNjZXNzUmF0ZS1BbGFybWA7XG4gICAgICBjb25zdCBtZXRyaWMgPSBuZXcgTWF0aEV4cHJlc3Npb24oe1xuICAgICAgICBleHByZXNzaW9uOiBcIjEwMCoocmVzcG9uc2UyMDAvKGludm9jYXRpb25zLXJlc3BvbnNlNDAwKSlcIixcbiAgICAgICAgdXNpbmdNZXRyaWNzOiB7XG4gICAgICAgICAgaW52b2NhdGlvbnM6IGFwaS5tZXRyaWMoYEdFVF9RVU9URV9SRVFVRVNURURgLCB7XG4gICAgICAgICAgICBwZXJpb2Q6IER1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgICAgICBzdGF0aXN0aWM6IFwic3VtXCIsXG4gICAgICAgICAgfSksXG4gICAgICAgICAgcmVzcG9uc2U0MDA6IGFwaS5tZXRyaWMoYEdFVF9RVU9URV80MDBgLCB7XG4gICAgICAgICAgICBwZXJpb2Q6IER1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgICAgICBzdGF0aXN0aWM6IFwic3VtXCIsXG4gICAgICAgICAgfSksXG4gICAgICAgICAgcmVzcG9uc2UyMDA6IGFwaS5tZXRyaWMoYEdFVF9RVU9URV8yMDBgLCB7XG4gICAgICAgICAgICBwZXJpb2Q6IER1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgICAgICBzdGF0aXN0aWM6IFwic3VtXCIsXG4gICAgICAgICAgfSksXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGFsYXJtID0gbmV3IGF3c19jbG91ZHdhdGNoLkFsYXJtKHRoaXMsIGFsYXJtTmFtZSwge1xuICAgICAgICBhbGFybU5hbWUsXG4gICAgICAgIG1ldHJpYyxcbiAgICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOiBDb21wYXJpc29uT3BlcmF0b3IuTEVTU19USEFOX09SX0VRVUFMX1RPX1RIUkVTSE9MRCxcbiAgICAgICAgdGhyZXNob2xkOiA5NSwgLy8gVGhpcyBpcyBhbGFybSB3aWxsIHRyaWdnZXIgaWYgdGhlIFNSIGlzIGxlc3MgdGhhbiBvciBlcXVhbCB0byA5NSVcbiAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDIsXG4gICAgICB9KTtcbiAgICAgIHN1Y2Nlc3NSYXRlQnlDaGFpbkFsYXJtLnB1c2goYWxhcm0pO1xuICAgIH0pO1xuXG4gICAgaWYgKGNoYXRib3RTTlNBcm4pIHtcbiAgICAgIGNvbnN0IGNoYXRCb3RUb3BpYyA9IGF3c19zbnMuVG9waWMuZnJvbVRvcGljQXJuKHRoaXMsIFwiQ2hhdGJvdFRvcGljXCIsIGNoYXRib3RTTlNBcm4pO1xuICAgICAgYXBpQWxhcm01eHhTZXYyLmFkZEFsYXJtQWN0aW9uKG5ldyBhd3NfY2xvdWR3YXRjaF9hY3Rpb25zLlNuc0FjdGlvbihjaGF0Qm90VG9waWMpKTtcbiAgICAgIGFwaUFsYXJtNHh4U2V2Mi5hZGRBbGFybUFjdGlvbihuZXcgYXdzX2Nsb3Vkd2F0Y2hfYWN0aW9ucy5TbnNBY3Rpb24oY2hhdEJvdFRvcGljKSk7XG4gICAgICBhcGlBbGFybUxhdGVuY3lTZXYyLmFkZEFsYXJtQWN0aW9uKG5ldyBhd3NfY2xvdWR3YXRjaF9hY3Rpb25zLlNuc0FjdGlvbihjaGF0Qm90VG9waWMpKTtcbiAgICAgIGFwaUFsYXJtNXh4U2V2My5hZGRBbGFybUFjdGlvbihuZXcgYXdzX2Nsb3Vkd2F0Y2hfYWN0aW9ucy5TbnNBY3Rpb24oY2hhdEJvdFRvcGljKSk7XG4gICAgICBhcGlBbGFybTR4eFNldjMuYWRkQWxhcm1BY3Rpb24obmV3IGF3c19jbG91ZHdhdGNoX2FjdGlvbnMuU25zQWN0aW9uKGNoYXRCb3RUb3BpYykpO1xuICAgICAgYXBpQWxhcm1MYXRlbmN5U2V2My5hZGRBbGFybUFjdGlvbihuZXcgYXdzX2Nsb3Vkd2F0Y2hfYWN0aW9ucy5TbnNBY3Rpb24oY2hhdEJvdFRvcGljKSk7XG4gICAgICBzaW11bGF0aW9uQWxhcm1TZXYzLmFkZEFsYXJtQWN0aW9uKG5ldyBhd3NfY2xvdWR3YXRjaF9hY3Rpb25zLlNuc0FjdGlvbihjaGF0Qm90VG9waWMpKTtcblxuICAgICAgcGVyY2VudDRYWEJ5Q2hhaW5BbGFybS5mb3JFYWNoKChhbGFybSkgPT4ge1xuICAgICAgICBhbGFybS5hZGRBbGFybUFjdGlvbihuZXcgYXdzX2Nsb3Vkd2F0Y2hfYWN0aW9ucy5TbnNBY3Rpb24oY2hhdEJvdFRvcGljKSk7XG4gICAgICB9KTtcbiAgICAgIHN1Y2Nlc3NSYXRlQnlDaGFpbkFsYXJtLmZvckVhY2goKGFsYXJtKSA9PiB7XG4gICAgICAgIGFsYXJtLmFkZEFsYXJtQWN0aW9uKG5ldyBhd3NfY2xvdWR3YXRjaF9hY3Rpb25zLlNuc0FjdGlvbihjaGF0Qm90VG9waWMpKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMudXJsID0gbmV3IENmbk91dHB1dCh0aGlzLCBcIlVybFwiLCB7XG4gICAgICB2YWx1ZTogYXBpLnVybCxcbiAgICB9KTtcbiAgfVxufVxuIl19