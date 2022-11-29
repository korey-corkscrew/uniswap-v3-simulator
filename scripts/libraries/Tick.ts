import { info } from "console";
import { BigNumber } from "ethers";
import { IUniswapV3Pool } from "../../typechain-types";
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

export let _ticks = new Map();

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

export async function cross(
    pool: IUniswapV3Pool,
    tick: number,
    feeGrowthGlobal0X128: BigNumber,
    feeGrowthGlobal1X128: BigNumber,
    secondsPerLiquidityCumulativeX128: BigNumber,
    tickCumulative: BigNumber,
    time: number
) {
    let info: Info = await ticks(pool, tick);
    // if(!_ticks.has(tick)) {
    //     // let _tick = await pool.ticks(tick);     // [ CALL ]
    //     info = {
    //         liquidityGross: _tick.liquidityGross,
    //         liquidityNet: _tick.liquidityNet,
    //         feeGrowthOutside0X128: _tick.feeGrowthOutside0X128,
    //         feeGrowthOutside1X128: _tick.feeGrowthOutside1X128,
    //         tickCumulativeOutside: _tick.tickCumulativeOutside,
    //         secondsPerLiquidityOutsideX128: _tick.secondsPerLiquidityOutsideX128,
    //         secondsOutside: _tick.secondsOutside,
    //         initialized: _tick.initialized
    //     };
    //     _ticks.set(tick, info);
    // }
    // info = _ticks.get(tick);
    info.feeGrowthOutside0X128 = feeGrowthGlobal0X128.sub(info.feeGrowthOutside0X128);
    info.feeGrowthOutside1X128 = feeGrowthGlobal1X128.sub(info.feeGrowthOutside1X128);
    info.secondsPerLiquidityOutsideX128 = secondsPerLiquidityCumulativeX128.sub(info.secondsPerLiquidityOutsideX128);
    info.tickCumulativeOutside = tickCumulative.sub(info.tickCumulativeOutside);
    info.secondsOutside = time - info.secondsOutside;
    setTicks(pool, tick, info);
    let liquidityNet = info.liquidityNet;
    return liquidityNet;
}

export async function ticks(pool: IUniswapV3Pool, tick: number) {
    if(!_ticks.has(tick)) {
        let _tick = await pool.ticks(tick);     // [ CALL ]
        let info = {
            liquidityGross: _tick.liquidityGross,
            liquidityNet: _tick.liquidityNet,
            feeGrowthOutside0X128: _tick.feeGrowthOutside0X128,
            feeGrowthOutside1X128: _tick.feeGrowthOutside1X128,
            tickCumulativeOutside: _tick.tickCumulativeOutside,
            secondsPerLiquidityOutsideX128: _tick.secondsPerLiquidityOutsideX128,
            secondsOutside: _tick.secondsOutside,
            initialized: _tick.initialized
        };
        _ticks.set(tick, info);
    }
    return _ticks.get(tick);
}

export function setTicks(pool: IUniswapV3Pool, tick: number, tickInfo: Info) {
    _ticks.set(tick, tickInfo);
}