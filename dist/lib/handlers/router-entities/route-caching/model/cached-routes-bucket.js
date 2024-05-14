export class CachedRoutesBucket {
    constructor({ bucket, blocksToLive = 2, cacheMode, maxSplits = 0, withLastNCachedRoutes = 4, }) {
        this.bucket = bucket;
        this.blocksToLive = blocksToLive; // by default, we allow up to 2 blocks to live for a cached route
        this.cacheMode = cacheMode;
        this.maxSplits = maxSplits; // by default this value is 0, which means that any number of splits are allowed
        this.withLastNCachedRoutes = withLastNCachedRoutes; // Fetching the last 4 cached routes by default
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGVkLXJvdXRlcy1idWNrZXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9saWIvaGFuZGxlcnMvcm91dGVyLWVudGl0aWVzL3JvdXRlLWNhY2hpbmcvbW9kZWwvY2FjaGVkLXJvdXRlcy1idWNrZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBNEJBLE1BQU0sT0FBTyxrQkFBa0I7SUFPN0IsWUFBWSxFQUNWLE1BQU0sRUFDTixZQUFZLEdBQUcsQ0FBQyxFQUNoQixTQUFTLEVBQ1QsU0FBUyxHQUFHLENBQUMsRUFDYixxQkFBcUIsR0FBRyxDQUFDLEdBQ0Q7UUFDeEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUMsQ0FBQyxpRUFBaUU7UUFDbkcsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7UUFDM0IsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUMsQ0FBQyxnRkFBZ0Y7UUFDNUcsSUFBSSxDQUFDLHFCQUFxQixHQUFHLHFCQUFxQixDQUFDLENBQUMsK0NBQStDO0lBQ3JHLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENhY2hlTW9kZSB9IGZyb20gXCJAdm90b3BpYS9zbWFydC1vcmRlci1yb3V0ZXJcIjtcblxuaW50ZXJmYWNlIENhY2hlZFJvdXRlc0J1Y2tldHNBcmdzIHtcbiAgLyoqXG4gICAqIFRoZSBidWNrZXQgZm9yIHRoZXNlIHBhcmFtZXRlcnMsIHRoaXMgYnVja2V0IGlzIGRlZmluZWQgaW4gdG90YWwgdW5pdHMuXG4gICAqIGUuZy4gaWYgYnVja2V0ID0gMSBhbmQgY3VycmVuY3kgKGluIENhY2hlZFJvdXRlc1N0cmF0ZWd5KSBpcyBXRVRILCB0aGVuIHRoaXMgaXMgMSBXRVRILlxuICAgKi9cbiAgYnVja2V0OiBudW1iZXI7XG4gIC8qKlxuICAgKiBGb3IgdGhlIGNhY2hlZCByb3V0ZSBhc3NvY2lhdGVkIHRvIHRoaXMgYnVja2V0LCBob3cgbWFueSBibG9ja3Mgc2hvdWxkIHRoZSBjYWNoZWQgcm91dGUgYmUgdmFsaWQgZm9yLlxuICAgKi9cbiAgYmxvY2tzVG9MaXZlPzogbnVtYmVyO1xuICAvKipcbiAgICogVGhlIENhY2hlTW9kZSBhc3NvY2lhdGVkIHRvIHRoaXMgYnVja2V0LiBTZXR0aW5nIGl0IHRvIGBMaXZlbW9kZWAgd2lsbCBlbmFibGUgY2FjaGluZyB0aGUgcm91dGUgZm9yIHRoaXMgYnVja2V0XG4gICAqL1xuICBjYWNoZU1vZGU6IENhY2hlTW9kZTtcbiAgLyoqXG4gICAqIERlZmluZXMgdGhlIG1heCBudW1iZXIgb2Ygc3BsaXRzIGFsbG93ZWQgZm9yIGEgcm91dGUgdG8gYmUgY2FjaGVkLiBBIHZhbHVlIG9mIDAgaW5kaWNhdGVzIHRoYXQgYW55IHNwbGl0cyBhcmUgYWxsb3dlZFxuICAgKiBBIHZhbHVlIG9mIDEgaW5kaWNhdGVzIHRoYXQgYXQgbW9zdCB0aGVyZSBjYW4gb25seSBiZSAxIHNwbGl0IGluIHRoZSByb3V0ZSBpbiBvcmRlciB0byBiZSBjYWNoZWQuXG4gICAqL1xuICBtYXhTcGxpdHM/OiBudW1iZXI7XG4gIC8qKlxuICAgKiBXaGVuIGZldGNoaW5nIHRoZSBDYWNoZWRSb3V0ZXMsIHdlIGNvdWxkIG9wdCBmb3IgdXNpbmcgdGhlIGxhc3QgTiByb3V0ZXMsIGZyb20gdGhlIGxhc3QgTiBibG9ja3NcbiAgICogVGhpcyB3YXkgd2Ugd291bGQgcXVlcnkgdGhlIHByaWNlIGZvciBhbGwgdGhlIHJlY2VudCByb3V0ZXMgdGhhdCBoYXZlIGJlZW4gY2FjaGVkIGFzIHRoZSBiZXN0IHJvdXRlc1xuICAgKi9cbiAgd2l0aExhc3ROQ2FjaGVkUm91dGVzPzogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgQ2FjaGVkUm91dGVzQnVja2V0IHtcbiAgcHVibGljIHJlYWRvbmx5IGJ1Y2tldDogbnVtYmVyO1xuICBwdWJsaWMgcmVhZG9ubHkgYmxvY2tzVG9MaXZlOiBudW1iZXI7XG4gIHB1YmxpYyByZWFkb25seSBjYWNoZU1vZGU6IENhY2hlTW9kZTtcbiAgcHVibGljIHJlYWRvbmx5IG1heFNwbGl0czogbnVtYmVyO1xuICBwdWJsaWMgcmVhZG9ubHkgd2l0aExhc3ROQ2FjaGVkUm91dGVzOiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3Ioe1xuICAgIGJ1Y2tldCxcbiAgICBibG9ja3NUb0xpdmUgPSAyLFxuICAgIGNhY2hlTW9kZSxcbiAgICBtYXhTcGxpdHMgPSAwLFxuICAgIHdpdGhMYXN0TkNhY2hlZFJvdXRlcyA9IDQsXG4gIH06IENhY2hlZFJvdXRlc0J1Y2tldHNBcmdzKSB7XG4gICAgdGhpcy5idWNrZXQgPSBidWNrZXQ7XG4gICAgdGhpcy5ibG9ja3NUb0xpdmUgPSBibG9ja3NUb0xpdmU7IC8vIGJ5IGRlZmF1bHQsIHdlIGFsbG93IHVwIHRvIDIgYmxvY2tzIHRvIGxpdmUgZm9yIGEgY2FjaGVkIHJvdXRlXG4gICAgdGhpcy5jYWNoZU1vZGUgPSBjYWNoZU1vZGU7XG4gICAgdGhpcy5tYXhTcGxpdHMgPSBtYXhTcGxpdHM7IC8vIGJ5IGRlZmF1bHQgdGhpcyB2YWx1ZSBpcyAwLCB3aGljaCBtZWFucyB0aGF0IGFueSBudW1iZXIgb2Ygc3BsaXRzIGFyZSBhbGxvd2VkXG4gICAgdGhpcy53aXRoTGFzdE5DYWNoZWRSb3V0ZXMgPSB3aXRoTGFzdE5DYWNoZWRSb3V0ZXM7IC8vIEZldGNoaW5nIHRoZSBsYXN0IDQgY2FjaGVkIHJvdXRlcyBieSBkZWZhdWx0XG4gIH1cbn1cbiJdfQ==