import { BigNumber } from "ethers";
import { UINT_128_MAX, UINT_16_MAX, UINT_32_MAX, UINT_4_MAX, UINT_64_MAX, UINT_8_MAX } from "../casting";

export function mostSignificantBit(x: BigNumber) {
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

export function leastSignificantBit(x: BigNumber) {
    let r = 255;
    if(x.and(UINT_128_MAX).gt(0)) {
        r -= 128;
    } else {
        x = x.shr(128);
    }
    if(x.and(UINT_64_MAX).gt(0)) {
        r -= 64;
    } else {
        x = x.shr(64);
    }
    if(x.and(UINT_32_MAX).gt(0)) {
        r -= 32;
    } else {
        x = x.shr(32);
    }
    if(x.and(UINT_16_MAX).gt(0)) {
        r -= 16;
    } else {
        x = x.shr(16);
    }
    if(x.and(UINT_8_MAX).gt(0)) {
        r -= 8;
    } else {
        x = x.shr(8);
    }
    if(x.and(UINT_4_MAX).gt(0)) {
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