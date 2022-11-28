import { BigNumber } from "ethers";

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
