/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Contract, utils } from "ethers";
const _abi = [
    {
        inputs: [
            {
                internalType: "address",
                name: "holder",
                type: "address",
            },
            {
                internalType: "address",
                name: "spender",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "nonce",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "expiry",
                type: "uint256",
            },
            {
                internalType: "bool",
                name: "allowed",
                type: "bool",
            },
            {
                internalType: "uint8",
                name: "v",
                type: "uint8",
            },
            {
                internalType: "bytes32",
                name: "r",
                type: "bytes32",
            },
            {
                internalType: "bytes32",
                name: "s",
                type: "bytes32",
            },
        ],
        name: "permit",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
];
export class IERC20PermitAllowed__factory {
    static createInterface() {
        return new utils.Interface(_abi);
    }
    static connect(address, signerOrProvider) {
        return new Contract(address, _abi, signerOrProvider);
    }
}
IERC20PermitAllowed__factory.abi = _abi;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSUVSQzIwUGVybWl0QWxsb3dlZF9fZmFjdG9yeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2xpYi90eXBlcy92My9mYWN0b3JpZXMvSUVSQzIwUGVybWl0QWxsb3dlZF9fZmFjdG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwrQ0FBK0M7QUFDL0Msb0JBQW9CO0FBQ3BCLG9CQUFvQjtBQUVwQixPQUFPLEVBQUUsUUFBUSxFQUFVLEtBQUssRUFBRSxNQUFNLFFBQVEsQ0FBQztBQU9qRCxNQUFNLElBQUksR0FBRztJQUNYO1FBQ0UsTUFBTSxFQUFFO1lBQ047Z0JBQ0UsWUFBWSxFQUFFLFNBQVM7Z0JBQ3ZCLElBQUksRUFBRSxRQUFRO2dCQUNkLElBQUksRUFBRSxTQUFTO2FBQ2hCO1lBQ0Q7Z0JBQ0UsWUFBWSxFQUFFLFNBQVM7Z0JBQ3ZCLElBQUksRUFBRSxTQUFTO2dCQUNmLElBQUksRUFBRSxTQUFTO2FBQ2hCO1lBQ0Q7Z0JBQ0UsWUFBWSxFQUFFLFNBQVM7Z0JBQ3ZCLElBQUksRUFBRSxPQUFPO2dCQUNiLElBQUksRUFBRSxTQUFTO2FBQ2hCO1lBQ0Q7Z0JBQ0UsWUFBWSxFQUFFLFNBQVM7Z0JBQ3ZCLElBQUksRUFBRSxRQUFRO2dCQUNkLElBQUksRUFBRSxTQUFTO2FBQ2hCO1lBQ0Q7Z0JBQ0UsWUFBWSxFQUFFLE1BQU07Z0JBQ3BCLElBQUksRUFBRSxTQUFTO2dCQUNmLElBQUksRUFBRSxNQUFNO2FBQ2I7WUFDRDtnQkFDRSxZQUFZLEVBQUUsT0FBTztnQkFDckIsSUFBSSxFQUFFLEdBQUc7Z0JBQ1QsSUFBSSxFQUFFLE9BQU87YUFDZDtZQUNEO2dCQUNFLFlBQVksRUFBRSxTQUFTO2dCQUN2QixJQUFJLEVBQUUsR0FBRztnQkFDVCxJQUFJLEVBQUUsU0FBUzthQUNoQjtZQUNEO2dCQUNFLFlBQVksRUFBRSxTQUFTO2dCQUN2QixJQUFJLEVBQUUsR0FBRztnQkFDVCxJQUFJLEVBQUUsU0FBUzthQUNoQjtTQUNGO1FBQ0QsSUFBSSxFQUFFLFFBQVE7UUFDZCxPQUFPLEVBQUUsRUFBRTtRQUNYLGVBQWUsRUFBRSxZQUFZO1FBQzdCLElBQUksRUFBRSxVQUFVO0tBQ2pCO0NBQ0YsQ0FBQztBQUVGLE1BQU0sT0FBTyw0QkFBNEI7SUFFdkMsTUFBTSxDQUFDLGVBQWU7UUFDcEIsT0FBTyxJQUFJLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFpQyxDQUFDO0lBQ25FLENBQUM7SUFDRCxNQUFNLENBQUMsT0FBTyxDQUNaLE9BQWUsRUFDZixnQkFBbUM7UUFFbkMsT0FBTyxJQUFJLFFBQVEsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixDQUF3QixDQUFDO0lBQzlFLENBQUM7O0FBVGUsZ0NBQUcsR0FBRyxJQUFJLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBBdXRvZ2VuZXJhdGVkIGZpbGUuIERvIG5vdCBlZGl0IG1hbnVhbGx5LiAqL1xuLyogdHNsaW50OmRpc2FibGUgKi9cbi8qIGVzbGludC1kaXNhYmxlICovXG5cbmltcG9ydCB7IENvbnRyYWN0LCBTaWduZXIsIHV0aWxzIH0gZnJvbSBcImV0aGVyc1wiO1xuaW1wb3J0IHsgUHJvdmlkZXIgfSBmcm9tIFwiQGV0aGVyc3Byb2plY3QvcHJvdmlkZXJzXCI7XG5pbXBvcnQgdHlwZSB7XG4gIElFUkMyMFBlcm1pdEFsbG93ZWQsXG4gIElFUkMyMFBlcm1pdEFsbG93ZWRJbnRlcmZhY2UsXG59IGZyb20gXCIuLi9JRVJDMjBQZXJtaXRBbGxvd2VkXCI7XG5cbmNvbnN0IF9hYmkgPSBbXG4gIHtcbiAgICBpbnB1dHM6IFtcbiAgICAgIHtcbiAgICAgICAgaW50ZXJuYWxUeXBlOiBcImFkZHJlc3NcIixcbiAgICAgICAgbmFtZTogXCJob2xkZXJcIixcbiAgICAgICAgdHlwZTogXCJhZGRyZXNzXCIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBpbnRlcm5hbFR5cGU6IFwiYWRkcmVzc1wiLFxuICAgICAgICBuYW1lOiBcInNwZW5kZXJcIixcbiAgICAgICAgdHlwZTogXCJhZGRyZXNzXCIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBpbnRlcm5hbFR5cGU6IFwidWludDI1NlwiLFxuICAgICAgICBuYW1lOiBcIm5vbmNlXCIsXG4gICAgICAgIHR5cGU6IFwidWludDI1NlwiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgaW50ZXJuYWxUeXBlOiBcInVpbnQyNTZcIixcbiAgICAgICAgbmFtZTogXCJleHBpcnlcIixcbiAgICAgICAgdHlwZTogXCJ1aW50MjU2XCIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBpbnRlcm5hbFR5cGU6IFwiYm9vbFwiLFxuICAgICAgICBuYW1lOiBcImFsbG93ZWRcIixcbiAgICAgICAgdHlwZTogXCJib29sXCIsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBpbnRlcm5hbFR5cGU6IFwidWludDhcIixcbiAgICAgICAgbmFtZTogXCJ2XCIsXG4gICAgICAgIHR5cGU6IFwidWludDhcIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGludGVybmFsVHlwZTogXCJieXRlczMyXCIsXG4gICAgICAgIG5hbWU6IFwiclwiLFxuICAgICAgICB0eXBlOiBcImJ5dGVzMzJcIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGludGVybmFsVHlwZTogXCJieXRlczMyXCIsXG4gICAgICAgIG5hbWU6IFwic1wiLFxuICAgICAgICB0eXBlOiBcImJ5dGVzMzJcIixcbiAgICAgIH0sXG4gICAgXSxcbiAgICBuYW1lOiBcInBlcm1pdFwiLFxuICAgIG91dHB1dHM6IFtdLFxuICAgIHN0YXRlTXV0YWJpbGl0eTogXCJub25wYXlhYmxlXCIsXG4gICAgdHlwZTogXCJmdW5jdGlvblwiLFxuICB9LFxuXTtcblxuZXhwb3J0IGNsYXNzIElFUkMyMFBlcm1pdEFsbG93ZWRfX2ZhY3Rvcnkge1xuICBzdGF0aWMgcmVhZG9ubHkgYWJpID0gX2FiaTtcbiAgc3RhdGljIGNyZWF0ZUludGVyZmFjZSgpOiBJRVJDMjBQZXJtaXRBbGxvd2VkSW50ZXJmYWNlIHtcbiAgICByZXR1cm4gbmV3IHV0aWxzLkludGVyZmFjZShfYWJpKSBhcyBJRVJDMjBQZXJtaXRBbGxvd2VkSW50ZXJmYWNlO1xuICB9XG4gIHN0YXRpYyBjb25uZWN0KFxuICAgIGFkZHJlc3M6IHN0cmluZyxcbiAgICBzaWduZXJPclByb3ZpZGVyOiBTaWduZXIgfCBQcm92aWRlclxuICApOiBJRVJDMjBQZXJtaXRBbGxvd2VkIHtcbiAgICByZXR1cm4gbmV3IENvbnRyYWN0KGFkZHJlc3MsIF9hYmksIHNpZ25lck9yUHJvdmlkZXIpIGFzIElFUkMyMFBlcm1pdEFsbG93ZWQ7XG4gIH1cbn1cbiJdfQ==