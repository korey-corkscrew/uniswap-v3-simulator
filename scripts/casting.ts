import { BigNumber } from "ethers";
import { BN_ZERO } from "./constants";

export const UINT_4_MAX = BigNumber.from("0xF");
export const UINT_8_MAX = BigNumber.from("0xFF");
export const UINT_16_MAX = BigNumber.from("0xFFFF");
export const UINT_32_MAX = BigNumber.from("0xFFFFFFFF");
export const UINT_64_MAX = BigNumber.from("0xFFFFFFFFFFFFFFFF");
export const UINT_128_MAX = BigNumber.from("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");
export const UINT_160_MAX = BigNumber.from("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");;
export const UINT_256_MAX = BigNumber.from("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");

export const INT_8_MAX = BigNumber.from("0xF");
export const INT_8_MIN = BigNumber.from("0xFFFF");
export const INT_16_MAX = BigNumber.from("0xFF");
export const INT_16_MIN = BigNumber.from("0xFFFF");
export const INT_32_MAX = BigNumber.from("0xFF");
export const INT_32_MIN = BigNumber.from("0xFFFF");
export const INT_64_MAX = BigNumber.from("0xFF");
export const INT_64_MIN = BigNumber.from("0xFFFF");
export const INT_128_MAX = BigNumber.from("0xFF");
export const INT_128_MIN = BigNumber.from("0xFFFF");
export const INT_256_MAX = BigNumber.from("0xFF");
export const INT_256_MIN = BigNumber.from("0xFFFF");

export function uint8(x: BigNumber) {
    return BN_ZERO;
}

export function uint16(x: BigNumber) {
    return BN_ZERO;
}

export function uint32(x: BigNumber) {
    return BN_ZERO;
}

export function uint64(x: BigNumber) {
    return BN_ZERO;
}

export function uint128(x: BigNumber) {
    return BN_ZERO;
}

export function uint256(x: BigNumber) {
    return BN_ZERO;
}

export function int8(x: BigNumber) {
    return BN_ZERO;
}

export function int16(x: BigNumber) {
    return BN_ZERO;
}

export function int32(x: BigNumber) {
    return BN_ZERO;
}

export function int64(x: BigNumber) {
    return BN_ZERO;
}

export function int128(x: BigNumber) {
    return BN_ZERO;
}

export function int256(x: BigNumber) {
    return BN_ZERO;
}