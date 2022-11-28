pragma solidity ^0.8.0;

import "../lib/forge-std/src/Script.sol";
// import "../src/interfaces/IOneSplitView.sol";
// import "../src/interfaces/ISwapRouter.sol";



contract Simulator is Script {
    // IOneSplitView oneSplit = IOneSplitView(0x6bcfe3187d41D4dD97e17038b5e49cc5B9A44CC3);
    // ISwapRouter router = ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);

    function setUp() public {
        string memory POLYGON_RPC_URL = vm.envString("POLYGON_RPC_URL");
        vm.createSelectFork(POLYGON_RPC_URL);
    }

    // struct Transaction {
    //     address from;
    //     address to;
    //     uint256 value;
    //     bytes data;
    // }

    // function getTransaction() internal returns (Transaction memory) {
    //     string memory inputDir = string.concat(vm.projectRoot(), "/script/input/");
    //     string memory chainDir = string.concat(vm.toString(block.chainid), "/");
    //     string memory path = string.concat(inputDir, chainDir, "data.json");
    //     string memory transaction = vm.readFile(path);
    //     return Transaction(
    //         abi.decode(vm.parseJson(transaction, "from"), (address)),
    //         abi.decode(vm.parseJson(transaction, "to"), (address)),
    //         abi.decode(vm.parseJson(transaction, "value"), (uint)),
    //         abi.decode(vm.parseJson(transaction, "data"), (bytes))
    //     );
    // }


    // function run() public {
    //     (uint256 amount, , ) = oneSplit.getExpectedReturn(IERC20(0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270), IERC20(0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174), 10 ether, 16);
    //     console.logUint(amount);
    // }

    function simulate(address from, address to, uint value, bytes memory data) public returns (bool success, bytes memory returnData) {
        vm.prank(from);
        (success, returnData) = to.call{value: value}(data);
    }

    // function simulateUniswapV3(address from, bytes memory swapParams, address baseToken, uint256 amount, uint flags) public returns (uint256,uint256,uint256[] memory) {
    //     vm.prank(from);
    //     ISwapRouter.ExactInputSingleParams memory params = abi.decode(swapParams, (ISwapRouter.ExactInputSingleParams));
    //     router.exactInputSingle(params);
    //     address[] memory path = buildPath(baseToken, params.tokenIn, params.tokenOut);
    //     return oneSplit.getExpectedReturnMulti(path, amount, flags);
    // }

    function buildPath(address baseToken, address fromToken, address toToken) public view returns (address[] memory path) {
        require(fromToken != toToken);
        if(baseToken == toToken) {
            path = new address[](3);
            path[0] = baseToken;
            path[1] = fromToken;
            path[2] = baseToken;
        } else if(baseToken == fromToken) {
            path = new address[](3);
            path[0] = baseToken;
            path[1] = toToken;
            path[2] = baseToken;
        }
        else {
            path = new address[](4); 
            path[0] = baseToken;
            path[1] = toToken;
            path[2] = fromToken;
            path[3] = baseToken;
        }
    }
}