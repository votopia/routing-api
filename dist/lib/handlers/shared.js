import { Percent, NATIVE_CURRENCY } from "@votopia/sdk-core";
export const SECONDS_PER_BLOCK = 30;
export const DEFAULT_ROUTING_CONFIG = {
    v3PoolSelection: {
        topN: 2,
        topNDirectSwaps: 2,
        topNTokenInOut: 2,
        topNSecondHop: 1,
        topNWithEachBaseToken: 3,
        topNWithBaseToken: 3,
    },
    maxSwapsPerPath: 3,
    minSplits: 1,
    maxSplits: 7,
    distributionPercent: 10,
    forceCrossProtocol: false,
};
export const QUOTE_SPEED_CONFIG = {
    standard: {},
    fast: {
        v2PoolSelection: {
            topN: 1,
            topNDirectSwaps: 1,
            topNTokenInOut: 1,
            topNSecondHop: 0,
            topNWithEachBaseToken: 1,
            topNWithBaseToken: 1,
        },
        v3PoolSelection: {
            topN: 1,
            topNDirectSwaps: 1,
            topNTokenInOut: 1,
            topNSecondHop: 0,
            topNWithEachBaseToken: 1,
            topNWithBaseToken: 1,
        },
        maxSwapsPerPath: 2,
        maxSplits: 1,
        distributionPercent: 100,
        writeToCachedRoutes: false,
    },
};
export const INTENT_SPECIFIC_CONFIG = {
    caching: {
        // When the intent is to create a cache entry, we should not use the cache
        useCachedRoutes: false,
        // This is *super* important to avoid an infinite loop of caching quotes calling themselves
        optimisticCachedRoutes: false,
    },
    quote: {
        // When the intent is to get a quote, we should use the cache and optimistic cached routes
        useCachedRoutes: true,
        optimisticCachedRoutes: true,
    },
    swap: {
        // When the intent is to prepare the swap, we can use cache, but it should not be optimistic
        useCachedRoutes: true,
        optimisticCachedRoutes: false,
    },
    pricing: {
        // When the intent is to get pricing, we should use the cache and optimistic cached routes
        useCachedRoutes: true,
        optimisticCachedRoutes: true,
    },
};
export const FEE_ON_TRANSFER_SPECIFIC_CONFIG = (enableFeeOnTransferFeeFetching) => {
    return {
        enableFeeOnTransferFeeFetching: enableFeeOnTransferFeeFetching,
    };
};
export async function tokenStringToCurrency(tokenListProvider, tokenProvider, tokenRaw, log) {
    const isAddress = (s) => s.length == 42 && s.startsWith("0x");
    let token = undefined;
    if (NATIVE_CURRENCY.symbol === tokenRaw.toUpperCase()) {
        token = NATIVE_CURRENCY;
    }
    else if (isAddress(tokenRaw)) {
        token = await tokenListProvider.getTokenByAddress(tokenRaw);
    }
    if (!token) {
        token = await tokenListProvider.getTokenBySymbol(tokenRaw);
    }
    if (token) {
        log.info({
            tokenAddress: token.wrapped.address,
        }, `Got input token from token list`);
        return token;
    }
    log.info(`Getting input token ${tokenRaw} from chain`);
    if (!token && isAddress(tokenRaw)) {
        const tokenAccessor = await tokenProvider.getTokens([tokenRaw]);
        return tokenAccessor.getTokenByAddress(tokenRaw);
    }
    return undefined;
}
export function parseSlippageTolerance(slippageTolerance) {
    const slippagePer10k = Math.round(parseFloat(slippageTolerance) * 100);
    return new Percent(slippagePer10k, 10000);
}
export function parseDeadline(deadline) {
    return Math.floor(Date.now() / 1000) + parseInt(deadline);
}
export function parsePortionPercent(portionBips) {
    return new Percent(portionBips, 10000);
}
export function parseFeeOptions(portionBips, portionRecipient) {
    if (!portionBips || !portionRecipient) {
        return undefined;
    }
    return { fee: parsePortionPercent(portionBips), recipient: portionRecipient };
}
export function parseFlatFeeOptions(portionAmount, portionRecipient) {
    if (!portionAmount || !portionRecipient) {
        return undefined;
    }
    return { amount: portionAmount, recipient: portionRecipient };
}
export function populateFeeOptions(type, portionBips, portionRecipient, portionAmount) {
    switch (type) {
        case "exactIn":
            const feeOptions = parseFeeOptions(portionBips, portionRecipient);
            return { fee: feeOptions };
        case "exactOut":
            const flatFeeOptions = parseFlatFeeOptions(portionAmount, portionRecipient);
            return { flatFee: flatFeeOptions };
        default:
            return undefined;
    }
}
export function computePortionAmount(currencyOut, portionBips) {
    if (!portionBips) {
        return undefined;
    }
    return currencyOut.multiply(parsePortionPercent(portionBips)).quotient.toString();
}
export const DEFAULT_DEADLINE = 600; // 10 minutes
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGliL2hhbmRsZXJzL3NoYXJlZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQTRCLE9BQU8sRUFBYyxlQUFlLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQVduRyxNQUFNLENBQUMsTUFBTSxpQkFBaUIsR0FBRyxFQUFFLENBQUM7QUFPcEMsTUFBTSxDQUFDLE1BQU0sc0JBQXNCLEdBQXNCO0lBQ3ZELGVBQWUsRUFBRTtRQUNmLElBQUksRUFBRSxDQUFDO1FBQ1AsZUFBZSxFQUFFLENBQUM7UUFDbEIsY0FBYyxFQUFFLENBQUM7UUFDakIsYUFBYSxFQUFFLENBQUM7UUFDaEIscUJBQXFCLEVBQUUsQ0FBQztRQUN4QixpQkFBaUIsRUFBRSxDQUFDO0tBQ3JCO0lBQ0QsZUFBZSxFQUFFLENBQUM7SUFDbEIsU0FBUyxFQUFFLENBQUM7SUFDWixTQUFTLEVBQUUsQ0FBQztJQUNaLG1CQUFtQixFQUFFLEVBQUU7SUFDdkIsa0JBQWtCLEVBQUUsS0FBSztDQUMxQixDQUFDO0FBV0YsTUFBTSxDQUFDLE1BQU0sa0JBQWtCLEdBQXdDO0lBQ3JFLFFBQVEsRUFBRSxFQUFFO0lBQ1osSUFBSSxFQUFFO1FBQ0osZUFBZSxFQUFFO1lBQ2YsSUFBSSxFQUFFLENBQUM7WUFDUCxlQUFlLEVBQUUsQ0FBQztZQUNsQixjQUFjLEVBQUUsQ0FBQztZQUNqQixhQUFhLEVBQUUsQ0FBQztZQUNoQixxQkFBcUIsRUFBRSxDQUFDO1lBQ3hCLGlCQUFpQixFQUFFLENBQUM7U0FDckI7UUFDRCxlQUFlLEVBQUU7WUFDZixJQUFJLEVBQUUsQ0FBQztZQUNQLGVBQWUsRUFBRSxDQUFDO1lBQ2xCLGNBQWMsRUFBRSxDQUFDO1lBQ2pCLGFBQWEsRUFBRSxDQUFDO1lBQ2hCLHFCQUFxQixFQUFFLENBQUM7WUFDeEIsaUJBQWlCLEVBQUUsQ0FBQztTQUNyQjtRQUNELGVBQWUsRUFBRSxDQUFD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UUFDaEIsT0FBTyxTQUFTLENBQUM7S0FDbEI7SUFFRCxPQUFPLFdBQVcsQ0FBQyxRQUFRLENBQUMsbUJBQW1CLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDcEYsQ0FBQztBQUVELE1BQU0sQ0FBQyxNQUFNLGdCQUFnQixHQUFHLEdBQUcsQ0FBQyxDQUFDLGFBQWEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDdXJyZW5jeSwgQ3VycmVuY3lBbW91bnQsIFBlcmNlbnQsIEZlZU9wdGlvbnMsIE5BVElWRV9DVVJSRU5DWSB9IGZyb20gXCJAdm90b3BpYS9zZGstY29yZVwiO1xuaW1wb3J0IHtcbiAgQWxwaGFSb3V0ZXJDb25maWcsXG4gIElUb2tlbkxpc3RQcm92aWRlcixcbiAgSVRva2VuUHJvdmlkZXIsXG4gIFByb3RvY29sUG9vbFNlbGVjdGlvbixcbn0gZnJvbSBcIkB2b3RvcGlhL3NtYXJ0LW9yZGVyLXJvdXRlclwiO1xuaW1wb3J0IExvZ2dlciBmcm9tIFwiYnVueWFuXCI7XG5cbmltcG9ydCB7IEJpZ051bWJlcmlzaCB9IGZyb20gXCJldGhlcnNcIjtcblxuZXhwb3J0IGNvbnN0IFNFQ09ORFNfUEVSX0JMT0NLID0gMzA7XG5cbmV4cG9ydCB0eXBlIEZsYXRGZWVPcHRpb25zID0ge1xuICBhbW91bnQ6IEJpZ051bWJlcmlzaDtcbiAgcmVjaXBpZW50OiBzdHJpbmc7XG59O1xuXG5leHBvcnQgY29uc3QgREVGQVVMVF9ST1VUSU5HX0NPTkZJRzogQWxwaGFSb3V0ZXJDb25maWcgPSB7XG4gIHYzUG9vbFNlbGVjdGlvbjoge1xuICAgIHRvcE46IDIsXG4gICAgdG9wTkRpcmVjdFN3YXBzOiAyLFxuICAgIHRvcE5Ub2tlbkluT3V0OiAyLFxuICAgIHRvcE5TZWNvbmRIb3A6IDEsXG4gICAgdG9wTldpdGhFYWNoQmFzZVRva2VuOiAzLFxuICAgIHRvcE5XaXRoQmFzZVRva2VuOiAzLFxuICB9LFxuICBtYXhTd2Fwc1BlclBhdGg6IDMsXG4gIG1pblNwbGl0czogMSxcbiAgbWF4U3BsaXRzOiA3LFxuICBkaXN0cmlidXRpb25QZXJjZW50OiAxMCxcbiAgZm9yY2VDcm9zc1Byb3RvY29sOiBmYWxzZSxcbn07XG5cbmV4cG9ydCB0eXBlIFF1b3RlU3BlZWRDb25maWcgPSB7XG4gIHYyUG9vbFNlbGVjdGlvbj86IFByb3RvY29sUG9vbFNlbGVjdGlvbjtcbiAgdjNQb29sU2VsZWN0aW9uPzogUHJvdG9jb2xQb29sU2VsZWN0aW9uO1xuICBtYXhTd2Fwc1BlclBhdGg/OiBudW1iZXI7XG4gIG1heFNwbGl0cz86IG51bWJlcjtcbiAgZGlzdHJpYnV0aW9uUGVyY2VudD86IG51bWJlcjtcbiAgd3JpdGVUb0NhY2hlZFJvdXRlcz86IGJvb2xlYW47XG59O1xuXG5leHBvcnQgY29uc3QgUVVPVEVfU1BFRURfQ09ORklHOiB7IFtrZXk6IHN0cmluZ106IFF1b3RlU3BlZWRDb25maWcgfSA9IHtcbiAgc3RhbmRhcmQ6IHt9LFxuICBmYXN0OiB7XG4gICAgdjJQb29sU2VsZWN0aW9uOiB7XG4gICAgICB0b3BOOiAxLFxuICAgICAgdG9wTkRpcmVjdFN3YXBzOiAxLFxuICAgICAgdG9wTlRva2VuSW5PdXQ6IDEsXG4gICAgICB0b3BOU2Vjb25kSG9wOiAwLFxuICAgICAgdG9wTldpdGhFYWNoQmFzZVRva2VuOiAxLFxuICAgICAgdG9wTldpdGhCYXNlVG9rZW46IDEsXG4gICAgfSxcbiAgICB2M1Bvb2xTZWxlY3Rpb246IHtcbiAgICAgIHRvcE46IDEsXG4gICAgICB0b3BORGlyZWN0U3dhcHM6IDEsXG4gICAgICB0b3BOVG9rZW5Jbk91dDogMSxcbiAgICAgIHRvcE5TZWNvbmRIb3A6IDAsXG4gICAgICB0b3BOV2l0aEVhY2hCYXNlVG9rZW46IDEsXG4gICAgICB0b3BOV2l0aEJhc2VUb2tlbjogMSxcbiAgICB9LFxuICAgIG1heFN3YXBzUGVyUGF0aDogMixcbiAgICBtYXhTcGxpdHM6IDEsXG4gICAgZGlzdHJpYnV0aW9uUGVyY2VudDogMTAwLFxuICAgIHdyaXRlVG9DYWNoZWRSb3V0ZXM6IGZhbHNlLFxuICB9LFxufTtcblxuZXhwb3J0IHR5cGUgSW50ZW50U3BlY2lmaWNDb25maWcgPSB7XG4gIHVzZUNhY2hlZFJvdXRlcz86IGJvb2xlYW47XG4gIG9wdGltaXN0aWNDYWNoZWRSb3V0ZXM/OiBib29sZWFuO1xufTtcblxuZXhwb3J0IGNvbnN0IElOVEVOVF9TUEVDSUZJQ19DT05GSUc6IHsgW2tleTogc3RyaW5nXTogSW50ZW50U3BlY2lmaWNDb25maWcgfSA9IHtcbiAgY2FjaGluZzoge1xuICAgIC8vIFdoZW4gdGhlIGludGVudCBpcyB0byBjcmVhdGUgYSBjYWNoZSBlbnRyeSwgd2Ugc2hvdWxkIG5vdCB1c2UgdGhlIGNhY2hlXG4gICAgdXNlQ2FjaGVkUm91dGVzOiBmYWxzZSxcbiAgICAvLyBUaGlzIGlzICpzdXBlciogaW1wb3J0YW50IHRvIGF2b2lkIGFuIGluZmluaXRlIGxvb3Agb2YgY2FjaGluZyBxdW90ZXMgY2FsbGluZyB0aGVtc2VsdmVzXG4gICAgb3B0aW1pc3RpY0NhY2hlZFJvdXRlczogZmFsc2UsXG4gIH0sXG4gIHF1b3RlOiB7XG4gICAgLy8gV2hlbiB0aGUgaW50ZW50IGlzIHRvIGdldCBhIHF1b3RlLCB3ZSBzaG91bGQgdXNlIHRoZSBjYWNoZSBhbmQgb3B0aW1pc3RpYyBjYWNoZWQgcm91dGVzXG4gICAgdXNlQ2FjaGVkUm91dGVzOiB0cnVlLFxuICAgIG9wdGltaXN0aWNDYWNoZWRSb3V0ZXM6IHRydWUsXG4gIH0sXG4gIHN3YXA6IHtcbiAgICAvLyBXaGVuIHRoZSBpbnRlbnQgaXMgdG8gcHJlcGFyZSB0aGUgc3dhcCwgd2UgY2FuIHVzZSBjYWNoZSwgYnV0IGl0IHNob3VsZCBub3QgYmUgb3B0aW1pc3RpY1xuICAgIHVzZUNhY2hlZFJvdXRlczogdHJ1ZSxcbiAgICBvcHRpbWlzdGljQ2FjaGVkUm91dGVzOiBmYWxzZSxcbiAgfSxcbiAgcHJpY2luZzoge1xuICAgIC8vIFdoZW4gdGhlIGludGVudCBpcyB0byBnZXQgcHJpY2luZywgd2Ugc2hvdWxkIHVzZSB0aGUgY2FjaGUgYW5kIG9wdGltaXN0aWMgY2FjaGVkIHJvdXRlc1xuICAgIHVzZUNhY2hlZFJvdXRlczogdHJ1ZSxcbiAgICBvcHRpbWlzdGljQ2FjaGVkUm91dGVzOiB0cnVlLFxuICB9LFxufTtcblxuZXhwb3J0IHR5cGUgRmVlT25UcmFuc2ZlclNwZWNpZmljQ29uZmlnID0ge1xuICBlbmFibGVGZWVPblRyYW5zZmVyRmVlRmV0Y2hpbmc/OiBib29sZWFuO1xufTtcblxuZXhwb3J0IGNvbnN0IEZFRV9PTl9UUkFOU0ZFUl9TUEVDSUZJQ19DT05GSUcgPSAoXG4gIGVuYWJsZUZlZU9uVHJhbnNmZXJGZWVGZXRjaGluZz86IGJvb2xlYW5cbik6IEZlZU9uVHJhbnNmZXJTcGVjaWZpY0NvbmZpZyA9PiB7XG4gIHJldHVybiB7XG4gICAgZW5hYmxlRmVlT25UcmFuc2ZlckZlZUZldGNoaW5nOiBlbmFibGVGZWVPblRyYW5zZmVyRmVlRmV0Y2hpbmcsXG4gIH0gYXMgRmVlT25UcmFuc2ZlclNwZWNpZmljQ29uZmlnO1xufTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHRva2VuU3RyaW5nVG9DdXJyZW5jeShcbiAgdG9rZW5MaXN0UHJvdmlkZXI6IElUb2tlbkxpc3RQcm92aWRlcixcbiAgdG9rZW5Qcm92aWRlcjogSVRva2VuUHJvdmlkZXIsXG4gIHRva2VuUmF3OiBzdHJpbmcsXG4gIGxvZzogTG9nZ2VyXG4pOiBQcm9taXNlPEN1cnJlbmN5IHwgdW5kZWZpbmVkPiB7XG4gIGNvbnN0IGlzQWRkcmVzcyA9IChzOiBzdHJpbmcpID0+IHMubGVuZ3RoID09IDQyICYmIHMuc3RhcnRzV2l0aChcIjB4XCIpO1xuXG4gIGxldCB0b2tlbjogQ3VycmVuY3kgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cbiAgaWYgKE5BVElWRV9DVVJSRU5DWS5zeW1ib2wgPT09IHRva2VuUmF3LnRvVXBwZXJDYXNlKCkpIHtcbiAgICB0b2tlbiA9IE5BVElWRV9DVVJSRU5DWTtcbiAgfSBlbHNlIGlmIChpc0FkZHJlc3ModG9rZW5SYXcpKSB7XG4gICAgdG9rZW4gPSBhd2FpdCB0b2tlbkxpc3RQcm92aWRlci5nZXRUb2tlbkJ5QWRkcmVzcyh0b2tlblJhdyk7XG4gIH1cblxuICBpZiAoIXRva2VuKSB7XG4gICAgdG9rZW4gPSBhd2FpdCB0b2tlbkxpc3RQcm92aWRlci5nZXRUb2tlbkJ5U3ltYm9sKHRva2VuUmF3KTtcbiAgfVxuXG4gIGlmICh0b2tlbikge1xuICAgIGxvZy5pbmZvKFxuICAgICAge1xuICAgICAgICB0b2tlbkFkZHJlc3M6IHRva2VuLndyYXBwZWQuYWRkcmVzcyxcbiAgICAgIH0sXG4gICAgICBgR290IGlucHV0IHRva2VuIGZyb20gdG9rZW4gbGlzdGBcbiAgICApO1xuICAgIHJldHVybiB0b2tlbjtcbiAgfVxuXG4gIGxvZy5pbmZvKGBHZXR0aW5nIGlucHV0IHRva2VuICR7dG9rZW5SYXd9IGZyb20gY2hhaW5gKTtcbiAgaWYgKCF0b2tlbiAmJiBpc0FkZHJlc3ModG9rZW5SYXcpKSB7XG4gICAgY29uc3QgdG9rZW5BY2Nlc3NvciA9IGF3YWl0IHRva2VuUHJvdmlkZXIuZ2V0VG9rZW5zKFt0b2tlblJhd10pO1xuICAgIHJldHVybiB0b2tlbkFjY2Vzc29yLmdldFRva2VuQnlBZGRyZXNzKHRva2VuUmF3KTtcbiAgfVxuXG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVNsaXBwYWdlVG9sZXJhbmNlKHNsaXBwYWdlVG9sZXJhbmNlOiBzdHJpbmcpOiBQZXJjZW50IHtcbiAgY29uc3Qgc2xpcHBhZ2VQZXIxMGsgPSBNYXRoLnJvdW5kKHBhcnNlRmxvYXQoc2xpcHBhZ2VUb2xlcmFuY2UpICogMTAwKTtcbiAgcmV0dXJuIG5ldyBQZXJjZW50KHNsaXBwYWdlUGVyMTBrLCAxMF8wMDApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VEZWFkbGluZShkZWFkbGluZTogc3RyaW5nKTogbnVtYmVyIHtcbiAgcmV0dXJuIE1hdGguZmxvb3IoRGF0ZS5ub3coKSAvIDEwMDApICsgcGFyc2VJbnQoZGVhZGxpbmUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VQb3J0aW9uUGVyY2VudChwb3J0aW9uQmlwczogbnVtYmVyKTogUGVyY2VudCB7XG4gIHJldHVybiBuZXcgUGVyY2VudChwb3J0aW9uQmlwcywgMTBfMDAwKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRmVlT3B0aW9ucyhwb3J0aW9uQmlwcz86IG51bWJlciwgcG9ydGlvblJlY2lwaWVudD86IHN0cmluZyk6IEZlZU9wdGlvbnMgfCB1bmRlZmluZWQge1xuICBpZiAoIXBvcnRpb25CaXBzIHx8ICFwb3J0aW9uUmVjaXBpZW50KSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIHJldHVybiB7IGZlZTogcGFyc2VQb3J0aW9uUGVyY2VudChwb3J0aW9uQmlwcyksIHJlY2lwaWVudDogcG9ydGlvblJlY2lwaWVudCB9IGFzIEZlZU9wdGlvbnM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUZsYXRGZWVPcHRpb25zKHBvcnRpb25BbW91bnQ/OiBzdHJpbmcsIHBvcnRpb25SZWNpcGllbnQ/OiBzdHJpbmcpOiBGbGF0RmVlT3B0aW9ucyB8IHVuZGVmaW5lZCB7XG4gIGlmICghcG9ydGlvbkFtb3VudCB8fCAhcG9ydGlvblJlY2lwaWVudCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICByZXR1cm4geyBhbW91bnQ6IHBvcnRpb25BbW91bnQsIHJlY2lwaWVudDogcG9ydGlvblJlY2lwaWVudCB9IGFzIEZsYXRGZWVPcHRpb25zO1xufVxuXG5leHBvcnQgdHlwZSBBbGxGZWVPcHRpb25zID0ge1xuICBmZWU/OiBGZWVPcHRpb25zO1xuICBmbGF0RmVlPzogRmxhdEZlZU9wdGlvbnM7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gcG9wdWxhdGVGZWVPcHRpb25zKFxuICB0eXBlOiBzdHJpbmcsXG4gIHBvcnRpb25CaXBzPzogbnVtYmVyLFxuICBwb3J0aW9uUmVjaXBpZW50Pzogc3RyaW5nLFxuICBwb3J0aW9uQW1vdW50Pzogc3RyaW5nXG4pOiBBbGxGZWVPcHRpb25zIHwgdW5kZWZpbmVkIHtcbiAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSBcImV4YWN0SW5cIjpcbiAgICAgIGNvbnN0IGZlZU9wdGlvbnMgPSBwYXJzZUZlZU9wdGlvbnMocG9ydGlvbkJpcHMsIHBvcnRpb25SZWNpcGllbnQpO1xuICAgICAgcmV0dXJuIHsgZmVlOiBmZWVPcHRpb25zIH07XG4gICAgY2FzZSBcImV4YWN0T3V0XCI6XG4gICAgICBjb25zdCBmbGF0RmVlT3B0aW9ucyA9IHBhcnNlRmxhdEZlZU9wdGlvbnMocG9ydGlvbkFtb3VudCwgcG9ydGlvblJlY2lwaWVudCk7XG4gICAgICByZXR1cm4geyBmbGF0RmVlOiBmbGF0RmVlT3B0aW9ucyB9O1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlUG9ydGlvbkFtb3VudChjdXJyZW5jeU91dDogQ3VycmVuY3lBbW91bnQ8Q3VycmVuY3k+LCBwb3J0aW9uQmlwcz86IG51bWJlcik6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIGlmICghcG9ydGlvbkJpcHMpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgcmV0dXJuIGN1cnJlbmN5T3V0Lm11bHRpcGx5KHBhcnNlUG9ydGlvblBlcmNlbnQocG9ydGlvbkJpcHMpKS5xdW90aWVudC50b1N0cmluZygpO1xufVxuXG5leHBvcnQgY29uc3QgREVGQVVMVF9ERUFETElORSA9IDYwMDsgLy8gMTAgbWludXRlc1xuIl19