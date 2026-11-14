import { Message } from "../../messages";

/** The table can run from 0 up to this many units of output. */
const MAX_UNITS = 20;

function toNumber(value: unknown, message: string): number {
    const n = Number(value);
    if (typeof value === "boolean" || value === null || value === undefined || !Number.isFinite(n)) {
        throw new Error(message);
    }
    return n;
}

/** Student code may hand us a list (or Python list proxy) of numbers. */
function toNumbers(input: unknown, what: string): number[] {
    if (input == null || typeof input === "string" || typeof (input as Iterable<unknown>)[Symbol.iterator] !== "function") {
        throw new Error(`showFarm expects ${what} to be a list of numbers.`);
    }
    return Array.from(input as Iterable<unknown>, (v, i) => toNumber(v, `showFarm: item ${i} of ${what} is not a number.`));
}

function toWhole(value: unknown, message: string): number {
    const n = toNumber(value, message);
    if (!Number.isInteger(n)) {
        throw new Error(message);
    }
    return n;
}

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        /**
         * Draws the farm's cost curves, the price line, the output it produces and its profit or loss.
         *
         * @param totalCosts    - Total cost of producing 0, 1, 2, … units; the first is the fixed cost
         * @param price         - The market price of one unit, 0 or more
         * @param marginalCosts - The marginal cost of each unit from the 1st, as the student's code found them
         * @param chosen        - The output the student's code chose, a whole number from 0 to the last unit
         * @param output        - What the firm produces after the shutdown rule: 0 when total revenue at `chosen` is less than total variable cost, `chosen` otherwise
         */
        showFarm: (totalCosts: unknown, price: unknown, marginalCosts: unknown, chosen: unknown, output: unknown) => {
            const costs = toNumbers(totalCosts, "the total costs");
            if (costs.length < 2 || costs.length > MAX_UNITS + 1) {
                throw new Error(`showFarm needs from 2 to ${MAX_UNITS + 1} total costs (outputs 0 to ${MAX_UNITS}), but it got ${costs.length}.`);
            }
            if (costs.some((c) => c < 0)) {
                throw new Error("showFarm: every total cost should be 0 or more.");
            }
            const units = costs.length - 1;
            const p = toNumber(price, "showFarm: the price should be a number.");
            if (p < 0) {
                throw new Error("showFarm: the price should be 0 or more.");
            }
            const mc = toNumbers(marginalCosts, "the marginal costs");
            if (mc.length !== units) {
                throw new Error(`showFarm needs ${units} marginal costs, one for each unit, but it got ${mc.length}.`);
            }
            const q = toWhole(chosen, `showFarm: the chosen output should be a whole number from 0 to ${units}.`);
            const produced = toWhole(output, `showFarm: the output should be a whole number from 0 to ${units}.`);
            if (q < 0 || q > units) {
                throw new Error(`showFarm: the chosen output should be a whole number from 0 to ${units}, but it is ${q}.`);
            }
            // The short-run shutdown rule (CED PRD-2.A.1), the same comparison the hidden helper makes, so the plot never labels a shutdown the numbers don't support.
            const shutsDown = q > 0 && p * q < costs[q] - costs[0];
            const expected = shutsDown ? 0 : q;
            if (produced !== expected) {
                throw new Error(`showFarm: the output should be ${expected}. A firm shuts down, producing 0, when total revenue at the chosen output is less than total variable cost, and produces the chosen output otherwise.`);
            }
            sendMessage({ type: "showFarm", totalCosts: costs, price: p, marginalCosts: mc, chosen: q, output: produced });
        },
    });
};

export default createExports;
