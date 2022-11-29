import { BigNumber, BigNumberish } from "ethers";
import { IUniswapV3Pool } from "../../typechain-types";
import { BN_ZERO } from "../constants";

export interface Observation {
    blockTimestamp: number;
    tickCumulative: BigNumber;
    secondsPerLiquidityCumulativeX128: BigNumber;
    initialized: boolean
}

export function transform(
    last: Observation,
    blockTimestamp: number,
    tick: number,
    liquidity: BigNumber
) {
    let delta = BigNumber.from(blockTimestamp - last.blockTimestamp);
    let newObservation: Observation = {
        blockTimestamp: blockTimestamp,
        tickCumulative: last.tickCumulative.add(tick).mul(delta),
        secondsPerLiquidityCumulativeX128: last.secondsPerLiquidityCumulativeX128.add(
            (delta.shl(128).div(liquidity.gt(0) ? liquidity : 1))),
        initialized: true
    };
    return newObservation;
}

export function lte(time: number, a: number, b: number) {
    if(a <= time && b <= time) return a <= b;
    let aAdjusted = a > time ? a : a + 2**32;
    let bAdjusted = b > time ? b : b + 2**32;
    return aAdjusted <= bAdjusted;
}

export async function binarySearch(
    pool: IUniswapV3Pool,
    time: number, 
    target: number,
    index: number,
    cardinality: number
) {
    let beforeOrAt: Observation;
    let atOrAfter: Observation;
    let l = BigNumber.from((index + 1) % cardinality);
    let r = BigNumber.from(l.add(cardinality - 1));
    let i = BN_ZERO;
    while(true) {
        i = (l.add(r)).div(2);
        beforeOrAt = await observations(pool, i.mod(cardinality));
        if(!beforeOrAt.initialized) { 
            l = i.add(1);
            continue;
        }
        atOrAfter = await observations(pool, (i.add(1).mod(cardinality)));
        let targetAtOrAfter = lte(time, beforeOrAt.blockTimestamp, target);
        if(targetAtOrAfter && lte(time, target, atOrAfter.blockTimestamp)) break;
        if(!targetAtOrAfter) r = i.sub(1);
        else l = i.add(1);
    }
    return {
        beforeOrAt: beforeOrAt,
        atOrAfter: atOrAfter
    };
}

export async function getSurroundingObservations(
    pool: IUniswapV3Pool,
    time: number,
    target: number,
    tick: number,
    index: number,
    liquidity: BigNumber,
    cardinality: number
) {
    let beforeOrAt = await observations(pool, index);
    let atOrAfter = newObservation();
    if(lte(time, beforeOrAt.blockTimestamp, target)) {
        if(beforeOrAt.blockTimestamp == target) {
            return {
                beforeOrAt: beforeOrAt,
                atOrAfter: atOrAfter
            };
        } else {
            return {
                beforeOrAt: beforeOrAt,
                atOrAfter: transform(beforeOrAt, target, tick, liquidity)
            };
        }
    }
    beforeOrAt = await observations(pool, (index + 1) % cardinality);
    if(!beforeOrAt.initialized) beforeOrAt = await observations(pool, 0);
    if(!lte(time, beforeOrAt.blockTimestamp, target)) throw "OLD";
    return binarySearch(pool, time, target, index, cardinality);
}

export async function observeSingle(
    pool: IUniswapV3Pool,
    time: number,
    secondsAgo: number,
    tick: number,
    index: number,
    liquidity: BigNumber,
    cardinality: number
) {
    if(secondsAgo == 0) {
        let last = await observations(pool, index);
        if(last.blockTimestamp != time) last = transform(last, time, tick, liquidity);
        return {
            tickCumulative: last.tickCumulative,
            secondsPerLiquidityCumulativeX128: last.secondsPerLiquidityCumulativeX128
        };
    }
    let target = time - secondsAgo;
    let surrounding = await getSurroundingObservations(
        pool,
        time,
        target,
        tick,
        index,
        liquidity,
        cardinality
    );
    let beforeOrAt = surrounding.beforeOrAt;
    let atOrAfter = surrounding.atOrAfter;
    if(target == beforeOrAt.blockTimestamp) {
        return {
            tickCumulative: beforeOrAt.tickCumulative,
            secondsPerLiquidityCumulativeX128: beforeOrAt.secondsPerLiquidityCumulativeX128
        };
    } else if(target == atOrAfter.blockTimestamp) {
        return {
            tickCumulative: atOrAfter.tickCumulative,
            secondsPerLiquidityCumulativeX128: atOrAfter.secondsPerLiquidityCumulativeX128
        };
    } else {
        let observationTimeDelta = atOrAfter.blockTimestamp - beforeOrAt.blockTimestamp;
        let targetDelta = target - beforeOrAt.blockTimestamp;
        return {
            tickCumulative: beforeOrAt.tickCumulative.add(
                atOrAfter.tickCumulative.sub(beforeOrAt.tickCumulative).div(observationTimeDelta)).mul(targetDelta
            ),
            secondsPerLiquidityCumulativeX128: beforeOrAt.secondsPerLiquidityCumulativeX128.add(
                atOrAfter.secondsPerLiquidityCumulativeX128.sub(beforeOrAt.secondsPerLiquidityCumulativeX128).mul(targetDelta).div(observationTimeDelta)
            )
        };
    }
}

export async function observations(pool: IUniswapV3Pool, index: BigNumberish): Promise<Observation> {
    let observation = await pool.observations(index);               // [ CALL ]
    return {
        blockTimestamp: observation.blockTimestamp,
        tickCumulative: observation.tickCumulative,
        secondsPerLiquidityCumulativeX128: observation.secondsPerLiquidityCumulativeX128,
        initialized: observation.initialized
    };
}

export function newObservation(): Observation {
    return {
        blockTimestamp: 0,
        tickCumulative: BN_ZERO,
        secondsPerLiquidityCumulativeX128: BN_ZERO,
        initialized: false
    };
}