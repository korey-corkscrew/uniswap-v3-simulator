import { IUniswapV3Pool } from "../../typechain-types";
import { leastSignificantBit, mostSignificantBit } from "./BitMath";

export function position(tick: number) {
    let wordPos = (tick >> 8);
    let bitPos = tick % 256;
    return {
        wordPos: wordPos,
        bitPos: bitPos
    };
}


export async function nextInitializedTickWithinOneWord(
    pool: IUniswapV3Pool,
    tick: number,
    tickSpacing: number,
    lte: boolean
) {
    let next: number = 0;
    let initialized: boolean = false;
    let compressed = tick / tickSpacing;
    if(tick < 0 && tick % tickSpacing != 0) compressed--;
    if(lte) {
        let positionData = position(compressed);
        let wordPos = positionData.wordPos;
        let bitPos = positionData.bitPos;
        let mask = (1 << bitPos) - 1 + (1 << bitPos);
        let masked = (await pool.tickBitmap(wordPos)).and(mask);        // [ CALL ]
        initialized = !masked.eq(0);
        next = initialized
            ? (compressed - (bitPos - mostSignificantBit(masked))) * tickSpacing
            : (compressed - bitPos) * tickSpacing;
    } else {
        let positionData = position(compressed + 1);
        let wordPos = positionData.wordPos;
        let bitPos = positionData.bitPos;
        let mask = ~((1 << bitPos) - 1);
        let masked = (await pool.tickBitmap(wordPos)).and(mask);        // [ CALL ]
        initialized = !masked.eq(0);
        next = initialized
            ? (compressed + 1 + (leastSignificantBit(masked) - bitPos)) * tickSpacing
            : (compressed + 1 + (255 - bitPos)) * tickSpacing;
    }
    return {
        next: next, 
        initialized: initialized
    };
}