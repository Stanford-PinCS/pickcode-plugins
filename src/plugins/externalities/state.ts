import { action, observable } from "mobx";
import { Message } from "./messages";

/** Two dollar amounts closer than this count as the same, so rounding in the student's arithmetic doesn't split one line into two. */
const SAME = 1e-6;

/** A sampled line's value at quantity `q`. Between two samples the line is straight; outside them it keeps the nearest end's value. */
export function valueAt(quantities: readonly number[], values: readonly number[], q: number): number {
    const last = quantities.length - 1;
    if (q <= quantities[0]) return values[0];
    if (q >= quantities[last]) return values[last];
    let i = 0;
    while (quantities[i + 1] < q) i++;
    const t = (q - quantities[i]) / (quantities[i + 1] - quantities[i]);
    return values[i] + (values[i + 1] - values[i]) * t;
}

/** `upper[i] − lower[i]` if that gap is the same at every sample, or null if it changes from one quantity to another. */
export function constantGap(upper: readonly number[], lower: readonly number[]): number | null {
    const gap = upper[0] - lower[0];
    return upper.every((v, i) => Math.abs(v - lower[i] - gap) < SAME) ? gap : null;
}

/** Whether two sampled lines are the same line. */
export function sameLine(a: readonly number[], b: readonly number[]): boolean {
    const gap = constantGap(a, b);
    return gap !== null && Math.abs(gap) < SAME;
}

/** A point on the graph: a quantity in tons a day and a price in dollars per ton. */
export interface Point {
    q: number;
    p: number;
}

/** Everything the graph shows for one run, in tons and dollars. The lines are sampled at `quantities`. */
export interface Market {
    quantities: number[];
    /** MPB at each quantity. It's also the MSB, since the waste is the only cost or benefit the market leaves out. */
    benefit: number[];
    privateCost: number[];
    /** The student's MSC at each quantity. */
    socialCost: number[];
    tax: number;
    /** MPC + tax at each quantity: what one more ton costs the mills once they pay the tax. */
    taxedCost: number[];
    marketQuantity: number;
    optimalQuantity: number;
    deadweightLoss: number;
    /** MPB at the market quantity: the price buyers pay. */
    marketPrice: number;
    /** MSB at the socially optimal quantity. */
    optimalPrice: number;
    /** Whether MPB really meets MPC + tax at the market quantity. It doesn't when even the first ton is worth less to buyers than it costs the mills, so the market makes nothing and there's no market price. */
    marketMeets: boolean;
    /** Whether MSB really meets the student's MSC at the socially optimal quantity. It doesn't when MSC is above MSB from the first ton on, so the socially optimal quantity is 0. */
    optimalMeets: boolean;
    /** MSC − MPC when it's the same at every quantity, or null when it changes. */
    externalGap: number | null;
    /** The student's MSC is the same line as MPC. */
    socialOnPrivate: boolean;
    /** There's a tax, and the student's MSC is the same line as MPC + tax. */
    socialOnTaxed: boolean;
    /** The deadweight loss region: along MSC from the smaller of the two quantities to the larger, then back along MSB. Empty when the two quantities are the same. */
    lossRegion: Point[];
}

/** The region between MSC and MSB from quantity `from` to quantity `to`, as a polygon: along MSC from left to right, then back along MSB. */
export function regionBetween(quantities: readonly number[], socialCost: readonly number[], benefit: readonly number[], from: number, to: number): Point[] {
    const low = Math.min(from, to);
    const high = Math.max(from, to);
    if (high - low < SAME) return [];
    const inside = quantities.filter((q) => q > low && q < high);
    const along = (values: readonly number[]) => [low, ...inside, high].map((q) => ({ q, p: valueAt(quantities, values, q) }));
    return [...along(socialCost), ...along(benefit).reverse()];
}

export function describeMarket(m: Message): Market {
    const quantities = [...m.quantities];
    const benefit = [...m.benefit];
    const privateCost = [...m.privateCost];
    const socialCost = [...m.socialCost];
    const taxedCost = privateCost.map((c) => c + m.tax);
    const at = (values: readonly number[], q: number) => valueAt(quantities, values, q);
    return {
        quantities,
        benefit,
        privateCost,
        socialCost,
        tax: m.tax,
        taxedCost,
        marketQuantity: m.marketQuantity,
        optimalQuantity: m.optimalQuantity,
        deadweightLoss: m.deadweightLoss,
        marketPrice: at(benefit, m.marketQuantity),
        optimalPrice: at(benefit, m.optimalQuantity),
        marketMeets: Math.abs(at(benefit, m.marketQuantity) - at(taxedCost, m.marketQuantity)) < SAME,
        optimalMeets: Math.abs(at(benefit, m.optimalQuantity) - at(socialCost, m.optimalQuantity)) < SAME,
        externalGap: constantGap(socialCost, privateCost),
        socialOnPrivate: sameLine(socialCost, privateCost),
        socialOnTaxed: m.tax !== 0 && sameLine(socialCost, taxedCost),
        lossRegion: regionBetween(quantities, socialCost, benefit, m.optimalQuantity, m.marketQuantity),
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
            case "showMarket":
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
