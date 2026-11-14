import { Message, Range } from "../../messages";

const MIN_PRICES = 3;
const MAX_PRICES = 15;
/** Each price from $0.10 to $1,000,000 and each quantity from 1 to 1,000,000,000. In that range every axis gets round ticks that read as distinct labels (a step of at least $0.05 on the price and total revenue axes, and 0.5 on the quantity axis), short forms stay short (at most $1.5M, 1.5B and $1500T), and no total revenue passes 1e15. */
const LOWEST_PRICE = 0.1;
const HIGHEST_PRICE = 1e6;
const LOWEST_QUANTITY = 1;
const HIGHEST_QUANTITY = 1e9;
const RANGES: readonly Range[] = ["elastic", "unit elastic", "inelastic"];

function toNumber(value: unknown, message: string): number {
    const n = Number(value);
    if (typeof value === "boolean" || value === null || value === undefined || !Number.isFinite(n)) {
        throw new Error(message);
    }
    return n;
}

/** Student code may hand us a list (or Python list proxy). */
function toList(input: unknown, name: string): unknown[] {
    if (input == null || typeof input === "string" || typeof (input as Iterable<unknown>)[Symbol.iterator] !== "function") {
        throw new Error(`showDemand expects the ${name} to be a list.`);
    }
    return Array.from(input as Iterable<unknown>);
}

function toNumbers(input: unknown, name: string): number[] {
    return toList(input, name).map((v, i) => toNumber(v, `showDemand: item ${i} of the ${name} is not a number.`));
}

/** "Unit-Elastic " and "unit elastic" name the same range. */
function toRange(value: unknown, i: number): Range {
    const name = typeof value === "string" ? value.trim().toLowerCase().replace(/[\s-]+/g, " ") : "";
    const range = RANGES.find((r) => r === name);
    if (!range) {
        throw new Error(`showDemand: range ${i} should be "elastic", "inelastic" or "unit elastic", but it's ${JSON.stringify(value) ?? String(value)}.`);
    }
    return range;
}

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        /**
         * Draws the demand curve with each stretch (the price increase from one price to the next) colored by its range and labeled with its elasticity, and the total revenue at each price below it.
         *
         * @param prices       - The schedule's prices, from 3 to 15 numbers from 0.1 to 1e6 (dollars), from lowest to highest
         * @param quantities   - The quantity demanded at each price, each a number from 1 to 1e9 and lower than the one before it
         * @param elasticities - What the student's elasticity function returned for each stretch, one fewer than the prices
         * @param ranges       - What the student's describe function returned for each stretch: "elastic", "inelastic" or "unit elastic"
         * @param raises       - The prices whose increase to the next price the student wants to test (any but the highest)
         */
        showDemand: (prices: unknown, quantities: unknown, elasticities: unknown, ranges: unknown, raises: unknown) => {
            const p = toNumbers(prices, "prices");
            const q = toNumbers(quantities, "quantities");
            if (p.length !== q.length) {
                throw new Error(`showDemand needs one quantity for each price, but it got ${p.length} prices and ${q.length} quantities.`);
            }
            if (p.length < MIN_PRICES || p.length > MAX_PRICES) {
                throw new Error(`showDemand needs from ${MIN_PRICES} to ${MAX_PRICES} prices, but it got ${p.length}.`);
            }
            const badPrice = p.find((v) => !(v >= LOWEST_PRICE && v <= HIGHEST_PRICE));
            if (badPrice !== undefined) {
                throw new Error(`showDemand needs every price to be from $0.10 to $1,000,000, but one of them is ${badPrice}.`);
            }
            const badQuantity = q.find((v) => !(v >= LOWEST_QUANTITY && v <= HIGHEST_QUANTITY));
            if (badQuantity !== undefined) {
                throw new Error(`showDemand needs every quantity to be from 1 to 1,000,000,000, but one of them is ${badQuantity}.`);
            }
            if (p.some((v, i) => i > 0 && v <= p[i - 1])) {
                throw new Error("showDemand needs the prices in order from lowest to highest, each one higher than the last.");
            }
            if (q.some((v, i) => i > 0 && v >= q[i - 1])) {
                throw new Error("showDemand needs each quantity to be lower than the one before it: by the law of demand, the quantity demanded falls as the price rises.");
            }
            const e = toNumbers(elasticities, "elasticities");
            const r = toList(ranges, "ranges").map(toRange);
            if (e.length !== p.length - 1 || r.length !== p.length - 1) {
                throw new Error(`showDemand needs one elasticity and one range for each of the ${p.length - 1} price increases, but it got ${e.length} and ${r.length}.`);
            }
            const tested = toNumbers(raises, "raises").map((price) => {
                const i = p.indexOf(price);
                if (i < 0 || i === p.length - 1) {
                    throw new Error(`showDemand: each price in raises should be one of the prices except the highest, but ${price} isn't.`);
                }
                return i;
            });
            sendMessage({ type: "showDemand", prices: p, quantities: q, elasticities: e, ranges: r, raises: [...new Set(tested)] });
        },
    });
};

export default createExports;
