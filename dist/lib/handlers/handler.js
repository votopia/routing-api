import { metricScope } from "aws-embedded-metrics";
import { default as bunyan } from "bunyan";
export class UnsupportedChainError extends Error {
    constructor(chainId) {
        super();
        this.chainId = chainId;
        this.name = "UnsupportedChainError";
    }
}
export class Injector {
    constructor(injectorName) {
        this.injectorName = injectorName;
    }
    async build() {
        this.containerInjected = await this.buildContainerInjected();
        return this;
    }
    async getContainerInjected() {
        if (this.containerInjected === undefined) {
            throw new Error("Container injected undefined. Must call build() before using.");
        }
        return this.containerInjected;
    }
}
const INTERNAL_ERROR = (id) => {
    return {
        statusCode: 500,
        body: JSON.stringify({
            errorCode: "INTERNAL_ERROR",
            detail: "Unexpected error",
            id,
        }),
    };
};
export class APIGLambdaHandler {
    constructor(handlerName, injectorPromise) {
        this.handlerName = handlerName;
        this.injectorPromise = injectorPromise;
    }
    get handler() {
        return async (event, context) => {
            const handler = this.buildHandler();
            const response = await handler(event, context);
            return {
                ...response,
                headers: {
                    ...response.headers,
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                    "Access-Control-Allow-Credentials": true,
                    "Content-Type": "application/json",
                },
            };
        };
    }
    buildHandler() {
        return metricScope((metric) => async (event, context) => {
            const requestStart = Date.now();
            let log = bunyan.createLogger({
                name: this.handlerName,
                serializers: bunyan.stdSerializers,
                level: bunyan.INFO,
                requestId: context.awsRequestId,
            });
            log.info({ event, context }, "Request started.");
            let requestBody;
            let requestQueryParams;
            try {
                const requestValidation = await this.parseAndValidateRequest(event, log);
                if (requestValidation.state == "invalid") {
                    return requestValidation.errorResponse;
                }
                requestBody = requestValidation.requestBody;
                requestQueryParams = requestValidation.requestQueryParams;
            }
            catch (err) {
                log.error({ err }, "Unexpected error validating request");
                return INTERNAL_ERROR();
            }
            const injector = await this.injectorPromise;
            const containerInjected = await injector.getContainerInjected();
            let requestInjected;
            try {
                requestInjected = await injector.getRequestInjected(containerInjected, requestBody, requestQueryParams, event, context, log, metric);
            }
            catch (err) {
                log.error({ err, event }, "Unexpected error building request injected.");
                return INTERNAL_ERROR();
            }
            const { id } = requestInjected;
            ({ log } = requestInjected);
            let statusCode;
            let body;
            try {
                const handleRequestResult = await this.handleRequest({
                    context,
                    event,
                    requestBody,
                    requestQueryParams,
                    containerInjected,
                    requestInjected,
                });
                if (this.isError(handleRequestResult)) {
                    log.info({ handleRequestResult }, "Handler did not return a 200");
                    const { statusCode, detail, errorCode } = handleRequestResult;
                    const response = JSON.stringify({ detail, errorCode, id });
                    log.info({ statusCode, response }, `Request ended. ${statusCode}`);
                    return {
                        statusCode,
                        body: response,
                    };
                }
                else {
                    log.info({ requestBody, requestQueryParams, requestDuration: Date.now() - requestStart }, "Handler returned 200");
                    ({ body, statusCode } = handleRequestResult);
                }
            }
            catch (err) {
                log.error({ err }, "Unexpected error in handler");
                return INTERNAL_ERROR(id);
            }
            let response;
            try {
                const responseValidation = await this.parseAndValidateResponse(body, id, log);
                if (responseValidation.state == "invalid") {
                    return responseValidation.errorResponse;
                }
                response = responseValidation.response;
            }
            catch (err) {
                log.error({ err }, "Unexpected error validating response");
                return INTERNAL_ERROR(id);
            }
            log.info({ statusCode, response }, `Request ended. ${statusCode}`);
            this.afterHandler(metric, response, requestStart);
            return {
                statusCode,
                body: JSON.stringify(response),
            };
        });
    }
    afterHandler(_, __, ___) { }
    isError(result) {
        return result.statusCode != 200 && result.statusCode != 202;
    }
    async parseAndValidateRequest(event, log) {
        let bodyRaw;
        if (event.body) {
            try {
                bodyRaw = JSON.parse(event.body);
            }
            catch (err) {
                return {
                    state: "invalid",
                    errorResponse: {
                        statusCode: 422,
                        body: JSON.stringify({
                            detail: "Invalid JSON body",
                            errorCode: "VALIDATION_ERROR",
                        }),
                    },
                };
            }
        }
        let queryParamsRaw = event.queryStringParameters;
        const queryParamsSchema = this.requestQueryParamsSchema();
        let queryParams;
        if (queryParamsRaw && queryParamsSchema) {
            const queryParamsValidation = queryParamsSchema.validate(queryParamsRaw, {
                allowUnknown: true,
                stripUnknown: true,
            });
            if (queryParamsValidation.error) {
                log.info({ queryParamsValidation }, "Request failed validation");
                return {
                    state: "invalid",
                    errorResponse: {
                        statusCode: 400,
                        body: JSON.stringify({
                            detail: queryParamsValidation.error.message,
                            errorCode: "VALIDATION_ERROR",
                        }),
                    },
                };
            }
            queryParams = queryParamsValidation.value;
        }
        const bodySchema = this.requestBodySchema();
        let body;
        if (bodyRaw && bodySchema) {
            const bodyValidation = bodySchema.validate(bodyRaw, {
                allowUnknown: true,
                stripUnknown: true,
            });
            if (bodyValidation.error) {
                log.info({ bodyValidation }, "Request failed validation");
                return {
                    state: "invalid",
                    errorResponse: {
                        statusCode: 400,
                        body: JSON.stringify({
                            detail: bodyValidation.error.message,
                            errorCode: "VALIDATION_ERROR",
                        }),
                    },
                };
            }
            body = bodyValidation.value;
        }
        return {
            state: "valid",
            requestBody: body,
            requestQueryParams: queryParams,
        };
    }
    async parseAndValidateResponse(body, id, log) {
        var _a, _b;
        const responseSchema = this.responseBodySchema();
        if (!responseSchema) {
            return { state: "valid", response: body };
        }
        const res = responseSchema.validate(body, {
            allowUnknown: true,
            stripUnknown: true, // Ensure no unexpected fields returned to users.
        });
        if (res.error) {
            log.error({ error: (_a = res.error) === null || _a === void 0 ? void 0 : _a.details, errors: (_b = res.errors) === null || _b === void 0 ? void 0 : _b.details, body }, "Unexpected error. Response failed validation.");
            return {
                state: "invalid",
                errorResponse: INTERNAL_ERROR(id),
            };
        }
        return { state: "valid", response: res.value };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9oYW5kbGVycy9oYW5kbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxXQUFXLEVBQWlCLE1BQU0sc0JBQXNCLENBQUM7QUFPbEUsT0FBTyxFQUFFLE9BQU8sSUFBSSxNQUFNLEVBQXFCLE1BQU0sUUFBUSxDQUFDO0FBOEI5RCxNQUFNLE9BQU8scUJBQXNCLFNBQVEsS0FBSztJQUM5QyxZQUFtQixPQUFlO1FBQ2hDLEtBQUssRUFBRSxDQUFDO1FBRFMsWUFBTyxHQUFQLE9BQU8sQ0FBUTtRQUczQixTQUFJLEdBQUcsdUJBQXVCLENBQUM7SUFEdEMsQ0FBQztDQUVGO0FBRUQsTUFBTSxPQUFnQixRQUFRO0lBRTVCLFlBQTZCLFlBQW9CO1FBQXBCLGlCQUFZLEdBQVosWUFBWSxDQUFRO0lBQUcsQ0FBQztJQUU5QyxLQUFLLENBQUMsS0FBSztRQUNoQixJQUFJLENBQUMsaUJBQWlCLEdBQUcsTUFBTSxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztRQUM3RCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFjTSxLQUFLLENBQUMsb0JBQW9CO1FBQy9CLElBQUksSUFBSSxDQUFDLGlCQUFpQixLQUFLLFNBQVMsRUFBRTtZQUN4QyxNQUFNLElBQUksS0FBSyxDQUFDLCtEQUErRCxDQUFDLENBQUM7U0FDbEY7UUFDRCxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztJQUNoQyxDQUFDO0NBQ0Y7QUFFRCxNQUFNLGNBQWMsR0FBRyxDQUFDLEVBQVcsRUFBRSxFQUFFO0lBQ3JDLE9BQU87UUFDTCxVQUFVLEVBQUUsR0FBRztRQUNmLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ25CLFNBQVMsRUFBRSxnQkFBZ0I7WUFDM0IsTUFBTSxFQUFFLGtCQUFrQjtZQUMxQixFQUFFO1NBQ0gsQ0FBQztLQUNILENBQUM7QUFDSixDQUFDLENB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RUFBRSxJQUFJO1lBQ2xCLFlBQVksRUFBRSxJQUFJLEVBQUUsaURBQWlEO1NBQ3RFLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLEtBQUssRUFBRTtZQUNiLEdBQUcsQ0FBQyxLQUFLLENBQ1AsRUFBRSxLQUFLLEVBQUUsTUFBQSxHQUFHLENBQUMsS0FBSywwQ0FBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQUEsR0FBRyxDQUFDLE1BQU0sMENBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxFQUNoRSwrQ0FBK0MsQ0FDaEQsQ0FBQztZQUNGLE9BQU87Z0JBQ0wsS0FBSyxFQUFFLFNBQVM7Z0JBQ2hCLGFBQWEsRUFBRSxjQUFjLENBQUMsRUFBRSxDQUFDO2FBQ2xDLENBQUM7U0FDSDtRQUVELE9BQU8sRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxHQUFHLENBQUMsS0FBWSxFQUFFLENBQUM7SUFDeEQsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEpvaSBmcm9tIFwiQGhhcGkvam9pXCI7XG5pbXBvcnQgeyBtZXRyaWNTY29wZSwgTWV0cmljc0xvZ2dlciB9IGZyb20gXCJhd3MtZW1iZWRkZWQtbWV0cmljc1wiO1xuaW1wb3J0IHtcbiAgQVBJR2F0ZXdheVByb3h5RXZlbnQsXG4gIEFQSUdhdGV3YXlQcm94eUV2ZW50UXVlcnlTdHJpbmdQYXJhbWV0ZXJzLFxuICBBUElHYXRld2F5UHJveHlSZXN1bHQsXG4gIENvbnRleHQsXG59IGZyb20gXCJhd3MtbGFtYmRhXCI7XG5pbXBvcnQgeyBkZWZhdWx0IGFzIGJ1bnlhbiwgZGVmYXVsdCBhcyBMb2dnZXIgfSBmcm9tIFwiYnVueWFuXCI7XG5cbmV4cG9ydCB0eXBlIEFQSUdhdGV3YXlQcm94eUhhbmRsZXIgPSAoZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50LCBjb250ZXh0OiBDb250ZXh0KSA9PiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD47XG5cbmV4cG9ydCB0eXBlIEJhc2VSSW5qID0ge1xuICBsb2c6IExvZ2dlcjtcbiAgaWQ6IHN0cmluZztcbn07XG5cbmV4cG9ydCB0eXBlIEhhbmRsZVJlcXVlc3RQYXJhbXM8Q0luaiwgUkluaiwgUmVxQm9keSwgUmVxUXVlcnlQYXJhbXM+ID0ge1xuICBjb250ZXh0OiBDb250ZXh0O1xuICBldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQ7XG4gIHJlcXVlc3RCb2R5OiBSZXFCb2R5O1xuICByZXF1ZXN0UXVlcnlQYXJhbXM6IFJlcVF1ZXJ5UGFyYW1zO1xuICBjb250YWluZXJJbmplY3RlZDogQ0luajtcbiAgcmVxdWVzdEluamVjdGVkOiBSSW5qO1xufTtcblxuZXhwb3J0IHR5cGUgUmVzcG9uc2U8UmVzPiA9IHtcbiAgc3RhdHVzQ29kZTogMjAwIHwgMjAyO1xuICBib2R5OiBSZXM7XG4gIGhlYWRlcnM/OiBhbnk7XG59O1xuXG5leHBvcnQgdHlwZSBFcnJvclJlc3BvbnNlID0ge1xuICBzdGF0dXNDb2RlOiA0MDAgfCA0MDMgfCA0MDQgfCA0MDggfCA0MDkgfCA1MDA7XG4gIGVycm9yQ29kZTogc3RyaW5nO1xuICBkZXRhaWw/OiBzdHJpbmc7XG59O1xuXG5leHBvcnQgY2xhc3MgVW5zdXBwb3J0ZWRDaGFpbkVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgY2hhaW5JZDogbnVtYmVyKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuICBwdWJsaWMgbmFtZSA9IFwiVW5zdXBwb3J0ZWRDaGFpbkVycm9yXCI7XG59XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBJbmplY3RvcjxDSW5qLCBSSW5qIGV4dGVuZHMgQmFzZVJJbmosIFJlcUJvZHksIFJlcVF1ZXJ5UGFyYW1zPiB7XG4gIHByaXZhdGUgY29udGFpbmVySW5qZWN0ZWQ6IENJbmo7XG4gIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgaW5qZWN0b3JOYW1lOiBzdHJpbmcpIHt9XG5cbiAgcHVibGljIGFzeW5jIGJ1aWxkKCkge1xuICAgIHRoaXMuY29udGFpbmVySW5qZWN0ZWQgPSBhd2FpdCB0aGlzLmJ1aWxkQ29udGFpbmVySW5qZWN0ZWQoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHB1YmxpYyBhYnN0cmFjdCBnZXRSZXF1ZXN0SW5qZWN0ZWQoXG4gICAgY29udGFpbmVySW5qZWN0ZWQ6IENJbmosXG4gICAgcmVxdWVzdEJvZHk6IFJlcUJvZHksXG4gICAgcmVxdWVzdFF1ZXJ5UGFyYW1zOiBSZXFRdWVyeVBhcmFtcyxcbiAgICBldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQsXG4gICAgY29udGV4dDogQ29udGV4dCxcbiAgICBsb2c6IExvZ2dlcixcbiAgICBtZXRyaWNzOiBNZXRyaWNzTG9nZ2VyXG4gICk6IFByb21pc2U8Ukluaj47XG5cbiAgcHVibGljIGFic3RyYWN0IGJ1aWxkQ29udGFpbmVySW5qZWN0ZWQoKTogUHJvbWlzZTxDSW5qPjtcblxuICBwdWJsaWMgYXN5bmMgZ2V0Q29udGFpbmVySW5qZWN0ZWQoKTogUHJvbWlzZTxDSW5qPiB7XG4gICAgaWYgKHRoaXMuY29udGFpbmVySW5qZWN0ZWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29udGFpbmVyIGluamVjdGVkIHVuZGVmaW5lZC4gTXVzdCBjYWxsIGJ1aWxkKCkgYmVmb3JlIHVzaW5nLlwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuY29udGFpbmVySW5qZWN0ZWQ7XG4gIH1cbn1cblxuY29uc3QgSU5URVJOQUxfRVJST1IgPSAoaWQ/OiBzdHJpbmcpID0+IHtcbiAgcmV0dXJuIHtcbiAgICBzdGF0dXNDb2RlOiA1MDAsXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgZXJyb3JDb2RlOiBcIklOVEVSTkFMX0VSUk9SXCIsXG4gICAgICBkZXRhaWw6IFwiVW5leHBlY3RlZCBlcnJvclwiLFxuICAgICAgaWQsXG4gICAgfSksXG4gIH07XG59O1xuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQVBJR0xhbWJkYUhhbmRsZXI8Q0luaiwgUkluaiBleHRlbmRzIEJhc2VSSW5qLCBSZXFCb2R5LCBSZXFRdWVyeVBhcmFtcywgUmVzPiB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgaGFuZGxlck5hbWU6IHN0cmluZyxcbiAgICBwcml2YXRlIGluamVjdG9yUHJvbWlzZTogUHJvbWlzZTxJbmplY3RvcjxDSW5qLCBSSW5qLCBSZXFCb2R5LCBSZXFRdWVyeVBhcmFtcz4+XG4gICkge31cblxuICBnZXQgaGFuZGxlcigpOiBBUElHYXRld2F5UHJveHlIYW5kbGVyIHtcbiAgICByZXR1cm4gYXN5bmMgKGV2ZW50OiBBUElHYXRld2F5UHJveHlFdmVudCwgY29udGV4dDogQ29udGV4dCk6IFByb21pc2U8QVBJR2F0ZXdheVByb3h5UmVzdWx0PiA9PiB7XG4gICAgICBjb25zdCBoYW5kbGVyID0gdGhpcy5idWlsZEhhbmRsZXIoKTtcblxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBoYW5kbGVyKGV2ZW50LCBjb250ZXh0KTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLi4ucmVzcG9uc2UsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAuLi5yZXNwb25zZS5oZWFkZXJzLFxuICAgICAgICAgIFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiLFxuICAgICAgICAgIFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVyc1wiOiBcIkNvbnRlbnQtVHlwZSxYLUFtei1EYXRlLEF1dGhvcml6YXRpb24sWC1BcGktS2V5LFgtQW16LVNlY3VyaXR5LVRva2VuXCIsXG4gICAgICAgICAgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1DcmVkZW50aWFsc1wiOiB0cnVlLFxuICAgICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgICB9LFxuICAgICAgfTtcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBidWlsZEhhbmRsZXIoKTogQVBJR2F0ZXdheVByb3h5SGFuZGxlciB7XG4gICAgcmV0dXJuIG1ldHJpY1Njb3BlKFxuICAgICAgKG1ldHJpYzogTWV0cmljc0xvZ2dlcikgPT5cbiAgICAgICAgYXN5bmMgKGV2ZW50OiBBUElHYXRld2F5UHJveHlFdmVudCwgY29udGV4dDogQ29udGV4dCk6IFByb21pc2U8QVBJR2F0ZXdheVByb3h5UmVzdWx0PiA9PiB7XG4gICAgICAgICAgY29uc3QgcmVxdWVzdFN0YXJ0ID0gRGF0ZS5ub3coKTtcblxuICAgICAgICAgIGxldCBsb2c6IExvZ2dlciA9IGJ1bnlhbi5jcmVhdGVMb2dnZXIoe1xuICAgICAgICAgICAgbmFtZTogdGhpcy5oYW5kbGVyTmFtZSxcbiAgICAgICAgICAgIHNlcmlhbGl6ZXJzOiBidW55YW4uc3RkU2VyaWFsaXplcnMsXG4gICAgICAgICAgICBsZXZlbDogYnVueWFuLklORk8sXG4gICAgICAgICAgICByZXF1ZXN0SWQ6IGNvbnRleHQuYXdzUmVxdWVzdElkLFxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgbG9nLmluZm8oeyBldmVudCwgY29udGV4dCB9LCBcIlJlcXVlc3Qgc3RhcnRlZC5cIik7XG5cbiAgICAgICAgICBsZXQgcmVxdWVzdEJvZHk6IFJlcUJvZHk7XG4gICAgICAgICAgbGV0IHJlcXVlc3RRdWVyeVBhcmFtczogUmVxUXVlcnlQYXJhbXM7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcXVlc3RWYWxpZGF0aW9uID0gYXdhaXQgdGhpcy5wYXJzZUFuZFZhbGlkYXRlUmVxdWVzdChldmVudCwgbG9nKTtcblxuICAgICAgICAgICAgaWYgKHJlcXVlc3RWYWxpZGF0aW9uLnN0YXRlID09IFwiaW52YWxpZFwiKSB7XG4gICAgICAgICAgICAgIHJldHVybiByZXF1ZXN0VmFsaWRhdGlvbi5lcnJvclJlc3BvbnNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXF1ZXN0Qm9keSA9IHJlcXVlc3RWYWxpZGF0aW9uLnJlcXVlc3RCb2R5O1xuICAgICAgICAgICAgcmVxdWVzdFF1ZXJ5UGFyYW1zID0gcmVxdWVzdFZhbGlkYXRpb24ucmVxdWVzdFF1ZXJ5UGFyYW1zO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgbG9nLmVycm9yKHsgZXJyIH0sIFwiVW5leHBlY3RlZCBlcnJvciB2YWxpZGF0aW5nIHJlcXVlc3RcIik7XG4gICAgICAgICAgICByZXR1cm4gSU5URVJOQUxfRVJST1IoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCBpbmplY3RvciA9IGF3YWl0IHRoaXMuaW5qZWN0b3JQcm9taXNlO1xuXG4gICAgICAgICAgY29uc3QgY29udGFpbmVySW5qZWN0ZWQgPSBhd2FpdCBpbmplY3Rvci5nZXRDb250YWluZXJJbmplY3RlZCgpO1xuXG4gICAgICAgICAgbGV0IHJlcXVlc3RJbmplY3RlZDogUkluajtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVxdWVzdEluamVjdGVkID0gYXdhaXQgaW5qZWN0b3IuZ2V0UmVxdWVzdEluamVjdGVkKFxuICAgICAgICAgICAgICBjb250YWluZXJJbmplY3RlZCxcbiAgICAgICAgICAgICAgcmVxdWVzdEJvZHksXG4gICAgICAgICAgICAgIHJlcXVlc3RRdWVyeVBhcmFtcyxcbiAgICAgICAgICAgICAgZXZlbnQsXG4gICAgICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICAgICAgIGxvZyxcbiAgICAgICAgICAgICAgbWV0cmljXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgbG9nLmVycm9yKHsgZXJyLCBldmVudCB9LCBcIlVuZXhwZWN0ZWQgZXJyb3IgYnVpbGRpbmcgcmVxdWVzdCBpbmplY3RlZC5cIik7XG4gICAgICAgICAgICByZXR1cm4gSU5URVJOQUxfRVJST1IoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCB7IGlkIH0gPSByZXF1ZXN0SW5qZWN0ZWQ7XG5cbiAgICAgICAgICAoeyBsb2cgfSA9IHJlcXVlc3RJbmplY3RlZCk7XG5cbiAgICAgICAgICBsZXQgc3RhdHVzQ29kZTogbnVtYmVyO1xuICAgICAgICAgIGxldCBib2R5OiBSZXM7XG5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgaGFuZGxlUmVxdWVzdFJlc3VsdCA9IGF3YWl0IHRoaXMuaGFuZGxlUmVxdWVzdCh7XG4gICAgICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICAgICAgIGV2ZW50LFxuICAgICAgICAgICAgICByZXF1ZXN0Qm9keSxcbiAgICAgICAgICAgICAgcmVxdWVzdFF1ZXJ5UGFyYW1zLFxuICAgICAgICAgICAgICBjb250YWluZXJJbmplY3RlZCxcbiAgICAgICAgICAgICAgcmVxdWVzdEluamVjdGVkLFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzRXJyb3IoaGFuZGxlUmVxdWVzdFJlc3VsdCkpIHtcbiAgICAgICAgICAgICAgbG9nLmluZm8oeyBoYW5kbGVSZXF1ZXN0UmVzdWx0IH0sIFwiSGFuZGxlciBkaWQgbm90IHJldHVybiBhIDIwMFwiKTtcbiAgICAgICAgICAgICAgY29uc3QgeyBzdGF0dXNDb2RlLCBkZXRhaWwsIGVycm9yQ29kZSB9ID0gaGFuZGxlUmVxdWVzdFJlc3VsdDtcbiAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBKU09OLnN0cmluZ2lmeSh7IGRldGFpbCwgZXJyb3JDb2RlLCBpZCB9KTtcblxuICAgICAgICAgICAgICBsb2cuaW5mbyh7IHN0YXR1c0NvZGUsIHJlc3BvbnNlIH0sIGBSZXF1ZXN0IGVuZGVkLiAke3N0YXR1c0NvZGV9YCk7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdHVzQ29kZSxcbiAgICAgICAgICAgICAgICBib2R5OiByZXNwb25zZSxcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGxvZy5pbmZvKFxuICAgICAgICAgICAgICAgIHsgcmVxdWVzdEJvZHksIHJlcXVlc3RRdWVyeVBhcmFtcywgcmVxdWVzdER1cmF0aW9uOiBEYXRlLm5vdygpIC0gcmVxdWVzdFN0YXJ0IH0sXG4gICAgICAgICAgICAgICAgXCJIYW5kbGVyIHJldHVybmVkIDIwMFwiXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICh7IGJvZHksIHN0YXR1c0NvZGUgfSA9IGhhbmRsZVJlcXVlc3RSZXN1bHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgbG9nLmVycm9yKHsgZXJyIH0sIFwiVW5leHBlY3RlZCBlcnJvciBpbiBoYW5kbGVyXCIpO1xuICAgICAgICAgICAgcmV0dXJuIElOVEVSTkFMX0VSUk9SKGlkKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsZXQgcmVzcG9uc2U6IFJlcztcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2VWYWxpZGF0aW9uID0gYXdhaXQgdGhpcy5wYXJzZUFuZFZhbGlkYXRlUmVzcG9uc2UoYm9keSwgaWQsIGxvZyk7XG5cbiAgICAgICAgICAgIGlmIChyZXNwb25zZVZhbGlkYXRpb24uc3RhdGUgPT0gXCJpbnZhbGlkXCIpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlVmFsaWRhdGlvbi5lcnJvclJlc3BvbnNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXNwb25zZSA9IHJlc3BvbnNlVmFsaWRhdGlvbi5yZXNwb25zZTtcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGxvZy5lcnJvcih7IGVyciB9LCBcIlVuZXhwZWN0ZWQgZXJyb3IgdmFsaWRhdGluZyByZXNwb25zZVwiKTtcbiAgICAgICAgICAgIHJldHVybiBJTlRFUk5BTF9FUlJPUihpZCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbG9nLmluZm8oeyBzdGF0dXNDb2RlLCByZXNwb25zZSB9LCBgUmVxdWVzdCBlbmRlZC4gJHtzdGF0dXNDb2RlfWApO1xuXG4gICAgICAgICAgdGhpcy5hZnRlckhhbmRsZXIobWV0cmljLCByZXNwb25zZSwgcmVxdWVzdFN0YXJ0KTtcblxuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdGF0dXNDb2RlLFxuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UpLFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgcHJvdGVjdGVkIGFmdGVySGFuZGxlcihfOiBNZXRyaWNzTG9nZ2VyLCBfXzogUmVzLCBfX186IG51bWJlcik6IHZvaWQge31cblxuICBwdWJsaWMgYWJzdHJhY3QgaGFuZGxlUmVxdWVzdChcbiAgICBwYXJhbXM6IEhhbmRsZVJlcXVlc3RQYXJhbXM8Q0luaiwgUkluaiwgUmVxQm9keSwgUmVxUXVlcnlQYXJhbXM+XG4gICk6IFByb21pc2U8UmVzcG9uc2U8UmVzPiB8IEVycm9yUmVzcG9uc2U+O1xuXG4gIHByb3RlY3RlZCBhYnN0cmFjdCByZXF1ZXN0Qm9keVNjaGVtYSgpOiBKb2kuT2JqZWN0U2NoZW1hIHwgbnVsbDtcbiAgcHJvdGVjdGVkIGFic3RyYWN0IHJlcXVlc3RRdWVyeVBhcmFtc1NjaGVtYSgpOiBKb2kuT2JqZWN0U2NoZW1hIHwgbnVsbDtcbiAgcHJvdGVjdGVkIGFic3RyYWN0IHJlc3BvbnNlQm9keVNjaGVtYSgpOiBKb2kuT2JqZWN0U2NoZW1hIHwgbnVsbDtcblxuICBwcml2YXRlIGlzRXJyb3IocmVzdWx0OiBSZXNwb25zZTxSZXM+IHwgRXJyb3JSZXNwb25zZSk6IHJlc3VsdCBpcyBFcnJvclJlc3BvbnNlIHtcbiAgICByZXR1cm4gcmVzdWx0LnN0YXR1c0NvZGUgIT0gMjAwICYmIHJlc3VsdC5zdGF0dXNDb2RlICE9IDIwMjtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcGFyc2VBbmRWYWxpZGF0ZVJlcXVlc3QoXG4gICAgZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50LFxuICAgIGxvZzogTG9nZ2VyXG4gICk6IFByb21pc2U8XG4gICAgfCB7XG4gICAgICAgIHN0YXRlOiBcInZhbGlkXCI7XG4gICAgICAgIHJlcXVlc3RCb2R5OiBSZXFCb2R5O1xuICAgICAgICByZXF1ZXN0UXVlcnlQYXJhbXM6IFJlcVF1ZXJ5UGFyYW1zO1xuICAgICAgfVxuICAgIHwgeyBzdGF0ZTogXCJpbnZhbGlkXCI7IGVycm9yUmVzcG9uc2U6IEFQSUdhdGV3YXlQcm94eVJlc3VsdCB9XG4gID4ge1xuICAgIGxldCBib2R5UmF3OiBhbnk7XG5cbiAgICBpZiAoZXZlbnQuYm9keSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYm9keVJhdyA9IEpTT04ucGFyc2UoZXZlbnQuYm9keSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdGF0ZTogXCJpbnZhbGlkXCIsXG4gICAgICAgICAgZXJyb3JSZXNwb25zZToge1xuICAgICAgICAgICAgc3RhdHVzQ29kZTogNDIyLFxuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICBkZXRhaWw6IFwiSW52YWxpZCBKU09OIGJvZHlcIixcbiAgICAgICAgICAgICAgZXJyb3JDb2RlOiBcIlZBTElEQVRJT05fRVJST1JcIixcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IHF1ZXJ5UGFyYW1zUmF3OiBBUElHYXRld2F5UHJveHlFdmVudFF1ZXJ5U3RyaW5nUGFyYW1ldGVycyB8IG51bGwgPSBldmVudC5xdWVyeVN0cmluZ1BhcmFtZXRlcnM7XG4gICAgY29uc3QgcXVlcnlQYXJhbXNTY2hlbWEgPSB0aGlzLnJlcXVlc3RRdWVyeVBhcmFtc1NjaGVtYSgpO1xuXG4gICAgbGV0IHF1ZXJ5UGFyYW1zOiBSZXFRdWVyeVBhcmFtcyB8IHVuZGVmaW5lZDtcbiAgICBpZiAocXVlcnlQYXJhbXNSYXcgJiYgcXVlcnlQYXJhbXNTY2hlbWEpIHtcbiAgICAgIGNvbnN0IHF1ZXJ5UGFyYW1zVmFsaWRhdGlvbiA9IHF1ZXJ5UGFyYW1zU2NoZW1hLnZhbGlkYXRlKHF1ZXJ5UGFyYW1zUmF3LCB7XG4gICAgICAgIGFsbG93VW5rbm93bjogdHJ1ZSwgLy8gTWFrZXMgQVBJIHNjaGVtYSBjaGFuZ2VzIGFuZCByb2xsYmFja3MgZWFzaWVyLlxuICAgICAgICBzdHJpcFVua25vd246IHRydWUsXG4gICAgICB9KTtcblxuICAgICAgaWYgKHF1ZXJ5UGFyYW1zVmFsaWRhdGlvbi5lcnJvcikge1xuICAgICAgICBsb2cuaW5mbyh7IHF1ZXJ5UGFyYW1zVmFsaWRhdGlvbiB9LCBcIlJlcXVlc3QgZmFpbGVkIHZhbGlkYXRpb25cIik7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3RhdGU6IFwiaW52YWxpZFwiLFxuICAgICAgICAgIGVycm9yUmVzcG9uc2U6IHtcbiAgICAgICAgICAgIHN0YXR1c0NvZGU6IDQwMCxcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgZGV0YWlsOiBxdWVyeVBhcmFtc1ZhbGlkYXRpb24uZXJyb3IubWVzc2FnZSxcbiAgICAgICAgICAgICAgZXJyb3JDb2RlOiBcIlZBTElEQVRJT05fRVJST1JcIixcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIHF1ZXJ5UGFyYW1zID0gcXVlcnlQYXJhbXNWYWxpZGF0aW9uLnZhbHVlIGFzIFJlcVF1ZXJ5UGFyYW1zO1xuICAgIH1cblxuICAgIGNvbnN0IGJvZHlTY2hlbWEgPSB0aGlzLnJlcXVlc3RCb2R5U2NoZW1hKCk7XG5cbiAgICBsZXQgYm9keTogUmVxQm9keSB8IHVuZGVmaW5lZDtcbiAgICBpZiAoYm9keVJhdyAmJiBib2R5U2NoZW1hKSB7XG4gICAgICBjb25zdCBib2R5VmFsaWRhdGlvbiA9IGJvZHlTY2hlbWEudmFsaWRhdGUoYm9keVJhdywge1xuICAgICAgICBhbGxvd1Vua25vd246IHRydWUsIC8vIE1ha2VzIEFQSSBzY2hlbWEgY2hhbmdlcyBhbmQgcm9sbGJhY2tzIGVhc2llci5cbiAgICAgICAgc3RyaXBVbmtub3duOiB0cnVlLFxuICAgICAgfSk7XG5cbiAgICAgIGlmIChib2R5VmFsaWRhdGlvbi5lcnJvcikge1xuICAgICAgICBsb2cuaW5mbyh7IGJvZHlWYWxpZGF0aW9uIH0sIFwiUmVxdWVzdCBmYWlsZWQgdmFsaWRhdGlvblwiKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdGF0ZTogXCJpbnZhbGlkXCIsXG4gICAgICAgICAgZXJyb3JSZXNwb25zZToge1xuICAgICAgICAgICAgc3RhdHVzQ29kZTogNDAwLFxuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICBkZXRhaWw6IGJvZHlWYWxpZGF0aW9uLmVycm9yLm1lc3NhZ2UsXG4gICAgICAgICAgICAgIGVycm9yQ29kZTogXCJWQUxJREFUSU9OX0VSUk9SXCIsXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBib2R5ID0gYm9keVZhbGlkYXRpb24udmFsdWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXRlOiBcInZhbGlkXCIsXG4gICAgICByZXF1ZXN0Qm9keTogYm9keSBhcyBSZXFCb2R5LFxuICAgICAgcmVxdWVzdFF1ZXJ5UGFyYW1zOiBxdWVyeVBhcmFtcyBhcyBSZXFRdWVyeVBhcmFtcyxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwYXJzZUFuZFZhbGlkYXRlUmVzcG9uc2UoXG4gICAgYm9keTogUmVzLFxuICAgIGlkOiBzdHJpbmcsXG4gICAgbG9nOiBMb2dnZXJcbiAgKTogUHJvbWlzZTx7IHN0YXRlOiBcInZhbGlkXCI7IHJlc3BvbnNlOiBSZXMgfSB8IHsgc3RhdGU6IFwiaW52YWxpZFwiOyBlcnJvclJlc3BvbnNlOiBBUElHYXRld2F5UHJveHlSZXN1bHQgfT4ge1xuICAgIGNvbnN0IHJlc3BvbnNlU2NoZW1hID0gdGhpcy5yZXNwb25zZUJvZHlTY2hlbWEoKTtcblxuICAgIGlmICghcmVzcG9uc2VTY2hlbWEpIHtcbiAgICAgIHJldHVybiB7IHN0YXRlOiBcInZhbGlkXCIsIHJlc3BvbnNlOiBib2R5IGFzIFJlcyB9O1xuICAgIH1cblxuICAgIGNvbnN0IHJlcyA9IHJlc3BvbnNlU2NoZW1hLnZhbGlkYXRlKGJvZHksIHtcbiAgICAgIGFsbG93VW5rbm93bjogdHJ1ZSxcbiAgICAgIHN0cmlwVW5rbm93bjogdHJ1ZSwgLy8gRW5zdXJlIG5vIHVuZXhwZWN0ZWQgZmllbGRzIHJldHVybmVkIHRvIHVzZXJzLlxuICAgIH0pO1xuXG4gICAgaWYgKHJlcy5lcnJvcikge1xuICAgICAgbG9nLmVycm9yKFxuICAgICAgICB7IGVycm9yOiByZXMuZXJyb3I/LmRldGFpbHMsIGVycm9yczogcmVzLmVycm9ycz8uZGV0YWlscywgYm9keSB9LFxuICAgICAgICBcIlVuZXhwZWN0ZWQgZXJyb3IuIFJlc3BvbnNlIGZhaWxlZCB2YWxpZGF0aW9uLlwiXG4gICAgICApO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3RhdGU6IFwiaW52YWxpZFwiLFxuICAgICAgICBlcnJvclJlc3BvbnNlOiBJTlRFUk5BTF9FUlJPUihpZCksXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7IHN0YXRlOiBcInZhbGlkXCIsIHJlc3BvbnNlOiByZXMudmFsdWUgYXMgUmVzIH07XG4gIH1cbn1cbiJdfQ==