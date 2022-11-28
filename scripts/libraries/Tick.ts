import { info } from "console";
import { BigNumber } from "ethers";
import { UINT_128_MAX } from "../casting";
import { BN_ZERO } from "../constants";
import { MAX_TICK, MIN_TICK } from "./TickMath";

export interface Info {
    liquidityGross: BigNumber;
    liquidityNet: BigNumber;
    feeGrowthOutside0X128: BigNumber;
    feeGrowthOutside1X128: BigNumber;
    tickCumulativeOutside: BigNumber;
    secondsPerLiquidityOutsideX128: BigNumber;
    secondsOutside: number;
    initialized: boolean;
}

export function tickSpacingToMaxLiquidityPerTick(tickSpacing: number) {
    let minTick = (MIN_TICK / tickSpacing) * tickSpacing;
    let maxTick = (MAX_TICK / tickSpacing) * tickSpacing;
    let numTicks = ((maxTick - minTick) / tickSpacing) + 1;
    return UINT_128_MAX.div(numTicks);
}

export function getFeeGrowthInside(
    lower: Info,
    upper: Info,
    tickLower: number,
    tickUpper: number,
    tickCurrent: number,
    feeGrowthGlobal0X128: BigNumber,
    feeGrowthGlobal1X128: BigNumber
) {
    let feeGrowthBelow0X128 = BN_ZERO;
    let feeGrowthBelow1X128 = BN_ZERO;
    if(tickCurrent >= tickLower) {
        feeGrowthBelow0X128 = lower.feeGrowthOutside0X128;
        feeGrowthBelow1X128 = lower.feeGrowthOutside1X128;
    } else {
        feeGrowthBelow0X128 = feeGrowthGlobal0X128.sub(lower.feeGrowthOutside0X128);
        feeGrowthBelow1X128 = feeGrowthGlobal1X128.sub(lower.feeGrowthOutside1X128);
    }
    let feeGrowthAbove0X128 = BN_ZERO;
    let feeGrowthAbove1X128 = BN_ZERO;
    if(tickCurrent < tickUpper) {
        feeGrowthAbove0X128 = upper.feeGrowthOutside0X128;
        feeGrowthAbove1X128 = upper.feeGrowthOutside1X128;
    } else {
        feeGrowthAbove0X128 = feeGrowthGlobal0X128.sub(upper.feeGrowthOutside0X128);
        feeGrowthAbove1X128 = feeGrowthGlobal1X128.sub(upper.feeGrowthOutside1X128);
    }
    let feeGrowthInside0X128 = feeGrowthGlobal0X128.sub(feeGrowthBelow0X128).sub(feeGrowthAbove0X128);
    let feeGrowthInside1X128 = feeGrowthGlobal1X128.sub(feeGrowthBelow1X128).sub(feeGrowthAbove1X128);
    return {
        feeGrowthInside0X128: feeGrowthInside0X128,
        feeGrowthInside1X128: feeGrowthInside1X128
    };
}

// export function update()

// export function clear()

// export function cross(
//     self: Info,
//     tick: number,
//     feeGrowthGlobal0X128: BigNumber,
//     feeGrowthGlobal1X128: BigNumber,
//     secondsPerLiquidityCumulativeX128: BigNumber,
//     tickCumulative: BigNumber,
//     time: number
// ) {
    
// }