import { action, observable } from "mobx";
import { Message } from "./messages";

/** The median of a list sorted from smallest to largest: its middle value, or the mean of the two middle values when the count is even. */
export function medianOfSorted(sorted: readonly number[]): number {
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

/** The lower and upper halves of a sorted list. With an odd count the middle value belongs to neither half, the way AP Statistics finds Q1 and Q3. */
export function halvesOfSorted(sorted: readonly number[]): { lower: number[]; upper: number[] } {
    const half = Math.floor(sorted.length / 2);
    return { lower: sorted.slice(0, half), upper: sorted.slice(sorted.length - half) };
}

/** Everything the plot shows for one run. The box, fences, whiskers and outliers come from the student's median and quartiles; `exact` holds the correct ones for the dashed marks. */
export interface Summary {
    /** The data, sorted from smallest to largest. */
    values: number[];
    median: number;
    q1: number;
    q3: number;
    iqr: number;
    /** Values below `lowFence` (Q1 − 1.5 × IQR) or above `highFence` (Q3 + 1.5 × IQR) are outliers. */
    lowFence: number;
    highFence: number;
    outliers: number[];
    /** The whiskers reach the most extreme values that aren't outliers. */
    whiskerLow: number;
    whiskerHigh: number;
    mean: number;
    exact: { median: number; q1: number; q3: number };
}

export function summarize(values: readonly number[], median: number, q1: number, q3: number): Summary {
    const sorted = [...values].sort((a, b) => a - b);
    const iqr = q3 - q1;
    const lowFence = q1 - 1.5 * iqr;
    const highFence = q3 + 1.5 * iqr;
    const inside = sorted.filter((v) => v >= lowFence && v <= highFence);
    const { lower, upper } = halvesOfSorted(sorted);
    return {
        values: sorted,
        median,
        q1,
        q3,
        iqr,
        lowFence,
        highFence,
        outliers: sorted.filter((v) => v < lowFence || v > highFence),
        whiskerLow: inside.length > 0 ? inside[0] : sorted[0],
        whiskerHigh: inside.length > 0 ? inside[inside.length - 1] : sorted[sorted.length - 1],
        mean: sorted.reduce((sum, v) => sum + v, 0) / sorted.length,
        exact: { median: medianOfSorted(sorted), q1: medianOfSorted(lower), q3: medianOfSorted(upper) },
    };
}

export class State {
    @observable accessor summary: Summary | null = null;

    public init = () => {
        this.summary = null;
    };

    @action
    public onMessage = (m: Message) => {
        switch (m.type) {
            case "showBoxplot":
                this.summary = summarize(m.values, m.median, m.q1, m.q3);
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
