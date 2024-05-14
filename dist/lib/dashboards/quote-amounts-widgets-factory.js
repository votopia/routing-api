import { TradeType, NETWORK_NAME } from "@votopia/sdk-core";
import _ from "lodash";
import { PAIRS_TO_TRACK } from "../handlers/quote/util/pairs-to-track";
export class QuoteAmountsWidgetsFactory {
    constructor(namespace, region) {
        this.region = region;
        this.namespace = namespace;
    }
    generateWidgets() {
        const pairsToTrackEntries = Array.from(PAIRS_TO_TRACK.entries());
        const widgets = _.flatMap(pairsToTrackEntries, ([, pairsByTradeType]) => {
            return this.generateChartWidgetsFromPairsByTradeType(pairsByTradeType);
        });
        return widgets;
    }
    generateChartWidgetsFromPairsByTradeType(pairsByTradeType) {
        const pairsByTradeTypeEntries = Array.from(pairsByTradeType.entries());
        const widgets = _.flatMap(pairsByTradeTypeEntries, ([tradeType, pairs]) => this.generateChartWidgetsFromPairs(tradeType, pairs));
        return widgets;
    }
    generateChartWidgetsFromPairs(tradeType, pairs) {
        return _.flatMap(pairs, (pair) => this.generateChartWidgetsFromPair(tradeType, pair));
    }
    generateChartWidgetsFromPair(tradeType, pair) {
        const tradeTypeLabel = this.tradeTypeToString(tradeType);
        const widgets = [
            {
                type: "text",
                width: 24,
                height: 2,
                properties: {
                    markdown: `# ${NETWORK_NAME}\n## ${pair} - ${tradeTypeLabel}`,
                },
            },
            {
                type: "metric",
                width: 24,
                height: 6,
                properties: {
                    view: "timeSeries",
                    stacked: false,
                    metrics: [
                        [
                            this.namespace,
                            `GET_QUOTE_AMOUNT_${pair}_${tradeTypeLabel.toUpperCase()}`,
                            "Service",
                            "RoutingAPI",
                            { label: `${pair}/${tradeTypeLabel.toUpperCase()} Quotes` },
                        ],
                    ],
                    region: this.region,
                    title: `Number of requested quotes ${pair}/${tradeTypeLabel}`,
                    period: 300,
                    stat: "SampleCount",
                },
            },
            {
                type: "metric",
                width: 24,
                height: 9,
                properties: {
                    view: "timeSeries",
                    stacked: true,
                    metrics: [
                        [
                            this.namespace,
                            `GET_QUOTE_AMOUNT_${pair}_${tradeTypeLabel.toUpperCase()}`,
                            "Service",
                            "RoutingAPI",
                            this.generateStatWithLabel(0, 0.001, pair, tradeType),
                        ],
                        ["...", this.generateStatWithLabel(0.001, 0.005, pair, tradeType)],
                        ["...", this.generateStatWithLabel(0.005, 0.01, pair, tradeType)],
                        ["...", this.generateStatWithLabel(0.01, 0.05, pair, tradeType)],
                        ["...", this.generateStatWithLabel(0.05, 0.1, pair, tradeType)],
                        ["...", this.generateStatWithLabel(0.1, 0.5, pair, tradeType)],
                        ["...", this.generateStatWithLabel(0.5, 1, pair, tradeType)],
                        ["...", this.generateStatWithLabel(1, 5, pair, tradeType)],
                        ["...", this.generateStatWithLabel(5, 10, pair, tradeType)],
                        ["...", this.generateStatWithLabel(10, 50, pair, tradeType)],
                        ["...", this.generateStatWithLabel(50, 100, pair, tradeType)],
                        ["...", this.generateStatWithLabel(100, 500, pair, tradeType)],
                        ["...", this.generateStatWithLabel(500, 1000, pair, tradeType)],
                        ["...", this.generateStatWithLabel(1000, 5000, pair, tradeType)],
                        ["...", this.generateStatWithLabel(5000, 10000, pair, tradeType)],
                        ["...", this.generateStatWithLabel(10000, 50000, pair, tradeType)],
                        ["...", this.generateStatWithLabel(50000, 100000, pair, tradeType)],
                        ["...", this.generateStatWithLabel(100000, 500000, pair, tradeType)],
                        ["...", this.generateStatWithLabel(500000, 1000000, pair, tradeType)],
                        ["...", this.generateStatWithLabel(1000000, -1, pair, tradeType)],
                    ],
                    region: this.region,
                    title: `Distribution of quotes ${pair}/${tradeTypeLabel}`,
                    period: 300,
                },
            },
        ];
        return widgets;
    }
    tradeTypeToString(tradeType) {
        if (tradeType == TradeType.EXACT_INPUT) {
            return "ExactIn";
        }
        else {
            return "ExactOut";
        }
    }
    generateStatWithLabel(min, max, pair, tradeType) {
        const tokens = pair.split("/");
        const maxNormalized = max > 0 ? max.toString() : "";
        switch (tradeType) {
            case TradeType.EXACT_INPUT:
                return {
                    stat: `PR(${min}:${maxNormalized})`,
                    label: `${min} to ${max} ${tokens[0]}`,
                };
            case TradeType.EXACT_OUTPUT:
                return {
                    stat: `PR(${min}:${maxNormalized})`,
                    label: `${min} to ${max} ${tokens[1]}`,
                };
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVvdGUtYW1vdW50cy13aWRnZXRzLWZhY3RvcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvZGFzaGJvYXJkcy9xdW90ZS1hbW91bnRzLXdpZGdldHMtZmFjdG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFFLFlBQVksRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBRTVELE9BQU8sQ0FBQyxNQUFNLFFBQVEsQ0FBQztBQUN2QixPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sdUNBQXVDLENBQUM7QUFJdkUsTUFBTSxPQUFPLDBCQUEwQjtJQUlyQyxZQUFZLFNBQWlCLEVBQUUsTUFBYztRQUMzQyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztJQUM3QixDQUFDO0lBRUQsZUFBZTtRQUNiLE1BQU0sbUJBQW1CLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUNqRSxNQUFNLE9BQU8sR0FBYSxDQUFDLENBQUMsT0FBTyxDQUFDLG1CQUFtQixFQUFFLENBQUMsQ0FBQyxFQUFFLGdCQUFnQixDQUFDLEVBQUUsRUFBRTtZQUNoRixPQUFPLElBQUksQ0FBQyx3Q0FBd0MsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3pFLENBQUMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQztJQUVPLHdDQUF3QyxDQUFDLGdCQUEwQztRQUN6RixNQUFNLHVCQUF1QixHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUV2RSxNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLHVCQUF1QixFQUFFLENBQUMsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUF3QixFQUFFLEVBQUUsQ0FDL0YsSUFB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Qzt3QkFDNUQsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO3dCQUMxRCxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7d0JBQzNELENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQzt3QkFDNUQsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO3dCQUM3RCxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMscUJBQXFCLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7d0JBQzlELENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQzt3QkFDL0QsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO3dCQUNoRSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7d0JBQ2pFLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQzt3QkFDbEUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLHFCQUFxQixDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO3dCQUNuRSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMscUJBQXFCLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7d0JBQ3BFLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQzt3QkFDckUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7cUJBQ2xFO29CQUNELE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtvQkFDbkIsS0FBSyxFQUFFLDBCQUEwQixJQUFJLElBQUksY0FBYyxFQUFFO29CQUN6RCxNQUFNLEVBQUUsR0FBRztpQkFDWjthQUNGO1NBQ0YsQ0FBQztRQUVGLE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFFTyxpQkFBaUIsQ0FBQyxTQUFvQjtRQUM1QyxJQUFJLFNBQVMsSUFBSSxTQUFTLENBQUMsV0FBVyxFQUFFO1lBQ3RDLE9BQU8sU0FBUyxDQUFDO1NBQ2xCO2FBQU07WUFDTCxPQUFPLFVBQVUsQ0FBQztTQUNuQjtJQUNILENBQUM7SUFFTyxxQkFBcUIsQ0FDM0IsR0FBVyxFQUNYLEdBQVcsRUFDWCxJQUFZLEVBQ1osU0FBb0I7UUFFcEIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMvQixNQUFNLGFBQWEsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUVwRCxRQUFRLFNBQVMsRUFBRTtZQUNqQixLQUFLLFNBQVMsQ0FBQyxXQUFXO2dCQUN4QixPQUFPO29CQUNMLElBQUksRUFBRSxNQUFNLEdBQUcsSUFBSSxhQUFhLEdBQUc7b0JBQ25DLEtBQUssRUFBRSxHQUFHLEdBQUcsT0FBTyxHQUFHLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFO2lCQUN2QyxDQUFDO1lBQ0osS0FBSyxTQUFTLENBQUMsWUFBWTtnQkFDekIsT0FBTztvQkFDTCxJQUFJLEVBQUUsTUFBTSxHQUFHLElBQUksYUFBYSxHQUFHO29CQUNuQyxLQUFLLEVBQUUsR0FBRyxHQUFHLE9BQU8sR0FBRyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRTtpQkFDdkMsQ0FBQztTQUNMO0lBQ0gsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVHJhZGVUeXBlLCBORVRXT1JLX05BTUUgfSBmcm9tIFwiQHZvdG9waWEvc2RrLWNvcmVcIjtcblxuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgUEFJUlNfVE9fVFJBQ0sgfSBmcm9tIFwiLi4vaGFuZGxlcnMvcXVvdGUvdXRpbC9wYWlycy10by10cmFja1wiO1xuaW1wb3J0IHsgV2lkZ2V0IH0gZnJvbSBcIi4vY29yZS9tb2RlbC93aWRnZXRcIjtcbmltcG9ydCB7IFdpZGdldHNGYWN0b3J5IH0gZnJvbSBcIi4vY29yZS93aWRnZXRzLWZhY3RvcnlcIjtcblxuZXhwb3J0IGNsYXNzIFF1b3RlQW1vdW50c1dpZGdldHNGYWN0b3J5IGltcGxlbWVudHMgV2lkZ2V0c0ZhY3Rvcnkge1xuICByZWdpb246IHN0cmluZztcbiAgbmFtZXNwYWNlOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IobmFtZXNwYWNlOiBzdHJpbmcsIHJlZ2lvbjogc3RyaW5nKSB7XG4gICAgdGhpcy5yZWdpb24gPSByZWdpb247XG4gICAgdGhpcy5uYW1lc3BhY2UgPSBuYW1lc3BhY2U7XG4gIH1cblxuICBnZW5lcmF0ZVdpZGdldHMoKTogV2lkZ2V0W10ge1xuICAgIGNvbnN0IHBhaXJzVG9UcmFja0VudHJpZXMgPSBBcnJheS5mcm9tKFBBSVJTX1RPX1RSQUNLLmVudHJpZXMoKSk7XG4gICAgY29uc3Qgd2lkZ2V0czogV2lkZ2V0W10gPSBfLmZsYXRNYXAocGFpcnNUb1RyYWNrRW50cmllcywgKFssIHBhaXJzQnlUcmFkZVR5cGVdKSA9PiB7XG4gICAgICByZXR1cm4gdGhpcy5nZW5lcmF0ZUNoYXJ0V2lkZ2V0c0Zyb21QYWlyc0J5VHJhZGVUeXBlKHBhaXJzQnlUcmFkZVR5cGUpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHdpZGdldHM7XG4gIH1cblxuICBwcml2YXRlIGdlbmVyYXRlQ2hhcnRXaWRnZXRzRnJvbVBhaXJzQnlUcmFkZVR5cGUocGFpcnNCeVRyYWRlVHlwZTogTWFwPFRyYWRlVHlwZSwgc3RyaW5nW10+KTogV2lkZ2V0W10ge1xuICAgIGNvbnN0IHBhaXJzQnlUcmFkZVR5cGVFbnRyaWVzID0gQXJyYXkuZnJvbShwYWlyc0J5VHJhZGVUeXBlLmVudHJpZXMoKSk7XG5cbiAgICBjb25zdCB3aWRnZXRzID0gXy5mbGF0TWFwKHBhaXJzQnlUcmFkZVR5cGVFbnRyaWVzLCAoW3RyYWRlVHlwZSwgcGFpcnNdOiBbVHJhZGVUeXBlLCBzdHJpbmdbXV0pID0+XG4gICAgICB0aGlzLmdlbmVyYXRlQ2hhcnRXaWRnZXRzRnJvbVBhaXJzKHRyYWRlVHlwZSwgcGFpcnMpXG4gICAgKTtcblxuICAgIHJldHVybiB3aWRnZXRzO1xuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZUNoYXJ0V2lkZ2V0c0Zyb21QYWlycyh0cmFkZVR5cGU6IFRyYWRlVHlwZSwgcGFpcnM6IHN0cmluZ1tdKTogV2lkZ2V0W10ge1xuICAgIHJldHVybiBfLmZsYXRNYXAocGFpcnMsIChwYWlyOiBzdHJpbmcpID0+IHRoaXMuZ2VuZXJhdGVDaGFydFdpZGdldHNGcm9tUGFpcih0cmFkZVR5cGUsIHBhaXIpKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVDaGFydFdpZGdldHNGcm9tUGFpcih0cmFkZVR5cGU6IFRyYWRlVHlwZSwgcGFpcjogc3RyaW5nKTogV2lkZ2V0W10ge1xuICAgIGNvbnN0IHRyYWRlVHlwZUxhYmVsID0gdGhpcy50cmFkZVR5cGVUb1N0cmluZyh0cmFkZVR5cGUpO1xuICAgIGNvbnN0IHdpZGdldHM6IFdpZGdldFtdID0gW1xuICAgICAge1xuICAgICAgICB0eXBlOiBcInRleHRcIixcbiAgICAgICAgd2lkdGg6IDI0LFxuICAgICAgICBoZWlnaHQ6IDIsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBtYXJrZG93bjogYCMgJHtORVRXT1JLX05BTUV9XFxuIyMgJHtwYWlyfSAtICR7dHJhZGVUeXBlTGFiZWx9YCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHR5cGU6IFwibWV0cmljXCIsXG4gICAgICAgIHdpZHRoOiAyNCxcbiAgICAgICAgaGVpZ2h0OiA2LFxuICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgdmlldzogXCJ0aW1lU2VyaWVzXCIsXG4gICAgICAgICAgc3RhY2tlZDogZmFsc2UsXG4gICAgICAgICAgbWV0cmljczogW1xuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICB0aGlzLm5hbWVzcGFjZSxcbiAgICAgICAgICAgICAgYEdFVF9RVU9URV9BTU9VTlRfJHtwYWlyfV8ke3RyYWRlVHlwZUxhYmVsLnRvVXBwZXJDYXNlKCl9YCxcbiAgICAgICAgICAgICAgXCJTZXJ2aWNlXCIsXG4gICAgICAgICAgICAgIFwiUm91dGluZ0FQSVwiLFxuICAgICAgICAgICAgICB7IGxhYmVsOiBgJHtwYWlyfS8ke3RyYWRlVHlwZUxhYmVsLnRvVXBwZXJDYXNlKCl9IFF1b3Rlc2AgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgXSxcbiAgICAgICAgICByZWdpb246IHRoaXMucmVnaW9uLFxuICAgICAgICAgIHRpdGxlOiBgTnVtYmVyIG9mIHJlcXVlc3RlZCBxdW90ZXMgJHtwYWlyfS8ke3RyYWRlVHlwZUxhYmVsfWAsXG4gICAgICAgICAgcGVyaW9kOiAzMDAsXG4gICAgICAgICAgc3RhdDogXCJTYW1wbGVDb3VudFwiLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgdHlwZTogXCJtZXRyaWNcIixcbiAgICAgICAgd2lkdGg6IDI0LFxuICAgICAgICBoZWlnaHQ6IDksXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICB2aWV3OiBcInRpbWVTZXJpZXNcIixcbiAgICAgICAgICBzdGFja2VkOiB0cnVlLFxuICAgICAgICAgIG1ldHJpY3M6IFtcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgdGhpcy5uYW1lc3BhY2UsXG4gICAgICAgICAgICAgIGBHRVRfUVVPVEVfQU1PVU5UXyR7cGFpcn1fJHt0cmFkZVR5cGVMYWJlbC50b1VwcGVyQ2FzZSgpfWAsXG4gICAgICAgICAgICAgIFwiU2VydmljZVwiLFxuICAgICAgICAgICAgICBcIlJvdXRpbmdBUElcIixcbiAgICAgICAgICAgICAgdGhpcy5nZW5lcmF0ZVN0YXRXaXRoTGFiZWwoMCwgMC4wMDEsIHBhaXIsIHRyYWRlVHlwZSksXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgW1wiLi4uXCIsIHRoaXMuZ2VuZXJhdGVTdGF0V2l0aExhYmVsKDAuMDAxLCAwLjAwNSwgcGFpciwgdHJhZGVUeXBlKV0sXG4gICAgICAgICAgICBbXCIuLi5cIiwgdGhpcy5nZW5lcmF0ZVN0YXRXaXRoTGFiZWwoMC4wMDUsIDAuMDEsIHBhaXIsIHRyYWRlVHlwZSldLFxuICAgICAgICAgICAgW1wiLi4uXCIsIHRoaXMuZ2VuZXJhdGVTdGF0V2l0aExhYmVsKDAuMDEsIDAuMDUsIHBhaXIsIHRyYWRlVHlwZSldLFxuICAgICAgICAgICAgW1wiLi4uXCIsIHRoaXMuZ2VuZXJhdGVTdGF0V2l0aExhYmVsKDAuMDUsIDAuMSwgcGFpciwgdHJhZGVUeXBlKV0sXG4gICAgICAgICAgICBbXCIuLi5cIiwgdGhpcy5nZW5lcmF0ZVN0YXRXaXRoTGFiZWwoMC4xLCAwLjUsIHBhaXIsIHRyYWRlVHlwZSldLFxuICAgICAgICAgICAgW1wiLi4uXCIsIHRoaXMuZ2VuZXJhdGVTdGF0V2l0aExhYmVsKDAuNSwgMSwgcGFpciwgdHJhZGVUeXBlKV0sXG4gICAgICAgICAgICBbXCIuLi5cIiwgdGhpcy5nZW5lcmF0ZVN0YXRXaXRoTGFiZWwoMSwgNSwgcGFpciwgdHJhZGVUeXBlKV0sXG4gICAgICAgICAgICBbXCIuLi5cIiwgdGhpcy5nZW5lcmF0ZVN0YXRXaXRoTGFiZWwoNSwgMTAsIHBhaXIsIHRyYWRlVHlwZSldLFxuICAgICAgICAgICAgW1wiLi4uXCIsIHRoaXMuZ2VuZXJhdGVTdGF0V2l0aExhYmVsKDEwLCA1MCwgcGFpciwgdHJhZGVUeXBlKV0sXG4gICAgICAgICAgICBbXCIuLi5cIiwgdGhpcy5nZW5lcmF0ZVN0YXRXaXRoTGFiZWwoNTAsIDEwMCwgcGFpciwgdHJhZGVUeXBlKV0sXG4gICAgICAgICAgICBbXCIuLi5cIiwgdGhpcy5nZW5lcmF0ZVN0YXRXaXRoTGFiZWwoMTAwLCA1MDAsIHBhaXIsIHRyYWRlVHlwZSldLFxuICAgICAgICAgICAgW1wiLi4uXCIsIHRoaXMuZ2VuZXJhdGVTdGF0V2l0aExhYmVsKDUwMCwgMTAwMCwgcGFpciwgdHJhZGVUeXBlKV0sXG4gICAgICAgICAgICBbXCIuLi5cIiwgdGhpcy5nZW5lcmF0ZVN0YXRXaXRoTGFiZWwoMTAwMCwgNTAwMCwgcGFpciwgdHJhZGVUeXBlKV0sXG4gICAgICAgICAgICBbXCIuLi5cIiwgdGhpcy5nZW5lcmF0ZVN0YXRXaXRoTGFiZWwoNTAwMCwgMTAwMDAsIHBhaXIsIHRyYWRlVHlwZSldLFxuICAgICAgICAgICAgW1wiLi4uXCIsIHRoaXMuZ2VuZXJhdGVTdGF0V2l0aExhYmVsKDEwMDAwLCA1MDAwMCwgcGFpciwgdHJhZGVUeXBlKV0sXG4gICAgICAgICAgICBbXCIuLi5cIiwgdGhpcy5nZW5lcmF0ZVN0YXRXaXRoTGFiZWwoNTAwMDAsIDEwMDAwMCwgcGFpciwgdHJhZGVUeXBlKV0sXG4gICAgICAgICAgICBbXCIuLi5cIiwgdGhpcy5nZW5lcmF0ZVN0YXRXaXRoTGFiZWwoMTAwMDAwLCA1MDAwMDAsIHBhaXIsIHRyYWRlVHlwZSldLFxuICAgICAgICAgICAgW1wiLi4uXCIsIHRoaXMuZ2VuZXJhdGVTdGF0V2l0aExhYmVsKDUwMDAwMCwgMTAwMDAwMCwgcGFpciwgdHJhZGVUeXBlKV0sXG4gICAgICAgICAgICBbXCIuLi5cIiwgdGhpcy5nZW5lcmF0ZVN0YXRXaXRoTGFiZWwoMTAwMDAwMCwgLTEsIHBhaXIsIHRyYWRlVHlwZSldLFxuICAgICAgICAgIF0sXG4gICAgICAgICAgcmVnaW9uOiB0aGlzLnJlZ2lvbixcbiAgICAgICAgICB0aXRsZTogYERpc3RyaWJ1dGlvbiBvZiBxdW90ZXMgJHtwYWlyfS8ke3RyYWRlVHlwZUxhYmVsfWAsXG4gICAgICAgICAgcGVyaW9kOiAzMDAsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIF07XG5cbiAgICByZXR1cm4gd2lkZ2V0cztcbiAgfVxuXG4gIHByaXZhdGUgdHJhZGVUeXBlVG9TdHJpbmcodHJhZGVUeXBlOiBUcmFkZVR5cGUpIHtcbiAgICBpZiAodHJhZGVUeXBlID09IFRyYWRlVHlwZS5FWEFDVF9JTlBVVCkge1xuICAgICAgcmV0dXJuIFwiRXhhY3RJblwiO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gXCJFeGFjdE91dFwiO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVTdGF0V2l0aExhYmVsKFxuICAgIG1pbjogbnVtYmVyLFxuICAgIG1heDogbnVtYmVyLFxuICAgIHBhaXI6IHN0cmluZyxcbiAgICB0cmFkZVR5cGU6IFRyYWRlVHlwZVxuICApOiB7IHN0YXQ6IHN0cmluZzsgbGFiZWw6IHN0cmluZyB9IHtcbiAgICBjb25zdCB0b2tlbnMgPSBwYWlyLnNwbGl0KFwiL1wiKTtcbiAgICBjb25zdCBtYXhOb3JtYWxpemVkID0gbWF4ID4gMCA/IG1heC50b1N0cmluZygpIDogXCJcIjtcblxuICAgIHN3aXRjaCAodHJhZGVUeXBlKSB7XG4gICAgICBjYXNlIFRyYWRlVHlwZS5FWEFDVF9JTlBVVDpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdGF0OiBgUFIoJHttaW59OiR7bWF4Tm9ybWFsaXplZH0pYCxcbiAgICAgICAgICBsYWJlbDogYCR7bWlufSB0byAke21heH0gJHt0b2tlbnNbMF19YCxcbiAgICAgICAgfTtcbiAgICAgIGNhc2UgVHJhZGVUeXBlLkVYQUNUX09VVFBVVDpcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdGF0OiBgUFIoJHttaW59OiR7bWF4Tm9ybWFsaXplZH0pYCxcbiAgICAgICAgICBsYWJlbDogYCR7bWlufSB0byAke21heH0gJHt0b2tlbnNbMV19YCxcbiAgICAgICAgfTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==