import { action, observable } from "mobx";
import { Message } from "./messages";

/** The standard normal cumulative distribution function Φ(z): the area under the standard normal curve to the left of z. Uses the Abramowitz and Stegun 7.1.26 approximation of erf, accurate to about 1e-7. */
export function normalCdf(z: number): number {
    const x = Math.abs(z) / Math.SQRT2;
    const t = 1 / (1 + 0.3275911 * x);
    const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
    const erf = 1 - poly * Math.exp(-x * x);
    return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

/** The confidence level C (from 0 to 1) that goes with the critical value z*: the area between −z* and z* under the standard normal curve, 2Φ(z*) − 1. */
export function confidenceLevel(zStar: number): number {
    return 2 * normalCdf(zStar) - 1;
}

/** Whether the interval from `lower` to `upper` captures the population proportion p. */
export function captures(lower: number, upper: number, p: number): boolean {
    return lower <= p && p <= upper;
}

/** One pollster's sample proportion and the interval the student's function built from it. */
export interface Poll {
    pHat: number;
    lower: number;
    upper: number;
    captured: boolean;
}

/** Everything the plot and the bottom row show for one run. */
export interface PollSummary {
    /** The true proportion for the whole school. */
    p: number;
    n: number;
    zStar: number;
    polls: Poll[];
    /** How many of the intervals capture p. */
    captured: number;
    /** The confidence level that goes with zStar, from 0 to 1. */
    confidence: number;
    /** The mean margin of error: half the width of each interval, averaged over the pollsters. */
    meanMargin: number;
    /** The mean of the pollsters' sample proportions. */
    meanPHat: number;
}

export function summarizePolls(p: number, n: number, zStar: number, pHats: readonly number[], lowers: readonly number[], uppers: readonly number[]): PollSummary {
    const polls = pHats.map((pHat, i) => ({ pHat, lower: lowers[i], upper: uppers[i], captured: captures(lowers[i], uppers[i], p) }));
    const mean = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;
    return {
        p,
        n,
        zStar,
        polls,
        captured: polls.filter((poll) => poll.captured).length,
        confidence: confidenceLevel(zStar),
        meanMargin: mean(polls.map((poll) => (poll.upper - poll.lower) / 2)),
        meanPHat: mean(polls.map((poll) => poll.pHat)),
    };
}

export class State {
    @observable accessor summary: PollSummary | null = null;

    public init = () => {
        this.summary = null;
    };

    @action
    public onMessage = (m: Message) => {
        switch (m.type) {
            case "showIntervals":
                this.summary = summarizePolls(m.p, m.n, m.zStar, m.pHats, m.lowers, m.uppers);
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
