import { TradeType, NETWORK_NAME } from "@votopia/sdk-core";

import _ from "lodash";
import { PAIRS_TO_TRACK } from "../handlers/quote/util/pairs-to-track";
import { Widget } from "./core/model/widget";
import { WidgetsFactory } from "./core/widgets-factory";

export class QuoteAmountsWidgetsFactory implements WidgetsFactory {
  region: string;
  namespace: string;

  constructor(namespace: string, region: string) {
    this.region = region;
    this.namespace = namespace;
  }

  generateWidgets(): Widget[] {
    const pairsToTrackEntries = Array.from(PAIRS_TO_TRACK.entries());
    const widgets: Widget[] = _.flatMap(pairsToTrackEntries, ([, pairsByTradeType]) => {
      return this.generateChartWidgetsFromPairsByTradeType(pairsByTradeType);
    });

    return widgets;
  }

  private generateChartWidgetsFromPairsByTradeType(pairsByTradeType: Map<TradeType, string[]>): Widget[] {
    const pairsByTradeTypeEntries = Array.from(pairsByTradeType.entries());

    const widgets = _.flatMap(pairsByTradeTypeEntries, ([tradeType, pairs]: [TradeType, string[]]) =>
      this.generateChartWidgetsFromPairs(tradeType, pairs)
    );

    return widgets;
  }

  private generateChartWidgetsFromPairs(tradeType: TradeType, pairs: string[]): Widget[] {
    return _.flatMap(pairs, (pair: string) => this.generateChartWidgetsFromPair(tradeType, pair));
  }

  private generateChartWidgetsFromPair(tradeType: TradeType, pair: string): Widget[] {
    const tradeTypeLabel = this.tradeTypeToString(tradeType);
    const widgets: Widget[] = [
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

  private tradeTypeToString(tradeType: TradeType) {
    if (tradeType == TradeType.EXACT_INPUT) {
      return "ExactIn";
    } else {
      return "ExactOut";
    }
  }

  private generateStatWithLabel(
    min: number,
    max: number,
    pair: string,
    tradeType: TradeType
  ): { stat: string; label: string } {
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
