import { action, observable } from "mobx";
import { Message } from "./messages";

/** The mean of a binomial random variable, μ_X = np. */
export function binomialMean(n: number, p: number): number {
    return n * p;
}

/** The standard deviation of a binomial random variable, σ_X = √(np(1 − p)). */
export function binomialSd(n: number, p: number): number {
    return Math.sqrt(n * p * (1 - p));
}

/** The mean of a discrete random variable whose values are 0, 1, 2, … with these probabilities: μ_X = Σ x·P(x). */
export function meanOf(probabilities: readonly number[]): number {
    return probabilities.reduce((sum, prob, x) => sum + x * prob, 0);
}

/** The standard deviation of the same random variable: σ_X = √(Σ (x − μ_X)²·P(x)). NaN when negative probabilities make the sum under the root negative. */
export function sdOf(probabilities: readonly number[], mean: number): number {
    const variance = probabilities.reduce((sum, prob, x) => sum + (x - mean) ** 2 * prob, 0);
    return variance >= 0 ? Math.sqrt(variance) : NaN;
}

/** The relative frequency of each number of successes 0, 1, …, n among the first `sessions` simulated sessions. */
export function relativeFrequencies(outcomes: readonly number[], n: number, sessions = outcomes.length): number[] {
    const counts = new Array<number>(n + 1).fill(0);
    for (let i = 0; i < sessions; i++) counts[outcomes[i]]++;
    return counts.map((c) => (sessions > 0 ? c / sessions : 0));
}

/** The relative frequency of each number of successes after the first `sessions` simulated sessions. */
export interface Snapshot {
    sessions: number;
    relativeFrequencies: number[];
}

/** Snapshots after more and more of the sessions, for the animation. The session counts grow slowly at first, where each new session moves the marks the most, and reach every session at the last snapshot. */
export function snapshotsOf(outcomes: readonly number[], n: number, count = 50): Snapshot[] {
    const snapshots: Snapshot[] = [];
    const counts = new Array<number>(n + 1).fill(0);
    let done = 0;
    for (let j = 1; j <= count; j++) {
        const target = Math.max(1, Math.round(outcomes.length * (j / count) ** 2.5));
        if (target <= done) continue;
        for (; done < target; done++) counts[outcomes[done]]++;
        snapshots.push({ sessions: done, relativeFrequencies: counts.map((c) => c / done) });
    }
    return snapshots;
}

/** Everything the chart shows for one run. The bars, their sum, mean and SD come from the student's probabilities; `binomialMean` and `binomialSd` come from the CED's formulas np and √(np(1 − p)); the simulation gives the dashed marks. */
export interface Distribution {
    n: number;
    p: number;
    /** probabilities[k] is the student's P(X = k). */
    probabilities: number[];
    /** The sum of the student's probabilities, which is 1 for a probability distribution. */
    total: number;
    /** The whole number nearest np, whose bar the stat row reports. */
    centerK: number;
    /** μ_X and σ_X worked out from the student's probabilities. */
    mean: number;
    sd: number;
    binomialMean: number;
    binomialSd: number;
    /** How many sessions of n trials were simulated. */
    sessions: number;
    /** The relative frequency of each number of successes over all the sessions. */
    simulated: number[];
    snapshots: Snapshot[];
}

export function describe(n: number, p: number, probabilities: readonly number[], outcomes: readonly number[]): Distribution {
    const mean = meanOf(probabilities);
    const muX = binomialMean(n, p);
    return {
        n,
        p,
        probabilities: [...probabilities],
        total: probabilities.reduce((sum, prob) => sum + prob, 0),
        centerK: Math.min(n, Math.max(0, Math.round(muX))),
        mean,
        sd: sdOf(probabilities, mean),
        binomialMean: muX,
        binomialSd: binomialSd(n, p),
        sessions: outcomes.length,
        simulated: relativeFrequencies(outcomes, n),
        snapshots: snapshotsOf(outcomes, n),
    };
}

export class State {
    @observable accessor distribution: Distribution | null = null;

    public init = () => {
        this.distribution = null;
    };

    @action
    public onMessage = (m: Message) => {
        switch (m.type) {
            case "showBinomial":
                this.distribution = describe(m.n, m.p, m.probabilities, m.outcomes);
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
