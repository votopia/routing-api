import { V3Route } from "@votopia/smart-order-router";
import { Protocol } from "@votopia/sdk-core";
import { TokenMarshaller } from "./token-marshaller";
import { PoolMarshaller } from "./pool-marshaller";
export class RouteMarshaller {
    static marshal(route) {
        switch (route.protocol) {
            case Protocol.V3:
                return {
                    protocol: Protocol.V3,
                    input: TokenMarshaller.marshal(route.input),
                    output: TokenMarshaller.marshal(route.output),
                    pools: route.pools.map((pool) => PoolMarshaller.marshal(pool)),
                };
        }
    }
    static unmarshal(marshalledRoute) {
        const v3Route = marshalledRoute;
        return new V3Route(v3Route.pools.map((marshalledPool) => PoolMarshaller.unmarshal(marshalledPool)), TokenMarshaller.unmarshal(v3Route.input), TokenMarshaller.unmarshal(v3Route.output));
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUtbWFyc2hhbGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2xpYi9oYW5kbGVycy9tYXJzaGFsbGluZy9yb3V0ZS1tYXJzaGFsbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSw2QkFBNkIsQ0FBQztBQUN0RCxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFDN0MsT0FBTyxFQUFtQixlQUFlLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUV0RSxPQUFPLEVBQWtCLGNBQWMsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBV25FLE1BQU0sT0FBTyxlQUFlO0lBQ25CLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBYztRQUNsQyxRQUFRLEtBQUssQ0FBQyxRQUFRLEVBQUU7WUFDdEIsS0FBSyxRQUFRLENBQUMsRUFBRTtnQkFDZCxPQUFPO29CQUNMLFFBQVEsRUFBRSxRQUFRLENBQUMsRUFBRTtvQkFDckIsS0FBSyxFQUFFLGVBQWUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztvQkFDM0MsTUFBTSxFQUFFLGVBQWUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztvQkFDN0MsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUMvRCxDQUFDO1NBQ0w7SUFDSCxDQUFDO0lBRU0sTUFBTSxDQUFDLFNBQVMsQ0FBQyxlQUFnQztRQUN0RCxNQUFNLE9BQU8sR0FBRyxlQUFvQyxDQUFDO1FBQ3JELE9BQU8sSUFBSSxPQUFPLENBQ2hCLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsY0FBYyxFQUFFLEVBQUUsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxDQUFDLEVBQy9FLGVBQWUsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUN4QyxlQUFlLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FDMUMsQ0FBQztJQUNKLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFYzUm91dGUgfSBmcm9tIFwiQHZvdG9waWEvc21hcnQtb3JkZXItcm91dGVyXCI7XG5pbXBvcnQgeyBQcm90b2NvbCB9IGZyb20gXCJAdm90b3BpYS9zZGstY29yZVwiO1xuaW1wb3J0IHsgTWFyc2hhbGxlZFRva2VuLCBUb2tlbk1hcnNoYWxsZXIgfSBmcm9tIFwiLi90b2tlbi1tYXJzaGFsbGVyXCI7XG5cbmltcG9ydCB7IE1hcnNoYWxsZWRQb29sLCBQb29sTWFyc2hhbGxlciB9IGZyb20gXCIuL3Bvb2wtbWFyc2hhbGxlclwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIE1hcnNoYWxsZWRWM1JvdXRlIHtcbiAgcHJvdG9jb2w6IFByb3RvY29sO1xuICBpbnB1dDogTWFyc2hhbGxlZFRva2VuO1xuICBvdXRwdXQ6IE1hcnNoYWxsZWRUb2tlbjtcbiAgcG9vbHM6IE1hcnNoYWxsZWRQb29sW107XG59XG5cbmV4cG9ydCB0eXBlIE1hcnNoYWxsZWRSb3V0ZSA9IE1hcnNoYWxsZWRWM1JvdXRlO1xuXG5leHBvcnQgY2xhc3MgUm91dGVNYXJzaGFsbGVyIHtcbiAgcHVibGljIHN0YXRpYyBtYXJzaGFsKHJvdXRlOiBWM1JvdXRlKTogTWFyc2hhbGxlZFJvdXRlIHtcbiAgICBzd2l0Y2ggKHJvdXRlLnByb3RvY29sKSB7XG4gICAgICBjYXNlIFByb3RvY29sLlYzOlxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHByb3RvY29sOiBQcm90b2NvbC5WMyxcbiAgICAgICAgICBpbnB1dDogVG9rZW5NYXJzaGFsbGVyLm1hcnNoYWwocm91dGUuaW5wdXQpLFxuICAgICAgICAgIG91dHB1dDogVG9rZW5NYXJzaGFsbGVyLm1hcnNoYWwocm91dGUub3V0cHV0KSxcbiAgICAgICAgICBwb29sczogcm91dGUucG9vbHMubWFwKChwb29sKSA9PiBQb29sTWFyc2hhbGxlci5tYXJzaGFsKHBvb2wpKSxcbiAgICAgICAgfTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgc3RhdGljIHVubWFyc2hhbChtYXJzaGFsbGVkUm91dGU6IE1hcnNoYWxsZWRSb3V0ZSk6IFYzUm91dGUge1xuICAgIGNvbnN0IHYzUm91dGUgPSBtYXJzaGFsbGVkUm91dGUgYXMgTWFyc2hhbGxlZFYzUm91dGU7XG4gICAgcmV0dXJuIG5ldyBWM1JvdXRlKFxuICAgICAgdjNSb3V0ZS5wb29scy5tYXAoKG1hcnNoYWxsZWRQb29sKSA9PiBQb29sTWFyc2hhbGxlci51bm1hcnNoYWwobWFyc2hhbGxlZFBvb2wpKSxcbiAgICAgIFRva2VuTWFyc2hhbGxlci51bm1hcnNoYWwodjNSb3V0ZS5pbnB1dCksXG4gICAgICBUb2tlbk1hcnNoYWxsZXIudW5tYXJzaGFsKHYzUm91dGUub3V0cHV0KVxuICAgICk7XG4gIH1cbn1cbiJdfQ==