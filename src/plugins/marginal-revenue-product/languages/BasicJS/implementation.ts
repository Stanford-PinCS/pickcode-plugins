import { Message } from "../../messages";

/** The total product table runs from 0 workers up to at most this many. */
const MAX_WORKERS = 20;

/** The largest a total product, the price or the wage can be, so every dollar amount on the plot stays readable. The prefixes check the same limit first, with friendlier messages. */
const LIMIT = 1000000;

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
        throw new Error("showHiring expects totalProduct to be a list of numbers.");
    }
    return Array.from(input as Iterable<unknown>, (v, i) => toNumber(v, `showHiring: item ${i} of totalProduct is not a number.`));
}

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        /**
         * Draws each worker's marginal revenue product as a bar, the market wage as a line across them, and which workers the student's loop hired.
         *
         * @param totalProduct - Total product with 0, 1, 2, … workers: from 2 to 21 numbers, each from -1000000 to 1000000
         * @param price        - The output price, greater than 0 and at most 1000000
         * @param wage         - The market wage, greater than 0 and at most 1000000
         * @param hired        - How many workers the student's loop hired, a whole number from 0 to the last worker in the table
         */
        showHiring: (totalProduct: unknown, price: unknown, wage: unknown, hired: unknown) => {
            const table = toNumbers(totalProduct);
            if (table.length < 2 || table.length > MAX_WORKERS + 1) {
                throw new Error(`showHiring needs total product for 0 workers up to between 1 and ${MAX_WORKERS} workers (2 to ${MAX_WORKERS + 1} values), but it got ${table.length} values.`);
            }
            const tooBig = table.findIndex((v) => Math.abs(v) > LIMIT);
            if (tooBig >= 0) {
                throw new Error(`showHiring: item ${tooBig} of totalProduct should be from -${LIMIT} to ${LIMIT}, but it's ${table[tooBig]}.`);
            }
            const p = toNumber(price, "showHiring: the price should be a number.");
            if (p <= 0) {
                throw new Error(`showHiring: the price should be greater than 0, but it's ${p}.`);
            }
            if (p > LIMIT) {
                throw new Error(`showHiring: the price should be at most ${LIMIT}, but it's ${p}.`);
            }
            const w = toNumber(wage, "showHiring: the wage should be a number.");
            if (w <= 0) {
                throw new Error(`showHiring: the wage should be greater than 0, but it's ${w}.`);
            }
            if (w > LIMIT) {
                throw new Error(`showHiring: the wage should be at most ${LIMIT}, but it's ${w}.`);
            }
            const h = toNumber(hired, "showHiring: the number of workers hired should be a number.");
            if (!Number.isInteger(h) || h < 0 || h > table.length - 1) {
                throw new Error(`showHiring: the number of workers hired should be a whole number from 0 to ${table.length - 1}, but it's ${h}.`);
            }
            sendMessage({ type: "showHiring", totalProduct: table, price: p, wage: w, hired: h });
        },
    });
};

export default createExports;
