import { Message } from "../../messages";

const MAX_TRIALS = 100;
const MAX_SESSIONS = 100000;

function toNumber(value: unknown, message: string): number {
    const n = Number(value);
    if (typeof value === "boolean" || value === null || value === undefined || !Number.isFinite(n)) {
        throw new Error(message);
    }
    return n;
}

/** Student code may hand us a list (or Python list proxy). */
function toList(input: unknown, what: string): unknown[] {
    if (input == null || typeof input === "string" || typeof (input as Iterable<unknown>)[Symbol.iterator] !== "function") {
        throw new Error(`showBinomial expects ${what} to be a list of numbers.`);
    }
    return Array.from(input as Iterable<unknown>);
}

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        /**
         * Draws the probability distribution the student's code found as bars, with the relative frequencies from a simulation as dashed marks.
         *
         * @param n             - The number of trials, a whole number from 1 to 100
         * @param p             - The probability of success on each trial, from 0 to 1
         * @param probabilities - P(X = k) for k = 0, 1, …, n, as the student's code found them
         * @param outcomes      - The number of successes in each simulated session of n trials
         */
        showBinomial: (n: unknown, p: unknown, probabilities: unknown, outcomes: unknown) => {
            const trials = toNumber(n, "showBinomial: n should be a number.");
            if (!Number.isInteger(trials) || trials < 1 || trials > MAX_TRIALS) {
                throw new Error(`showBinomial: n should be a whole number from 1 to ${MAX_TRIALS}, but it is ${trials}.`);
            }
            const success = toNumber(p, "showBinomial: p should be a number.");
            if (success < 0 || success > 1) {
                throw new Error(`showBinomial: p is a probability, so it should be from 0 to 1, but it is ${success}.`);
            }
            const probs = toList(probabilities, "the probabilities").map((v, k) => toNumber(v, `showBinomial: P(X = ${k}) is not a number.`));
            if (probs.length !== trials + 1) {
                throw new Error(`showBinomial needs ${trials + 1} probabilities, one for each k from 0 to ${trials}, but it got ${probs.length}.`);
            }
            const sessions = toList(outcomes, "the simulated sessions").map((v, i) => {
                const made = toNumber(v, `showBinomial: simulated session ${i} is not a number.`);
                if (!Number.isInteger(made) || made < 0 || made > trials) {
                    throw new Error(`showBinomial: simulated session ${i} has ${made} successes, but it should be a whole number from 0 to ${trials}.`);
                }
                return made;
            });
            if (sessions.length < 1 || sessions.length > MAX_SESSIONS) {
                throw new Error(`showBinomial needs from 1 to ${MAX_SESSIONS} simulated sessions, but it got ${sessions.length}.`);
            }
            sendMessage({ type: "showBinomial", n: trials, p: success, probabilities: probs, outcomes: sessions });
        },
    });
};

export default createExports;
