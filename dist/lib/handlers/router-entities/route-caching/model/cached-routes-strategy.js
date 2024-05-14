import { CurrencyAmount, TradeType } from "@votopia/sdk-core";
import { CacheMode } from "@votopia/smart-order-router";
/**
 * Models out the strategy for categorizing cached routes into buckets by amount traded
 */
export class CachedRoutesStrategy {
    /**
     * @param pair
     * @param tradeType
     * @param chainId
     * @param buckets
     */
    constructor({ pair, tradeType, buckets }) {
        this.pair = pair;
        this._tradeType = tradeType;
        // Used for deciding to show metrics in the dashboard related to Tapcompare
        this.willTapcompare = buckets.find((bucket) => bucket.cacheMode == CacheMode.Tapcompare) != undefined;
        // It is important that we sort the buckets in ascendant order for the algorithm to work correctly.
        // For a strange reason the `.sort()` function was comparing the number as strings, so I had to pass a compareFn.
        this.buckets = buckets.map((params) => params.bucket).sort((a, b) => a - b);
        // Create a Map<bucket, CachedRoutesBucket> for easy lookup once we find a bucket.
        this.bucketsMap = new Map(buckets.map((params) => [params.bucket, params]));
    }
    get tradeType() {
        return this._tradeType == TradeType.EXACT_INPUT ? "ExactIn" : "ExactOut";
    }
    readablePairTradeTypeChainId() {
        return `${this.pair.toUpperCase()}/${this.tradeType}`;
    }
    bucketPairs() {
        if (this.buckets.length > 0) {
            const firstBucket = [[0, this.buckets[0]]];
            const middleBuckets = this.buckets.length > 1
                ? this.buckets.slice(0, -1).map((bucket, i) => [bucket, this.buckets[i + 1]])
                : [];
            const lastBucket = [[this.buckets.slice(-1)[0], -1]];
            return firstBucket.concat(middleBuckets).concat(lastBucket);
        }
        else {
            return [];
        }
    }
    /**
     * Given an amount, we will search the bucket that has a cached route for that amount based on the CachedRoutesBucket array
     * @param amount
     */
    getCachingBucket(amount) {
        // Find the first bucket which is greater or equal than the amount.
        // If no bucket is found it means it's not supposed to be cached.
        // e.g. let buckets = [10, 50, 100, 500, 1000]
        // e.g.1. if amount = 0.10, then bucket = 10
        // e.g.2. if amount = 501, then bucket = 1000
        // e.g.3. If amount = 1001 then bucket = undefined
        const bucket = this.buckets.find((bucket) => {
            // Create a CurrencyAmount object to compare the amount with the bucket.
            const bucketCurrency = CurrencyAmount.fromRawAmount(amount.currency, bucket * 10 ** amount.currency.decimals);
            // Given that the array of buckets is sorted, we want to find the first bucket that makes the amount lessThanOrEqual to the bucket
            // refer to the examples above
            return amount.lessThan(bucketCurrency) || amount.equalTo(bucketCurrency);
        });
        if (bucket) {
            // if a bucket was found, return the CachedRoutesBucket associated to that bucket.
            return this.bucketsMap.get(bucket);
        }
        return undefined;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGVkLXJvdXRlcy1zdHJhdGVneS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL2xpYi9oYW5kbGVycy9yb3V0ZXItZW50aXRpZXMvcm91dGUtY2FjaGluZy9tb2RlbC9jYWNoZWQtcm91dGVzLXN0cmF0ZWd5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBWSxjQUFjLEVBQUUsU0FBUyxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFFeEUsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLDZCQUE2QixDQUFDO0FBU3hEOztHQUVHO0FBQ0gsTUFBTSxPQUFPLG9CQUFvQjtJQVEvQjs7Ozs7T0FLRztJQUNILFlBQVksRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBNEI7UUFDaEUsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDakIsSUFBSSxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUM7UUFFNUIsMkVBQTJFO1FBQzNFLElBQUksQ0FBQyxjQUFjLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLFNBQVMsSUFBSSxTQUFTLENBQUMsVUFBVSxDQUFDLElBQUksU0FBUyxDQUFDO1FBRXRHLG1HQUFtRztRQUNuRyxpSEFBaUg7UUFDakgsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBRTVFLGtGQUFrRjtRQUNsRixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDOUUsQ0FBQztJQUVELElBQVcsU0FBUztRQUNsQixPQUFPLElBQUksQ0FBQyxVQUFVLElBQUksU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUM7SUFDM0UsQ0FBQztJQUVNLDRCQUE0QjtRQUNqQyxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDeEQsQ0FBQztJQUVNLFdBQVc7UUFDaEIsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDM0IsTUFBTSxXQUFXLEdBQXVCLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0QsTUFBTSxhQUFhLEdBQ2pCLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUM7Z0JBQ3JCLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFvQixFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFFLENBQUMsQ0FBQztnQkFDaEcsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNULE1BQU0sVUFBVSxHQUF1QixDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFekUsT0FBTyxXQUFXLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUM3RDthQUFNO1lBQ0wsT0FBTyxFQUFFLENBQUM7U0FDWDtJQUNILENBQUM7SUFFRDs7O09BR0c7SUFDSSxnQkFBZ0IsQ0FBQyxNQUFnQztRQUN0RCxtRUFBbUU7UUFDbkUsaUVBQWlFO1FBQ2pFLDhDQUE4QztRQUM5Qyw0Q0FBNEM7UUFDNUMsNkNBQTZDO1FBQzdDLGtEQUFrRDtRQUNsRCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQWMsRUFBRSxFQUFFO1lBQ2xELHdFQUF3RTtZQUN4RSxNQUFNLGNBQWMsR0FBRyxjQUFjLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsTUFBTSxHQUFHLEVBQUUsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRTlHLGtJQUFrSTtZQUNsSSw4QkFBOEI7WUFDOUIsT0FBTyxNQUFNLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDM0UsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLE1BQU0sRUFBRTtZQUNWLGtGQUFrRjtZQUNsRixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ3BDO1FBRUQsT0FBTyxTQUFTLENBQUM7SUFDbkIsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ3VycmVuY3ksIEN1cnJlbmN5QW1vdW50LCBUcmFkZVR5cGUgfSBmcm9tIFwiQHZvdG9waWEvc2RrLWNvcmVcIjtcbmltcG9ydCB7IENhY2hlZFJvdXRlc0J1Y2tldCB9IGZyb20gXCIuL2NhY2hlZC1yb3V0ZXMtYnVja2V0XCI7XG5pbXBvcnQgeyBDYWNoZU1vZGUgfSBmcm9tIFwiQHZvdG9waWEvc21hcnQtb3JkZXItcm91dGVyXCI7XG5cbmludGVyZmFjZSBDYWNoZWRSb3V0ZXNTdHJhdGVneUFyZ3Mge1xuICBwYWlyOiBzdHJpbmc7XG4gIHRyYWRlVHlwZTogVHJhZGVUeXBlO1xuXG4gIGJ1Y2tldHM6IENhY2hlZFJvdXRlc0J1Y2tldFtdO1xufVxuXG4vKipcbiAqIE1vZGVscyBvdXQgdGhlIHN0cmF0ZWd5IGZvciBjYXRlZ29yaXppbmcgY2FjaGVkIHJvdXRlcyBpbnRvIGJ1Y2tldHMgYnkgYW1vdW50IHRyYWRlZFxuICovXG5leHBvcnQgY2xhc3MgQ2FjaGVkUm91dGVzU3RyYXRlZ3kge1xuICByZWFkb25seSBwYWlyOiBzdHJpbmc7XG4gIHJlYWRvbmx5IF90cmFkZVR5cGU6IFRyYWRlVHlwZTtcblxuICByZWFkb25seSB3aWxsVGFwY29tcGFyZTogYm9vbGVhbjtcbiAgcHJpdmF0ZSBidWNrZXRzOiBudW1iZXJbXTtcbiAgcHJpdmF0ZSBidWNrZXRzTWFwOiBNYXA8bnVtYmVyLCBDYWNoZWRSb3V0ZXNCdWNrZXQ+O1xuXG4gIC8qKlxuICAgKiBAcGFyYW0gcGFpclxuICAgKiBAcGFyYW0gdHJhZGVUeXBlXG4gICAqIEBwYXJhbSBjaGFpbklkXG4gICAqIEBwYXJhbSBidWNrZXRzXG4gICAqL1xuICBjb25zdHJ1Y3Rvcih7IHBhaXIsIHRyYWRlVHlwZSwgYnVja2V0cyB9OiBDYWNoZWRSb3V0ZXNTdHJhdGVneUFyZ3MpIHtcbiAgICB0aGlzLnBhaXIgPSBwYWlyO1xuICAgIHRoaXMuX3RyYWRlVHlwZSA9IHRyYWRlVHlwZTtcblxuICAgIC8vIFVzZWQgZm9yIGRlY2lkaW5nIHRvIHNob3cgbWV0cmljcyBpbiB0aGUgZGFzaGJvYXJkIHJlbGF0ZWQgdG8gVGFwY29tcGFyZVxuICAgIHRoaXMud2lsbFRhcGNvbXBhcmUgPSBidWNrZXRzLmZpbmQoKGJ1Y2tldCkgPT4gYnVja2V0LmNhY2hlTW9kZSA9PSBDYWNoZU1vZGUuVGFwY29tcGFyZSkgIT0gdW5kZWZpbmVkO1xuXG4gICAgLy8gSXQgaXMgaW1wb3J0YW50IHRoYXQgd2Ugc29ydCB0aGUgYnVja2V0cyBpbiBhc2NlbmRhbnQgb3JkZXIgZm9yIHRoZSBhbGdvcml0aG0gdG8gd29yayBjb3JyZWN0bHkuXG4gICAgLy8gRm9yIGEgc3RyYW5nZSByZWFzb24gdGhlIGAuc29ydCgpYCBmdW5jdGlvbiB3YXMgY29tcGFyaW5nIHRoZSBudW1iZXIgYXMgc3RyaW5ncywgc28gSSBoYWQgdG8gcGFzcyBhIGNvbXBhcmVGbi5cbiAgICB0aGlzLmJ1Y2tldHMgPSBidWNrZXRzLm1hcCgocGFyYW1zKSA9PiBwYXJhbXMuYnVja2V0KS5zb3J0KChhLCBiKSA9PiBhIC0gYik7XG5cbiAgICAvLyBDcmVhdGUgYSBNYXA8YnVja2V0LCBDYWNoZWRSb3V0ZXNCdWNrZXQ+IGZvciBlYXN5IGxvb2t1cCBvbmNlIHdlIGZpbmQgYSBidWNrZXQuXG4gICAgdGhpcy5idWNrZXRzTWFwID0gbmV3IE1hcChidWNrZXRzLm1hcCgocGFyYW1zKSA9PiBbcGFyYW1zLmJ1Y2tldCwgcGFyYW1zXSkpO1xuICB9XG5cbiAgcHVibGljIGdldCB0cmFkZVR5cGUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5fdHJhZGVUeXBlID09IFRyYWRlVHlwZS5FWEFDVF9JTlBVVCA/IFwiRXhhY3RJblwiIDogXCJFeGFjdE91dFwiO1xuICB9XG5cbiAgcHVibGljIHJlYWRhYmxlUGFpclRyYWRlVHlwZUNoYWluSWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYCR7dGhpcy5wYWlyLnRvVXBwZXJDYXNlKCl9LyR7dGhpcy50cmFkZVR5cGV9YDtcbiAgfVxuXG4gIHB1YmxpYyBidWNrZXRQYWlycygpOiBbbnVtYmVyLCBudW1iZXJdW10ge1xuICAgIGlmICh0aGlzLmJ1Y2tldHMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgZmlyc3RCdWNrZXQ6IFtudW1iZXIsIG51bWJlcl1bXSA9IFtbMCwgdGhpcy5idWNrZXRzWzBdXV07XG4gICAgICBjb25zdCBtaWRkbGVCdWNrZXRzOiBbbnVtYmVyLCBudW1iZXJdW10gPVxuICAgICAgICB0aGlzLmJ1Y2tldHMubGVuZ3RoID4gMVxuICAgICAgICAgID8gdGhpcy5idWNrZXRzLnNsaWNlKDAsIC0xKS5tYXAoKGJ1Y2tldCwgaSk6IFtudW1iZXIsIG51bWJlcl0gPT4gW2J1Y2tldCwgdGhpcy5idWNrZXRzW2kgKyAxXSFdKVxuICAgICAgICAgIDogW107XG4gICAgICBjb25zdCBsYXN0QnVja2V0OiBbbnVtYmVyLCBudW1iZXJdW10gPSBbW3RoaXMuYnVja2V0cy5zbGljZSgtMSlbMF0sIC0xXV07XG5cbiAgICAgIHJldHVybiBmaXJzdEJ1Y2tldC5jb25jYXQobWlkZGxlQnVja2V0cykuY29uY2F0KGxhc3RCdWNrZXQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdpdmVuIGFuIGFtb3VudCwgd2Ugd2lsbCBzZWFyY2ggdGhlIGJ1Y2tldCB0aGF0IGhhcyBhIGNhY2hlZCByb3V0ZSBmb3IgdGhhdCBhbW91bnQgYmFzZWQgb24gdGhlIENhY2hlZFJvdXRlc0J1Y2tldCBhcnJheVxuICAgKiBAcGFyYW0gYW1vdW50XG4gICAqL1xuICBwdWJsaWMgZ2V0Q2FjaGluZ0J1Y2tldChhbW91bnQ6IEN1cnJlbmN5QW1vdW50PEN1cnJlbmN5Pik6IENhY2hlZFJvdXRlc0J1Y2tldCB8IHVuZGVmaW5lZCB7XG4gICAgLy8gRmluZCB0aGUgZmlyc3QgYnVja2V0IHdoaWNoIGlzIGdyZWF0ZXIgb3IgZXF1YWwgdGhhbiB0aGUgYW1vdW50LlxuICAgIC8vIElmIG5vIGJ1Y2tldCBpcyBmb3VuZCBpdCBtZWFucyBpdCdzIG5vdCBzdXBwb3NlZCB0byBiZSBjYWNoZWQuXG4gICAgLy8gZS5nLiBsZXQgYnVja2V0cyA9IFsxMCwgNTAsIDEwMCwgNTAwLCAxMDAwXVxuICAgIC8vIGUuZy4xLiBpZiBhbW91bnQgPSAwLjEwLCB0aGVuIGJ1Y2tldCA9IDEwXG4gICAgLy8gZS5nLjIuIGlmIGFtb3VudCA9IDUwMSwgdGhlbiBidWNrZXQgPSAxMDAwXG4gICAgLy8gZS5nLjMuIElmIGFtb3VudCA9IDEwMDEgdGhlbiBidWNrZXQgPSB1bmRlZmluZWRcbiAgICBjb25zdCBidWNrZXQgPSB0aGlzLmJ1Y2tldHMuZmluZCgoYnVja2V0OiBudW1iZXIpID0+IHtcbiAgICAgIC8vIENyZWF0ZSBhIEN1cnJlbmN5QW1vdW50IG9iamVjdCB0byBjb21wYXJlIHRoZSBhbW91bnQgd2l0aCB0aGUgYnVja2V0LlxuICAgICAgY29uc3QgYnVja2V0Q3VycmVuY3kgPSBDdXJyZW5jeUFtb3VudC5mcm9tUmF3QW1vdW50KGFtb3VudC5jdXJyZW5jeSwgYnVja2V0ICogMTAgKiogYW1vdW50LmN1cnJlbmN5LmRlY2ltYWxzKTtcblxuICAgICAgLy8gR2l2ZW4gdGhhdCB0aGUgYXJyYXkgb2YgYnVja2V0cyBpcyBzb3J0ZWQsIHdlIHdhbnQgdG8gZmluZCB0aGUgZmlyc3QgYnVja2V0IHRoYXQgbWFrZXMgdGhlIGFtb3VudCBsZXNzVGhhbk9yRXF1YWwgdG8gdGhlIGJ1Y2tldFxuICAgICAgLy8gcmVmZXIgdG8gdGhlIGV4YW1wbGVzIGFib3ZlXG4gICAgICByZXR1cm4gYW1vdW50Lmxlc3NUaGFuKGJ1Y2tldEN1cnJlbmN5KSB8fCBhbW91bnQuZXF1YWxUbyhidWNrZXRDdXJyZW5jeSk7XG4gICAgfSk7XG5cbiAgICBpZiAoYnVja2V0KSB7XG4gICAgICAvLyBpZiBhIGJ1Y2tldCB3YXMgZm91bmQsIHJldHVybiB0aGUgQ2FjaGVkUm91dGVzQnVja2V0IGFzc29jaWF0ZWQgdG8gdGhhdCBidWNrZXQuXG4gICAgICByZXR1cm4gdGhpcy5idWNrZXRzTWFwLmdldChidWNrZXQpO1xuICAgIH1cblxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbn1cbiJdfQ==