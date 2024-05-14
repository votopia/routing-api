/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { utils, Contract, ContractFactory } from "ethers";
const _abi = [
    {
        inputs: [],
        name: "getCurrentBlockTimestamp",
        outputs: [
            {
                internalType: "uint256",
                name: "timestamp",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "addr",
                type: "address",
            },
        ],
        name: "getEthBalance",
        outputs: [
            {
                internalType: "uint256",
                name: "balance",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                components: [
                    {
                        internalType: "address",
                        name: "target",
                        type: "address",
                    },
                    {
                        internalType: "uint256",
                        name: "gasLimit",
                        type: "uint256",
                    },
                    {
                        internalType: "bytes",
                        name: "callData",
                        type: "bytes",
                    },
                ],
                internalType: "struct UniswapInterfaceMulticall.Call[]",
                name: "calls",
                type: "tuple[]",
            },
        ],
        name: "multicall",
        outputs: [
            {
                internalType: "uint256",
                name: "blockNumber",
                type: "uint256",
            },
            {
                components: [
                    {
                        internalType: "bool",
                        name: "success",
                        type: "bool",
                    },
                    {
                        internalType: "uint256",
                        name: "gasUsed",
                        type: "uint256",
                    },
                    {
                        internalType: "bytes",
                        name: "returnData",
                        type: "bytes",
                    },
                ],
                internalType: "struct UniswapInterfaceMulticall.Result[]",
                name: "returnData",
                type: "tuple[]",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
];
const _bytecode = "0x608060405234801561001057600080fd5b50610567806100206000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c80630f28c97d146100465780631749e1e3146100645780634d2301cc14610085575b600080fd5b61004e610098565b60405161005b919061041f565b60405180910390f35b6100776100723660046102a7565b61009c565b60405161005b929190610428565b61004e610093366004610286565b610220565b4290565b8051439060609067ffffffffffffffff811180156100b957600080fd5b506040519080825280602002602001820160405280156100f357816020015b6100e061023a565b8152602001906001900390816100d85790505b50905060005b835181101561021a57600080600086848151811061011357fe5b60200260200101516000015187858151811061012b57fe5b60200260200101516020015188868151811061014357fe5b60200260200101516040015192509250925060005a90506000808573ffffffffffffffffffffffffffffffffffffffff1685856040516101839190610403565b60006040518083038160008787f1925050503d80600081146101c1576040519150601f19603f3d011682016040523d82523d6000602084013e6101c6565b606091505b509150915060005a8403905060405180606001604052808415158152602001828152602001838152508989815181106101fb57fe5b60200260200101819052505050505050505080806001019150506100f9565b50915091565b73ffffffffffffffffffffffffffffffffffffffff163190565b604051806060016040528060001515815260200160008152602001606081525090565b803573ffffffffffffffffffffffffffffffffffffffff8116811461028157600080fd5b919050565b600060208284031215610297578081fd5b6102a08261025d565b9392505050565b600060208083850312156102b9578182fd5b823567ffffffffffffffff808211156102d0578384fd5b818501915085601f8301126102e3578384fd5b8135818111156102ef57fe5b6102fc8485830201610506565b81815284810190848601875b848110156103f457813587017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0606081838f03011215610346578a8bfd5b60408051606081018181108b8211171561035c57fe5b8252610369848d0161025d565b8152818401358c82015260608401358a811115610384578d8efd5b8085019450508e603f850112610398578c8dfd5b8b8401358a8111156103a657fe5b6103b68d85601f84011601610506565b93508084528f838287010111156103cb578d8efd5b808386018e86013783018c018d9052908101919091528552509287019290870190600101610308565b50909998505050505050505050565b6000825161041581846020870161052a565b9190910192915050565b90815260200190565b600060408083018584526020828186015281865180845260609350838701915083838202880101838901875b838110156104f6578983037fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffa001855281518051151584528681015187850152880151888401889052805188850181905260806104b582828801858c0161052a565b96880196601f919091017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe01694909401909301925090850190600101610454565b50909a9950505050505050505050565b60405181810167ffffffffffffffff8111828210171561052257fe5b604052919050565b60005b8381101561054557818101518382015260200161052d565b83811115610554576000848401525b5050505056fea164736f6c6343000706000a";
export class UniswapInterfaceMulticall__factory extends ContractFactory {
    constructor(...args) {
        if (args.length === 1) {
            super(_abi, _bytecode, args[0]);
        }
        else {
            super(...args);
        }
    }
    deploy(overrides) {
        return super.deploy(overrides || {});
    }
    getDeployTransaction(overrides) {
        return super.getDeployTransaction(overrides || {});
    }
    attach(address) {
        return super.attach(address);
    }
    connect(signer) {
        return super.connect(signer);
    }
    static createInterface() {
        return new utils.Interface(_abi);
    }
    static connect(address, signerOrProvider) {
        return new Contract(address, _abi, signerOrProvider);
    }
}
UniswapInterfaceMulticall__factory.bytecode = _bytecode;
UniswapInterfaceMulticall__factory.abi = _abi;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVW5pc3dhcEludGVyZmFjZU11bHRpY2FsbF9fZmFjdG9yeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2xpYi90eXBlcy92My9mYWN0b3JpZXMvVW5pc3dhcEludGVyZmFjZU11bHRpY2FsbF9fZmFjdG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSwrQ0FBK0M7QUFDL0Msb0JBQW9CO0FBQ3BCLG9CQUFvQjtBQUVwQixPQUFPLEVBQVUsS0FBSyxFQUFFLFFBQVEsRUFBRSxlQUFlLEVBQWEsTUFBTSxRQUFRLENBQUM7QUFPN0UsTUFBTSxJQUFJLEdBQUc7SUFDWDtRQUNFLE1BQU0sRUFBRSxFQUFFO1FBQ1YsSUFBSSxFQUFFLDBCQUEwQjtRQUNoQyxPQUFPLEVBQUU7WUFDUDtnQkFDRSxZQUFZLEVBQUUsU0FBUztnQkFDdkIsSUFBSSxFQUFFLFdBQVc7Z0JBQ2pCLElBQUksRUFBRSxTQUFTO2FBQ2hCO1NBQ0Y7UUFDRCxlQUFlLEVBQUUsTUFBTTtRQUN2QixJQUFJLEVBQUUsVUFBVTtLQUNqQjtJQUNEO1FBQ0UsTUFBTSxFQUFFO1lBQ047Z0JBQ0UsWUFBWSxFQUFFLFNBQVM7Z0JBQ3ZCLElBQUksRUFBRSxNQUFNO2dCQUNaLElBQUksRUFBRSxTQUFTO2FBQ2hCO1NBQ0Y7UUFDRCxJQUFJLEVBQUUsZUFBZTtRQUNyQixPQUFPLEVBQUU7WUFDUDtnQkFDRSxZQUFZLEVBQUUsU0FBUztnQkFDdkIsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsSUFBSSxFQUFFLFNBQVM7YUFDaEI7U0FDRjtRQUNELGVBQWUsRUFBRSxNQUFNO1FBQ3ZCLElBQUksRUFBRSxVQUFVO0tBQ2pCO0lBQ0Q7UUFDRSxNQUFNLEVBQUU7WUFDTjtnQkFDRSxVQUFVLEVBQUU7b0JBQ1Y7d0JBQ0UsWUFBWSxFQUFFLFNBQVM7d0JBQ3ZCLElBQUksRUFBRSxRQUFRO3dCQUNkLElBQUksRUFBRSxTQUFTO3FCQUNoQjtvQkFDRDt3QkFDRSxZQUFZLEVBQUUsU0FBUzt3QkFDdkIsSUFBSSxFQUFFLFVBQVU7d0JBQ2hCLElBQUksRUFBRSxTQUFTO3FCQUNoQjtvQkFDRDt3QkFDRSxZQUFZLEVBQUUsT0FBTzt3QkFDckIsSUFBSSxFQUFFLFVBQVU7d0JBQ2hCLElBQUksRUFBRSxPQUFPO3FCQUNkO2lCQUNGO2dCQUNELFlBQVksRUFBRSx5Q0FBeUM7Z0JBQ3ZELElBQUksRUFBRSxPQUFPO2dCQUNiLElBQUksRUFBRSxTQUFTO2FBQ2hCO1NBQ0Y7UUFDRCxJQUFJLEVBQUUsV0FBVztRQUNqQixPQUFPLEVBQUU7WUFDUDtnQkFDRSxZQUFZLEVBQUUsU0FBUztnQkFDdkIsSUFBSSxFQUFFLGFBQWE7Z0JBQ25CLElBQUksRUFBRSxTQUFTO2FBQ2hCO1lBQ0Q7Z0JBQ0UsVUFBVSxFQUFFO29CQUNWO3dCQUNFLFlBQVksRUFBRSxNQUFNO3dCQUNwQixJQUFJLEVBQUUsU0FBUzt3QkFDZixJQUFJLEVBQUUsTUFBTTtxQkFDYjtvQkFDRDt3QkFDRSxZQUFZLEVBQUUsU0FBUzt3QkFDdkIsSUFBSSxFQUFFLFNBQVM7d0JBQ2YsSUFBSSxFQUFFLFNBQVM7cUJBQ2hCO29CQUNEO3dCQUNFLFlBQVksRUFBRSxPQUFPO3dCQUNyQixJQUFJLEVBQUUsWUFBWTt3QkFDbEIsSUFBSSxFQUFFLE9BQU87cUJBQ2Q7aUJBQ0Y7Z0JBQ0QsWUFBWSxFQUFFLDJDQUEyQztnQkFDekQsSUFBSSxFQUFFLFlBQVk7Z0JBQ2xCLElBQUksRUFBRSxTQUFTO2FBQ2hCO1NBQ0Y7UUFDRCxlQUFlLEVBQUUsWUFBWTtRQUM3QixJQUFJLEVBQUUsVUFBVTtLQUNqQjtDQUNGLENBQUM7QUFFRixNQUFNLFNBQVMsR0FDYixreEZBQWt4RixDQUFDO0FBRXJ4RixNQUFNLE9BQU8sa0NBQW1DLFNBQVEsZUFBZTtJQUNyRSxZQUNFLEdBQUcsSUFBc0U7UUFFekUsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUNyQixLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNqQzthQUFNO1lBQ0wsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7U0FDaEI7SUFDSCxDQUFDO0lBRUQsTUFBTSxDQUNKLFNBQTJEO1FBRTNELE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLElBQUksRUFBRSxDQUF1QyxDQUFDO0lBQzdFLENBQUM7SUFDRCxvQkFBb0IsQ0FDbEIsU0FBMkQ7UUFFM0QsT0FBTyxLQUFLLENBQUMsb0JBQW9CLENBQUMsU0FBUyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ3JELENBQUM7SUFDRCxNQUFNLENBQUMsT0FBZTtRQUNwQixPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUE4QixDQUFDO0lBQzVELENBQUM7SUFDRCxPQUFPLENBQUMsTUFBYztRQUNwQixPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUF1QyxDQUFDO0lBQ3JFLENBQUM7SUFHRCxNQUFNLENBQUMsZUFBZTtRQUNwQixPQUFPLElBQUksS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQXVDLENBQUM7SUFDekUsQ0FBQztJQUNELE1BQU0sQ0FBQyxPQUFPLENBQ1osT0FBZSxFQUNmLGdCQUFtQztRQUVuQyxPQUFPLElBQUksUUFBUSxDQUNqQixPQUFPLEVBQ1AsSUFBSSxFQUNKLGdCQUFnQixDQUNZLENBQUM7SUFDakMsQ0FBQzs7QUFkZSwyQ0FBUSxHQUFHLFNBQVMsQ0FBQztBQUNyQixzQ0FBRyxHQUFHLElBQUksQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIEF1dG9nZW5lcmF0ZWQgZmlsZS4gRG8gbm90IGVkaXQgbWFudWFsbHkuICovXG4vKiB0c2xpbnQ6ZGlzYWJsZSAqL1xuLyogZXNsaW50LWRpc2FibGUgKi9cblxuaW1wb3J0IHsgU2lnbmVyLCB1dGlscywgQ29udHJhY3QsIENvbnRyYWN0RmFjdG9yeSwgT3ZlcnJpZGVzIH0gZnJvbSBcImV0aGVyc1wiO1xuaW1wb3J0IHsgUHJvdmlkZXIsIFRyYW5zYWN0aW9uUmVxdWVzdCB9IGZyb20gXCJAZXRoZXJzcHJvamVjdC9wcm92aWRlcnNcIjtcbmltcG9ydCB0eXBlIHtcbiAgVW5pc3dhcEludGVyZmFjZU11bHRpY2FsbCxcbiAgVW5pc3dhcEludGVyZmFjZU11bHRpY2FsbEludGVyZmFjZSxcbn0gZnJvbSBcIi4uL1VuaXN3YXBJbnRlcmZhY2VNdWx0aWNhbGxcIjtcblxuY29uc3QgX2FiaSA9IFtcbiAge1xuICAgIGlucHV0czogW10sXG4gICAgbmFtZTogXCJnZXRDdXJyZW50QmxvY2tUaW1lc3RhbXBcIixcbiAgICBvdXRwdXRzOiBbXG4gICAgICB7XG4gICAgICAgIGludGVybmFsVHlwZTogXCJ1aW50MjU2XCIsXG4gICAgICAgIG5hbWU6IFwidGltZXN0YW1wXCIsXG4gICAgICAgIHR5cGU6IFwidWludDI1NlwiLFxuICAgICAgfSxcbiAgICBdLFxuICAgIHN0YXRlTXV0YWJpbGl0eTogXCJ2aWV3XCIsXG4gICAgdHlwZTogXCJmdW5jdGlvblwiLFxuICB9LFxuICB7XG4gICAgaW5wdXRzOiBbXG4gICAgICB7XG4gICAgICAgIGludGVybmFsVHlwZTogXCJhZGRyZXNzXCIsXG4gICAgICAgIG5hbWU6IFwiYWRkclwiLFxuICAgICAgICB0eXBlOiBcImFkZHJlc3NcIixcbiAgICAgIH0sXG4gICAgXSxcbiAgICBuYW1lOiBcImdldEV0aEJhbGFuY2VcIixcbiAgICBvdXRwdXRzOiBbXG4gICAgICB7XG4gICAgICAgIGludGVybmFsVHlwZTogXCJ1aW50MjU2XCIsXG4gICAgICAgIG5hbWU6IFwiYmFsYW5jZVwiLFxuICAgICAgICB0eXBlOiBcInVpbnQyNTZcIixcbiAgICAgIH0sXG4gICAgXSxcbiAgICBzdGF0ZU11dGFiaWxpdHk6IFwidmlld1wiLFxuICAgIHR5cGU6IFwiZnVuY3Rpb25cIixcbiAgfSxcbiAge1xuICAgIGlucHV0czogW1xuICAgICAge1xuICAgICAgICBjb21wb25lbnRzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgaW50ZXJuYWxUeXBlOiBcImFkZHJlc3NcIixcbiAgICAgICAgICAgIG5hbWU6IFwidGFyZ2V0XCIsXG4gICAgICAgICAgICB0eXBlOiBcImFkZHJlc3NcIixcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGludGVybmFsVHlwZTogXCJ1aW50MjU2XCIsXG4gICAgICAgICAgICBuYW1lOiBcImdhc0xpbWl0XCIsXG4gICAgICAgICAgICB0eXBlOiBcInVpbnQyNTZcIixcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGludGVybmFsVHlwZTogXCJieXRlc1wiLFxuICAgICAgICAgICAgbmFtZTogXCJjYWxsRGF0YVwiLFxuICAgICAgICAgICAgdHlwZTogXCJieXRlc1wiLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIGludGVybmFsVHlwZTogXCJzdHJ1Y3QgVW5pc3dhcEludGVyZmFjZU11bHRpY2FsbC5DYWxsW11cIixcbiAgICAgICAgbmFtZTogXCJjYWxsc1wiLFxuICAgICAgICB0eXBlOiBcInR1cGxlW11cIixcbiAgICAgIH0sXG4gICAgXSxcbiAgICBuYW1lOiBcIm11bHRpY2FsbFwiLFxuICAgIG91dHB1dHM6IFtcbiAgICAgIHtcbiAgICAgICAgaW50ZXJuYWxUeXBlOiBcInVpbnQyNTZcIixcbiAgICAgICAgbmFtZTogXCJibG9ja051bWJlclwiLFxuICAgICAgICB0eXBlOiBcInVpbnQyNTZcIixcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGNvbXBvbmVudHM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBpbnRlcm5hbFR5cGU6IFwiYm9vbFwiLFxuICAgICAgICAgICAgbmFtZTogXCJzdWNjZXNzXCIsXG4gICAgICAgICAgICB0eXBlOiBcImJvb2xcIixcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGludGVybmFsVHlwZTogXCJ1aW50MjU2XCIsXG4gICAgICAgICAgICBuYW1lOiBcImdhc1VzZWRcIixcbiAgICAgICAgICAgIHR5cGU6IFwidWludDI1NlwiLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgaW50ZXJuYWxUeXBlOiBcImJ5dGVzXCIsXG4gICAgICAgICAgICBuYW1lOiBcInJldHVybkRhdGFcIixcbiAgICAgICAgICAgIHR5cGU6IFwiYnl0ZXNcIixcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBpbnRlcm5hbFR5cGU6IFwic3RydWN0IFVuaXN3YXBJbnRlcmZhY2VNdWx0aWNhbGwuUmVzdWx0W11cIixcbiAgICAgICAgbmFtZTogXCJyZXR1cm5EYXRhXCIsXG4gICAgICAgIHR5cGU6IFwidHVwbGVbXVwiLFxuICAgICAgfSxcbiAgICBdLFxuICAgIHN0YXRlTXV0YWJpbGl0eTogXCJub25wYXlhYmxlXCIsXG4gICAgdHlwZTogXCJmdW5jdGlvblwiLFxuICB9LFxuXTtcblxuY29uc3QgX2J5dGVjb2RlID1cbiAgXCIweDYwODA2MDQwNTIzNDgwMTU2MTAwMTA1NzYwMDA4MGZkNWI1MDYxMDU2NzgwNjEwMDIwNjAwMDM5NjAwMGYzZmU2MDgwNjA0MDUyMzQ4MDE1NjEwMDEwNTc2MDAwODBmZDViNTA2MDA0MzYxMDYxMDA0MTU3NjAwMDM1NjBlMDFjODA2MzBmMjhjOTdkMTQ2MTAwNDY1NzgwNjMxNzQ5ZTFlMzE0NjEwMDY0NTc4MDYzNGQyMzAxY2MxNDYxMDA4NTU3NWI2MDAwODBmZDViNjEwMDRlNjEwMDk4NTY1YjYwNDA1MTYxMDA1YjkxOTA2MTA0MWY1NjViNjA0MDUxODA5MTAzOTBmMzViNjEwMDc3NjEwMDcyMzY2MDA0NjEwMmE3NTY1YjYxMDA5YzU2NWI2MDQwNTE2MTAwNWI5MjkxOTA2MTA0Mjg1NjViNjEwMDRlNjEwMDkzMzY2MDA0NjEwMjg2NTY1YjYxMDIyMDU2NWI0MjkwNTY1YjgwNTE0MzkwNjA2MDkwNjdmZmZmZmZmZmZmZmZmZmZmODExMTgwMTU2MTAwYjk1NzYwMDA4MGZkNWI1MDYwNDA1MTkwODA4MjUyODA2MDIwMDI2MDIwMDE4MjAxNjA0MDUyODAxNTYxMDBmMzU3ODE2MDIwMDE1YjYxMDBlMDYxMDIzYTU2NWI4MTUyNjAyMDAxOTA2MDAxOTAwMzkwODE2MTAwZDg1NzkwNTA1YjUwOTA1MDYwMDA1YjgzNTE4MTEwMTU2MTAyMWE1NzYwMDA4MDYwMDA4Njg0ODE1MTgxMTA2MTAxMTM1N2ZlNWI2MDIwMDI2MDIwMDEwMTUxNjAwMDAxNTE4Nzg1ODE1MTgxMTA2MTAxMmI1N2ZlNWI2MDIwMDI2MDIwMDEwMTUxNjAyMDAxNTE4ODg2ODE1MTgxMTA2MTAxNDM1N2ZlNWI2MDIwMDI2MDIwMDEwMTUxNjA0MDAxNTE5MjUwOTI1MDkyNTA2MDAwNWE5MDUwNjAwMDgwODU3M2ZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmYxNjg1ODU2MDQwNTE2MTAxODM5MTkwNjEwNDAzNTY1YjYwMDA2MDQwNTE4MDgzMDM4MTYwMDA4Nzg3ZjE5MjUwNTA1MDNkODA2MDAwODExNDYxMDFjMTU3NjA0MDUxOTE1MDYwMWYxOTYwM2YzZDAxMTY4MjAxNjA0MDUyM2Q4MjUyM2Q2MDAwNjAyMDg0MDEzZTYxMDFjNjU2NWI2MDYwOTE1MDViNTA5MTUwOTE1MDYwMDA1YTg0MDM5MDUwNjA0MDUxODA2MDYwMDE2MDQwNTI4MDg0MTUxNTgxNTI2MDIwMDE4MjgxNTI2MDIwMDE4MzgxNTI1MDg5ODk4MTUxODExMDYxMDFmYjU3ZmU1YjYwMjAwMjYwMjAwMTAxODE5MDUyNTA1MDUwNTA1MDUwNTA1MDgwODA2MDAxMDE5MTUwNTA2MTAwZjk1NjViNTA5MTUwOTE1NjViNzNmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmMTYzMTkwNTY1YjYwNDA1MTgwNjA2MDAxNjA0MDUyODA2MDAwMTUxNTgxNTI2MDIwMDE2MDAwODE1MjYwMjAwMTYwNjA4MTUyNTA5MDU2NWI4MDM1NzNmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmODExNjgxMTQ2MTAyODE1NzYwMDA4MGZkNWI5MTkwNTA1NjViNjAwMDYwMjA4Mjg0MDMxMjE1NjEwMjk3NTc4MDgxZmQ1YjYxMDJhMDgyNjEwMjVkNTY1YjkzOTI1MDUwNTA1NjViNjAwMDYwMjA4MDgzODUwMzEyMTU2MTAyYjk1NzgxODJmZDViODIzNTY3ZmZmZmZmZmZmZmZmZmZmZjgwODIxMTE1NjEwMmQwNTc4Mzg0ZmQ1YjgxODUwMTkxNTA4NTYwMWY4MzAxMTI2MTAyZTM1NzgzODRmZDViODEzNTgxODExMTE1NjEwMmVmNTdmZTViNjEwMmZjODQ4NTgzMDIwMTYxMDUwNjU2NWI4MTgxNTI4NDgxMDE5MDg0ODYwMTg3NWI4NDgxMTAxNTYxMDNmNDU3ODEzNTg3MDE3ZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZTA2MDYwODE4MzhmMDMwMTEyMTU2MTAzNDY1NzhhOGJmZDViNjA0MDgwNTE2MDYwODEwMTgxODExMDhiODIxMTE3MTU2MTAzNWM1N2ZlNWI4MjUyNjEwMzY5ODQ4ZDAxNjEwMjVkNTY1YjgxNTI4MTg0MDEzNThjODIwMTUyNjA2MDg0MDEzNThhODExMTE1NjEwMzg0NTc4ZDhlZmQ1YjgwODUwMTk0NTA1MDhlNjAzZjg1MDExMjYxMDM5ODU3OGM4ZGZkNWI4Yjg0MDEzNThhODExMTE1NjEwM2E2NTdmZTViNjEwM2I2OGQ4NTYwMWY4NDAxMTYwMTYxMDUwNjU2NWI5MzUwODA4NDUyOGY4MzgyODcwMTAxMTExNTYxMDNjYjU3OGQ4ZWZkNWI4MDgzODYwMThlODYwMTM3ODMwMThjMDE4ZDkwNTI5MDgxMDE5MTkwOTE1Mjg1NTI1MDkyODcwMTkyOTA4NzAxOTA2MDAxMDE2MTAzMDg1NjViNTA5MDk5OTg1MDUwNTA1MDUwNTA1MDUwNTA1NjViNjAwMDgyNTE2MTA0MTU4MTg0NjAyMDg3MDE2MTA1MmE1NjViOTE5MDkxMDE5MjkxNTA1MDU2NWI5MDgxNTI2MDIwMDE5MDU2NWI2MDAwNjA0MDgwODMwMTg1ODQ1MjYwMjA4MjgxODYwMTUyODE4NjUxODA4NDUyNjA2MDkzNTA4Mzg3MDE5MTUwODM4MzgyMDI4ODAxMDE4Mzg5MDE4NzViODM4MTEwMTU2MTA0ZjY1Nzg5ODMwMzdmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZhMDAxODU1MjgxNTE4MDUxMTUxNTg0NTI4NjgxMDE1MTg3ODUwMTUyODgwMTUxODg4NDAxODg5MDUyODA1MTg4ODUwMTgxOTA1MjYwODA2MTA0YjU4MjgyODgwMTg1OGMwMTYxMDUyYTU2NWI5Njg4MDE5NjYwMWY5MTkwOTEwMTdmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZlMDE2OTQ5MDk0MDE5MDkzMDE5MjUwOTA4NTAxOTA2MDAxMDE2MTA0NTQ1NjViNTA5MDlhOTk1MDUwNTA1MDUwNTA1MDUwNTA1MDU2NWI2MDQwNTE4MTgxMDE2N2ZmZmZmZmZmZmZmZmZmZmY4MTExODI4MjEwMTcxNTYxMDUyMjU3ZmU1YjYwNDA1MjkxOTA1MDU2NWI2MDAwNWI4MzgxMTAxNTYxMDU0NTU3ODE4MTAxNTE4MzgyMDE1MjYwMjAwMTYxMDUyZDU2NWI4MzgxMTExNTYxMDU1NDU3NjAwMDg0ODQwMTUyNWI1MDUwNTA1MDU2ZmVhMTY0NzM2ZjZjNjM0MzAwMDcwNjAwMGFcIjtcblxuZXhwb3J0IGNsYXNzIFVuaXN3YXBJbnRlcmZhY2VNdWx0aWNhbGxfX2ZhY3RvcnkgZXh0ZW5kcyBDb250cmFjdEZhY3Rvcnkge1xuICBjb25zdHJ1Y3RvcihcbiAgICAuLi5hcmdzOiBbc2lnbmVyOiBTaWduZXJdIHwgQ29uc3RydWN0b3JQYXJhbWV0ZXJzPHR5cGVvZiBDb250cmFjdEZhY3Rvcnk+XG4gICkge1xuICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgc3VwZXIoX2FiaSwgX2J5dGVjb2RlLCBhcmdzWzBdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3VwZXIoLi4uYXJncyk7XG4gICAgfVxuICB9XG5cbiAgZGVwbG95KFxuICAgIG92ZXJyaWRlcz86IE92ZXJyaWRlcyAmIHsgZnJvbT86IHN0cmluZyB8IFByb21pc2U8c3RyaW5nPiB9XG4gICk6IFByb21pc2U8VW5pc3dhcEludGVyZmFjZU11bHRpY2FsbD4ge1xuICAgIHJldHVybiBzdXBlci5kZXBsb3kob3ZlcnJpZGVzIHx8IHt9KSBhcyBQcm9taXNlPFVuaXN3YXBJbnRlcmZhY2VNdWx0aWNhbGw+O1xuICB9XG4gIGdldERlcGxveVRyYW5zYWN0aW9uKFxuICAgIG92ZXJyaWRlcz86IE92ZXJyaWRlcyAmIHsgZnJvbT86IHN0cmluZyB8IFByb21pc2U8c3RyaW5nPiB9XG4gICk6IFRyYW5zYWN0aW9uUmVxdWVzdCB7XG4gICAgcmV0dXJuIHN1cGVyLmdldERlcGxveVRyYW5zYWN0aW9uKG92ZXJyaWRlcyB8fCB7fSk7XG4gIH1cbiAgYXR0YWNoKGFkZHJlc3M6IHN0cmluZyk6IFVuaXN3YXBJbnRlcmZhY2VNdWx0aWNhbGwge1xuICAgIHJldHVybiBzdXBlci5hdHRhY2goYWRkcmVzcykgYXMgVW5pc3dhcEludGVyZmFjZU11bHRpY2FsbDtcbiAgfVxuICBjb25uZWN0KHNpZ25lcjogU2lnbmVyKTogVW5pc3dhcEludGVyZmFjZU11bHRpY2FsbF9fZmFjdG9yeSB7XG4gICAgcmV0dXJuIHN1cGVyLmNvbm5lY3Qoc2lnbmVyKSBhcyBVbmlzd2FwSW50ZXJmYWNlTXVsdGljYWxsX19mYWN0b3J5O1xuICB9XG4gIHN0YXRpYyByZWFkb25seSBieXRlY29kZSA9IF9ieXRlY29kZTtcbiAgc3RhdGljIHJlYWRvbmx5IGFiaSA9IF9hYmk7XG4gIHN0YXRpYyBjcmVhdGVJbnRlcmZhY2UoKTogVW5pc3dhcEludGVyZmFjZU11bHRpY2FsbEludGVyZmFjZSB7XG4gICAgcmV0dXJuIG5ldyB1dGlscy5JbnRlcmZhY2UoX2FiaSkgYXMgVW5pc3dhcEludGVyZmFjZU11bHRpY2FsbEludGVyZmFjZTtcbiAgfVxuICBzdGF0aWMgY29ubmVjdChcbiAgICBhZGRyZXNzOiBzdHJpbmcsXG4gICAgc2lnbmVyT3JQcm92aWRlcjogU2lnbmVyIHwgUHJvdmlkZXJcbiAgKTogVW5pc3dhcEludGVyZmFjZU11bHRpY2FsbCB7XG4gICAgcmV0dXJuIG5ldyBDb250cmFjdChcbiAgICAgIGFkZHJlc3MsXG4gICAgICBfYWJpLFxuICAgICAgc2lnbmVyT3JQcm92aWRlclxuICAgICkgYXMgVW5pc3dhcEludGVyZmFjZU11bHRpY2FsbDtcbiAgfVxufVxuIl19