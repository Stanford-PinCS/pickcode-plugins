import { Message } from "../../messages";

const MAX_POLLSTERS = 500;

function toNumber(value: unknown, message: string): number {
    const n = Number(value);
    if (typeof value === "boolean" || value === null || value === undefined || !Number.isFinite(n)) {
        throw new Error(message);
    }
    return n;
}

/** Student code may hand us a list (or Python list proxy). */
function toList(input: unknown, message: string): unknown[] {
    if (input == null || typeof input === "string" || typeof (input as Iterable<unknown>)[Symbol.iterator] !== "function") {
        throw new Error(message);
    }
    return Array.from(input as Iterable<unknown>);
}

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        /**
         * Draws one confidence interval per pollster, stacked top to bottom, with a dashed line at the true proportion p.
         *
         * @param p         - The true proportion for the whole population, from 0 to 1
         * @param n         - The sample size each pollster used
         * @param zStar     - The critical value z* the intervals were built with
         * @param pHats     - Each pollster's sample proportion, from 0 to 1
         * @param intervals - Each pollster's interval as a list of two numbers, [lower, upper]
         */
        showIntervals: (p: unknown, n: unknown, zStar: unknown, pHats: unknown, intervals: unknown) => {
            const trueP = toNumber(p, "showIntervals: p should be a number.");
            if (trueP < 0 || trueP > 1) {
                throw new Error(`showIntervals: p is a proportion, so it should be from 0 to 1, but it is ${trueP}.`);
            }
            const size = toNumber(n, "showIntervals: n should be a number.");
            if (!Number.isInteger(size) || size < 1) {
                throw new Error(`showIntervals: n is a number of students, so it should be a whole number of at least 1, but it is ${size}.`);
            }
            const z = toNumber(zStar, "showIntervals: zStar should be a number.");
            const proportions = toList(pHats, "showIntervals expects the sample proportions to be a list of numbers.").map((v, i) => {
                const pHat = toNumber(v, `showIntervals: sample proportion ${i} is not a number.`);
                if (pHat < 0 || pHat > 1) {
                    throw new Error(`showIntervals: sample proportion ${i} should be from 0 to 1, but it is ${pHat}.`);
                }
                return pHat;
            });
            if (proportions.length < 1 || proportions.length > MAX_POLLSTERS) {
                throw new Error(`showIntervals needs from 1 to ${MAX_POLLSTERS} sample proportions, but it got ${proportions.length}.`);
            }
            const pairs = toList(intervals, "showIntervals expects the intervals to be a list of [lower, upper] lists.");
            if (pairs.length !== proportions.length) {
                throw new Error(`showIntervals got ${proportions.length} sample proportions but ${pairs.length} intervals. It needs one interval for each.`);
            }
            const lowers: number[] = [];
            const uppers: number[] = [];
            pairs.forEach((pair, i) => {
                const items = toList(pair, `showIntervals: interval ${i} should be a list of two numbers, [lower, upper].`);
                if (items.length !== 2) {
                    throw new Error(`showIntervals: interval ${i} should be a list of two numbers, [lower, upper], but it has ${items.length}.`);
                }
                const lower = toNumber(items[0], `showIntervals: the lower limit of interval ${i} is not a number.`);
                const upper = toNumber(items[1], `showIntervals: the upper limit of interval ${i} is not a number.`);
                if (lower > upper) {
                    throw new Error(`showIntervals: interval ${i} is [${lower}, ${upper}], but the lower limit should come first.`);
                }
                lowers.push(lower);
                uppers.push(upper);
            });
            sendMessage({ type: "showIntervals", p: trueP, n: size, zStar: z, pHats: proportions, lowers, uppers });
        },
    });
};

export default createExports;
