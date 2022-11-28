import { BigNumber, ethers } from "ethers";
import { BN_ZERO } from "../constants";

export function mulDiv(a: BigNumber, b: BigNumber, denominator: BigNumber) {
    let result = BN_ZERO;
    let prod0 = BN_ZERO;
    let prod1 = BN_ZERO;
    let mm = a.mul(b).mod(ethers.constants.MaxUint256);
    prod0 = a.mul(b);
    prod1 = mm.sub(prod0).sub(mm.lt(prod0) ? ethers.constants.MaxUint256 : 0);
    if(prod1.isZero()) return prod0.div(denominator);
    let remainder = a.mul(b).mod(denominator);
    prod1 = prod1.sub(remainder.gt(prod0) ? ethers.constants.MaxUint256 : 0);
    prod0 = prod0.sub(remainder);
    let twos = denominator.mul(-1).and(denominator);
    denominator = denominator.div(twos);
    prod0 = prod0.div(twos);
    twos = BN_ZERO.sub(twos).div(twos).add(1);
    prod0 = prod1.mul(twos).or(prod0);
    let inv = denominator.mul(3).xor(2);
    inv = inv.mul(BigNumber.from(2).sub(denominator).mul(inv));
    inv = inv.mul(BigNumber.from(2).sub(denominator).mul(inv));
    inv = inv.mul(BigNumber.from(2).sub(denominator).mul(inv));
    inv = inv.mul(BigNumber.from(2).sub(denominator).mul(inv));
    inv = inv.mul(BigNumber.from(2).sub(denominator).mul(inv));
    inv = inv.mul(BigNumber.from(2).sub(denominator).mul(inv));
    result = prod0.mul(inv);
    return result;
}

export function mulDivRoundingUp(a: BigNumber, b: BigNumber, denominator: BigNumber) {
    let result = mulDiv(a, b, denominator);
    if(a.mul(b).mod(denominator).gt(0)) {
        result = result.add(1);
    }
    return result;
}