import { BigNumber, BigNumberish, providers } from "ethers";
import { ethers } from "hardhat";
import { BN_ZERO } from "./constants";
import { Q128 } from "./libraries/FixedPoint128";
import { mulDiv } from "./libraries/FullMath";
import { addDelta } from "./libraries/LiquidityMath";
import { observeSingle } from "./libraries/Oracle";
import { computeSwapStep } from "./libraries/SwapMath";
import { cross } from "./libraries/Tick";
import { nextInitializedTickWithinOneWord } from "./libraries/TickBitmap";
import { getSqrtRatioAtTick, getTickAtSqrtRatio, MAX_TICK, MIN_TICK } from "./libraries/TickMath";
import { ProtocolFees, Slot0, StepComputations, SwapCache, SwapState } from "./pool/PoolStructs";



async function UniswapV3Pool(pool: string) {
    return await ethers.getContractAt('IUniswapV3Pool', pool);
}

async function getAmountOut(pool: string, zeroForOne: boolean, amountSpecified: BigNumber, sqrtPriceLimitX96: BigNumber) {
    const provider = new ethers.providers.WebSocketProvider("ws://192.168.0.187:8546");
    const block = await provider.getBlockNumber();
    const blockTimestamp = (await provider.getBlock(block)).timestamp;
    
    const uniswapPool = await UniswapV3Pool(pool);
    let _slot0 = await uniswapPool.slot0();                                 // [CALL]
    let slot0: Slot0 = {
        sqrtPriceX96: _slot0.sqrtPriceX96,
        tick: _slot0.tick,
        observationIndex: _slot0.observationIndex,
        observationCardinality: _slot0.observationCardinalityNext,
        observationCardinalityNext: _slot0.observationCardinality,
        feeProtocol: _slot0.feeProtocol,
        unlocked: _slot0.unlocked
    };
    let _protocolFees = await uniswapPool.protocolFees();                   // [CALL]
    let protocolFees: ProtocolFees = {
        token0: _protocolFees.token0,
        token1: _protocolFees.token1
    };
    let liquidity = await uniswapPool.liquidity();                          // [CALL]
    let feeGrowthGlobal0X128 = await uniswapPool.feeGrowthGlobal0X128();    // [CALL]
    let feeGrowthGlobal1X128 = await uniswapPool.feeGrowthGlobal1X128();    // [CALL]
    const tickSpacing = await uniswapPool.tickSpacing();                    // [CALL]
    const fee = await uniswapPool.fee();                                    // [CALL]

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
    console.log(
        "slot0", slot0,
        "\nprotocolFees", protocolFees,
        "\nliquidity", liquidity,
        "\nfeeGrowthGlobal0X128", feeGrowthGlobal0X128,
        "\nfeeGrowthGlobal1X128", feeGrowthGlobal1X128,
        "\ntickSpacing", tickSpacing,
        "\nfee", fee
    );
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

    let slot0Start = slot0
    let cache: SwapCache = {
        liquidityStart: liquidity,
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
        feeGrowthGlobalX128: zeroForOne ? feeGrowthGlobal0X128 : feeGrowthGlobal1X128,
        protocolFee: BN_ZERO,
        liquidity: cache.liquidityStart
    };

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
    console.log("cache", cache, "\nstate", state);
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

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

        ///////////////////////////////////////////////////////////////////
        let nextInitialized = await nextInitializedTickWithinOneWord(
            uniswapPool,
            state.tick,
            tickSpacing,
            zeroForOne
        );
        step.tickNext = nextInitialized.next;
        step.initialized = nextInitialized.initialized;
        ///////////////////////////////////////////////////////////////////

        if(step.tickNext < MIN_TICK) {
            step.tickNext = MIN_TICK;
        } else if(step.tickNext > MAX_TICK) {
            step.tickNext = MAX_TICK;
        }

        step.sqrtPriceNextX96 = await getSqrtRatioAtTick(step.tickNext);
        [state.sqrtPriceX96, step.amountIn, step.amountOut, step.feeAmount] = computeSwapStep(
            state.sqrtPriceX96,
            (zeroForOne ? step.sqrtPriceNextX96.lt(sqrtPriceLimitX96) : step.sqrtPriceNextX96.gt(sqrtPriceLimitX96))
                ? sqrtPriceLimitX96
                : step.sqrtPriceNextX96,
            state.liquidity,
            state.amountSpecifiedRemaining,
            fee
        );


        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
        console.log("step", step);
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
        

        if(exactInput) {
            state.amountSpecifiedRemaining = state.amountSpecifiedRemaining.sub(step.amountIn.add(step.feeAmount));
            state.amountCalculated = state.amountCalculated.sub(step.amountOut);
        } else {
            state.amountSpecifiedRemaining = state.amountSpecifiedRemaining.add(step.amountOut);
            state.amountCalculated = state.amountCalculated.add(step.amountIn.add(step.feeAmount));
        }
        if(cache.feeProtocol > 0) {
            let delta = step.feeAmount.div(cache.feeProtocol);
            step.feeAmount = step.feeAmount.sub(delta);
            state.protocolFee = state.protocolFee.add(delta);
        }
        if(state.liquidity.gt(0)) {
            state.feeGrowthGlobalX128 = state.feeGrowthGlobalX128.add(mulDiv(step.feeAmount, Q128, state.liquidity));
        }
        if(state.sqrtPriceX96.eq(step.sqrtPriceNextX96)) {
            if(step.initialized) {
                if(!cache.computedLatestObservation) {

                    ///////////////////////////////////////////////////////////////////
                    let observeData = await observeSingle(
                        uniswapPool,
                        cache.blockTimestamp,
                        0,
                        slot0Start.tick,
                        slot0Start.observationIndex,
                        cache.liquidityStart,
                        slot0Start.observationCardinality
                    );
                    cache.tickCumulative = observeData.tickCumulative;
                    cache.secondsPerLiquidityCumulativeX128 = observeData.secondsPerLiquidityCumulativeX128;
                    ///////////////////////////////////////////////////////////////////

                    cache.computedLatestObservation = true;
                }

                ///////////////////////////////////////////////////////////////////
                let liquidityNet = await cross(
                    uniswapPool,
                    step.tickNext,
                    (zeroForOne ? state.feeGrowthGlobalX128 : feeGrowthGlobal0X128),
                    (zeroForOne ? feeGrowthGlobal1X128 : state.feeGrowthGlobalX128),
                    cache.secondsPerLiquidityCumulativeX128,
                    cache.tickCumulative,
                    cache.blockTimestamp
                );
                ///////////////////////////////////////////////////////////////////

                if(zeroForOne) liquidityNet = liquidityNet.mul(-1);
                state.liquidity = addDelta(state.liquidity, liquidityNet);
            }
            state.tick = zeroForOne ? step.tickNext - 1 : step.tickNext;
        } else if(!state.sqrtPriceX96.eq(step.sqrtPriceStartX96)) {
            state.tick = getTickAtSqrtRatio(state.sqrtPriceX96).toNumber();
        }
    }
    if(state.tick != slot0Start.tick) {
        let observationIndex = 0;
        let observationCardinality = 0;

        ///////////////////////////////////////////////////////////////////
        // let writeData = write();
        // observationIndex = writeData.observationIndex;
        // observationCardinality = writeData.observationCardinality;
        ///////////////////////////////////////////////////////////////////

        slot0.sqrtPriceX96 = state.sqrtPriceX96;
        slot0.tick = state.tick;
        slot0.observationIndex = observationIndex;
        slot0.observationCardinality = observationCardinality;
    } else {
        slot0.sqrtPriceX96 = state.sqrtPriceX96;
    }
    if(!cache.liquidityStart.eq(state.liquidity)) liquidity = state.liquidity;
    if(zeroForOne) {
        feeGrowthGlobal0X128 = state.feeGrowthGlobalX128;
        if(state.protocolFee.gt(0)) protocolFees.token0 = protocolFees.token0.add(state.protocolFee);
    } else {
        feeGrowthGlobal1X128 = state.feeGrowthGlobalX128;
        if(state.protocolFee.gt(0)) protocolFees.token1 = protocolFees.token1.add(state.protocolFee);
    }

    let amount0 = BN_ZERO;
    let amount1 = BN_ZERO;
    if(zeroForOne == exactInput) {
        amount0 = amountSpecified.sub(state.amountSpecifiedRemaining);
        amount1 = state.amountCalculated;
    } else {
        amount0 = state.amountCalculated;
        amount1 = amountSpecified.sub(state.amountSpecifiedRemaining);
    }
    slot0.unlocked = true;
    return {
        amount0: amount0,
        amount1: amount1
    };
}

async function main() {
    const data = await getAmountOut(
        "0x45dDa9cb7c25131DF268515131f647d726f50608",
        true,
        ethers.utils.parseUnits("10", 6),
        BN_ZERO
    );
    console.log(data);
}

main();