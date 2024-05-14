import { WidgetsFactory } from "./core/widgets-factory";
import { Widget } from "./core/model/widget";

import _ from "lodash";
import { NETWORK_NAME, JSON_RPC_PROVIER } from "@votopia/sdk-core";

export class RpcProvidersWidgetsFactory implements WidgetsFactory {
  region: string;
  namespace: string;

  constructor(namespace: string, region: string) {
    this.namespace = namespace;
    this.region = region;
  }

  generateWidgets(): Widget[] {
    return this.generateWidgetsForMethod("CALL")
      .concat(this.generateWidgetsForMethod("GETBLOCKNUMBER"))
      .concat(this.generateWidgetsForMethod("GETGASPRICE"))
      .concat(this.generateWidgetsForMethod("GETNETWORK"))
      .concat(this.generateWidgetsForMethod("RESOLVENAME"));
  }

  private generateWidgetsForMethod(rpcMethod: string): Widget[] {
    return this.generateRequestsWidgetForMethod(rpcMethod).concat(this.generateSuccessRateForMethod(rpcMethod));
  }

  private generateSuccessRateForMethod(rpcMethod: string): Widget[] {
    const metrics = () => {
      const providerName = JSON_RPC_PROVIER;

      const metric1 = `m${0 * 2 + 1}`;
      const metric2 = `m${0 * 2 + 2}`;
      const expression = `e${0}`;

      return [
        [
          {
            expression: `${metric1} / (${metric1} + ${metric2}) * 100`,
            label: `RPC ${providerName} Chain ${NETWORK_NAME} ${rpcMethod} Success Rate`,
            id: expression,
          },
        ],
        [
          this.namespace,
          `RPC_${providerName}_${rpcMethod}_SUCCESS`,
          "Service",
          "RoutingAPI",
          {
            id: metric1,
            visible: false,
          },
        ],
        [
          this.namespace,
          `RPC_${providerName}_${rpcMethod}_FAILURE`,
          "Service",
          "RoutingAPI",
          {
            id: metric2,
            visible: false,
          },
        ],
      ];
    };

    return [
      {
        height: 10,
        width: 12,
        type: "metric",
        properties: {
          metrics: metrics,
          view: "timeSeries",
          stacked: false,
          region: this.region,
          stat: "SampleCount",
          period: 300,
          title: `RPC ${rpcMethod} Success Rate`,
        },
      },
    ];
  }

  private generateRequestsWidgetForMethod(rpcMethod: string): Widget[] {
    const metrics = () => {
      const providerName = JSON_RPC_PROVIER;

      return [
        [this.namespace, `RPC_${providerName}_${rpcMethod}_SUCCESS`, "Service", "RoutingAPI"],
        [this.namespace, `RPC_${providerName}_${rpcMethod}_FAILURE`, "Service", "RoutingAPI"],
      ];
    };

    return [
      {
        height: 10,
        width: 12,
        type: "metric",
        properties: {
          metrics: metrics,
          view: "timeSeries",
          stacked: true,
          region: this.region,
          stat: "SampleCount",
          period: 300,
          title: `RPC ${rpcMethod} Requests`,
        },
      },
    ];
  }
}
