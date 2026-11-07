import { action, observable } from "mobx";
import { Message } from "./messages";

/** Two numbers closer than this, relative to their size, count as the same, so rounding in the student's arithmetic doesn't make a right price wrong. */
const SAME = 1e-6;

export const sameNumber = (a: number, b: number) => Math.abs(a - b) <= SAME * Math.max(1, Math.abs(a), Math.abs(b));

/** A straight-line demand or supply curve in the foreign exchange market for the pell: at an exchange rate of `rate` quors per pell, the quantity is `atZero + slope × rate` millions of pells a day. Demand slopes down (a negative slope) and supply slopes up (a positive one). */
export interface Line {
    atZero: number;
    slope: number;
}

/** The quantity of pells on a line at an exchange rate. */
export const quantityAt = (line: Line, rate: number) => line.atZero + line.slope * rate;

/** The exchange rate where the quantity demanded equals the quantity supplied. */
export const equilibriumRate = (demand: Line, supply: Line) => (demand.atZero - supply.atZero) / (supply.slope - demand.slope);

/** Which way a number moved. */
export type Direction = "up" | "down" | "none";

export function direction(before: number, after: number): Direction {
    if (sameNumber(before, after)) return "none";
    return after > before ? "up" : "down";
}

/** Everything the graphs show for one run. Quantities are in millions of pells a day, exchange rates in quors per pell, prices in pells or quors. */
export interface Market {
    demand: Line;
    /** The demand for pells after the shift. The same as `demand` when nothing shifted. */
    demandAfter: Line;
    supply: Line;
    shift: number;
    shifted: boolean;
    rateBefore: number;
    rateAfter: number;
    quantityBefore: number;
    quantityAfter: number;
    /** At the old exchange rate, after the shift: the quantity of pells demanded minus the quantity supplied. More than 0 is a shortage and less than 0 a surplus. */
    gapAtOldRate: number;
    /** "up" when the exchange rate rose, so the pell appreciated, and "down" when it fell, so the pell depreciated. */
    rateMove: Direction;
    /** What happens to Pellia's net exports, as the CED states it: factors that cause a currency to appreciate cause net exports to decrease ("down"), and factors that cause it to depreciate cause them to increase ("up"). */
    netExports: Direction;
    /** What each export sells for in Pellia, in pells. */
    prices: number[];
    /** The student's price in quors for each export at the exchange rate before the shift, and after it. */
    pricesBefore: number[];
    pricesAfter: number[];
    /** price × exchange rate: the correct price in quors of each export, before the shift and after it. */
    correctBefore: number[];
    correctAfter: number[];
    /** For each export, whether every price in quors the graph shows for it is right: the one before the shift, and the one after it when the demand shifted. */
    right: boolean[];
    rightCount: number;
}

export function describeMarket(m: Message): Market {
    const demand: Line = { atZero: m.demandAtZero, slope: m.demandSlope };
    const demandAfter: Line = { atZero: m.demandAtZero + m.shift, slope: m.demandSlope };
    const supply: Line = { atZero: m.supplyAtZero, slope: m.supplySlope };
    const shifted = m.shift !== 0;
    const prices = [...m.prices];
    const correctBefore = prices.map((p) => p * m.rateBefore);
    const correctAfter = prices.map((p) => p * m.rateAfter);
    const right = prices.map((_, i) => sameNumber(m.pricesBefore[i], correctBefore[i]) && (!shifted || sameNumber(m.pricesAfter[i], correctAfter[i])));
    const rateMove = direction(m.rateBefore, m.rateAfter);
    return {
        demand,
        demandAfter,
        supply,
        shift: m.shift,
        shifted,
        rateBefore: m.rateBefore,
        rateAfter: m.rateAfter,
        quantityBefore: quantityAt(supply, m.rateBefore),
        quantityAfter: quantityAt(supply, m.rateAfter),
        gapAtOldRate: quantityAt(demandAfter, m.rateBefore) - quantityAt(supply, m.rateBefore),
        rateMove,
        netExports: rateMove === "up" ? "down" : rateMove === "down" ? "up" : "none",
        prices,
        pricesBefore: [...m.pricesBefore],
        pricesAfter: [...m.pricesAfter],
        correctBefore,
        correctAfter,
        right,
        rightCount: right.filter(Boolean).length,
    };
}

export class State {
    @observable accessor market: Market | null = null;

    public init = () => {
        this.market = null;
    };

    @action
    public onMessage = (m: Message) => {
        switch (m.type) {
            case "showExchangeMarket":
                this.market = describeMarket(m);
                break;
            default:
                assertNever(m.type);
        }
    };
}

/** Compile-time guarantee that the switch above handles every Message variant. */
function assertNever(x: never): never {
    throw new Error(`Unhandled message: ${JSON.stringify(x)}`);
}

export default State;
