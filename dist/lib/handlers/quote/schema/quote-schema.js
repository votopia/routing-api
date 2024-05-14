import BaseJoi from "@hapi/joi";
const Joi = BaseJoi.extend((joi) => ({
    base: joi.array(),
    type: "stringArray",
    messages: {
        "stringArray.type": "{{#label}} is not a valid string array",
    },
    coerce: (value, helpers) => {
        if (typeof value !== "string") {
            return { value: value, errors: [helpers.error("stringArray.type")] };
        }
        value = value.replace(/^\[|\]$/g, "").split(",");
        const ar = value.map((val) => {
            return val.trim();
        });
        return { value: ar };
    },
}));
export const QuoteQueryParamsJoi = Joi.object({
    tokenInAddress: Joi.string().alphanum().max(42).required(),
    tokenOutAddress: Joi.string().alphanum().max(42).required(),
    amount: Joi.string()
        .pattern(/^[0-9]+$/)
        .max(77) // TODO: validate < 2**256
        .required(),
    type: Joi.string().valid("exactIn", "exactOut").required(),
    recipient: Joi.string()
        .pattern(new RegExp(/^0x[a-fA-F0-9]{40}$/))
        .optional(),
    slippageTolerance: Joi.number().min(0).max(20).precision(2).optional(),
    deadline: Joi.number().max(10800).optional(),
    algorithm: Joi.string().valid("alpha", "legacy").optional(),
    gasPriceWei: Joi.string()
        .pattern(/^[0-9]+$/)
        .max(30)
        .optional(),
    minSplits: Joi.number().max(7).optional(),
    forceCrossProtocol: Joi.boolean().optional(),
    forceMixedRoutes: Joi.boolean().optional(),
    protocols: Joi.stringArray().items(Joi.string().valid("v2", "v3", "mixed")).optional(),
    simulateFromAddress: Joi.string().alphanum().max(42).optional(),
    permitSignature: Joi.string().optional(),
    permitNonce: Joi.string().optional(),
    permitExpiration: Joi.number().optional(),
    permitAmount: Joi.string()
        .pattern(/^[0-9]+$/)
        .max(77),
    permitSigDeadline: Joi.number().optional(),
    // TODO: Remove once universal router is no longer behind a feature flag.
    enableUniversalRouter: Joi.boolean().optional().default(false),
    quoteSpeed: Joi.string().valid("fast", "standard").optional().default("standard"),
    debugRoutingConfig: Joi.string().optional(),
    unicornSecret: Joi.string().optional(),
    intent: Joi.string().valid("quote", "swap", "caching", "pricing").optional().default("quote"),
    enableFeeOnTransferFeeFetching: Joi.boolean().optional().default(false),
    portionBips: Joi.string()
        .pattern(/^[0-9]+$/)
        .max(5) // portionBips is a string type with the expectation of being parsable to integer between 0 and 10000
        .optional(),
    portionAmount: Joi.string()
        .pattern(/^[0-9]+$/)
        .optional(),
    portionRecipient: Joi.string().alphanum().max(42).optional(),
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVvdGUtc2NoZW1hLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vbGliL2hhbmRsZXJzL3F1b3RlL3NjaGVtYS9xdW90ZS1zY2hlbWEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxPQUFPLE1BQU0sV0FBVyxDQUFDO0FBRWhDLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDbkMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxLQUFLLEVBQUU7SUFDakIsSUFBSSxFQUFFLGFBQWE7SUFDbkIsUUFBUSxFQUFFO1FBQ1Isa0JBQWtCLEVBQUUsd0NBQXdDO0tBQzdEO0lBQ0QsTUFBTSxFQUFFLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFO1FBQ3pCLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO1lBQzdCLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxFQUFFLENBQUM7U0FDdEU7UUFDRCxLQUFLLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2pELE1BQU0sRUFBRSxHQUFJLEtBQWtCLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7WUFDekMsT0FBTyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDcEIsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxDQUFDO0lBQ3ZCLENBQUM7Q0FDRixDQUFDLENBQUMsQ0FBQztBQUVKLE1BQU0sQ0FBQyxNQUFNLG1CQUFtQixHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7SUFDNUMsY0FBYyxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFO0lBQzFELGVBQWUsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsRUFBRTtJQUMzRCxNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRTtTQUNqQixPQUFPLENBQUMsVUFBVSxDQUFDO1NBQ25CLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQywwQkFBMEI7U0FDbEMsUUFBUSxFQUFFO0lBQ2IsSUFBSSxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDLFFBQVEsRUFBRTtJQUMxRCxTQUFTLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRTtTQUNwQixPQUFPLENBQUMsSUFBSSxNQUFNLENBQUMscUJBQXFCLENBQUMsQ0FBQztTQUMxQyxRQUFRLEVBQUU7SUFDYixpQkFBaUIsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFO0lBQ3RFLFFBQVEsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsRUFBRTtJQUM1QyxTQUFTLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUMsUUFBUSxFQUFFO0lBQzNELFdBQVcsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFO1NBQ3RCLE9BQU8sQ0FBQyxVQUFVLENBQUM7U0FDbkIsR0FBRyxDQUFDLEVBQUUsQ0FBQztTQUNQLFFBQVEsRUFBRTtJQUNiLFNBQVMsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRTtJQUN6QyxrQkFBa0IsRUFBRSxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUMsUUFBUSxFQUFFO0lBQzVDLGdCQUFnQixFQUFFLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDMUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFO0lBQ3RGLG1CQUFtQixFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFO0lBQy9ELGVBQWUsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFO0lBQ3hDLFdBQVcsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFO0lBQ3BDLGdCQUFnQixFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDekMsWUFBWSxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUU7U0FDdkIsT0FBTyxDQUFDLFVBQVUsQ0FBQztTQUNuQixHQUFHLENBQUMsRUFBRSxDQUFDO0lBQ1YsaUJBQWlCLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRTtJQUMxQyx5RUFBeUU7SUFDekUscUJBQXFCLEVBQUUsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7SUFDOUQsVUFBVSxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUM7SUFDakYsa0JBQWtCLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRTtJQUMzQyxhQUFhLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRTtJQUN0QyxNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO0lBQzdGLDhCQUE4QixFQUFFLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO0lBQ3ZFLFdBQVcsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFO1NBQ3RCLE9BQU8sQ0FBQyxVQUFVLENBQUM7U0FDbkIsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLHFHQUFxRztTQUM1RyxRQUFRLEVBQUU7SUFDYixhQUFhLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRTtTQUN4QixPQUFPLENBQUMsVUFBVSxDQUFDO1NBQ25CLFFBQVEsRUFBRTtJQUNiLGdCQUFnQixFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFO0NBQzdELENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBCYXNlSm9pIGZyb20gXCJAaGFwaS9qb2lcIjtcblxuY29uc3QgSm9pID0gQmFzZUpvaS5leHRlbmQoKGpvaSkgPT4gKHtcbiAgYmFzZTogam9pLmFycmF5KCksXG4gIHR5cGU6IFwic3RyaW5nQXJyYXlcIixcbiAgbWVzc2FnZXM6IHtcbiAgICBcInN0cmluZ0FycmF5LnR5cGVcIjogXCJ7eyNsYWJlbH19IGlzIG5vdCBhIHZhbGlkIHN0cmluZyBhcnJheVwiLFxuICB9LFxuICBjb2VyY2U6ICh2YWx1ZSwgaGVscGVycykgPT4ge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHJldHVybiB7IHZhbHVlOiB2YWx1ZSwgZXJyb3JzOiBbaGVscGVycy5lcnJvcihcInN0cmluZ0FycmF5LnR5cGVcIildIH07XG4gICAgfVxuICAgIHZhbHVlID0gdmFsdWUucmVwbGFjZSgvXlxcW3xcXF0kL2csIFwiXCIpLnNwbGl0KFwiLFwiKTtcbiAgICBjb25zdCBhciA9ICh2YWx1ZSBhcyBzdHJpbmdbXSkubWFwKCh2YWwpID0+IHtcbiAgICAgIHJldHVybiB2YWwudHJpbSgpO1xuICAgIH0pO1xuICAgIHJldHVybiB7IHZhbHVlOiBhciB9O1xuICB9LFxufSkpO1xuXG5leHBvcnQgY29uc3QgUXVvdGVRdWVyeVBhcmFtc0pvaSA9IEpvaS5vYmplY3Qoe1xuICB0b2tlbkluQWRkcmVzczogSm9pLnN0cmluZygpLmFscGhhbnVtKCkubWF4KDQyKS5yZXF1aXJlZCgpLFxuICB0b2tlbk91dEFkZHJlc3M6IEpvaS5zdHJpbmcoKS5hbHBoYW51bSgpLm1heCg0MikucmVxdWlyZWQoKSxcbiAgYW1vdW50OiBKb2kuc3RyaW5nKClcbiAgICAucGF0dGVybigvXlswLTldKyQvKVxuICAgIC5tYXgoNzcpIC8vIFRPRE86IHZhbGlkYXRlIDwgMioqMjU2XG4gICAgLnJlcXVpcmVkKCksXG4gIHR5cGU6IEpvaS5zdHJpbmcoKS52YWxpZChcImV4YWN0SW5cIiwgXCJleGFjdE91dFwiKS5yZXF1aXJlZCgpLFxuICByZWNpcGllbnQ6IEpvaS5zdHJpbmcoKVxuICAgIC5wYXR0ZXJuKG5ldyBSZWdFeHAoL14weFthLWZBLUYwLTldezQwfSQvKSlcbiAgICAub3B0aW9uYWwoKSxcbiAgc2xpcHBhZ2VUb2xlcmFuY2U6IEpvaS5udW1iZXIoKS5taW4oMCkubWF4KDIwKS5wcmVjaXNpb24oMikub3B0aW9uYWwoKSxcbiAgZGVhZGxpbmU6IEpvaS5udW1iZXIoKS5tYXgoMTA4MDApLm9wdGlvbmFsKCksIC8vIDE4MCBtaW5zLCBzYW1lIGFzIGludGVyZmFjZSBtYXhcbiAgYWxnb3JpdGhtOiBKb2kuc3RyaW5nKCkudmFsaWQoXCJhbHBoYVwiLCBcImxlZ2FjeVwiKS5vcHRpb25hbCgpLFxuICBnYXNQcmljZVdlaTogSm9pLnN0cmluZygpXG4gICAgLnBhdHRlcm4oL15bMC05XSskLylcbiAgICAubWF4KDMwKVxuICAgIC5vcHRpb25hbCgpLFxuICBtaW5TcGxpdHM6IEpvaS5udW1iZXIoKS5tYXgoNykub3B0aW9uYWwoKSxcbiAgZm9yY2VDcm9zc1Byb3RvY29sOiBKb2kuYm9vbGVhbigpLm9wdGlvbmFsKCksXG4gIGZvcmNlTWl4ZWRSb3V0ZXM6IEpvaS5ib29sZWFuKCkub3B0aW9uYWwoKSxcbiAgcHJvdG9jb2xzOiBKb2kuc3RyaW5nQXJyYXkoKS5pdGVtcyhKb2kuc3RyaW5nKCkudmFsaWQoXCJ2MlwiLCBcInYzXCIsIFwibWl4ZWRcIikpLm9wdGlvbmFsKCksXG4gIHNpbXVsYXRlRnJvbUFkZHJlc3M6IEpvaS5zdHJpbmcoKS5hbHBoYW51bSgpLm1heCg0Mikub3B0aW9uYWwoKSxcbiAgcGVybWl0U2lnbmF0dXJlOiBKb2kuc3RyaW5nKCkub3B0aW9uYWwoKSxcbiAgcGVybWl0Tm9uY2U6IEpvaS5zdHJpbmcoKS5vcHRpb25hbCgpLFxuICBwZXJtaXRFeHBpcmF0aW9uOiBKb2kubnVtYmVyKCkub3B0aW9uYWwoKSxcbiAgcGVybWl0QW1vdW50OiBKb2kuc3RyaW5nKClcbiAgICAucGF0dGVybigvXlswLTldKyQvKVxuICAgIC5tYXgoNzcpLFxuICBwZXJtaXRTaWdEZWFkbGluZTogSm9pLm51bWJlcigpLm9wdGlvbmFsKCksXG4gIC8vIFRPRE86IFJlbW92ZSBvbmNlIHVuaXZlcnNhbCByb3V0ZXIgaXMgbm8gbG9uZ2VyIGJlaGluZCBhIGZlYXR1cmUgZmxhZy5cbiAgZW5hYmxlVW5pdmVyc2FsUm91dGVyOiBKb2kuYm9vbGVhbigpLm9wdGlvbmFsKCkuZGVmYXVsdChmYWxzZSksXG4gIHF1b3RlU3BlZWQ6IEpvaS5zdHJpbmcoKS52YWxpZChcImZhc3RcIiwgXCJzdGFuZGFyZFwiKS5vcHRpb25hbCgpLmRlZmF1bHQoXCJzdGFuZGFyZFwiKSxcbiAgZGVidWdSb3V0aW5nQ29uZmlnOiBKb2kuc3RyaW5nKCkub3B0aW9uYWwoKSxcbiAgdW5pY29yblNlY3JldDogSm9pLnN0cmluZygpLm9wdGlvbmFsKCksXG4gIGludGVudDogSm9pLnN0cmluZygpLnZhbGlkKFwicXVvdGVcIiwgXCJzd2FwXCIsIFwiY2FjaGluZ1wiLCBcInByaWNpbmdcIikub3B0aW9uYWwoKS5kZWZhdWx0KFwicXVvdGVcIiksXG4gIGVuYWJsZUZlZU9uVHJhbnNmZXJGZWVGZXRjaGluZzogSm9pLmJvb2xlYW4oKS5vcHRpb25hbCgpLmRlZmF1bHQoZmFsc2UpLFxuICBwb3J0aW9uQmlwczogSm9pLnN0cmluZygpXG4gICAgLnBhdHRlcm4oL15bMC05XSskLylcbiAgICAubWF4KDUpIC8vIHBvcnRpb25CaXBzIGlzIGEgc3RyaW5nIHR5cGUgd2l0aCB0aGUgZXhwZWN0YXRpb24gb2YgYmVpbmcgcGFyc2FibGUgdG8gaW50ZWdlciBiZXR3ZWVuIDAgYW5kIDEwMDAwXG4gICAgLm9wdGlvbmFsKCksXG4gIHBvcnRpb25BbW91bnQ6IEpvaS5zdHJpbmcoKVxuICAgIC5wYXR0ZXJuKC9eWzAtOV0rJC8pXG4gICAgLm9wdGlvbmFsKCksXG4gIHBvcnRpb25SZWNpcGllbnQ6IEpvaS5zdHJpbmcoKS5hbHBoYW51bSgpLm1heCg0Mikub3B0aW9uYWwoKSxcbn0pO1xuXG5leHBvcnQgdHlwZSBRdW90ZVF1ZXJ5UGFyYW1zID0ge1xuICB0b2tlbkluQWRkcmVzczogc3RyaW5nO1xuICB0b2tlbk91dEFkZHJlc3M6IHN0cmluZztcbiAgYW1vdW50OiBzdHJpbmc7XG4gIHR5cGU6IHN0cmluZztcbiAgcmVjaXBpZW50Pzogc3RyaW5nO1xuICBzbGlwcGFnZVRvbGVyYW5jZT86IHN0cmluZztcbiAgZGVhZGxpbmU/OiBzdHJpbmc7XG4gIGFsZ29yaXRobT86IHN0cmluZztcbiAgZ2FzUHJpY2VXZWk/OiBzdHJpbmc7XG4gIG1pblNwbGl0cz86IG51bWJlcjtcbiAgZm9yY2VDcm9zc1Byb3RvY29sPzogYm9vbGVhbjtcbiAgZm9yY2VNaXhlZFJvdXRlcz86IGJvb2xlYW47XG4gIHByb3RvY29scz86IHN0cmluZ1tdIHwgc3RyaW5nO1xuICBzaW11bGF0ZUZyb21BZGRyZXNzPzogc3RyaW5nO1xuICBwZXJtaXRTaWduYXR1cmU/OiBzdHJpbmc7XG4gIHBlcm1pdE5vbmNlPzogc3RyaW5nO1xuICBwZXJtaXRFeHBpcmF0aW9uPzogc3RyaW5nO1xuICBwZXJtaXRBbW91bnQ/OiBzdHJpbmc7XG4gIHBlcm1pdFNpZ0RlYWRsaW5lPzogc3RyaW5nO1xuICBlbmFibGVVbml2ZXJzYWxSb3V0ZXI/OiBib29sZWFuO1xuICBxdW90ZVNwZWVkPzogc3RyaW5nO1xuICBkZWJ1Z1JvdXRpbmdDb25maWc/OiBzdHJpbmc7XG4gIHVuaWNvcm5TZWNyZXQ/OiBzdHJpbmc7XG4gIGludGVudD86IHN0cmluZztcbiAgZW5hYmxlRmVlT25UcmFuc2ZlckZlZUZldGNoaW5nPzogYm9vbGVhbjtcbiAgcG9ydGlvbkJpcHM/OiBudW1iZXI7XG4gIHBvcnRpb25BbW91bnQ/OiBzdHJpbmc7XG4gIHBvcnRpb25SZWNpcGllbnQ/OiBzdHJpbmc7XG59O1xuIl19