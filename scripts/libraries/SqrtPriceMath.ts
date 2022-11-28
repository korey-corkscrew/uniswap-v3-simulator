import { BigNumber } from "ethers";
import { int256, UINT_160_MAX } from "../casting";
import { BN_ZERO } from "../constants";
import { Q96, RESOLUTION } from "./FixedPoint96";
import { mulDiv, mulDivRoundingUp } from "./FullMath";
import { divRoundingUp } from "./UnsafeMath";

export function getNextSqrtPriceFromAmount0RoundingUp(
    sqrtPX96: BigNumber,
    liquidity: BigNumber,
    amount: BigNumber,
    add: boolean
) {
    if(amount.isZero()) return sqrtPX96;
    let numerator1 = liquidity.shl(RESOLUTION);
    if(add) {
        let product = BN_ZERO;
        if((product = amount.mul(sqrtPX96)).div(amount).eq(sqrtPX96)) {
            let denominator = numerator1.add(product);
            if(denominator.gte(numerator1)) {
                return mulDivRoundingUp(numerator1, sqrtPX96, denominator);
            }
        }
        return divRoundingUp(numerator1, (numerator1.div(sqrtPX96).add(amount)));
    } else {
        let product = BN_ZERO;
        if(!(product = amount.mul(sqrtPX96)).div(amount).eq(sqrtPX96) && !numerator1.gt(product)) {
            throw "FLOW";
        }
        let denominator = numerator1.sub(product);
        return mulDivRoundingUp(numerator1, sqrtPX96, denominator);
    }
}

export function getNextSqrtPriceFromAmount1RoundingDown(
    sqrtPX96: BigNumber,
    liquidity: BigNumber,
    amount: BigNumber,
    add: boolean
) {
    if(add) {
        let quotient = amount.lte(UINT_160_MAX)
            ? amount.shl(RESOLUTION).div(liquidity)
            : mulDiv(amount, Q96, liquidity);
        return sqrtPX96.add(quotient);
    } else {
        let quotient = amount.lte(UINT_160_MAX)
            ? divRoundingUp(amount.shl(RESOLUTION), liquidity)
            : mulDivRoundingUp(amount, Q96, liquidity);
        if(!sqrtPX96.gt(quotient)) throw "sqrtPX96 <= quotient";
        return sqrtPX96.sub(quotient);
    }
}

export function getNextSqrtPriceFromInput(
    sqrtPX96: BigNumber,
    liquidity: BigNumber,
    amountIn: BigNumber,
    zeroForOne: boolean
) {
    if(!sqrtPX96.gt(0)) throw "sqrtPX96 <= 0";
    if(!liquidity.gt(0)) throw "liquidity <= 0";
    return zeroForOne 
        ? getNextSqrtPriceFromAmount0RoundingUp(sqrtPX96, liquidity, amountIn, true)
        : getNextSqrtPriceFromAmount1RoundingDown(sqrtPX96, liquidity, amountIn, true);
}

export function getNextSqrtPriceFromOutput(
    sqrtPX96: BigNumber,
    liquidity: BigNumber,
    amountOut: BigNumber,
    zeroForOne: boolean
) {
    if(!sqrtPX96.gt(0)) throw "sqrtPX96 <= 0";
    if(!liquidity.gt(0)) throw "liquidity <= 0";
    return zeroForOne 
        ? getNextSqrtPriceFromAmount1RoundingDown(sqrtPX96, liquidity, amountOut, false)
        : getNextSqrtPriceFromAmount0RoundingUp(sqrtPX96, liquidity, amountOut, false);
}

export function _getAmount0Delta(
    sqrtRatioAX96: BigNumber,
    sqrtRatioBX96: BigNumber,
    liquidity: BigNumber,
    roundUp: boolean
): BigNumber {
    let amount0 = BN_ZERO;
    if(sqrtRatioAX96.gt(sqrtRatioBX96)) {
        let temp = sqrtRatioAX96;
        sqrtRatioAX96 = sqrtRatioBX96;
        sqrtRatioBX96 = temp;
    }
    let numerator1 = liquidity.shl(RESOLUTION);
    let numerator2 = sqrtRatioBX96.sub(sqrtRatioAX96);
    amount0 = roundUp 
        ? divRoundingUp(mulDivRoundingUp(numerator1, numerator2, sqrtRatioBX96), sqrtRatioAX96)
        : numerator1.mul(numerator2).div(sqrtRatioBX96).div(sqrtRatioAX96);
    return amount0;
}

export function _getAmount1Delta(
    sqrtRatioAX96: BigNumber,
    sqrtRatioBX96: BigNumber,
    liquidity: BigNumber,
    roundUp: boolean
): BigNumber {
    let amount1 = BN_ZERO;
    if(sqrtRatioAX96.gt(sqrtRatioBX96)) {
        let temp = sqrtRatioAX96;
        sqrtRatioAX96 = sqrtRatioBX96;
        sqrtRatioBX96 = temp;
    }
    amount1 = roundUp 
        ? mulDivRoundingUp(liquidity, sqrtRatioBX96.sub(sqrtRatioAX96), Q96)
        : liquidity.mul(sqrtRatioBX96.sub(sqrtRatioAX96)).div(Q96);
    return amount1;
}

export function getAmount0Delta(
    sqrtRatioAX96: BigNumber,
    sqrtRatioBX96: BigNumber,
    liquidity: BigNumber
): BigNumber {
    let amount0 = liquidity.lt(0)
        ? int256(_getAmount0Delta(sqrtRatioAX96, sqrtRatioBX96, liquidity.mul(-1), false))
        : int256(_getAmount0Delta(sqrtRatioAX96, sqrtRatioBX96, liquidity, true));
    return amount0;
}

export function getAmount1Delta(
    sqrtRatioAX96: BigNumber,
    sqrtRatioBX96: BigNumber,
    liquidity: BigNumber
): BigNumber {
    let amount1 = liquidity.lt(0)
        ? int256(_getAmount0Delta(sqrtRatioAX96, sqrtRatioBX96, liquidity.mul(-1), false))
        : int256(_getAmount0Delta(sqrtRatioAX96, sqrtRatioBX96, liquidity, true));
    return amount1;
}