import { Alternative, Message } from "../../messages";

const MAX_VALUES = 500;
const MAX_SAMPLES = 5000;

function toNumber(value: unknown, message: string): number {
    const n = Number(value);
    if (typeof value === "boolean" || value === null || value === undefined || !Number.isFinite(n)) {
        throw new Error(message);
    }
    return n;
}

/** Student code may hand us a list (or Python list proxy) of numbers. */
function toNumbers(input: unknown, helper: string, name: string): number[] {
    if (input == null || typeof input === "string" || typeof (input as Iterable<unknown>)[Symbol.iterator] !== "function") {
        throw new Error(`${helper} expects ${name} to be a list of numbers.`);
    }
    return Array.from(input as Iterable<unknown>, (v, i) => toNumber(v, `${helper}: item ${i} of ${name} is not a number.`));
}

function toAlternative(value: unknown, helper: string): Alternative {
    if (value !== "!=" && value !== "<" && value !== ">") {
        throw new Error(`${helper}: the alternative hypothesis should be "!=", "<" or ">".`);
    }
    return value;
}

/** Degrees of freedom are n − 1 for a one-sample t-test. */
function toDf(value: unknown, n: number, helper: string): number {
    const df = toNumber(value, `${helper}: df should be a number.`);
    if (df !== n - 1) {
        throw new Error(`${helper}: df should be n − 1 = ${n - 1}, but it got ${df}.`);
    }
    return df;
}

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        /**
         * Draws a one-sample t-test: a dotplot of the sample with μ0 and x̄, and the t-distribution with df = n − 1 with the observed t and the p-value shaded.
         *
         * @param values      - The sample, from 2 to 500 numbers
         * @param mu0         - μ0, the population mean in the null hypothesis H0: μ = μ0
         * @param xBar        - The sample mean, x̄
         * @param s           - The sample standard deviation, s (more than 0)
         * @param t           - The test statistic, t = (x̄ − μ0) / (s / √n)
         * @param df          - Degrees of freedom, n − 1
         * @param alternative - "!=" for Ha: μ ≠ μ0, "<" for Ha: μ < μ0, ">" for Ha: μ > μ0
         */
        showTest: (values: unknown, mu0: unknown, xBar: unknown, s: unknown, t: unknown, df: unknown, alternative: unknown) => {
            const data = toNumbers(values, "showTest", "the sample");
            if (data.length < 2 || data.length > MAX_VALUES) {
                throw new Error(`showTest needs from 2 to ${MAX_VALUES} values, but it got ${data.length}.`);
            }
            const sd = toNumber(s, "showTest: s should be a number.");
            if (sd <= 0) {
                throw new Error("showTest: s should be more than 0.");
            }
            sendMessage({
                type: "showTest",
                values: data,
                mu0: toNumber(mu0, "showTest: μ0 should be a number, like 500."),
                xBar: toNumber(xBar, "showTest: x̄ should be a number."),
                s: sd,
                t: toNumber(t, "showTest: t should be a number."),
                df: toDf(df, data.length, "showTest"),
                alternative: toAlternative(alternative, "showTest"),
            });
        },

        /**
         * Draws many samples taken from a population where H0 is true: a histogram of their sample means and a histogram of their test statistics over the t-distribution with df = n − 1, counting the ones whose p-value is at most α = 0.05.
         *
         * @param mu0         - μ0, the population mean in H0 (and the true mean of the population sampled)
         * @param n           - The size of each sample, from 2 to 500
         * @param df          - Degrees of freedom, n − 1
         * @param alternative - "!=", "<" or ">", as in showTest
         * @param means       - Each sample's x̄
         * @param tValues     - Each sample's test statistic, t, in the same order as means
         */
        showSimulation: (mu0: unknown, n: unknown, df: unknown, alternative: unknown, means: unknown, tValues: unknown) => {
            const size = toNumber(n, "showSimulation: n should be a number.");
            if (!Number.isInteger(size) || size < 2 || size > MAX_VALUES) {
                throw new Error(`showSimulation: n should be a whole number from 2 to ${MAX_VALUES}.`);
            }
            const xBars = toNumbers(means, "showSimulation", "the sample means");
            const ts = toNumbers(tValues, "showSimulation", "the test statistics");
            if (xBars.length < 1 || xBars.length > MAX_SAMPLES || xBars.length !== ts.length) {
                throw new Error(`showSimulation needs from 1 to ${MAX_SAMPLES} samples, with one sample mean and one test statistic for each.`);
            }
            sendMessage({
                type: "showSimulation",
                mu0: toNumber(mu0, "showSimulation: μ0 should be a number, like 500."),
                n: size,
                df: toDf(df, size, "showSimulation"),
                alternative: toAlternative(alternative, "showSimulation"),
                means: xBars,
                tValues: ts,
            });
        },
    });
};

export default createExports;
