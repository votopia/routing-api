export class CachedRoutesWidgetsFactory {
    constructor(namespace, region, lambdaName) {
        this.region = region;
        this.namespace = namespace;
        this.lambdaName = lambdaName;
    }
    generateWidgets() {
        return this.generateCacheHitMissMetricsWidgets();
    }
    generateCacheHitMissMetricsWidgets() {
        return [
            {
                type: "text",
                width: 24,
                height: 1,
                properties: {
                    markdown: `# Overall Cache Hit/Miss`,
                },
            },
            {
                type: "metric",
                width: 12,
                height: 7,
                properties: {
                    view: "timeSeries",
                    stacked: false,
                    metrics: [
                        [{ expression: "SUM(METRICS())", label: "Requests", id: "e1" }],
                        [this.namespace, "GetCachedRoute_hit_livemode", "Service", "RoutingAPI", { label: "Cache Hit", id: "m1" }],
                        [".", "GetCachedRoute_miss_livemode", ".", ".", { label: "Cache Miss", id: "m2" }],
                    ],
                    region: this.region,
                    title: "Cache Hit, Miss and Total requests of Cachemode.Livemode",
                    period: 300,
                    stat: "Sum",
                    yAxis: {
                        left: {
                            min: 0,
                        },
                    },
                },
            },
            {
                type: "metric",
                width: 12,
                height: 7,
                properties: {
                    view: "timeSeries",
                    stacked: false,
                    metrics: [
                        [{ expression: "SUM(METRICS())", label: "AllRequests", id: "e1", visible: false }],
                        [{ expression: "m1/e1 * 100", label: "Cache Hit Rate", id: "e2" }],
                        [{ expression: "m2/e1 * 100", label: "Cache Miss Rate", id: "e3" }],
                        [
                            this.namespace,
                            "GetCachedRoute_hit_livemode",
                            "Service",
                            "RoutingAPI",
                            { label: "Cache Hit", id: "m1", visible: false },
                        ],
                        [".", "GetCachedRoute_miss_livemode", ".", ".", { label: "Cache Miss", id: "m2", visible: false }],
                    ],
                    region: this.region,
                    title: "Cache Hit and Miss Rates of Cachemode.Livemode",
                    period: 300,
                    stat: "Sum",
                    yAxis: {
                        left: {
                            min: 0,
                            max: 100,
                        },
                    },
                },
            },
            {
                type: "metric",
                width: 12,
                height: 7,
                properties: {
                    view: "timeSeries",
                    stacked: false,
                    metrics: [
                        [{ expression: "SUM(METRICS())", label: "Requests", id: "e1" }],
                        [
                            this.namespace,
                            "GetCachedRoute_hit_tapcompare",
                            "Service",
                            "RoutingAPI",
                            { label: "Cache Hit", id: "m1" },
                        ],
                        [".", "GetCachedRoute_miss_tapcompare", ".", ".", { label: "Cache Miss", id: "m2" }],
                    ],
                    region: this.region,
                    title: "Cache Hit, Miss and Total requests of Cachemode.Tapcompare",
                    period: 300,
                    stat: "Sum",
                    yAxis: {
                        left: {
                            min: 0,
                        },
                    },
                },
            },
            {
                type: "metric",
                width: 12,
                height: 7,
                properties: {
                    view: "timeSeries",
                    stacked: false,
                    metrics: [
                        [{ expression: "SUM(METRICS())", label: "AllRequests", id: "e1", visible: false }],
                        [{ expression: "m1/e1 * 100", label: "Cache Hit Rate", id: "e2" }],
                        [{ expression: "m2/e1 * 100", label: "Cache Miss Rate", id: "e3" }],
                        [
                            this.namespace,
                            "GetCachedRoute_hit_tapcompare",
                            "Service",
                            "RoutingAPI",
                            { label: "Cache Hit", id: "m1", visible: false },
                        ],
                        [".", "GetCachedRoute_miss_tapcompare", ".", ".", { label: "Cache Miss", id: "m2", visible: false }],
                    ],
                    region: this.region,
                    title: "Cache Hit and Miss Rates of cachemode.Tapcompare",
                    period: 300,
                    stat: "Sum",
                    yAxis: {
                        left: {
                            min: 0,
                            max: 100,
                        },
                    },
                },
            },
            {
                type: "metric",
                width: 12,
                height: 7,
                properties: {
                    view: "timeSeries",
                    stacked: false,
                    metrics: [
                        [
                            this.namespace,
                            "TapcompareCachedRoute_quoteGasAdjustedDiffPercent",
                            "Service",
                            "RoutingAPI",
                            { label: "Misquote" },
                        ],
                    ],
                    region: this.region,
                    title: "Total number of Misquotes from Tapcompare",
                    period: 300,
                    stat: "SampleCount",
                    yAxis: {
                        left: {
                            min: 0,
                        },
                    },
                },
            },
            {
                type: "metric",
                width: 12,
                height: 7,
                properties: {
                    view: "timeSeries",
                    stacked: false,
                    metrics: [
                        [{ expression: "m2/m1 * 100", label: "Misquote Rate", id: "e1" }],
                        [
                            this.namespace,
                            "GetCachedRoute_hit_tapcompare",
                            "Service",
                            "RoutingAPI",
                            { label: "Cache Hit", id: "m1", visible: false },
                        ],
                        [
                            ".",
                            "TapcompareCachedRoute_quoteGasAdjustedDiffPercent",
                            ".",
                            ".",
                            { label: "Cache Miss", id: "m2", stat: "SampleCount", visible: false },
                        ],
                    ],
                    region: this.region,
                    title: "Misquote rate from Tapcompare",
                    period: 300,
                    stat: "Sum",
                    yAxis: {
                        left: {
                            min: 0,
                        },
                    },
                },
            },
        ];
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGVkLXJvdXRlcy13aWRnZXRzLWZhY3RvcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvZGFzaGJvYXJkcy9jYWNoZWQtcm91dGVzLXdpZGdldHMtZmFjdG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFHQSxNQUFNLE9BQU8sMEJBQTBCO0lBS3JDLFlBQVksU0FBaUIsRUFBRSxNQUFjLEVBQUUsVUFBa0I7UUFDL0QsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7UUFDM0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7SUFDL0IsQ0FBQztJQUVELGVBQWU7UUFDYixPQUFPLElBQUksQ0FBQyxrQ0FBa0MsRUFBRSxDQUFDO0lBQ25ELENBQUM7SUFFTyxrQ0FBa0M7UUFDeEMsT0FBTztZQUNMO2dCQUNFLElBQUksRUFBRSxNQUFNO2dCQUNaLEtBQUssRUFBRSxFQUFFO2dCQUNULE1BQU0sRUFBRSxDQUFDO2dCQUNULFVBQVUsRUFBRTtvQkFDVixRQUFRLEVBQUUsMEJBQTBCO2lCQUNyQzthQUNGO1lBQ0Q7Z0JBQ0UsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsS0FBSyxFQUFFLEVBQUU7Z0JBQ1QsTUFBTSxFQUFFLENBQUM7Z0JBQ1QsVUFBVSxFQUFFO29CQUNWLElBQUksRUFBRSxZQUFZO29CQUNsQixPQUFPLEVBQUUsS0FBSztvQkFDZCxPQUFPLEVBQUU7d0JBQ1AsQ0FBQyxFQUFFLFVBQVUsRUFBRSxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQzt3QkFDL0QsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLDZCQUE2QixFQUFFLFNBQVMsRUFBRSxZQUFZLEVBQUUsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQzt3QkFDMUcsQ0FBQyxHQUFH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QUN2RTtxQkFDRjtvQkFDRCxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU07b0JBQ25CLEtBQUssRUFBRSwrQkFBK0I7b0JBQ3RDLE1BQU0sRUFBRSxHQUFHO29CQUNYLElBQUksRUFBRSxLQUFLO29CQUNYLEtBQUssRUFBRTt3QkFDTCxJQUFJLEVBQUU7NEJBQ0osR0FBRyxFQUFFLENBQUM7eUJBQ1A7cUJBQ0Y7aUJBQ0Y7YUFDRjtTQUNGLENBQUM7SUFDSixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBXaWRnZXQgfSBmcm9tIFwiLi9jb3JlL21vZGVsL3dpZGdldFwiO1xuaW1wb3J0IHsgV2lkZ2V0c0ZhY3RvcnkgfSBmcm9tIFwiLi9jb3JlL3dpZGdldHMtZmFjdG9yeVwiO1xuXG5leHBvcnQgY2xhc3MgQ2FjaGVkUm91dGVzV2lkZ2V0c0ZhY3RvcnkgaW1wbGVtZW50cyBXaWRnZXRzRmFjdG9yeSB7XG4gIHJlZ2lvbjogc3RyaW5nO1xuICBuYW1lc3BhY2U6IHN0cmluZztcbiAgbGFtYmRhTmFtZTogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKG5hbWVzcGFjZTogc3RyaW5nLCByZWdpb246IHN0cmluZywgbGFtYmRhTmFtZTogc3RyaW5nKSB7XG4gICAgdGhpcy5yZWdpb24gPSByZWdpb247XG4gICAgdGhpcy5uYW1lc3BhY2UgPSBuYW1lc3BhY2U7XG4gICAgdGhpcy5sYW1iZGFOYW1lID0gbGFtYmRhTmFtZTtcbiAgfVxuXG4gIGdlbmVyYXRlV2lkZ2V0cygpOiBXaWRnZXRbXSB7XG4gICAgcmV0dXJuIHRoaXMuZ2VuZXJhdGVDYWNoZUhpdE1pc3NNZXRyaWNzV2lkZ2V0cygpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZUNhY2hlSGl0TWlzc01ldHJpY3NXaWRnZXRzKCk6IFdpZGdldFtdIHtcbiAgICByZXR1cm4gW1xuICAgICAge1xuICAgICAgICB0eXBlOiBcInRleHRcIixcbiAgICAgICAgd2lkdGg6IDI0LFxuICAgICAgICBoZWlnaHQ6IDEsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBtYXJrZG93bjogYCMgT3ZlcmFsbCBDYWNoZSBIaXQvTWlzc2AsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICB0eXBlOiBcIm1ldHJpY1wiLFxuICAgICAgICB3aWR0aDogMTIsXG4gICAgICAgIGhlaWdodDogNyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHZpZXc6IFwidGltZVNlcmllc1wiLFxuICAgICAgICAgIHN0YWNrZWQ6IGZhbHNlLFxuICAgICAgICAgIG1ldHJpY3M6IFtcbiAgICAgICAgICAgIFt7IGV4cHJlc3Npb246IFwiU1VNKE1FVFJJQ1MoKSlcIiwgbGFiZWw6IFwiUmVxdWVzdHNcIiwgaWQ6IFwiZTFcIiB9XSxcbiAgICAgICAgICAgIFt0aGlzLm5hbWVzcGFjZSwgXCJHZXRDYWNoZWRSb3V0ZV9oaXRfbGl2ZW1vZGVcIiwgXCJTZXJ2aWNlXCIsIFwiUm91dGluZ0FQSVwiLCB7IGxhYmVsOiBcIkNhY2hlIEhpdFwiLCBpZDogXCJtMVwiIH1dLFxuICAgICAgICAgICAgW1wiLlwiLCBcIkdldENhY2hlZFJvdXRlX21pc3NfbGl2ZW1vZGVcIiwgXCIuXCIsIFwiLlwiLCB7IGxhYmVsOiBcIkNhY2hlIE1pc3NcIiwgaWQ6IFwibTJcIiB9XSxcbiAgICAgICAgICBdLFxuICAgICAgICAgIHJlZ2lvbjogdGhpcy5yZWdpb24sXG4gICAgICAgICAgdGl0bGU6IFwiQ2FjaGUgSGl0LCBNaXNzIGFuZCBUb3RhbCByZXF1ZXN0cyBvZiBDYWNoZW1vZGUuTGl2ZW1vZGVcIixcbiAgICAgICAgICBwZXJpb2Q6IDMwMCxcbiAgICAgICAgICBzdGF0OiBcIlN1bVwiLFxuICAgICAgICAgIHlBeGlzOiB7XG4gICAgICAgICAgICBsZWZ0OiB7XG4gICAgICAgICAgICAgIG1pbjogMCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHR5cGU6IFwibWV0cmljXCIsXG4gICAgICAgIHdpZHRoOiAxMixcbiAgICAgICAgaGVpZ2h0OiA3LFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgdmlldzogXCJ0aW1lU2VyaWVzXCIsXG4gICAgICAgICAgc3RhY2tlZDogZmFsc2UsXG4gICAgICAgICAgbWV0cmljczogW1xuICAgICAgICAgICAgW3sgZXhwcmVzc2lvbjogXCJTVU0oTUVUUklDUygpKVwiLCBsYWJlbDogXCJBbGxSZXF1ZXN0c1wiLCBpZDogXCJlMVwiLCB2aXNpYmxlOiBmYWxzZSB9XSxcbiAgICAgICAgICAgIFt7IGV4cHJlc3Npb246IFwibTEvZTEgKiAxMDBcIiwgbGFiZWw6IFwiQ2FjaGUgSGl0IFJhdGVcIiwgaWQ6IFwiZTJcIiB9XSxcbiAgICAgICAgICAgIFt7IGV4cHJlc3Npb246IFwibTIvZTEgKiAxMDBcIiwgbGFiZWw6IFwiQ2FjaGUgTWlzcyBSYXRlXCIsIGlkOiBcImUzXCIgfV0sXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgIHRoaXMubmFtZXNwYWNlLFxuICAgICAgICAgICAgICBcIkdldENhY2hlZFJvdXRlX2hpdF9saXZlbW9kZVwiLFxuICAgICAgICAgICAgICBcIlNlcnZpY2VcIixcbiAgICAgICAgICAgICAgXCJSb3V0aW5nQVBJXCIsXG4gICAgICAgICAgICAgIHsgbGFiZWw6IFwiQ2FjaGUgSGl0XCIsIGlkOiBcIm0xXCIsIHZpc2libGU6IGZhbHNlIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgW1wiLlwiLCBcIkdldENhY2hlZFJvdXRlX21pc3NfbGl2ZW1vZGVcIiwgXCIuXCIsIFwiLlwiLCB7IGxhYmVsOiBcIkNhY2hlIE1pc3NcIiwgaWQ6IFwibTJcIiwgdmlzaWJsZTogZmFsc2UgfV0sXG4gICAgICAgICAgXSxcbiAgICAgICAgICByZWdpb246IHRoaXMucmVnaW9uLFxuICAgICAgICAgIHRpdGxlOiBcIkNhY2hlIEhpdCBhbmQgTWlzcyBSYXRlcyBvZiBDYWNoZW1vZGUuTGl2ZW1vZGVcIixcbiAgICAgICAgICBwZXJpb2Q6IDMwMCxcbiAgICAgICAgICBzdGF0OiBcIlN1bVwiLFxuICAgICAgICAgIHlBeGlzOiB7XG4gICAgICAgICAgICBsZWZ0OiB7XG4gICAgICAgICAgICAgIG1pbjogMCxcbiAgICAgICAgICAgICAgbWF4OiAxMDAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICB0eXBlOiBcIm1ldHJpY1wiLFxuICAgICAgICB3aWR0aDogMTIsXG4gICAgICAgIGhlaWdodDogNyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHZpZXc6IFwidGltZVNlcmllc1wiLFxuICAgICAgICAgIHN0YWNrZWQ6IGZhbHNlLFxuICAgICAgICAgIG1ldHJpY3M6IFtcbiAgICAgICAgICAgIFt7IGV4cHJlc3Npb246IFwiU1VNKE1FVFJJQ1MoKSlcIiwgbGFiZWw6IFwiUmVxdWVzdHNcIiwgaWQ6IFwiZTFcIiB9XSxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgdGhpcy5uYW1lc3BhY2UsXG4gICAgICAgICAgICAgIFwiR2V0Q2FjaGVkUm91dGVfaGl0X3RhcGNvbXBhcmVcIixcbiAgICAgICAgICAgICAgXCJTZXJ2aWNlXCIsXG4gICAgICAgICAgICAgIFwiUm91dGluZ0FQSVwiLFxuICAgICAgICAgICAgICB7IGxhYmVsOiBcIkNhY2hlIEhpdFwiLCBpZDogXCJtMVwiIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgW1wiLlwiLCBcIkdldENhY2hlZFJvdXRlX21pc3NfdGFwY29tcGFyZVwiLCBcIi5cIiwgXCIuXCIsIHsgbGFiZWw6IFwiQ2FjaGUgTWlzc1wiLCBpZDogXCJtMlwiIH1dLFxuICAgICAgICAgIF0sXG4gICAgICAgICAgcmVnaW9uOiB0aGlzLnJlZ2lvbixcbiAgICAgICAgICB0aXRsZTogXCJDYWNoZSBIaXQsIE1pc3MgYW5kIFRvdGFsIHJlcXVlc3RzIG9mIENhY2hlbW9kZS5UYXBjb21wYXJlXCIsXG4gICAgICAgICAgcGVyaW9kOiAzMDAsXG4gICAgICAgICAgc3RhdDogXCJTdW1cIixcbiAgICAgICAgICB5QXhpczoge1xuICAgICAgICAgICAgbGVmdDoge1xuICAgICAgICAgICAgICBtaW46IDAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICB0eXBlOiBcIm1ldHJpY1wiLFxuICAgICAgICB3aWR0aDogMTIsXG4gICAgICAgIGhlaWdodDogNyxcbiAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgIHZpZXc6IFwidGltZVNlcmllc1wiLFxuICAgICAgICAgIHN0YWNrZWQ6IGZhbHNlLFxuICAgICAgICAgIG1ldHJpY3M6IFtcbiAgICAgICAgICAgIFt7IGV4cHJlc3Npb246IFwiU1VNKE1FVFJJQ1MoKSlcIiwgbGFiZWw6IFwiQWxsUmVxdWVzdHNcIiwgaWQ6IFwiZTFcIiwgdmlzaWJsZTogZmFsc2UgfV0sXG4gICAgICAgICAgICBbeyBleHByZXNzaW9uOiBcIm0xL2UxICogMTAwXCIsIGxhYmVsOiBcIkNhY2hlIEhpdCBSYXRlXCIsIGlkOiBcImUyXCIgfV0sXG4gICAgICAgICAgICBbeyBleHByZXNzaW9uOiBcIm0yL2UxICogMTAwXCIsIGxhYmVsOiBcIkNhY2hlIE1pc3MgUmF0ZVwiLCBpZDogXCJlM1wiIH1dLFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICB0aGlzLm5hbWVzcGFjZSxcbiAgICAgICAgICAgICAgXCJHZXRDYWNoZWRSb3V0ZV9oaXRfdGFwY29tcGFyZVwiLFxuICAgICAgICAgICAgICBcIlNlcnZpY2VcIixcbiAgICAgICAgICAgICAgXCJSb3V0aW5nQVBJXCIsXG4gICAgICAgICAgICAgIHsgbGFiZWw6IFwiQ2FjaGUgSGl0XCIsIGlkOiBcIm0xXCIsIHZpc2libGU6IGZhbHNlIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgW1wiLlwiLCBcIkdldENhY2hlZFJvdXRlX21pc3NfdGFwY29tcGFyZVwiLCBcIi5cIiwgXCIuXCIsIHsgbGFiZWw6IFwiQ2FjaGUgTWlzc1wiLCBpZDogXCJtMlwiLCB2aXNpYmxlOiBmYWxzZSB9XSxcbiAgICAgICAgICBdLFxuICAgICAgICAgIHJlZ2lvbjogdGhpcy5yZWdpb24sXG4gICAgICAgICAgdGl0bGU6IFwiQ2FjaGUgSGl0IGFuZCBNaXNzIFJhdGVzIG9mIGNhY2hlbW9kZS5UYXBjb21wYXJlXCIsXG4gICAgICAgICAgcGVyaW9kOiAzMDAsXG4gICAgICAgICAgc3RhdDogXCJTdW1cIixcbiAgICAgICAgICB5QXhpczoge1xuICAgICAgICAgICAgbGVmdDoge1xuICAgICAgICAgICAgICBtaW46IDAsXG4gICAgICAgICAgICAgIG1heDogMTAwLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgdHlwZTogXCJtZXRyaWNcIixcbiAgICAgICAgd2lkdGg6IDEyLFxuICAgICAgICBoZWlnaHQ6IDcsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICB2aWV3OiBcInRpbWVTZXJpZXNcIixcbiAgICAgICAgICBzdGFja2VkOiBmYWxzZSxcbiAgICAgICAgICBtZXRyaWNzOiBbXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgIHRoaXMubmFtZXNwYWNlLFxuICAgICAgICAgICAgICBcIlRhcGNvbXBhcmVDYWNoZWRSb3V0ZV9xdW90ZUdhc0FkanVzdGVkRGlmZlBlcmNlbnRcIixcbiAgICAgICAgICAgICAgXCJTZXJ2aWNlXCIsXG4gICAgICAgICAgICAgIFwiUm91dGluZ0FQSVwiLFxuICAgICAgICAgICAgICB7IGxhYmVsOiBcIk1pc3F1b3RlXCIgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgXSxcbiAgICAgICAgICByZWdpb246IHRoaXMucmVnaW9uLFxuICAgICAgICAgIHRpdGxlOiBcIlRvdGFsIG51bWJlciBvZiBNaXNxdW90ZXMgZnJvbSBUYXBjb21wYXJlXCIsXG4gICAgICAgICAgcGVyaW9kOiAzMDAsXG4gICAgICAgICAgc3RhdDogXCJTYW1wbGVDb3VudFwiLFxuICAgICAgICAgIHlBeGlzOiB7XG4gICAgICAgICAgICBsZWZ0OiB7XG4gICAgICAgICAgICAgIG1pbjogMCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHR5cGU6IFwibWV0cmljXCIsXG4gICAgICAgIHdpZHRoOiAxMixcbiAgICAgICAgaGVpZ2h0OiA3LFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgdmlldzogXCJ0aW1lU2VyaWVzXCIsXG4gICAgICAgICAgc3RhY2tlZDogZmFsc2UsXG4gICAgICAgICAgbWV0cmljczogW1xuICAgICAgICAgICAgW3sgZXhwcmVzc2lvbjogXCJtMi9tMSAqIDEwMFwiLCBsYWJlbDogXCJNaXNxdW90ZSBSYXRlXCIsIGlkOiBcImUxXCIgfV0sXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgIHRoaXMubmFtZXNwYWNlLFxuICAgICAgICAgICAgICBcIkdldENhY2hlZFJvdXRlX2hpdF90YXBjb21wYXJlXCIsXG4gICAgICAgICAgICAgIFwiU2VydmljZVwiLFxuICAgICAgICAgICAgICBcIlJvdXRpbmdBUElcIixcbiAgICAgICAgICAgICAgeyBsYWJlbDogXCJDYWNoZSBIaXRcIiwgaWQ6IFwibTFcIiwgdmlzaWJsZTogZmFsc2UgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgIFwiLlwiLFxuICAgICAgICAgICAgICBcIlRhcGNvbXBhcmVDYWNoZWRSb3V0ZV9xdW90ZUdhc0FkanVzdGVkRGlmZlBlcmNlbnRcIixcbiAgICAgICAgICAgICAgXCIuXCIsXG4gICAgICAgICAgICAgIFwiLlwiLFxuICAgICAgICAgICAgICB7IGxhYmVsOiBcIkNhY2hlIE1pc3NcIiwgaWQ6IFwibTJcIiwgc3RhdDogXCJTYW1wbGVDb3VudFwiLCB2aXNpYmxlOiBmYWxzZSB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICBdLFxuICAgICAgICAgIHJlZ2lvbjogdGhpcy5yZWdpb24sXG4gICAgICAgICAgdGl0bGU6IFwiTWlzcXVvdGUgcmF0ZSBmcm9tIFRhcGNvbXBhcmVcIixcbiAgICAgICAgICBwZXJpb2Q6IDMwMCxcbiAgICAgICAgICBzdGF0OiBcIlN1bVwiLFxuICAgICAgICAgIHlBeGlzOiB7XG4gICAgICAgICAgICBsZWZ0OiB7XG4gICAgICAgICAgICAgIG1pbjogMCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXTtcbiAgfVxufVxuIl19