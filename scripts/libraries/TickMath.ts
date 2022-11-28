import { BigNumber } from "ethers";
import { UINT_256_MAX } from "../casting";

export const MIN_TICK = -887272;
export const MAX_TICK = -MIN_TICK;
export const MIN_SQRT_RATIO = BigNumber.from(4295128739);
export const MAX_SQRT_RATIO = BigNumber.from("1461446703485210103287273052203988822378723970342");

export function getSqrtRatioAtTick(tick: number) {
    let absTick = BigNumber.from(tick > 0 ? tick * -1 : tick);
    if(!absTick.lte(MAX_TICK)) throw "T";
    let ratio = !absTick.and(0x1).eq(0) ? BigNumber.from("0xfffcb933bd6fad37aa2d162d1a594001") : BigNumber.from("0x100000000000000000000000000000000");
    if(!absTick.and(0x2).eq(0)) ratio = ratio.mul(BigNumber.from("0xfff97272373d413259a46990580e213a")).shr(128);
    if(!absTick.and(0x4).eq(0)) ratio = ratio.mul(BigNumber.from("0xfff2e50f5f656932ef12357cf3c7fdcc")).shr(128);
    if(!absTick.and(0x8).eq(0)) ratio = ratio.mul(BigNumber.from("0xffe5caca7e10e4e61c3624eaa0941cd0")).shr(128);
    if(!absTick.and(0x10).eq(0)) ratio = ratio.mul(BigNumber.from("0xffcb9843d60f6159c9db58835c926644")).shr(128);
    if(!absTick.and(0x20).eq(0)) ratio = ratio.mul(BigNumber.from("0xff973b41fa98c081472e6896dfb254c0")).shr(128);
    if(!absTick.and(0x40).eq(0)) ratio = ratio.mul(BigNumber.from("0xff2ea16466c96a3843ec78b326b52861")).shr(128);
    if(!absTick.and(0x80).eq(0)) ratio = ratio.mul(BigNumber.from("0xfe5dee046a99a2a811c461f1969c3053")).shr(128);
    if(!absTick.and(0x100).eq(0)) ratio = ratio.mul(BigNumber.from("0xfcbe86c7900a88aedcffc83b479aa3a4")).shr(128);
    if(!absTick.and(0x200).eq(0)) ratio = ratio.mul(BigNumber.from("0xf987a7253ac413176f2b074cf7815e54")).shr(128);
    if(!absTick.and(0x400).eq(0)) ratio = ratio.mul(BigNumber.from("0xf3392b0822b70005940c7a398e4b70f3")).shr(128);
    if(!absTick.and(0x800).eq(0)) ratio = ratio.mul(BigNumber.from("0xe7159475a2c29b7443b29c7fa6e889d9")).shr(128);
    if(!absTick.and(0x1000).eq(0)) ratio = ratio.mul(BigNumber.from("0xd097f3bdfd2022b8845ad8f792aa5825")).shr(128);
    if(!absTick.and(0x2000).eq(0)) ratio = ratio.mul(BigNumber.from("0xa9f746462d870fdf8a65dc1f90e061e5")).shr(128);
    if(!absTick.and(0x4000).eq(0)) ratio = ratio.mul(BigNumber.from("0x70d869a156d2a1b890bb3df62baf32f7")).shr(128);
    if(!absTick.and(0x8000).eq(0)) ratio = ratio.mul(BigNumber.from("0x31be135f97d08fd981231505542fcfa6")).shr(128);
    if(!absTick.and(0x10000).eq(0)) ratio = ratio.mul(BigNumber.from("0x9aa508b5b7a84e1c677de54f3e99bc9")).shr(128);
    if(!absTick.and(0x20000).eq(0)) ratio = ratio.mul(BigNumber.from("0x5d6af8dedb81196699c329225ee604")).shr(128);
    if(!absTick.and(0x40000).eq(0)) ratio = ratio.mul(BigNumber.from("0x2216e584f5fa1ea926041bedfe98")).shr(128);
    if(!absTick.and(0x80000).eq(0)) ratio = ratio.mul(BigNumber.from("0x48a170391f7dc42444e8fa2")).shr(128);
    if(tick > 0) ratio = UINT_256_MAX.div(ratio);
    let sqrtPriceX96 = ratio.shr(32).add(ratio.mod(1 << 32).isZero() ? 0 : 1);
    return sqrtPriceX96;
}

export function getTickAtSqrtRatio(sqrtPriceX96: BigNumber) {
    if(!sqrtPriceX96.gte(MIN_SQRT_RATIO) || !sqrtPriceX96.lt(MAX_SQRT_RATIO)) throw "R";
    let ratio = sqrtPriceX96.shl(32);
    let r = ratio;
    let msb = 0;
    let retData = getTickAtSqrtRatioHelper(r, BigNumber.from("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"), 7, msb);
    r = retData.ratio;
    msb = retData.msb;
    retData = getTickAtSqrtRatioHelper(r, BigNumber.from("0xFFFFFFFFFFFFFFFF"), 6, msb);
    r = retData.ratio;
    msb = retData.msb;
    retData = getTickAtSqrtRatioHelper(r, BigNumber.from("0xFFFFFFFF"), 5, msb);
    r = retData.ratio;
    msb = retData.msb;
    retData = getTickAtSqrtRatioHelper(r, BigNumber.from("0xFFFF"), 4, msb);
    r = retData.ratio;
    msb = retData.msb;
    retData = getTickAtSqrtRatioHelper(r, BigNumber.from("0xFF"), 3, msb);
    r = retData.ratio;
    msb = retData.msb;
    retData = getTickAtSqrtRatioHelper(r, BigNumber.from("0xF"), 2, msb);
    r = retData.ratio;
    msb = retData.msb;
    retData = getTickAtSqrtRatioHelper(r, BigNumber.from("0x3"), 1, msb);
    r = retData.ratio;
    msb = retData.msb;
    msb = r.gt(1) ? msb | 1 : msb;
    if(msb >= 128) r = ratio.shr(msb - 127);
    else r = ratio.shl(127 - msb);
    let log_2 = BigNumber.from(msb - 128).shl(64);
    let retData2 = getTickAtSqrtRatioHelper2(r, 63, log_2);
    r = retData2.ratio;
    log_2 = retData2.log_2;
    retData2 = getTickAtSqrtRatioHelper2(r, 62, log_2);
    r = retData2.ratio;
    log_2 = retData2.log_2;
    retData2 = getTickAtSqrtRatioHelper2(r, 61, log_2);
    r = retData2.ratio;
    log_2 = retData2.log_2;
    retData2 = getTickAtSqrtRatioHelper2(r, 60, log_2);
    r = retData2.ratio;
    log_2 = retData2.log_2;
    retData2 = getTickAtSqrtRatioHelper2(r, 59, log_2);
    r = retData2.ratio;
    log_2 = retData2.log_2;
    retData2 = getTickAtSqrtRatioHelper2(r, 58, log_2);
    r = retData2.ratio;
    log_2 = retData2.log_2;
    retData2 = getTickAtSqrtRatioHelper2(r, 57, log_2);
    r = retData2.ratio;
    log_2 = retData2.log_2;
    retData2 = getTickAtSqrtRatioHelper2(r, 56, log_2);
    r = retData2.ratio;
    log_2 = retData2.log_2;
    retData2 = getTickAtSqrtRatioHelper2(r, 55, log_2);
    r = retData2.ratio;
    log_2 = retData2.log_2;
    retData2 = getTickAtSqrtRatioHelper2(r, 54, log_2);
    r = retData2.ratio;
    log_2 = retData2.log_2;
    retData2 = getTickAtSqrtRatioHelper2(r, 53, log_2);
    r = retData2.ratio;
    log_2 = retData2.log_2;
    retData2 = getTickAtSqrtRatioHelper2(r, 52, log_2);
    r = retData2.ratio;
    log_2 = retData2.log_2;
    retData2 = getTickAtSqrtRatioHelper2(r, 51, log_2);
    r = retData2.ratio;
    log_2 = retData2.log_2;
    r = r.mul(r).shr(127);
    let f = r.shr(128);
    log_2 = f.shl(50).or(log_2);
    let log_sqrt10001 = log_2.mul(BigNumber.from("255738958999603826347141"));
    let tickLow = log_sqrt10001.sub(BigNumber.from("3402992956809132418596140100660247210")).shr(128);
    let tickHi = log_sqrt10001.add(BigNumber.from("291339464771989622907027621153398088495")).shr(128);
    let tick = tickLow.eq(tickHi) ? tickLow : getSqrtRatioAtTick(tickHi.toNumber()).lte(sqrtPriceX96) ? tickHi : tickLow;
    return tick;
}

function getTickAtSqrtRatioHelper(ratio: BigNumber, max: BigNumber, shift: number, msb: number) {
    let f = ratio.gt(max) ? (1 << shift) : 0;
    msb = msb | f;
    ratio = ratio.shr(f);
    return {
        msb: msb,
        ratio: ratio
    };
}

function getTickAtSqrtRatioHelper2(ratio: BigNumber, shift: number, log_2: BigNumber) {
    ratio = ratio.mul(ratio).shr(127);
    let f = ratio.shr(128);
    log_2 = f.shl(shift).or(log_2);
    ratio = ratio.shr(f.toNumber());
    return {
        log_2: log_2,
        ratio: ratio
    };
}