import Joi from "@hapi/joi";
export const QuoteResponseSchemaJoi = Joi.object().keys({
    quoteId: Joi.string().required(),
    amount: Joi.string().required(),
    amountDecimals: Joi.string().required(),
    quote: Joi.string().required(),
    quoteDecimals: Joi.string().required(),
    quoteGasAdjusted: Joi.string().required(),
    quoteGasAdjustedDecimals: Joi.string().required(),
    gasUseEstimateQuote: Joi.string().required(),
    gasUseEstimateQuoteDecimals: Joi.string().required(),
    quoteGasAndPortionAdjusted: Joi.string().optional(),
    quoteGasAndPortionAdjustedDecimals: Joi.string().optional(),
    gasUseEstimate: Joi.string().required(),
    gasUseEstimateUSD: Joi.string().required(),
    simulationError: Joi.boolean().optional(),
    simulationStatus: Joi.string().required(),
    gasPriceWei: Joi.string().required(),
    blockNumber: Joi.string().required(),
    route: Joi.array().items(Joi.any()).required(),
    routeString: Joi.string().required(),
    methodParameters: Joi.object({
        calldata: Joi.string().required(),
        value: Joi.string().required(),
        to: Joi.string().required(),
    }).optional(),
    hitsCachedRoutes: Joi.boolean().optional(),
    portionBips: Joi.number().optional(),
    portionRecipient: Joi.string().optional(),
    portionAmount: Joi.string().optional(),
    portionAmountDecimals: Joi.string().optional(),
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZW1hLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGliL2hhbmRsZXJzL3NjaGVtYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEdBQUcsTUFBTSxXQUFXLENBQUM7QUF5QzVCLE1BQU0sQ0FBQyxNQUFNLHNCQUFzQixHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUM7SUFDdEQsT0FBTyxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDaEMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDL0IsY0FBYyxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDdkMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDOUIsYUFBYSxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDdEMsZ0JBQWdCLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRTtJQUN6Qyx3QkFBd0IsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFO0lBQ2pELG1CQUFtQixFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDNUMsMkJBQTJCLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRTtJQUNwRCwwQkFBMEIsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFO0lBQ25ELGtDQUFrQyxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDM0QsY0FBYyxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDdkMsaUJBQWlCLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRTtJQUMxQyxlQUFlLEVBQUUsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDLFFBQVEsRUFBRTtJQUN6QyxnQkFBZ0IsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFO0lBQ3pDLFdBQVcsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFO0lBQ3BDLFdBQVcsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFO0lBQ3BDLEtBQUssRUFBRSxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLFFBQVEsRUFBRTtJQUM5QyxXQUFXLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRTtJQUNwQyxnQkFBZ0IsRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDO1FBQzNCLFFBQVEsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFO1FBQ2pDLEtBQUssRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFO1FBQzlCLEVBQUUsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFO0tBQzVCLENBQUMsQ0FBQyxRQUFRLEVBQUU7SUFDYixnQkFBZ0IsRUFBRSxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUMsUUFBUSxFQUFFO0lBQzFDLFdBQVcsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFO0lBQ3BDLGdCQUFnQixFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDekMsYUFBYSxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDdEMscUJBQXFCLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRTtDQUMvQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgSm9pIGZyb20gXCJAaGFwaS9qb2lcIjtcbmltcG9ydCB7IE1ldGhvZFBhcmFtZXRlcnMgfSBmcm9tIFwiQHZvdG9waWEvc21hcnQtb3JkZXItcm91dGVyXCI7XG5cbmV4cG9ydCB0eXBlIFRva2VuSW5Sb3V0ZSA9IHtcbiAgYWRkcmVzczogc3RyaW5nO1xuXG4gIHN5bWJvbDogc3RyaW5nO1xuICBkZWNpbWFsczogc3RyaW5nO1xuICBidXlGZWVCcHM/OiBzdHJpbmc7XG4gIHNlbGxGZWVCcHM/OiBzdHJpbmc7XG59O1xuXG5leHBvcnQgdHlwZSBWM1Bvb2xJblJvdXRlID0ge1xuICB0eXBlOiBcInYzLXBvb2xcIjtcbiAgYWRkcmVzczogc3RyaW5nO1xuICB0b2tlbkluOiBUb2tlbkluUm91dGU7XG4gIHRva2VuT3V0OiBUb2tlbkluUm91dGU7XG4gIHNxcnRSYXRpb1g5Njogc3RyaW5nO1xuICBsaXF1aWRpdHk6IHN0cmluZztcbiAgdGlja0N1cnJlbnQ6IHN0cmluZztcbiAgZmVlOiBzdHJpbmc7XG4gIGFtb3VudEluPzogc3RyaW5nO1xuICBhbW91bnRPdXQ/OiBzdHJpbmc7XG59O1xuXG5leHBvcnQgdHlwZSBWMlJlc2VydmUgPSB7XG4gIHRva2VuOiBUb2tlbkluUm91dGU7XG4gIHF1b3RpZW50OiBzdHJpbmc7XG59O1xuXG5leHBvcnQgdHlwZSBWMlBvb2xJblJvdXRlID0ge1xuICB0eXBlOiBcInYyLXBvb2xcIjtcbiAgYWRkcmVzczogc3RyaW5nO1xuICB0b2tlbkluOiBUb2tlbkluUm91dGU7XG4gIHRva2VuT3V0OiBUb2tlbkluUm91dGU7XG4gIHJlc2VydmUwOiBWMlJlc2VydmU7XG4gIHJlc2VydmUxOiBWMlJlc2VydmU7XG4gIGFtb3VudEluPzogc3RyaW5nO1xuICBhbW91bnRPdXQ/OiBzdHJpbmc7XG59O1xuXG5leHBvcnQgY29uc3QgUXVvdGVSZXNwb25zZVNjaGVtYUpvaSA9IEpvaS5vYmplY3QoKS5rZXlzKHtcbiAgcXVvdGVJZDogSm9pLnN0cmluZygpLnJlcXVpcmVkKCksXG4gIGFtb3VudDogSm9pLnN0cmluZygpLnJlcXVpcmVkKCksXG4gIGFtb3VudERlY2ltYWxzOiBKb2kuc3RyaW5nKCkucmVxdWlyZWQoKSxcbiAgcXVvdGU6IEpvaS5zdHJpbmcoKS5yZXF1aXJlZCgpLFxuICBxdW90ZURlY2ltYWxzOiBKb2kuc3RyaW5nKCkucmVxdWlyZWQoKSxcbiAgcXVvdGVHYXNBZGp1c3RlZDogSm9pLnN0cmluZygpLnJlcXVpcmVkKCksXG4gIHF1b3RlR2FzQWRqdXN0ZWREZWNpbWFsczogSm9pLnN0cmluZygpLnJlcXVpcmVkKCksXG4gIGdhc1VzZUVzdGltYXRlUXVvdGU6IEpvaS5zdHJpbmcoKS5yZXF1aXJlZCgpLFxuICBnYXNVc2VFc3RpbWF0ZVF1b3RlRGVjaW1hbHM6IEpvaS5zdHJpbmcoKS5yZXF1aXJlZCgpLFxuICBxdW90ZUdhc0FuZFBvcnRpb25BZGp1c3RlZDogSm9pLnN0cmluZygpLm9wdGlvbmFsKCksXG4gIHF1b3RlR2FzQW5kUG9ydGlvbkFkanVzdGVkRGVjaW1hbHM6IEpvaS5zdHJpbmcoKS5vcHRpb25hbCgpLFxuICBnYXNVc2VFc3RpbWF0ZTogSm9pLnN0cmluZygpLnJlcXVpcmVkKCksXG4gIGdhc1VzZUVzdGltYXRlVVNEOiBKb2kuc3RyaW5nKCkucmVxdWlyZWQoKSxcbiAgc2ltdWxhdGlvbkVycm9yOiBKb2kuYm9vbGVhbigpLm9wdGlvbmFsKCksXG4gIHNpbXVsYXRpb25TdGF0dXM6IEpvaS5zdHJpbmcoKS5yZXF1aXJlZCgpLFxuICBnYXNQcmljZVdlaTogSm9pLnN0cmluZygpLnJlcXVpcmVkKCksXG4gIGJsb2NrTnVtYmVyOiBKb2kuc3RyaW5nKCkucmVxdWlyZWQoKSxcbiAgcm91dGU6IEpvaS5hcnJheSgpLml0ZW1zKEpvaS5hbnkoKSkucmVxdWlyZWQoKSxcbiAgcm91dGVTdHJpbmc6IEpvaS5zdHJpbmcoKS5yZXF1aXJlZCgpLFxuICBtZXRob2RQYXJhbWV0ZXJzOiBKb2kub2JqZWN0KHtcbiAgICBjYWxsZGF0YTogSm9pLnN0cmluZygpLnJlcXVpcmVkKCksXG4gICAgdmFsdWU6IEpvaS5zdHJpbmcoKS5yZXF1aXJlZCgpLFxuICAgIHRvOiBKb2kuc3RyaW5nKCkucmVxdWlyZWQoKSxcbiAgfSkub3B0aW9uYWwoKSxcbiAgaGl0c0NhY2hlZFJvdXRlczogSm9pLmJvb2xlYW4oKS5vcHRpb25hbCgpLFxuICBwb3J0aW9uQmlwczogSm9pLm51bWJlcigpLm9wdGlvbmFsKCksXG4gIHBvcnRpb25SZWNpcGllbnQ6IEpvaS5zdHJpbmcoKS5vcHRpb25hbCgpLFxuICBwb3J0aW9uQW1vdW50OiBKb2kuc3RyaW5nKCkub3B0aW9uYWwoKSxcbiAgcG9ydGlvbkFtb3VudERlY2ltYWxzOiBKb2kuc3RyaW5nKCkub3B0aW9uYWwoKSxcbn0pO1xuXG5leHBvcnQgdHlwZSBRdW90ZVJlc3BvbnNlID0ge1xuICBxdW90ZUlkOiBzdHJpbmc7XG4gIGFtb3VudDogc3RyaW5nO1xuICBhbW91bnREZWNpbWFsczogc3RyaW5nO1xuICBxdW90ZTogc3RyaW5nO1xuICBxdW90ZURlY2ltYWxzOiBzdHJpbmc7XG4gIHF1b3RlR2FzQWRqdXN0ZWQ6IHN0cmluZztcbiAgcXVvdGVHYXNBZGp1c3RlZERlY2ltYWxzOiBzdHJpbmc7XG4gIHF1b3RlR2FzQW5kUG9ydGlvbkFkanVzdGVkPzogc3RyaW5nO1xuICBxdW90ZUdhc0FuZFBvcnRpb25BZGp1c3RlZERlY2ltYWxzPzogc3RyaW5nO1xuICBnYXNVc2VFc3RpbWF0ZTogc3RyaW5nO1xuICBnYXNVc2VFc3RpbWF0ZVF1b3RlOiBzdHJpbmc7XG4gIGdhc1VzZUVzdGltYXRlUXVvdGVEZWNpbWFsczogc3RyaW5nO1xuICBnYXNVc2VFc3RpbWF0ZVVTRDogc3RyaW5nO1xuICBzaW11bGF0aW9uRXJyb3I/OiBib29sZWFuO1xuICBzaW11bGF0aW9uU3RhdHVzOiBzdHJpbmc7XG4gIGdhc1ByaWNlV2VpOiBzdHJpbmc7XG4gIGJsb2NrTnVtYmVyOiBzdHJpbmc7XG4gIHJvdXRlOiBBcnJheTwoVjNQb29sSW5Sb3V0ZSB8IFYyUG9vbEluUm91dGUpW10+O1xuICByb3V0ZVN0cmluZzogc3RyaW5nO1xuICBtZXRob2RQYXJhbWV0ZXJzPzogTWV0aG9kUGFyYW1ldGVycztcbiAgaGl0c0NhY2hlZFJvdXRlcz86IGJvb2xlYW47XG4gIHBvcnRpb25CaXBzPzogbnVtYmVyO1xuICBwb3J0aW9uUmVjaXBpZW50Pzogc3RyaW5nO1xuICBwb3J0aW9uQW1vdW50Pzogc3RyaW5nO1xuICBwb3J0aW9uQW1vdW50RGVjaW1hbHM/OiBzdHJpbmc7XG59O1xuIl19