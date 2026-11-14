import { Message } from "../../messages";

/** The new spending or tax cut runs from 1 to this many millions of dollars. */
const MAX_AMOUNT = 10000;

/** The largest MPC the plot draws: its multiplier, 1 ÷ 0.05 = 20, keeps the prediction on a readable axis. */
const MAX_MPC = 0.95;

/** The plot follows from 1 to this many rounds. */
const MAX_ROUNDS = 50;

/** The largest a running total can be, so every dollar amount on the plot stays readable. The prefixes check the same limit first, with friendlier messages. */
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
        throw new Error("showRounds expects the totals to be a list of numbers.");
    }
    return Array.from(input as Iterable<unknown>, (v, i) => toNumber(v, `showRounds: item ${i} of the totals is not a number.`));
}

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        /**
         * Draws each round's new spending stacked into the running total, with the multiplier's prediction as a dashed line.
         *
         * @param policy - "spending" for more government spending, or "taxCut" for a tax cut
         * @param amount - The new spending or the tax cut, in millions of dollars, from 1 to 10000
         * @param mpc    - The marginal propensity to consume, from 0 to 0.95
         * @param totals - The total change in real GDP after round 1, 2, 3, …: from 1 to 50 numbers, each from 0 to 1000000 and none less than the one before
         */
        showRounds: (policy: unknown, amount: unknown, mpc: unknown, totals: unknown) => {
            if (policy !== "spending" && policy !== "taxCut") {
                throw new Error(`showRounds: the policy should be "spending" or "taxCut", but it's ${JSON.stringify(policy)}.`);
            }
            const a = toNumber(amount, "showRounds: the amount should be a number.");
            if (a < 1 || a > MAX_AMOUNT) {
                throw new Error(`showRounds: the amount should be from 1 to ${MAX_AMOUNT} million dollars, but it's ${a}.`);
            }
            const m = toNumber(mpc, "showRounds: the MPC should be a number.");
            if (m < 0 || m > MAX_MPC) {
                throw new Error(`showRounds: the MPC should be from 0 to ${MAX_MPC}, but it's ${m}.`);
            }
            const list = toNumbers(totals);
            if (list.length < 1 || list.length > MAX_ROUNDS) {
                throw new Error(`showRounds needs a total for each of 1 to ${MAX_ROUNDS} rounds, but it got ${list.length}.`);
            }
            const outside = list.findIndex((v) => v < 0 || v > LIMIT);
            if (outside >= 0) {
                throw new Error(`showRounds: the total after round ${outside + 1} should be from 0 to ${LIMIT}, but it's ${list[outside]}.`);
            }
            // Each round's new spending is 0 or more, so a running total never goes down.
            const drop = list.findIndex((v, i) => i > 0 && v < list[i - 1]);
            if (drop >= 0) {
                throw new Error(`showRounds: the total after round ${drop + 1} is ${list[drop]}, less than the ${list[drop - 1]} after round ${drop}. Each round's new spending is 0 or more, so the totals should never go down.`);
            }
            sendMessage({ type: "showRounds", policy, amount: a, mpc: m, totals: list });
        },
    });
};

export default createExports;
