import { BigNumber } from "ethers";
import { BN_ZERO } from "../constants";

export function addDelta(x: BigNumber, y: BigNumber) {
    let z = BN_ZERO;
    if(y.lt(0)) {
        z = x.sub(y.mul(-1));
        if(!z.lt(x)) throw "LS";
    } else {
        z = x.add(y);
        if(!z.gte(x)) throw "LA";
    }
    return z;
}