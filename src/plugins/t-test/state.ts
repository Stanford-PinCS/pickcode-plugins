import { action, observable } from "mobx";
import { Alternative, Message } from "./messages";

/** The significance level every test in this plugin uses. */
export const ALPHA = 0.05;

// ---------------------------------------------------------------------------
// The t-distribution
// ---------------------------------------------------------------------------

const LANCZOS = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];

/** ln Γ(x) for x > 0, by the Lanczos approximation (about 15 correct digits). */
export function lnGamma(x: number): number {
    if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lnGamma(1 - x);
    const z = x - 1;
    let sum = LANCZOS[0];
    for (let i = 1; i < LANCZOS.length; i++) sum += LANCZOS[i] / (z + i);
    const t = z + 7.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(sum);
}

/** The continued fraction for the incomplete beta function, evaluated with the modified Lentz method. */
function betaContinuedFraction(a: number, b: number, x: number): number {
    const TINY = 1e-300;
    let c = 1;
    let d = 1 - ((a + b) * x) / (a + 1);
    if (Math.abs(d) < TINY) d = TINY;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= 300; m++) {
        const m2 = 2 * m;
        let aa = (m * (b - m) * x) / ((a + m2 - 1) * (a + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < TINY) d = TINY;
        c = 1 + aa / c;
        if (Math.abs(c) < TINY) c = TINY;
        d = 1 / d;
        h *= d * c;
        aa = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1));
        d = 1 + aa * d;
        if (Math.abs(d) < TINY) d = TINY;
        c = 1 + aa / c;
        if (Math.abs(c) < TINY) c = TINY;
        d = 1 / d;
        const step = d * c;
        h *= step;
        if (Math.abs(step - 1) < 1e-15) break;
    }
    return h;
}

/** The regularized incomplete beta function I_x(a, b), for 0 ≤ x ≤ 1. */
export function incompleteBeta(x: number, a: number, b: number): number {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const front = Math.exp(lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    // The continued fraction converges fast only below this point; above it, use I_x(a, b) = 1 − I_(1−x)(b, a).
    return x < (a + 1) / (a + b + 2) ? (front * betaContinuedFraction(a, b, x)) / a : 1 - (front * betaContinuedFraction(b, a, 1 - x)) / b;
}

/** P(T ≥ |t|) for a t-distribution with `df` degrees of freedom: the area in one tail beyond |t|. */
export function tTail(t: number, df: number): number {
    return 0.5 * incompleteBeta(df / (df + t * t), df / 2, 0.5);
}

/** P(T ≤ t) for a t-distribution with `df` degrees of freedom. */
export function tCdf(t: number, df: number): number {
    return t < 0 ? tTail(t, df) : 1 - tTail(t, df);
}

/** The height of the t-distribution's density curve with `df` degrees of freedom at t. */
export function tDensity(t: number, df: number): number {
    const logScale = lnGamma((df + 1) / 2) - lnGamma(df / 2) - 0.5 * Math.log(df * Math.PI);
    return Math.exp(logScale - ((df + 1) / 2) * Math.log(1 + (t * t) / df));
}

/**
 * The p-value of a one-sample t-test: the probability, when H0 is true, of a test statistic as extreme as t or more extreme, in the direction of the alternative hypothesis.
 *
 * "<" is Ha: μ < μ0 (the area at or below t), ">" is Ha: μ > μ0 (at or above t), and "!=" is Ha: μ ≠ μ0 (at or below −|t| plus at or above |t|).
 */
export function pValue(t: number, df: number, alternative: Alternative): number {
    if (alternative === "<") return tCdf(t, df);
    if (alternative === ">") return t > 0 ? tTail(t, df) : 1 - tTail(t, df);
    return Math.min(1, 2 * tTail(t, df));
}

/** The test statistic where the p-value equals α: H0 is rejected for any t at or beyond it, in the direction of Ha. For "!=" it's the positive one, and −cutoff is the other. */
export function rejectionCutoff(df: number, alternative: Alternative, alpha = ALPHA): number {
    const tailArea = alternative === "!=" ? alpha / 2 : alpha;
    // tTail falls from 0.5 at t = 0 toward 0 as t grows, so bisect for the t whose tail area is tailArea.
    let low = 0;
    let high = 1;
    while (tTail(high, df) > tailArea) high *= 2;
    for (let i = 0; i < 100; i++) {
        const mid = (low + high) / 2;
        if (tTail(mid, df) > tailArea) low = mid;
        else high = mid;
    }
    const cutoff = (low + high) / 2;
    return alternative === "<" ? -cutoff : cutoff;
}

// ---------------------------------------------------------------------------
// What the plot shows
// ---------------------------------------------------------------------------

/** One test of the inspector's sample. `s` and `t` come from the student's functions; the p-value comes from the t-distribution with df = n − 1. */
export interface TestResult {
    kind: "test";
    /** The sample, sorted from smallest to largest. */
    values: number[];
    mu0: number;
    xBar: number;
    s: number;
    t: number;
    df: number;
    alternative: Alternative;
    pValue: number;
    /** p-value ≤ α. */
    reject: boolean;
}

/** Many samples drawn from a population where H0 is true, each tested at α. Every rejection is a Type I error. */
export interface SimulationResult {
    kind: "simulation";
    mu0: number;
    n: number;
    df: number;
    alternative: Alternative;
    /** Each sample's mean, x̄, in the order the samples were drawn. */
    means: number[];
    /** Each sample's test statistic, from the student's tStatistic. */
    tValues: number[];
    /** Whether each sample's p-value was ≤ α. */
    rejected: boolean[];
    rejections: number;
    /** Where the rejection region starts (see rejectionCutoff). */
    cutoff: number;
    /** The mean and standard deviation of the sample means. */
    meanOfMeans: number;
    sdOfMeans: number;
}

export type Result = TestResult | SimulationResult;

export function analyzeTest(values: readonly number[], mu0: number, xBar: number, s: number, t: number, df: number, alternative: Alternative): TestResult {
    const p = pValue(t, df, alternative);
    return { kind: "test", values: [...values].sort((a, b) => a - b), mu0, xBar, s, t, df, alternative, pValue: p, reject: p <= ALPHA };
}

export function analyzeSimulation(mu0: number, n: number, df: number, alternative: Alternative, means: readonly number[], tValues: readonly number[]): SimulationResult {
    const rejected = tValues.map((t) => pValue(t, df, alternative) <= ALPHA);
    const meanOfMeans = means.reduce((sum, m) => sum + m, 0) / means.length;
    const sdOfMeans = Math.sqrt(means.reduce((sum, m) => sum + (m - meanOfMeans) ** 2, 0) / Math.max(means.length - 1, 1));
    return {
        kind: "simulation",
        mu0,
        n,
        df,
        alternative,
        means: [...means],
        tValues: [...tValues],
        rejected,
        rejections: rejected.filter(Boolean).length,
        cutoff: rejectionCutoff(df, alternative),
        meanOfMeans,
        sdOfMeans,
    };
}

export class State {
    @observable accessor result: Result | null = null;

    public init = () => {
        this.result = null;
    };

    @action
    public onMessage = (m: Message) => {
        switch (m.type) {
            case "showTest":
                this.result = analyzeTest(m.values, m.mu0, m.xBar, m.s, m.t, m.df, m.alternative);
                break;
            case "showSimulation":
                this.result = analyzeSimulation(m.mu0, m.n, m.df, m.alternative, m.means, m.tValues);
                break;
            default:
                assertNever(m);
        }
    };
}

/** Compile-time guarantee that the switch above handles every Message variant. */
function assertNever(x: never): never {
    throw new Error(`Unhandled message: ${JSON.stringify(x)}`);
}

export default State;
