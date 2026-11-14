import { Message } from "../../messages";

const MAX_VALUES = 500;

function toNumber(value: unknown, message: string): number {
    const n = Number(value);
    if (typeof value === "boolean" || value === null || value === undefined || !Number.isFinite(n)) {
        throw new Error(message);
    }
    return n;
}

/** Student code may hand us a list (or Python list proxy) of numbers. */
function toNumbers(input: unknown): number[] {
    if (input == null || typeof input === "string" || typeof (input as Iterable<unknown>)[Symbol.iterator] !== "function") {
        throw new Error("showBoxplot expects the data to be a list of numbers.");
    }
    return Array.from(input as Iterable<unknown>, (v, i) => toNumber(v, `showBoxplot: item ${i} of the data is not a number.`));
}

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        /**
         * Draws a dotplot of the data and a boxplot from the median and quartiles the student's code found.
         *
         * @param values - The data, from 4 to 500 numbers in any order
         * @param median - The median of all the values
         * @param q1     - The first quartile, the median of the lower half
         * @param q3     - The third quartile, the median of the upper half
         */
        showBoxplot: (values: unknown, median: unknown, q1: unknown, q3: unknown) => {
            const data = toNumbers(values);
            if (data.length < 4 || data.length > MAX_VALUES) {
                throw new Error(`showBoxplot needs from 4 to ${MAX_VALUES} values, but it got ${data.length}.`);
            }
            const m = toNumber(median, "showBoxplot: the median should be a number.");
            const lower = toNumber(q1, "showBoxplot: Q1 should be a number.");
            const upper = toNumber(q3, "showBoxplot: Q3 should be a number.");
            sendMessage({ type: "showBoxplot", values: [...data].sort((a, b) => a - b), median: m, q1: lower, q3: upper });
        },
    });
};

export default createExports;
