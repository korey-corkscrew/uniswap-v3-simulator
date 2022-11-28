pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract TypeCasting {
    function test(uint160 sqrtPriceX96) public view {
        uint256 ratio = uint256(sqrtPriceX96) << 32;
        console.log("ratio:", ratio);

        uint256 r = ratio;
        uint256 msb = 0;
        uint256 f;
        uint256 g;

        assembly {
            g := gt(r, 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF)
        }
        console.log("g:", g);

        assembly {
            f := shl(7, g)
        }
        console.log("f:", f);

        assembly {
            msb := or(msb, f)
        }
        console.log("msb:", msb);

        assembly {
            r := shr(f, r)
        }
        console.log("r:", r);
    }


}