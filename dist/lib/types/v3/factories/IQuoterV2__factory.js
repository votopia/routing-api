/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Contract, utils } from "ethers";
const _abi = [
    {
        inputs: [
            {
                internalType: "bytes",
                name: "path",
                type: "bytes",
            },
            {
                internalType: "uint256",
                name: "amountIn",
                type: "uint256",
            },
        ],
        name: "quoteExactInput",
        outputs: [
            {
                internalType: "uint256",
                name: "amountOut",
                type: "uint256",
            },
            {
                internalType: "uint160[]",
                name: "sqrtPriceX96AfterList",
                type: "uint160[]",
            },
            {
                internalType: "uint32[]",
                name: "initializedTicksCrossedList",
                type: "uint32[]",
            },
            {
                internalType: "uint256",
                name: "gasEstimate",
                type: "uint256",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                components: [
                    {
                        internalType: "address",
                        name: "tokenIn",
                        type: "address",
                    },
                    {
                        internalType: "address",
                        name: "tokenOut",
                        type: "address",
                    },
                    {
                        internalType: "uint256",
                        name: "amountIn",
                        type: "uint256",
                    },
                    {
                        internalType: "uint24",
                        name: "fee",
                        type: "uint24",
                    },
                    {
                        internalType: "uint160",
                        name: "sqrtPriceLimitX96",
                        type: "uint160",
                    },
                ],
                internalType: "struct IQuoterV2.QuoteExactInputSingleParams",
                name: "params",
                type: "tuple",
            },
        ],
        name: "quoteExactInputSingle",
        outputs: [
            {
                internalType: "uint256",
                name: "amountOut",
                type: "uint256",
            },
            {
                internalType: "uint160",
                name: "sqrtPriceX96After",
                type: "uint160",
            },
            {
                internalType: "uint32",
                name: "initializedTicksCrossed",
                type: "uint32",
            },
            {
                internalType: "uint256",
                name: "gasEstimate",
                type: "uint256",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "bytes",
                name: "path",
                type: "bytes",
            },
            {
                internalType: "uint256",
                name: "amountOut",
                type: "uint256",
            },
        ],
        name: "quoteExactOutput",
        outputs: [
            {
                internalType: "uint256",
                name: "amountIn",
                type: "uint256",
            },
            {
                internalType: "uint160[]",
                name: "sqrtPriceX96AfterList",
                type: "uint160[]",
            },
            {
                internalType: "uint32[]",
                name: "initializedTicksCrossedList",
                type: "uint32[]",
            },
            {
                internalType: "uint256",
                name: "gasEstimate",
                type: "uint256",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                components: [
                    {
                        internalType: "address",
                        name: "tokenIn",
                        type: "address",
                    },
                    {
                        internalType: "address",
                        name: "tokenOut",
                        type: "address",
                    },
                    {
                        internalType: "uint256",
                        name: "amount",
                        type: "uint256",
                    },
                    {
                        internalType: "uint24",
                        name: "fee",
                        type: "uint24",
                    },
                    {
                        internalType: "uint160",
                        name: "sqrtPriceLimitX96",
                        type: "uint160",
                    },
                ],
                internalType: "struct IQuoterV2.QuoteExactOutputSingleParams",
                name: "params",
                type: "tuple",
            },
        ],
        name: "quoteExactOutputSingle",
        outputs: [
            {
                internalType: "uint256",
                name: "amountIn",
                type: "uint256",
            },
            {
                internalType: "uint160",
                name: "sqrtPriceX96After",
                type: "uint160",
            },
            {
                internalType: "uint32",
                name: "initializedTicksCrossed",
                type: "uint32",
            },
            {
                internalType: "uint256",
                name: "gasEstimate",
                type: "uint256",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
];
export class IQuoterV2__factory {
    static createInterface() {
        return new utils.Interface(_abi);
    }
    static connect(address, signerOrProvider) {
        return new Contract(address, _abi, signerOrProvider);
    }
}
IQuoterV2__factory.abi = _abi;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSVF1b3RlclYyX19mYWN0b3J5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vbGliL3R5cGVzL3YzL2ZhY3Rvcmllcy9JUXVvdGVyVjJfX2ZhY3RvcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsK0NBQStDO0FBQy9DLG9CQUFvQjtBQUNwQixvQkFBb0I7QUFFcEIsT0FBTyxFQUFFLFFBQVEsRUFBVSxLQUFLLEVBQUUsTUFBTSxRQUFRLENBQUM7QUFJakQsTUFBTSxJQUFJLEdBQUc7SUFDWDtRQUNFLE1BQU0sRUFBRTtZQUNOO2dCQUNFLFlBQVksRUFBRSxPQUFPO2dCQUNyQixJQUFJLEVBQUUsTUFBTTtnQkFDWixJQUFJLEVBQUUsT0FBTzthQUNkO1lBQ0Q7Z0JBQ0UsWUFBWSxFQUFFLFNBQVM7Z0JBQ3ZCLElBQUksRUFBRSxVQUFVO2dCQUNoQixJQUFJLEVBQUUsU0FBUzthQUNoQjtTQUNGO1FBQ0QsSUFBSSxFQUFFLGlCQUFpQjtRQUN2QixPQUFPLEVBQUU7WUFDUDtnQkFDRSxZQUFZLEVBQUUsU0FBUztnQkFDdkIsSUFBSSxFQUFFLFdBQVc7Z0JBQ2pCLElBQUksRUFBRSxTQUFTO2FBQ2hCO1lBQ0Q7Z0JBQ0UsWUFBWSxFQUFFLFdBQVc7Z0JBQ3pCLElBQUksRUFBRSx1QkFBdUI7Z0JBQzdCLElBQUksRUFBRSxXQUFXO2FBQ2xCO1lBQ0Q7Z0JBQ0UsWUFBWSxFQUFFLFVBQVU7Z0JBQ3hCLElBQUksRUFBRSw2QkFBNkI7Z0JBQ25DLElBQUksRUFBRSxVQUFVO2FBQ2pCO1lBQ0Q7Z0JBQ0UsWUFBWSxFQUFFLFNBQVM7Z0JBQ3ZCLElBQUksRUFBRSxhQUFhO2dCQUNuQixJQUFJLEVBQUUsU0FBUzthQUNoQjtTQUNGO1FBQ0QsZUFBZSxFQUFFLFlBQVk7UUFDN0IsSUFBSSxFQUFFLFVBQVU7S0FDakI7SUFDRDtRQUNFLE1BQU0sRUFBRTtZQUNOO2dCQUNFLFVBQVUsRUFBRTtvQkFDVjt3QkFDRSxZQUFZLEVB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QUN2QixJQUFJLEVBQUUsbUJBQW1CO3dCQUN6QixJQUFJLEVBQUUsU0FBUztxQkFDaEI7aUJBQ0Y7Z0JBQ0QsWUFBWSxFQUFFLCtDQUErQztnQkFDN0QsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsSUFBSSxFQUFFLE9BQU87YUFDZDtTQUNGO1FBQ0QsSUFBSSxFQUFFLHdCQUF3QjtRQUM5QixPQUFPLEVBQUU7WUFDUDtnQkFDRSxZQUFZLEVBQUUsU0FBUztnQkFDdkIsSUFBSSxFQUFFLFVBQVU7Z0JBQ2hCLElBQUksRUFBRSxTQUFTO2FBQ2hCO1lBQ0Q7Z0JBQ0UsWUFBWSxFQUFFLFNBQVM7Z0JBQ3ZCLElBQUksRUFBRSxtQkFBbUI7Z0JBQ3pCLElBQUksRUFBRSxTQUFTO2FBQ2hCO1lBQ0Q7Z0JBQ0UsWUFBWSxFQUFFLFFBQVE7Z0JBQ3RCLElBQUksRUFBRSx5QkFBeUI7Z0JBQy9CLElBQUksRUFBRSxRQUFRO2FBQ2Y7WUFDRDtnQkFDRSxZQUFZLEVBQUUsU0FBUztnQkFDdkIsSUFBSSxFQUFFLGFBQWE7Z0JBQ25CLElBQUksRUFBRSxTQUFTO2FBQ2hCO1NBQ0Y7UUFDRCxlQUFlLEVBQUUsWUFBWTtRQUM3QixJQUFJLEVBQUUsVUFBVTtLQUNqQjtDQUNGLENBQUM7QUFFRixNQUFNLE9BQU8sa0JBQWtCO0lBRTdCLE1BQU0sQ0FBQyxlQUFlO1FBQ3BCLE9BQU8sSUFBSSxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBdUIsQ0FBQztJQUN6RCxDQUFDO0lBQ0QsTUFBTSxDQUFDLE9BQU8sQ0FDWixPQUFlLEVBQ2YsZ0JBQW1DO1FBRW5DLE9BQU8sSUFBSSxRQUFRLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxnQkFBZ0IsQ0FBYyxDQUFDO0lBQ3BFLENBQUM7O0FBVGUsc0JBQUcsR0FBRyxJQUFJLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBBdXRvZ2VuZXJhdGVkIGZpbGUuIERvIG5vdCBlZGl0IG1hbnVhbGx5LiAqL1xuLyogdHNsaW50OmRpc2FibGUgKi9cbi8qIGVzbGludC1kaXNhYmxlICovXG5cbmltcG9ydCB7IENvbnRyYWN0LCBTaWduZXIsIHV0aWxzIH0gZnJvbSBcImV0aGVyc1wiO1xuaW1wb3J0IHsgUHJvdmlkZXIgfSBmcm9tIFwiQGV0aGVyc3Byb2plY3QvcHJvdmlkZXJzXCI7XG5pbXBvcnQgdHlwZSB7IElRdW90ZXJWMiwgSVF1b3RlclYySW50ZXJmYWNlIH0gZnJvbSBcIi4uL0lRdW90ZXJWMlwiO1xuXG5jb25zdCBfYWJpID0gW1xuICB7XG4gICAgaW5wdXRzOiBbXG4gICAgICB7XG4gICAgICAgIGludGVybmFsVHlwZTogXCJieXRlc1wiLFxuICAgICAgICBuYW1lOiBcInBhdGhcIixcbiAgICAgICAgdHlwZTogXCJieXRlc1wiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgaW50ZXJuYWxUeXBlOiBcInVpbnQyNTZcIixcbiAgICAgICAgbmFtZTogXCJhbW91bnRJblwiLFxuICAgICAgICB0eXBlOiBcInVpbnQyNTZcIixcbiAgICAgIH0sXG4gICAgXSxcbiAgICBuYW1lOiBcInF1b3RlRXhhY3RJbnB1dFwiLFxuICAgIG91dHB1dHM6IFtcbiAgICAgIHtcbiAgICAgICAgaW50ZXJuYWxUeXBlOiBcInVpbnQyNTZcIixcbiAgICAgICAgbmFtZTogXCJhbW91bnRPdXRcIixcbiAgICAgICAgdHlwZTogXCJ1aW50MjU2XCIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBpbnRlcm5hbFR5cGU6IFwidWludDE2MFtdXCIsXG4gICAgICAgIG5hbWU6IFwic3FydFByaWNlWDk2QWZ0ZXJMaXN0XCIsXG4gICAgICAgIHR5cGU6IFwidWludDE2MFtdXCIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBpbnRlcm5hbFR5cGU6IFwidWludDMyW11cIixcbiAgICAgICAgbmFtZTogXCJpbml0aWFsaXplZFRpY2tzQ3Jvc3NlZExpc3RcIixcbiAgICAgICAgdHlwZTogXCJ1aW50MzJbXVwiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgaW50ZXJuYWxUeXBlOiBcInVpbnQyNTZcIixcbiAgICAgICAgbmFtZTogXCJnYXNFc3RpbWF0ZVwiLFxuICAgICAgICB0eXBlOiBcInVpbnQyNTZcIixcbiAgICAgIH0sXG4gICAgXSxcbiAgICBzdGF0ZU11dGFiaWxpdHk6IFwibm9ucGF5YWJsZVwiLFxuICAgIHR5cGU6IFwiZnVuY3Rpb25cIixcbiAgfSxcbiAge1xuICAgIGlucHV0czogW1xuICAgICAge1xuICAgICAgICBjb21wb25lbnRzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgaW50ZXJuYWxUeXBlOiBcImFkZHJlc3NcIixcbiAgICAgICAgICAgIG5hbWU6IFwidG9rZW5JblwiLFxuICAgICAgICAgICAgdHlwZTogXCJhZGRyZXNzXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBpbnRlcm5hbFR5cGU6IFwiYWRkcmVzc1wiLFxuICAgICAgICAgICAgbmFtZTogXCJ0b2tlbk91dFwiLFxuICAgICAgICAgICAgdHlwZTogXCJhZGRyZXNzXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBpbnRlcm5hbFR5cGU6IFwidWludDI1NlwiLFxuICAgICAgICAgICAgbmFtZTogXCJhbW91bnRJblwiLFxuICAgICAgICAgICAgdHlwZTogXCJ1aW50MjU2XCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBpbnRlcm5hbFR5cGU6IFwidWludDI0XCIsXG4gICAgICAgICAgICBuYW1lOiBcImZlZVwiLFxuICAgICAgICAgICAgdHlwZTogXCJ1aW50MjRcIixcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGludGVybmFsVHlwZTogXCJ1aW50MTYwXCIsXG4gICAgICAgICAgICBuYW1lOiBcInNxcnRQcmljZUxpbWl0WDk2XCIsXG4gICAgICAgICAgICB0eXBlOiBcInVpbnQxNjBcIixcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBpbnRlcm5hbFR5cGU6IFwic3RydWN0IElRdW90ZXJWMi5RdW90ZUV4YWN0SW5wdXRTaW5nbGVQYXJhbXNcIixcbiAgICAgICAgbmFtZTogXCJwYXJhbXNcIixcbiAgICAgICAgdHlwZTogXCJ0dXBsZVwiLFxuICAgICAgfSxcbiAgICBdLFxuICAgIG5hbWU6IFwicXVvdGVFeGFjdElucHV0U2luZ2xlXCIsXG4gICAgb3V0cHV0czogW1xuICAgICAge1xuICAgICAgICBpbnRlcm5hbFR5cGU6IFwidWludDI1NlwiLFxuICAgICAgICBuYW1lOiBcImFtb3VudE91dFwiLFxuICAgICAgICB0eXBlOiBcInVpbnQyNTZcIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGludGVybmFsVHlwZTogXCJ1aW50MTYwXCIsXG4gICAgICAgIG5hbWU6IFwic3FydFByaWNlWDk2QWZ0ZXJcIixcbiAgICAgICAgdHlwZTogXCJ1aW50MTYwXCIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBpbnRlcm5hbFR5cGU6IFwidWludDMyXCIsXG4gICAgICAgIG5hbWU6IFwiaW5pdGlhbGl6ZWRUaWNrc0Nyb3NzZWRcIixcbiAgICAgICAgdHlwZTogXCJ1aW50MzJcIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGludGVybmFsVHlwZTogXCJ1aW50MjU2XCIsXG4gICAgICAgIG5hbWU6IFwiZ2FzRXN0aW1hdGVcIixcbiAgICAgICAgdHlwZTogXCJ1aW50MjU2XCIsXG4gICAgICB9LFxuICAgIF0sXG4gICAgc3RhdGVNdXRhYmlsaXR5OiBcIm5vbnBheWFibGVcIixcbiAgICB0eXBlOiBcImZ1bmN0aW9uXCIsXG4gIH0sXG4gIHtcbiAgICBpbnB1dHM6IFtcbiAgICAgIHtcbiAgICAgICAgaW50ZXJuYWxUeXBlOiBcImJ5dGVzXCIsXG4gICAgICAgIG5hbWU6IFwicGF0aFwiLFxuICAgICAgICB0eXBlOiBcImJ5dGVzXCIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBpbnRlcm5hbFR5cGU6IFwidWludDI1NlwiLFxuICAgICAgICBuYW1lOiBcImFtb3VudE91dFwiLFxuICAgICAgICB0eXBlOiBcInVpbnQyNTZcIixcbiAgICAgIH0sXG4gICAgXSxcbiAgICBuYW1lOiBcInF1b3RlRXhhY3RPdXRwdXRcIixcbiAgICBvdXRwdXRzOiBbXG4gICAgICB7XG4gICAgICAgIGludGVybmFsVHlwZTogXCJ1aW50MjU2XCIsXG4gICAgICAgIG5hbWU6IFwiYW1vdW50SW5cIixcbiAgICAgICAgdHlwZTogXCJ1aW50MjU2XCIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBpbnRlcm5hbFR5cGU6IFwidWludDE2MFtdXCIsXG4gICAgICAgIG5hbWU6IFwic3FydFByaWNlWDk2QWZ0ZXJMaXN0XCIsXG4gICAgICAgIHR5cGU6IFwidWludDE2MFtdXCIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBpbnRlcm5hbFR5cGU6IFwidWludDMyW11cIixcbiAgICAgICAgbmFtZTogXCJpbml0aWFsaXplZFRpY2tzQ3Jvc3NlZExpc3RcIixcbiAgICAgICAgdHlwZTogXCJ1aW50MzJbXVwiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgaW50ZXJuYWxUeXBlOiBcInVpbnQyNTZcIixcbiAgICAgICAgbmFtZTogXCJnYXNFc3RpbWF0ZVwiLFxuICAgICAgICB0eXBlOiBcInVpbnQyNTZcIixcbiAgICAgIH0sXG4gICAgXSxcbiAgICBzdGF0ZU11dGFiaWxpdHk6IFwibm9ucGF5YWJsZVwiLFxuICAgIHR5cGU6IFwiZnVuY3Rpb25cIixcbiAgfSxcbiAge1xuICAgIGlucHV0czogW1xuICAgICAge1xuICAgICAgICBjb21wb25lbnRzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgaW50ZXJuYWxUeXBlOiBcImFkZHJlc3NcIixcbiAgICAgICAgICAgIG5hbWU6IFwidG9rZW5JblwiLFxuICAgICAgICAgICAgdHlwZTogXCJhZGRyZXNzXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBpbnRlcm5hbFR5cGU6IFwiYWRkcmVzc1wiLFxuICAgICAgICAgICAgbmFtZTogXCJ0b2tlbk91dFwiLFxuICAgICAgICAgICAgdHlwZTogXCJhZGRyZXNzXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBpbnRlcm5hbFR5cGU6IFwidWludDI1NlwiLFxuICAgICAgICAgICAgbmFtZTogXCJhbW91bnRcIixcbiAgICAgICAgICAgIHR5cGU6IFwidWludDI1NlwiLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgaW50ZXJuYWxUeXBlOiBcInVpbnQyNFwiLFxuICAgICAgICAgICAgbmFtZTogXCJmZWVcIixcbiAgICAgICAgICAgIHR5cGU6IFwidWludDI0XCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBpbnRlcm5hbFR5cGU6IFwidWludDE2MFwiLFxuICAgICAgICAgICAgbmFtZTogXCJzcXJ0UHJpY2VMaW1pdFg5NlwiLFxuICAgICAgICAgICAgdHlwZTogXCJ1aW50MTYwXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgaW50ZXJuYWxUeXBlOiBcInN0cnVjdCBJUXVvdGVyVjIuUXVvdGVFeGFjdE91dHB1dFNpbmdsZVBhcmFtc1wiLFxuICAgICAgICBuYW1lOiBcInBhcmFtc1wiLFxuICAgICAgICB0eXBlOiBcInR1cGxlXCIsXG4gICAgICB9LFxuICAgIF0sXG4gICAgbmFtZTogXCJxdW90ZUV4YWN0T3V0cHV0U2luZ2xlXCIsXG4gICAgb3V0cHV0czogW1xuICAgICAge1xuICAgICAgICBpbnRlcm5hbFR5cGU6IFwidWludDI1NlwiLFxuICAgICAgICBuYW1lOiBcImFtb3VudEluXCIsXG4gICAgICAgIHR5cGU6IFwidWludDI1NlwiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgaW50ZXJuYWxUeXBlOiBcInVpbnQxNjBcIixcbiAgICAgICAgbmFtZTogXCJzcXJ0UHJpY2VYOTZBZnRlclwiLFxuICAgICAgICB0eXBlOiBcInVpbnQxNjBcIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGludGVybmFsVHlwZTogXCJ1aW50MzJcIixcbiAgICAgICAgbmFtZTogXCJpbml0aWFsaXplZFRpY2tzQ3Jvc3NlZFwiLFxuICAgICAgICB0eXBlOiBcInVpbnQzMlwiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgaW50ZXJuYWxUeXBlOiBcInVpbnQyNTZcIixcbiAgICAgICAgbmFtZTogXCJnYXNFc3RpbWF0ZVwiLFxuICAgICAgICB0eXBlOiBcInVpbnQyNTZcIixcbiAgICAgIH0sXG4gICAgXSxcbiAgICBzdGF0ZU11dGFiaWxpdHk6IFwibm9ucGF5YWJsZVwiLFxuICAgIHR5cGU6IFwiZnVuY3Rpb25cIixcbiAgfSxcbl07XG5cbmV4cG9ydCBjbGFzcyBJUXVvdGVyVjJfX2ZhY3Rvcnkge1xuICBzdGF0aWMgcmVhZG9ubHkgYWJpID0gX2FiaTtcbiAgc3RhdGljIGNyZWF0ZUludGVyZmFjZSgpOiBJUXVvdGVyVjJJbnRlcmZhY2Uge1xuICAgIHJldHVybiBuZXcgdXRpbHMuSW50ZXJmYWNlKF9hYmkpIGFzIElRdW90ZXJWMkludGVyZmFjZTtcbiAgfVxuICBzdGF0aWMgY29ubmVjdChcbiAgICBhZGRyZXNzOiBzdHJpbmcsXG4gICAgc2lnbmVyT3JQcm92aWRlcjogU2lnbmVyIHwgUHJvdmlkZXJcbiAgKTogSVF1b3RlclYyIHtcbiAgICByZXR1cm4gbmV3IENvbnRyYWN0KGFkZHJlc3MsIF9hYmksIHNpZ25lck9yUHJvdmlkZXIpIGFzIElRdW90ZXJWMjtcbiAgfVxufVxuIl19