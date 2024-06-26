import { TradeType } from "@votopia/sdk-core";
import { ChainId } from "../../injector-sor";
export const PAIRS_TO_TRACK = new Map([
    [
        ChainId.OPTOPIA,
        new Map([
            [TradeType.EXACT_INPUT, ["WETH/USDC", "USDC/WETH"]],
            [TradeType.EXACT_OUTPUT, ["USDC/WETH"]],
        ]),
    ],
]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFpcnMtdG8tdHJhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9saWIvaGFuZGxlcnMvcXVvdGUvdXRpbC9wYWlycy10by10cmFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFFOUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBRTdDLE1BQU0sQ0FBQyxNQUFNLGNBQWMsR0FBMkMsSUFBSSxHQUFHLENBQUM7SUFDNUU7UUFDRSxPQUFPLENBQUMsT0FBTztRQUNmLElBQUksR0FBRyxDQUFDO1lBQ04sQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ25ELENBQUMsU0FBUyxDQUFDLFlBQVksRUFBRSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1NBQ3hDLENBQUM7S0FDSDtDQUNGLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRyYWRlVHlwZSB9IGZyb20gXCJAdm90b3BpYS9zZGstY29yZVwiO1xuXG5pbXBvcnQgeyBDaGFpbklkIH0gZnJvbSBcIi4uLy4uL2luamVjdG9yLXNvclwiO1xuXG5leHBvcnQgY29uc3QgUEFJUlNfVE9fVFJBQ0s6IE1hcDxDaGFpbklkLCBNYXA8VHJhZGVUeXBlLCBzdHJpbmdbXT4+ID0gbmV3IE1hcChbXG4gIFtcbiAgICBDaGFpbklkLk9QVE9QSUEsXG4gICAgbmV3IE1hcChbXG4gICAgICBbVHJhZGVUeXBlLkVYQUNUX0lOUFVULCBbXCJXRVRIL1VTRENcIiwgXCJVU0RDL1dFVEhcIl1dLFxuICAgICAgW1RyYWRlVHlwZS5FWEFDVF9PVVRQVVQsIFtcIlVTREMvV0VUSFwiXV0sXG4gICAgXSksXG4gIF0sXG5dKTtcbiJdfQ==