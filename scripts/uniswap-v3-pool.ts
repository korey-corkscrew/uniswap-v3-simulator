import { BigNumber, BigNumberish, providers } from "ethers";
import { ethers } from "hardhat";
import { boolean } from "hardhat/internal/core/params/argumentTypes";
import { IUniswapV3Pool } from "../typechain-types";
// import { IUniswapV3Pool } from "../typechain-types";

const BN_ZERO = BigNumber.from(0);

interface SwapCache {
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

interface SwapState {
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

interface StepComputations {
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

const MIN_TICK = -887272;
const MAX_TICK = -MIN_TICK;

async function UniswapV3Pool(pool: string) {
    return await ethers.getContractAt('IUniswapV3Pool', pool);
}

async function getAmountOut(sqrtPriceLimitX96: BigNumber, amountSpecified: BigNumber, pool: string, amountIn: BigNumberish, zeroForOne: boolean) {
    const provider = providers.getDefaultProvider();
    const block = await provider.getBlockNumber();
    const blockTimestamp = (await provider.getBlock(block)).timestamp;
    const uniswapPool = await UniswapV3Pool(pool);
    let slot0Start = await uniswapPool.slot0();
    let cache: SwapCache = {
        liquidityStart: await uniswapPool.liquidity(),
        blockTimestamp: blockTimestamp,
        feeProtocol: zeroForOne ? (slot0Start.feeProtocol % 16) : (slot0Start.feeProtocol >> 4),
        secondsPerLiquidityCumulativeX128: BN_ZERO,
        tickCumulative: BN_ZERO,
        computedLatestObservation: false
    };
    let exactInput = amountSpecified.gt(0);
    let state: SwapState = {
        amountSpecifiedRemaining: amountSpecified,
        amountCalculated: BN_ZERO,
        sqrtPriceX96: slot0Start.sqrtPriceX96,
        tick: slot0Start.tick,
        feeGrowthGlobalX128: zeroForOne ? await uniswapPool.feeGrowthGlobal0X128() : await uniswapPool.feeGrowthGlobal1X128(),
        protocolFee: BN_ZERO,
        liquidity: cache.liquidityStart
    };
    while(!state.amountSpecifiedRemaining.eq(0) && !state.sqrtPriceX96.eq(sqrtPriceLimitX96)) {
        let step: StepComputations = {
            sqrtPriceStartX96: BN_ZERO,
            tickNext: 0,
            initialized: false,
            sqrtPriceNextX96: BN_ZERO,
            amountIn: BN_ZERO,
            amountOut: BN_ZERO,
            feeAmount: BN_ZERO
        };
        step.sqrtPriceStartX96 = state.sqrtPriceX96;
        let nextInitialized = await nextInitializedTickWithinOneWord(
            uniswapPool,
            state.tick,
            await uniswapPool.tickSpacing(),
            zeroForOne
        );
        step.tickNext = nextInitialized.next;
        step.initialized = nextInitialized.initialized;
        if(step.tickNext < MIN_TICK) {
            step.tickNext = MIN_TICK;
        } else if(step.tickNext > MAX_TICK) {
            step.tickNext = MAX_TICK;
        }

        // step.sqrtPriceNextX96 = ...


    }
}

async function nextInitializedTickWithinOneWord(
    pool: IUniswapV3Pool,
    tick: number,
    tickSpacing: number,
    lte: boolean
) {
    let next: number = 0;
    let initialized: boolean = false;
    let compressed = tick / tickSpacing;
    if(tick < 0 && tick % tickSpacing != 0) compressed--;
    if(lte) {
        let [wordPos, bitPos] = position(compressed);
        let mask = (1 << bitPos) - 1 + (1 << bitPos);
        let masked = (await pool.tickBitmap(wordPos)).and(mask);
        initialized = !masked.eq(0);
        next = initialized
            ? (compressed - (bitPos - mostSignificantBit(masked))) * tickSpacing
            : (compressed - bitPos) * tickSpacing;
    } else {
        let [wordPos, bitPos] = position(compressed + 1);
        let mask = ~((1 << bitPos) - 1);
        let masked = (await pool.tickBitmap(wordPos)).and(mask);
        initialized = !masked.eq(0);
        next = initialized
            ? (compressed + 1 + (leastSignificantBit(masked) - bitPos)) * tickSpacing
            : (compressed + 1 + (255 - bitPos)) * tickSpacing;
    }
    return {next: next, initialized: initialized};
}

function position(tick: number) {
    let wordPos = (tick >> 8); // check this !!!
    let bitPos = tick % 256; // check this !!!
    return [wordPos, bitPos];
}

function mostSignificantBit(x: BigNumber) {
    let r = 0;
    if(x.gte("0x100000000000000000000000000000000")) {
        x = x.shr(128);
        r += 128;
    }
    if(x.gte("0x10000000000000000")) {
        x = x.shr(64);
        r += 64;
    }
    if(x.gte("0x100000000")) {
        x = x.shr(32);
        r += 32;
    }
    if(x.gte("0x10000")) {
        x = x.shr(16);
        r += 16;
    }
    if(x.gte("0x100")) {
        x = x.shr(8);
        r += 8;
    }
    if(x.gte("0x10")) {
        x = x.shr(4);
        r += 4;
    }
    if(x.gte("0x4")) {
        x = x.shr(2);
        r += 2;
    }
    if(x.gte("0x2")) {
        r += 1;
    }
    return r;
}

function leastSignificantBit(x: BigNumber) {
    let r = 255;
    if(x.and("340282366920938463463374607431768211455").gt(0)) {
        r -= 128;
    } else {
        x = x.shr(128);
    }
    if(x.and("18446744073709551615").gt(0)) {
        r -= 64;
    } else {
        x = x.shr(64);
    }
    if(x.and("4294967295").gt(0)) {
        r -= 32;
    } else {
        x = x.shr(32);
    }
    if(x.and("65535").gt(0)) {
        r -= 16;
    } else {
        x = x.shr(16);
    }
    if(x.and(255).gt(0)) {
        r -= 8;
    } else {
        x = x.shr(8);
    }
    if(x.and(15).gt(0)) {
        r -= 4;
    } else {
        x = x.shr(4);
    }
    if(x.and(3).gt(0)) {
        r -= 2;
    } else {
        x = x.shr(2);
    }
    if(x.and(1).gt(0)) {
        r -= 1;
    }
    return r;
}

function computeSwapStep(
    sqrtRatioCurrentX96: BigNumber,
    sqrtRatioTargetX96: BigNumber,
    liquidity: BigNumber,
    amountRemaining: BigNumber,
    feePips: number
) {
    let sqrtRatioNextX96: BigNumber = BN_ZERO;
    let amountIn: BigNumber = BN_ZERO;
    let amountOut: BigNumber = BN_ZERO;
    let feeAmount: BigNumber = BN_ZERO;
    let zeroForOne = sqrtRatioCurrentX96.gte(sqrtRatioTargetX96);
    let exactIn = amountRemaining.gte(0);
    if(exactIn) {
        let amountRemainingLessFee = amountRemaining.mul(1e6 - feePips).div(1e6);
        amountIn = zeroForOne
            ? getAmount0Delta(sqrtRatioTargetX96, sqrtRatioCurrentX96, liquidity, true)
            : getAmount1Delta(sqrtRatioCurrentX96, sqrtRatioTargetX96, liquidity, true);
        if(amountRemainingLessFee.gte(amountIn)) sqrtRatioNextX96 = sqrtRatioTargetX96;
        else {
            sqrtRatioNextX96 = get
        }
    }
}


function getAmount0Delta(
    sqrtRatioAX96: BigNumber,
    sqrtRatioBX96: BigNumber,
    liquidity: BigNumber,
    roundUp: boolean
) {
    let amount0 = BN_ZERO;
    if(sqrtRatioAX96.gt(sqrtRatioBX96)) {
        let temp = sqrtRatioAX96;
        sqrtRatioAX96 = sqrtRatioBX96;
        sqrtRatioBX96 = temp;
    }
    let numerator1 = liquidity.shl(96);
    let numerator2 = sqrtRatioBX96.sub(sqrtRatioAX96);
    amount0 = roundUp 
        ? divRoundingUp(mulDivRoundingUp(numerator1, numerator2, sqrtRatioBX96), sqrtRatioAX96)
        : numerator1.mul(numerator2).div(sqrtRatioBX96).div(sqrtRatioAX96);
    return amount0;
}

function getAmount1Delta(
    sqrtRatioAX96: BigNumber,
    sqrtRatioBX96: BigNumber,
    liquidity: BigNumber,
    roundUp: boolean
) {
    let amount1 = BN_ZERO;
    if(sqrtRatioAX96.gt(sqrtRatioBX96)) {
        let temp = sqrtRatioAX96;
        sqrtRatioAX96 = sqrtRatioBX96;
        sqrtRatioBX96 = temp;
    }
    amount1 = roundUp 
        ? mulDivRoundingUp(liquidity, sqrtRatioBX96.sub(sqrtRatioAX96), BigNumber.from("0x1000000000000000000000000"))
        : liquidity.mul(sqrtRatioBX96.sub(sqrtRatioAX96)).div(BigNumber.from("0x1000000000000000000000000"));
    return amount1;
}

function divRoundingUp(x: BigNumber, y: BigNumber) {
    return x.div(y).add(x.mod(y).gt(0) ? x.mod(y) : 0);
}

function mulDivRoundingUp(a: BigNumber, b: BigNumber, denominator: BigNumber) {
    let result = a.mul(b).div(denominator);
    if(a.mul(b).mod(denominator).gt(0)) {
        result = result.add(1);
    }
    return result;
}