import { Protocol } from "@votopia/sdk-core";
import { V3SubgraphProvider } from "@votopia/smart-order-router";

export const chainProtocols = [
  {
    protocol: Protocol.V3,
    timeout: 90000,
    provider: new V3SubgraphProvider(3, 90000),
  },
];
