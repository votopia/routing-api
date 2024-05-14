/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Contract, utils } from "ethers";
const _abi = [
    {
        inputs: [],
        name: "refundETH",
        outputs: [],
        stateMutability: "payable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "token",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "amountMinimum",
                type: "uint256",
            },
            {
                internalType: "address",
                name: "recipient",
                type: "address",
            },
        ],
        name: "sweepToken",
        outputs: [],
        stateMutability: "payable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "amountMinimum",
                type: "uint256",
            },
            {
                internalType: "address",
                name: "recipient",
                type: "address",
            },
        ],
        name: "unwrapWETH9",
        outputs: [],
        stateMutability: "payable",
        type: "function",
    },
];
export class IPeripheryPayments__factory {
    static createInterface() {
        return new utils.Interface(_abi);
    }
    static connect(address, signerOrProvider) {
        return new Contract(address, _abi, signerOrProvider);
    }
}
IPeripheryPayments__factory.abi = _abi;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSVBlcmlwaGVyeVBheW1lbnRzX19mYWN0b3J5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vbGliL3R5cGVzL3YzL2ZhY3Rvcmllcy9JUGVyaXBoZXJ5UGF5bWVudHNfX2ZhY3RvcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsK0NBQStDO0FBQy9DLG9CQUFvQjtBQUNwQixvQkFBb0I7QUFFcEIsT0FBTyxFQUFFLFFBQVEsRUFBVSxLQUFLLEVBQUUsTUFBTSxRQUFRLENBQUM7QUFPakQsTUFBTSxJQUFJLEdBQUc7SUFDWDtRQUNFLE1BQU0sRUFBRSxFQUFFO1FBQ1YsSUFBSSxFQUFFLFdBQVc7UUFDakIsT0FBTyxFQUFFLEVBQUU7UUFDWCxlQUFlLEVBQUUsU0FBUztRQUMxQixJQUFJLEVBQUUsVUFBVTtLQUNqQjtJQUNEO1FBQ0UsTUFBTSxFQUFFO1lBQ047Z0JBQ0UsWUFBWSxFQUFFLFNBQVM7Z0JBQ3ZCLElBQUksRUFBRSxPQUFPO2dCQUNiLElBQUksRUFBRSxTQUFTO2FBQ2hCO1lBQ0Q7Z0JBQ0UsWUFBWSxFQUFFLFNBQVM7Z0JBQ3ZCLElBQUksRUFBRSxlQUFlO2dCQUNyQixJQUFJLEVBQUUsU0FBUzthQUNoQjtZQUNEO2dCQUNFLFlBQVksRUFBRSxTQUFTO2dCQUN2QixJQUFJLEVBQUUsV0FBVztnQkFDakIsSUFBSSxFQUFFLFNBQVM7YUFDaEI7U0FDRjtRQUNELElBQUksRUFBRSxZQUFZO1FBQ2xCLE9BQU8sRUFBRSxFQUFFO1FBQ1gsZUFBZSxFQUFFLFNBQVM7UUFDMUIsSUFBSSxFQUFFLFVBQVU7S0FDakI7SUFDRDtRQUNFLE1BQU0sRUFBRTtZQUNOO2dCQUNFLFlBQVksRUFBRSxTQUFTO2dCQUN2QixJQUFJLEVBQUUsZUFBZTtnQkFDckIsSUFBSSxFQUFFLFNBQVM7YUFDaEI7WUFDRDtnQkFDRSxZQUFZLEVBQUUsU0FBUztnQkFDdkIsSUFBSSxFQUFFLFdBQVc7Z0JBQ2pCLElBQUksRUFBRSxTQUFTO2FBQ2hCO1NBQ0Y7UUFDRCxJQUFJLEVBQUUsYUFBYTtRQUNuQixPQUFPLEVBQUUsRUFBRTtRQUNYLGVBQWUsRUFBRSxTQUFTO1FBQzFCLElBQUksRUFBRSxVQUFVO0tBQ2pCO0NBQ0YsQ0FBQztBQUVGLE1BQU0sT0FBTywyQkFBMkI7SUFFdEMsTUFBTSxDQUFDLGVBQWU7UUFDcEIsT0FBTyxJQUFJLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFnQyxDQUFDO0lBQ2xFLENBQUM7SUFDRCxNQUFNLENBQUMsT0FBTyxDQUNaLE9BQWUsRUFDZixnQkFBbUM7UUFFbkMsT0FBTyxJQUFJLFFBQVEsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixDQUF1QixDQUFDO0lBQzdFLENBQUM7O0FBVGUsK0JBQUcsR0FBRyxJQUFJLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBBdXRvZ2VuZXJhdGVkIGZpbGUuIERvIG5vdCBlZGl0IG1hbnVhbGx5LiAqL1xuLyogdHNsaW50OmRpc2FibGUgKi9cbi8qIGVzbGludC1kaXNhYmxlICovXG5cbmltcG9ydCB7IENvbnRyYWN0LCBTaWduZXIsIHV0aWxzIH0gZnJvbSBcImV0aGVyc1wiO1xuaW1wb3J0IHsgUHJvdmlkZXIgfSBmcm9tIFwiQGV0aGVyc3Byb2plY3QvcHJvdmlkZXJzXCI7XG5pbXBvcnQgdHlwZSB7XG4gIElQZXJpcGhlcnlQYXltZW50cyxcbiAgSVBlcmlwaGVyeVBheW1lbnRzSW50ZXJmYWNlLFxufSBmcm9tIFwiLi4vSVBlcmlwaGVyeVBheW1lbnRzXCI7XG5cbmNvbnN0IF9hYmkgPSBbXG4gIHtcbiAgICBpbnB1dHM6IFtdLFxuICAgIG5hbWU6IFwicmVmdW5kRVRIXCIsXG4gICAgb3V0cHV0czogW10sXG4gICAgc3RhdGVNdXRhYmlsaXR5OiBcInBheWFibGVcIixcbiAgICB0eXBlOiBcImZ1bmN0aW9uXCIsXG4gIH0sXG4gIHtcbiAgICBpbnB1dHM6IFtcbiAgICAgIHtcbiAgICAgICAgaW50ZXJuYWxUeXBlOiBcImFkZHJlc3NcIixcbiAgICAgICAgbmFtZTogXCJ0b2tlblwiLFxuICAgICAgICB0eXBlOiBcImFkZHJlc3NcIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGludGVybmFsVHlwZTogXCJ1aW50MjU2XCIsXG4gICAgICAgIG5hbWU6IFwiYW1vdW50TWluaW11bVwiLFxuICAgICAgICB0eXBlOiBcInVpbnQyNTZcIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGludGVybmFsVHlwZTogXCJhZGRyZXNzXCIsXG4gICAgICAgIG5hbWU6IFwicmVjaXBpZW50XCIsXG4gICAgICAgIHR5cGU6IFwiYWRkcmVzc1wiLFxuICAgICAgfSxcbiAgICBdLFxuICAgIG5hbWU6IFwic3dlZXBUb2tlblwiLFxuICAgIG91dHB1dHM6IFtdLFxuICAgIHN0YXRlTXV0YWJpbGl0eTogXCJwYXlhYmxlXCIsXG4gICAgdHlwZTogXCJmdW5jdGlvblwiLFxuICB9LFxuICB7XG4gICAgaW5wdXRzOiBbXG4gICAgICB7XG4gICAgICAgIGludGVybmFsVHlwZTogXCJ1aW50MjU2XCIsXG4gICAgICAgIG5hbWU6IFwiYW1vdW50TWluaW11bVwiLFxuICAgICAgICB0eXBlOiBcInVpbnQyNTZcIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGludGVybmFsVHlwZTogXCJhZGRyZXNzXCIsXG4gICAgICAgIG5hbWU6IFwicmVjaXBpZW50XCIsXG4gICAgICAgIHR5cGU6IFwiYWRkcmVzc1wiLFxuICAgICAgfSxcbiAgICBdLFxuICAgIG5hbWU6IFwidW53cmFwV0VUSDlcIixcbiAgICBvdXRwdXRzOiBbXSxcbiAgICBzdGF0ZU11dGFiaWxpdHk6IFwicGF5YWJsZVwiLFxuICAgIHR5cGU6IFwiZnVuY3Rpb25cIixcbiAgfSxcbl07XG5cbmV4cG9ydCBjbGFzcyBJUGVyaXBoZXJ5UGF5bWVudHNfX2ZhY3Rvcnkge1xuICBzdGF0aWMgcmVhZG9ubHkgYWJpID0gX2FiaTtcbiAgc3RhdGljIGNyZWF0ZUludGVyZmFjZSgpOiBJUGVyaXBoZXJ5UGF5bWVudHNJbnRlcmZhY2Uge1xuICAgIHJldHVybiBuZXcgdXRpbHMuSW50ZXJmYWNlKF9hYmkpIGFzIElQZXJpcGhlcnlQYXltZW50c0ludGVyZmFjZTtcbiAgfVxuICBzdGF0aWMgY29ubmVjdChcbiAgICBhZGRyZXNzOiBzdHJpbmcsXG4gICAgc2lnbmVyT3JQcm92aWRlcjogU2lnbmVyIHwgUHJvdmlkZXJcbiAgKTogSVBlcmlwaGVyeVBheW1lbnRzIHtcbiAgICByZXR1cm4gbmV3IENvbnRyYWN0KGFkZHJlc3MsIF9hYmksIHNpZ25lck9yUHJvdmlkZXIpIGFzIElQZXJpcGhlcnlQYXltZW50cztcbiAgfVxufVxuIl19