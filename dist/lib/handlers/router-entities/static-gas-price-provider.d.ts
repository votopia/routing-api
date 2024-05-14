import { GasPrice, IGasPriceProvider } from "@votopia/smart-order-router";
import { BigNumber } from "ethers";
export declare class StaticGasPriceProvider implements IGasPriceProvider {
    private gasPriceWei;
    constructor(gasPriceWei: BigNumber);
    getGasPrice(): Promise<GasPrice>;
}
