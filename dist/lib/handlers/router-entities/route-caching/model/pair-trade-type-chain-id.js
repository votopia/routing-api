/**
 * Class used to model the partition key of the CachedRoutes cache database and configuration.
 */
export class PairTradeTypeChainId {
    constructor({ tokenIn, tokenOut, tradeType }) {
        this.tokenIn = tokenIn.toLowerCase(); // All token addresses should be lower case for normalization.
        this.tokenOut = tokenOut.toLowerCase(); // All token addresses should be lower case for normalization.
        this.tradeType = tradeType;
    }
    toString() {
        return `${this.tokenIn}/${this.tokenOut}/${this.tradeType}`;
    }
    static fromCachedRoutes(cachedRoutes) {
        return new PairTradeTypeChainId({
            tokenIn: cachedRoutes.tokenIn.address,
            tokenOut: cachedRoutes.tokenOut.address,
            tradeType: cachedRoutes.tradeType,
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFpci10cmFkZS10eXBlLWNoYWluLWlkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vbGliL2hhbmRsZXJzL3JvdXRlci1lbnRpdGllcy9yb3V0ZS1jYWNoaW5nL21vZGVsL3BhaXItdHJhZGUtdHlwZS1jaGFpbi1pZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFTQTs7R0FFRztBQUNILE1BQU0sT0FBTyxvQkFBb0I7SUFLL0IsWUFBWSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUE0QjtRQUNwRSxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLDhEQUE4RDtRQUNwRyxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLDhEQUE4RDtRQUN0RyxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztJQUM3QixDQUFDO0lBRU0sUUFBUTtRQUNiLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO0lBQzlELENBQUM7SUFFTSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsWUFBMEI7UUFDdkQsT0FBTyxJQUFJLG9CQUFvQixDQUFDO1lBQzlCLE9BQU8sRUFBRSxZQUFZLENBQUMsT0FBTyxDQUFDLE9BQU87WUFDckMsUUFBUSxFQUFFLFlBQVksQ0FBQyxRQUFRLENBQUMsT0FBTztZQUN2QyxTQUFTLEVBQUUsWUFBWSxDQUFDLFNBQVM7U0FDbEMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVHJhZGVUeXBlIH0gZnJvbSBcIkB2b3RvcGlhL3Nkay1jb3JlXCI7XG5pbXBvcnQgeyBDYWNoZWRSb3V0ZXMgfSBmcm9tIFwiQHZvdG9waWEvc21hcnQtb3JkZXItcm91dGVyXCI7XG5cbmludGVyZmFjZSBQYWlyVHJhZGVUeXBlQ2hhaW5JZEFyZ3Mge1xuICB0b2tlbkluOiBzdHJpbmc7XG4gIHRva2VuT3V0OiBzdHJpbmc7XG4gIHRyYWRlVHlwZTogVHJhZGVUeXBlO1xufVxuXG4vKipcbiAqIENsYXNzIHVzZWQgdG8gbW9kZWwgdGhlIHBhcnRpdGlvbiBrZXkgb2YgdGhlIENhY2hlZFJvdXRlcyBjYWNoZSBkYXRhYmFzZSBhbmQgY29uZmlndXJhdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIFBhaXJUcmFkZVR5cGVDaGFpbklkIHtcbiAgcHVibGljIHJlYWRvbmx5IHRva2VuSW46IHN0cmluZztcbiAgcHVibGljIHJlYWRvbmx5IHRva2VuT3V0OiBzdHJpbmc7XG4gIHB1YmxpYyByZWFkb25seSB0cmFkZVR5cGU6IFRyYWRlVHlwZTtcblxuICBjb25zdHJ1Y3Rvcih7IHRva2VuSW4sIHRva2VuT3V0LCB0cmFkZVR5cGUgfTogUGFpclRyYWRlVHlwZUNoYWluSWRBcmdzKSB7XG4gICAgdGhpcy50b2tlbkluID0gdG9rZW5Jbi50b0xvd2VyQ2FzZSgpOyAvLyBBbGwgdG9rZW4gYWRkcmVzc2VzIHNob3VsZCBiZSBsb3dlciBjYXNlIGZvciBub3JtYWxpemF0aW9uLlxuICAgIHRoaXMudG9rZW5PdXQgPSB0b2tlbk91dC50b0xvd2VyQ2FzZSgpOyAvLyBBbGwgdG9rZW4gYWRkcmVzc2VzIHNob3VsZCBiZSBsb3dlciBjYXNlIGZvciBub3JtYWxpemF0aW9uLlxuICAgIHRoaXMudHJhZGVUeXBlID0gdHJhZGVUeXBlO1xuICB9XG5cbiAgcHVibGljIHRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAke3RoaXMudG9rZW5Jbn0vJHt0aGlzLnRva2VuT3V0fS8ke3RoaXMudHJhZGVUeXBlfWA7XG4gIH1cblxuICBwdWJsaWMgc3RhdGljIGZyb21DYWNoZWRSb3V0ZXMoY2FjaGVkUm91dGVzOiBDYWNoZWRSb3V0ZXMpOiBQYWlyVHJhZGVUeXBlQ2hhaW5JZCB7XG4gICAgcmV0dXJuIG5ldyBQYWlyVHJhZGVUeXBlQ2hhaW5JZCh7XG4gICAgICB0b2tlbkluOiBjYWNoZWRSb3V0ZXMudG9rZW5Jbi5hZGRyZXNzLFxuICAgICAgdG9rZW5PdXQ6IGNhY2hlZFJvdXRlcy50b2tlbk91dC5hZGRyZXNzLFxuICAgICAgdHJhZGVUeXBlOiBjYWNoZWRSb3V0ZXMudHJhZGVUeXBlLFxuICAgIH0pO1xuICB9XG59XG4iXX0=