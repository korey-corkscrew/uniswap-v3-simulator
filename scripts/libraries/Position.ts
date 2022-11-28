import { BigNumber, ethers } from "ethers";
import { uint128 } from "../casting";
import { BN_ZERO } from "../constants";
import { Q128 } from "./FixedPoint128";
import { mulDiv } from "./FullMath";
import { addDelta } from "./LiquidityMath";

export interface Info {
    liquidity: BigNumber;
    feeGrowthInside0LastX128: BigNumber;
    feeGrowthInside1LastX128: BigNumber;
    tokensOwned0: BigNumber;
    tokensOwned1: BigNumber;
}

export function get(owner: string, tickLower: number, tickUpper: number) {
    const positionIndex = ethers.utils.keccak256(ethers.utils.solidityPack([ "address", "int24", "int24" ], [ owner, tickLower, tickUpper]));
    return positionIndex;
}

export function update(
    self: Info,
    liquidityDelta: BigNumber,
    feeGrowthInside0X128: BigNumber,
    feeGrowthInside1X128: BigNumber
) {
    let liquidityNext = BN_ZERO;
    if(liquidityDelta.isZero()) {
        if(self.liquidity.gt(0)) throw "NP";
        liquidityNext = self.liquidity;
    } else {
        liquidityNext = addDelta(self.liquidity, liquidityDelta);
    }
    let tokensOwned0 = uint128(mulDiv(feeGrowthInside0X128.sub(self.feeGrowthInside0LastX128), self.liquidity, Q128));
    let tokensOwned1 = uint128(mulDiv(feeGrowthInside1X128.sub(self.feeGrowthInside1LastX128), self.liquidity, Q128));
    if(!liquidityDelta.isZero()) self.liquidity = liquidityNext;
    self.feeGrowthInside0LastX128 = feeGrowthInside0X128;
    self.feeGrowthInside1LastX128 = feeGrowthInside1X128;
    if(tokensOwned0.gt(0) || tokensOwned1.gt(0)) {
        self.tokensOwned0 = self.tokensOwned0.add(tokensOwned0);
        self.tokensOwned1 = self.tokensOwned1.add(tokensOwned1);
    }
    return self;
}