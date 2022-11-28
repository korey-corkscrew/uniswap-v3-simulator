import { BigNumber } from "ethers";
import { BN_ZERO } from "../constants";
import { mulDiv, mulDivRoundingUp } from "./FullMath";
import { getAmount0Delta, getNextSqrtPriceFromInput, getNextSqrtPriceFromOutput, _getAmount0Delta, _getAmount1Delta } from "./SqrtPriceMath";

export function computeSwapStep(
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
        let amountRemainingLessFee = mulDiv(amountRemaining, BigNumber.from(1e6).sub(feePips), BigNumber.from(1e6));
        amountIn = zeroForOne
            ? _getAmount0Delta(sqrtRatioTargetX96, sqrtRatioCurrentX96, liquidity, true)
            : _getAmount1Delta(sqrtRatioCurrentX96, sqrtRatioTargetX96, liquidity, true);
        if(amountRemainingLessFee.gte(amountIn)) sqrtRatioNextX96 = sqrtRatioTargetX96;
        else {
            sqrtRatioNextX96 = getNextSqrtPriceFromInput(
                sqrtRatioCurrentX96,
                liquidity,
                amountRemainingLessFee,
                zeroForOne
            );
        }
    } else {
        amountOut = zeroForOne
            ? _getAmount1Delta(sqrtRatioTargetX96, sqrtRatioCurrentX96, liquidity, false)
            : _getAmount0Delta(sqrtRatioCurrentX96, sqrtRatioTargetX96, liquidity, false);
        if(amountRemaining.mul(-1).gte(amountOut)) sqrtRatioNextX96 = sqrtRatioTargetX96;
        else {
            sqrtRatioNextX96 = getNextSqrtPriceFromOutput(
                sqrtRatioCurrentX96,
                liquidity,
                amountRemaining.mul(-1),
                zeroForOne
            );
        }
    }
    let max = sqrtRatioTargetX96.eq(sqrtRatioNextX96);
    if(zeroForOne) {
        amountIn = max && exactIn 
            ? amountIn
            : _getAmount0Delta(sqrtRatioNextX96, sqrtRatioCurrentX96, liquidity, true);
        amountOut = max && !exactIn
            ? amountOut
            : _getAmount1Delta(sqrtRatioNextX96, sqrtRatioCurrentX96, liquidity, false);
    } else {
        amountIn = max && exactIn
            ? amountIn
            : _getAmount1Delta(sqrtRatioCurrentX96, sqrtRatioNextX96, liquidity, true);
        amountOut = max && !exactIn
            ? amountOut
            : _getAmount0Delta(sqrtRatioCurrentX96, sqrtRatioNextX96, liquidity, false);
    }
    if(!exactIn && amountOut.gt(amountRemaining.mul(-1))) {
        feeAmount = amountRemaining.sub(amountIn);
    } else {
        feeAmount = mulDivRoundingUp(amountIn, BigNumber.from(feePips), BigNumber.from(1e6).sub(feePips));
    }
    return [ sqrtRatioNextX96, amountIn, amountOut, feeAmount ];
}