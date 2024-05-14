import { WidgetsFactory } from "./core/widgets-factory";
import { Widget } from "./core/model/widget";
export declare class RpcProvidersWidgetsFactory implements WidgetsFactory {
    region: string;
    namespace: string;
    constructor(namespace: string, region: string);
    generateWidgets(): Widget[];
    private generateWidgetsForMethod;
    private generateSuccessRateForMethod;
    private generateRequestsWidgetForMethod;
}
