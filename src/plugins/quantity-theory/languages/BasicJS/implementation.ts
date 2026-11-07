import { Message } from "../../messages";

/** The money supply list runs from year 0 to at most this many years. */
const MAX_YEARS = 50;

/** The plot can show money supplies, velocities, real outputs and price levels in these ranges, so every axis stays readable and every growth rate is a finite number. The correct price level, M × V ÷ Y, has to fit too: with real output at least 1 it can't pass MAX_PRICE_LEVEL, and a run whose M × V ÷ Y falls below SMALLEST is turned away. The prefixes check the same limits first, with friendlier messages. */
const SMALLEST = 0.000001;
const MAX_MONEY = 1000000;
const MAX_VELOCITY = 100;
const MIN_OUTPUT = 1;
const MAX_OUTPUT = 1000000;
const MAX_PRICE_LEVEL = 100000000;

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
        throw new Error(`showEconomy expects ${name} to be a list of numbers.`);
    }
    return Array.from(input as Iterable<unknown>, (v, i) => toNumber(v, `showEconomy: item ${i} of ${name} is not a number.`));
}

/** Checks that every value in a list is from `low` to `high`, and says which one isn't. */
function checkRange(values: readonly number[], name: string, low: number, high: number) {
    const bad = values.findIndex((v) => v < low || v > high);
    if (bad >= 0) {
        throw new Error(`showEconomy: every value in ${name} should be from ${low} to ${high}, but item ${bad} is ${values[bad]}.`);
    }
}

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        /**
         * Draws the money supply, the price level and real output in each year, and each year's money growth and inflation rates, worked out from the money supply and the price levels.
         *
         * @param moneySupply - The money supply in year 0, 1, 2, …: from 2 to 51 numbers, each from 0.000001 to 1000000 (billions of dollars)
         * @param velocity    - The velocity of money, greater than 0 and at most 100
         * @param realOutput  - Real output, the same every year, from 1 to 1000000 (billions of dollars); M × V ÷ Y has to be at least 0.000001 in every year
         * @param priceLevels - The student's price level for each year, one per money supply, each from 0.000001 to 100000000
         */
        showEconomy: (moneySupply: unknown, velocity: unknown, realOutput: unknown, priceLevels: unknown) => {
            const money = toNumbers(moneySupply, "moneySupply");
            if (money.length < 2 || money.length > MAX_YEARS + 1) {
                throw new Error(`showEconomy needs the money supply for year 0 up to between 1 and ${MAX_YEARS} years (2 to ${MAX_YEARS + 1} values), but it got ${money.length} values.`);
            }
            checkRange(money, "moneySupply", SMALLEST, MAX_MONEY);
            const v = toNumber(velocity, "showEconomy: velocity should be a number.");
            if (v <= 0 || v > MAX_VELOCITY) {
                throw new Error(`showEconomy: velocity should be greater than 0 and at most ${MAX_VELOCITY}, but it's ${v}.`);
            }
            const y = toNumber(realOutput, "showEconomy: realOutput should be a number.");
            if (y < MIN_OUTPUT || y > MAX_OUTPUT) {
                throw new Error(`showEconomy: realOutput should be from ${MIN_OUTPUT} to ${MAX_OUTPUT}, but it's ${y}.`);
            }
            // The dashed line draws M × V ÷ Y, so it has to fit the price level axis too; below SMALLEST every tick label would read 0.
            const tooLow = money.findIndex((m) => (m * v) / y < SMALLEST);
            if (tooLow >= 0) {
                throw new Error(`showEconomy: the price level M × V ÷ Y in year ${tooLow} is ${(money[tooLow] * v) / y}, but the plot can show price levels from ${SMALLEST} to ${MAX_PRICE_LEVEL}. Use a larger money supply or velocity, or a smaller real output.`);
            }
            const levels = toNumbers(priceLevels, "priceLevels");
            if (levels.length !== money.length) {
                throw new Error(`showEconomy needs one price level for each money supply (${money.length}), but it got ${levels.length}.`);
            }
            checkRange(levels, "priceLevels", SMALLEST, MAX_PRICE_LEVEL);
            sendMessage({ type: "showEconomy", moneySupply: money, velocity: v, realOutput: y, priceLevels: levels });
        },
    });
};

export default createExports;
