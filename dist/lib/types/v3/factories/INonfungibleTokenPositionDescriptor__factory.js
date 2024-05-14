/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Contract, utils } from "ethers";
const _abi = [
    {
        inputs: [
            {
                internalType: "contract INonfungiblePositionManager",
                name: "positionManager",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "tokenId",
                type: "uint256",
            },
        ],
        name: "tokenURI",
        outputs: [
            {
                internalType: "string",
                name: "",
                type: "string",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
];
export class INonfungibleTokenPositionDescriptor__factory {
    static createInterface() {
        return new utils.Interface(_abi);
    }
    static connect(address, signerOrProvider) {
        return new Contract(address, _abi, signerOrProvider);
    }
}
INonfungibleTokenPositionDescriptor__factory.abi = _abi;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSU5vbmZ1bmdpYmxlVG9rZW5Qb3NpdGlvbkRlc2NyaXB0b3JfX2ZhY3RvcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9saWIvdHlwZXMvdjMvZmFjdG9yaWVzL0lOb25mdW5naWJsZVRva2VuUG9zaXRpb25EZXNjcmlwdG9yX19mYWN0b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLCtDQUErQztBQUMvQyxvQkFBb0I7QUFDcEIsb0JBQW9CO0FBRXBCLE9BQU8sRUFBRSxRQUFRLEVBQVUsS0FBSyxFQUFFLE1BQU0sUUFBUSxDQUFDO0FBT2pELE1BQU0sSUFBSSxHQUFHO0lBQ1g7UUFDRSxNQUFNLEVBQUU7WUFDTjtnQkFDRSxZQUFZLEVBQUUsc0NBQXNDO2dCQUNwRCxJQUFJLEVBQUUsaUJBQWlCO2dCQUN2QixJQUFJLEVBQUUsU0FBUzthQUNoQjtZQUNEO2dCQUNFLFlBQVksRUFBRSxTQUFTO2dCQUN2QixJQUFJLEVBQUUsU0FBUztnQkFDZixJQUFJLEVBQUUsU0FBUzthQUNoQjtTQUNGO1FBQ0QsSUFBSSxFQUFFLFVBQVU7UUFDaEIsT0FBTyxFQUFFO1lBQ1A7Z0JBQ0UsWUFBWSxFQUFFLFFBQVE7Z0JBQ3RCLElBQUksRUFBRSxFQUFFO2dCQUNSLElBQUksRUFBRSxRQUFRO2FBQ2Y7U0FDRjtRQUNELGVBQWUsRUFBRSxNQUFNO1FBQ3ZCLElBQUksRUFBRSxVQUFVO0tBQ2pCO0NBQ0YsQ0FBQztBQUVGLE1BQU0sT0FBTyw0Q0FBNEM7SUFFdkQsTUFBTSxDQUFDLGVBQWU7UUFDcEIsT0FBTyxJQUFJLEtBQUssQ0FBQyxTQUFTLENBQ3hCLElBQUksQ0FDMkMsQ0FBQztJQUNwRCxDQUFDO0lBQ0QsTUFBTSxDQUFDLE9BQU8sQ0FDWixPQUFlLEVBQ2YsZ0JBQW1DO1FBRW5DLE9BQU8sSUFBSSxRQUFRLENBQ2pCLE9BQU8sRUFDUCxJQUFJLEVBQ0osZ0JBQWdCLENBQ3NCLENBQUM7SUFDM0MsQ0FBQzs7QUFmZSxnREFBRyxHQUFHLElBQUksQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIEF1dG9nZW5lcmF0ZWQgZmlsZS4gRG8gbm90IGVkaXQgbWFudWFsbHkuICovXG4vKiB0c2xpbnQ6ZGlzYWJsZSAqL1xuLyogZXNsaW50LWRpc2FibGUgKi9cblxuaW1wb3J0IHsgQ29udHJhY3QsIFNpZ25lciwgdXRpbHMgfSBmcm9tIFwiZXRoZXJzXCI7XG5pbXBvcnQgeyBQcm92aWRlciB9IGZyb20gXCJAZXRoZXJzcHJvamVjdC9wcm92aWRlcnNcIjtcbmltcG9ydCB0eXBlIHtcbiAgSU5vbmZ1bmdpYmxlVG9rZW5Qb3NpdGlvbkRlc2NyaXB0b3IsXG4gIElOb25mdW5naWJsZVRva2VuUG9zaXRpb25EZXNjcmlwdG9ySW50ZXJmYWNlLFxufSBmcm9tIFwiLi4vSU5vbmZ1bmdpYmxlVG9rZW5Qb3NpdGlvbkRlc2NyaXB0b3JcIjtcblxuY29uc3QgX2FiaSA9IFtcbiAge1xuICAgIGlucHV0czogW1xuICAgICAge1xuICAgICAgICBpbnRlcm5hbFR5cGU6IFwiY29udHJhY3QgSU5vbmZ1bmdpYmxlUG9zaXRpb25NYW5hZ2VyXCIsXG4gICAgICAgIG5hbWU6IFwicG9zaXRpb25NYW5hZ2VyXCIsXG4gICAgICAgIHR5cGU6IFwiYWRkcmVzc1wiLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgaW50ZXJuYWxUeXBlOiBcInVpbnQyNTZcIixcbiAgICAgICAgbmFtZTogXCJ0b2tlbklkXCIsXG4gICAgICAgIHR5cGU6IFwidWludDI1NlwiLFxuICAgICAgfSxcbiAgICBdLFxuICAgIG5hbWU6IFwidG9rZW5VUklcIixcbiAgICBvdXRwdXRzOiBbXG4gICAgICB7XG4gICAgICAgIGludGVybmFsVHlwZTogXCJzdHJpbmdcIixcbiAgICAgICAgbmFtZTogXCJcIixcbiAgICAgICAgdHlwZTogXCJzdHJpbmdcIixcbiAgICAgIH0sXG4gICAgXSxcbiAgICBzdGF0ZU11dGFiaWxpdHk6IFwidmlld1wiLFxuICAgIHR5cGU6IFwiZnVuY3Rpb25cIixcbiAgfSxcbl07XG5cbmV4cG9ydCBjbGFzcyBJTm9uZnVuZ2libGVUb2tlblBvc2l0aW9uRGVzY3JpcHRvcl9fZmFjdG9yeSB7XG4gIHN0YXRpYyByZWFkb25seSBhYmkgPSBfYWJpO1xuICBzdGF0aWMgY3JlYXRlSW50ZXJmYWNlKCk6IElOb25mdW5naWJsZVRva2VuUG9zaXRpb25EZXNjcmlwdG9ySW50ZXJmYWNlIHtcbiAgICByZXR1cm4gbmV3IHV0aWxzLkludGVyZmFjZShcbiAgICAgIF9hYmlcbiAgICApIGFzIElOb25mdW5naWJsZVRva2VuUG9zaXRpb25EZXNjcmlwdG9ySW50ZXJmYWNlO1xuICB9XG4gIHN0YXRpYyBjb25uZWN0KFxuICAgIGFkZHJlc3M6IHN0cmluZyxcbiAgICBzaWduZXJPclByb3ZpZGVyOiBTaWduZXIgfCBQcm92aWRlclxuICApOiBJTm9uZnVuZ2libGVUb2tlblBvc2l0aW9uRGVzY3JpcHRvciB7XG4gICAgcmV0dXJuIG5ldyBDb250cmFjdChcbiAgICAgIGFkZHJlc3MsXG4gICAgICBfYWJpLFxuICAgICAgc2lnbmVyT3JQcm92aWRlclxuICAgICkgYXMgSU5vbmZ1bmdpYmxlVG9rZW5Qb3NpdGlvbkRlc2NyaXB0b3I7XG4gIH1cbn1cbiJdfQ==