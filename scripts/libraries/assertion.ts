import { BigNumber } from "ethers";

export function requireBool(x: boolean, y: boolean, err: string) {
    if(x === y) return;
    throw err;
}

export function requireUint(x: BigNumber, y: BigNumber, err: string) {
    if(x.eq(y)) return;
    throw err;
}

// export function require(x: boolean, err: string) {
//     if(x) return;
//     throw err;
// }