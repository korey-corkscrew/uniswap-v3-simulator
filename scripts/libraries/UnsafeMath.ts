import { BigNumber } from "ethers";
import { BN_ZERO } from "../constants";

export function divRoundingUp(x: BigNumber, y: BigNumber) {
    return x.div(y).add(x.mod(y).gt(0) ? 1 : 0);
}