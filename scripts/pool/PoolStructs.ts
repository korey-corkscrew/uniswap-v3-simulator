import { BigNumber } from "ethers";

export interface Slot0 {
    sqrtPriceX96: BigNumber;
    tick: number;
    observationIndex: number;
    observationCardinality: number;
    observationCardinalityNext: number;
    feeProtocol: number;
    unlocked: boolean;
}

export interface ProtocolFees {
    token0: BigNumber;
    token1: BigNumber;
}

export interface ModifyPositionParams {
    owner: string;
    tickLower: number;
    tickUpper: number;
    liquidityDelta: BigNumber;
}

export interface SwapCache {
    // the protocol fee for the input token
    feeProtocol: number;
    // liquidity at the beginning of the swap
    liquidityStart: BigNumber;
    // the timestamp of the current block
    blockTimestamp: number;
    // the current value of the tick accumulator, computed only if we cross an initialized tick
    tickCumulative: BigNumber;
    // the current value of seconds per liquidity accumulator, computed only if we cross an initialized tick
    secondsPerLiquidityCumulativeX128: BigNumber;
    // whether we've computed and cached the above two accumulators
    computedLatestObservation: boolean;
}

export interface SwapState {
    // the amount remaining to be swapped in/out of the input/output asset
    amountSpecifiedRemaining: BigNumber;
    // the amount already swapped out/in of the output/input asset
    amountCalculated: BigNumber;
    // current sqrt(price)
    sqrtPriceX96: BigNumber;
    // the tick associated with the current price
    tick: number;
    // the global fee growth of the input token
    feeGrowthGlobalX128: BigNumber;
    // amount of input token paid as protocol fee
    protocolFee: BigNumber;
    // the current liquidity in range
    liquidity: BigNumber;
}

export interface StepComputations {
    // the price at the beginning of the step
    sqrtPriceStartX96: BigNumber;
    // the next tick to swap to from the current tick in the swap direction
    tickNext: number;
    // whether tickNext is initialized or not
    initialized: boolean;
    // sqrt(price) for the next tick (1/0)
    sqrtPriceNextX96: BigNumber;
    // how much is being swapped in in this step
    amountIn: BigNumber;
    // how much is being swapped out
    amountOut: BigNumber;
    // how much fee is being paid in
    feeAmount: BigNumber;
}