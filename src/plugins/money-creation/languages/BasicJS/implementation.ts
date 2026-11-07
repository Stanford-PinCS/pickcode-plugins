import { Message } from "../../messages";

/** The new deposit runs from $10 to $1,000,000 and the required reserve ratio from 0.05 to 1, so every chain fits on the plot. The prefixes check the same limits first, with friendlier messages. */
const MIN_DEPOSIT = 10;
const MAX_DEPOSIT = 1000000;
const MIN_RATIO = 0.05;

/** The most banks the plot draws. With the inputs above, a loop that stops once the deposit is $1 or less goes through at most 270 banks. */
const MAX_BANKS = 300;

/** Two dollar amounts that differ only by floating-point rounding count as equal. */
const close = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

function toNumber(value: unknown, message: string): number {
    const n = Number(value);
    if (typeof value === "boolean" || value === null || value === undefined || !Number.isFinite(n)) {
        throw new Error(message);
    }
    return n;
}

/** Student code may hand us a list (or Python list proxy) of numbers. */
function toNumbers(input: unknown, name: string): number[] {
    if (input == null || typeof input === "string" || typeof (input as Iterable<unknown>)[Symbol.iterator] !== "function") {
        throw new Error(`showChain expects ${name} to be a list of numbers.`);
    }
    return Array.from(input as Iterable<unknown>, (v, i) => toNumber(v, `showChain: item ${i} of ${name} is not a number.`));
}

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        /**
         * Draws a chain of banks: each bank's new deposit split into its required reserves, excess reserves and loan, the new money the loans add up to, and the most new money the simple money multiplier predicts.
         *
         * @param reserveRatio - The required reserve ratio, from 0.05 to 1
         * @param deposits     - Each bank's new deposit, from 1 to 300 of them. The first is the new deposit, from 10 to 1000000, and each later one is the loan the bank before it made
         * @param loans        - What each bank lent, from 0 up to its excess reserves, the deposit minus the required reserves
         */
        showChain: (reserveRatio: unknown, deposits: unknown, loans: unknown) => {
            const ratio = toNumber(reserveRatio, "showChain: the required reserve ratio should be a number.");
            if (ratio < MIN_RATIO || ratio > 1) {
                throw new Error(`showChain: the required reserve ratio should be from ${MIN_RATIO} to 1, but it's ${ratio}.`);
            }
            const ds = toNumbers(deposits, "deposits");
            const ls = toNumbers(loans, "loans");
            if (ds.length < 1 || ds.length > MAX_BANKS) {
                throw new Error(`showChain needs from 1 to ${MAX_BANKS} banks, but it got ${ds.length}.`);
            }
            if (ls.length !== ds.length) {
                throw new Error(`showChain needs one loan for each bank: ${ds.length} deposits but ${ls.length} loans.`);
            }
            if (ds[0] < MIN_DEPOSIT || ds[0] > MAX_DEPOSIT) {
                throw new Error(`showChain: the new deposit should be from ${MIN_DEPOSIT} to ${MAX_DEPOSIT}, but it's ${ds[0]}.`);
            }
            ds.forEach((deposit, i) => {
                const bank = i + 1;
                if (i > 0 && !close(deposit, ls[i - 1])) {
                    throw new Error(`showChain: Bank ${bank}'s deposit should be Bank ${i}'s loan, ${ls[i - 1]}, but it's ${deposit}.`);
                }
                const excess = deposit - deposit * ratio;
                // A loan may miss 0 or the excess reserves by floating-point rounding (a billionth of the deposit), as the prefixes allow.
                const tolerance = 1e-9 * Math.max(1, deposit);
                if (ls[i] < -tolerance || ls[i] > excess + tolerance) {
                    throw new Error(`showChain: Bank ${bank}'s loan should be from 0 to its excess reserves, ${excess}, but it's ${ls[i]}.`);
                }
            });
            sendMessage({ type: "showChain", reserveRatio: ratio, deposits: ds, loans: ls });
        },
    });
};

export default createExports;
