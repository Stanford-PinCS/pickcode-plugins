import { Message } from "../../messages";

const MAX_PRICES = 6;
const MIN_PRICE = 0.01;
const MAX_PRICE = 1000;
const MAX_QUORS = 1000000;
// Caps on the market, so that every message this accepts graphs with true labels: the exchange rate axis's tick labels stay at most four characters, so they fit beside its title and never round to a wrong value; both demand curves reach their equilibrium inside the graph; the shortage or surplus label fits beside its bracket; and no exchange rate, change in it, quantity or shift reads as 0.
const MAX_QUANTITY = 100000;
const MIN_SLOPE = 0.01;
const MAX_SLOPE = 100000;
const MIN_SHIFT = 0.01;
const MAX_SHIFT = 1000;
const MIN_RATE = 0.1;
const MAX_RATE = 500;
const MIN_RATE_CHANGE = 0.001;
const MAX_RATE_RATIO = 3;
const MIN_TRADED = 0.01;

/** Two numbers closer than this, relative to their size, count as the same (the plugin's state uses the same rule). */
const SAME = 1e-6;
const sameNumber = (a: number, b: number) => Math.abs(a - b) <= SAME * Math.max(1, Math.abs(a), Math.abs(b));

/** A number for an error message, without a long tail of digits. */
const short = (v: number) => Number(v.toPrecision(6));

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
        throw new Error(`showExchangeMarket expects ${name} to be a list of numbers.`);
    }
    return Array.from(input as Iterable<unknown>, (v, i) => toNumber(v, `showExchangeMarket: item ${i} of ${name} is not a number.`));
}

/** A number from `low` to `high`, or an error that names the range. */
function inRange(value: unknown, name: string, low: number, high: number): number {
    const n = toNumber(value, `showExchangeMarket: ${name} should be a number.`);
    if (n < low || n > high) {
        throw new Error(`showExchangeMarket: ${name} should be from ${low.toLocaleString("en-US")} to ${high.toLocaleString("en-US")}, but it is ${n}.`);
    }
    return n;
}

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        /**
         * Graphs the foreign exchange market for the pell, before and after a shift in the demand for pells, and each export's price in quors at the exchange rate before and after.
         *
         * At an exchange rate of r quors per pell, the quantity of pells demanded is demandAtZero + demandSlope × r and the quantity supplied is supplyAtZero + supplySlope × r, in millions of pells a day. Each exchange rate must be where the two curves cross, with at least 0.01 million pells a day demanded and supplied there; the graph uses the crossing itself.
         *
         * @param demandAtZero - Millions of pells demanded a day at an exchange rate of 0, before the shift: 0 to 100,000
         * @param demandSlope  - How the quantity demanded changes for each quor per pell: -100,000 to -0.01
         * @param supplyAtZero - Millions of pells supplied a day at an exchange rate of 0: -100,000 to 100,000
         * @param supplySlope  - How the quantity supplied changes for each quor per pell: 0.01 to 100,000
         * @param shift        - Millions of pells a day the demand curve moves right (or left, when less than 0): 0, or from 0.01 to 1,000 either way, leaving at least 0.01 demanded at rateBefore
         * @param rateBefore   - The equilibrium exchange rate before the shift, in quors per pell: 0.1 to 500
         * @param rateAfter    - The equilibrium exchange rate after the shift: 0.1 to 500, and when demand shifted, at least 0.001 away from rateBefore and from 1/3 of it to 3 times it
         * @param prices       - What each export sells for in Pellia: 1 to 6 prices in pells, each from 0.01 to 1,000
         * @param pricesBefore - The student's price in quors for each export at rateBefore: 0 to 1,000,000
         * @param pricesAfter  - The student's price in quors for each export at rateAfter: 0 to 1,000,000
         */
        showExchangeMarket: (
            demandAtZero: unknown,
            demandSlope: unknown,
            supplyAtZero: unknown,
            supplySlope: unknown,
            shift: unknown,
            rateBefore: unknown,
            rateAfter: unknown,
            prices: unknown,
            pricesBefore: unknown,
            pricesAfter: unknown
        ) => {
            const dAtZero = inRange(demandAtZero, "the demand at an exchange rate of 0", 0, MAX_QUANTITY);
            const sAtZero = inRange(supplyAtZero, "the supply at an exchange rate of 0", -MAX_QUANTITY, MAX_QUANTITY);
            const dSlope = toNumber(demandSlope, "showExchangeMarket: the demand slope should be a number.");
            const sSlope = toNumber(supplySlope, "showExchangeMarket: the supply slope should be a number.");
            // The demand for a currency slopes down and its supply slopes up.
            if (dSlope >= 0 || sSlope <= 0) {
                throw new Error("showExchangeMarket needs a demand curve that slopes down (a slope less than 0) and a supply curve that slopes up (a slope more than 0).");
            }
            inRange(dSlope, "the demand slope", -MAX_SLOPE, -MIN_SLOPE);
            inRange(sSlope, "the supply slope", MIN_SLOPE, MAX_SLOPE);
            const move = inRange(shift, "the shift in demand", -MAX_SHIFT, MAX_SHIFT);
            if (move !== 0 && Math.abs(move) < MIN_SHIFT) {
                throw new Error(`showExchangeMarket: the shift in demand should be 0, or at least ${MIN_SHIFT} either way, but it is ${move}.`);
            }
            const given = {
                before: inRange(rateBefore, "the exchange rate before the shift", MIN_RATE, MAX_RATE),
                after: inRange(rateAfter, "the exchange rate after the shift", MIN_RATE, MAX_RATE),
            };

            // Each exchange rate must be the one where the demand and supply curves cross, so that the quantity of pells demanded equals the quantity supplied. It compares exchange rates, not quantities, so a rate far from the crossing can't pass where the curves are nearly flat. Then the graph gets the crossing itself, so each equilibrium sits exactly on both curves and the shortage or surplus at the old exchange rate is exactly the shift, even where the curves are steep.
            const equilibrium = (rate: number, atZero: number, when: string) => {
                const crossing = (atZero - sAtZero) / (sSlope - dSlope);
                if (!sameNumber(rate, crossing)) {
                    throw new Error(`showExchangeMarket needs each exchange rate to be where the demand and supply curves cross, but ${when} they cross at ${short(crossing)} quors per pell, not ${rate}.`);
                }
                if (crossing < MIN_RATE || crossing > MAX_RATE) {
                    throw new Error(`showExchangeMarket needs each exchange rate to be from ${MIN_RATE} to ${MAX_RATE}, but ${when} the curves cross at ${crossing}.`);
                }
                const traded = sAtZero + sSlope * crossing;
                if (traded < MIN_TRADED) {
                    throw new Error(`showExchangeMarket needs at least ${MIN_TRADED} million pells a day demanded and supplied at each exchange rate, but ${when} it is ${short(traded)}.`);
                }
                return crossing;
            };
            const before = equilibrium(given.before, dAtZero, "before the shift");
            const after = equilibrium(given.after, dAtZero + move, "after the shift");

            // A shift must move the exchange rate far enough that the two rates read differently on the graph, but not so far that a curve meets its equilibrium off the graph, and the same way as the shift: demand that shifts right raises the exchange rate (the pell appreciates), and demand that shifts left lowers it (the pell depreciates). With no shift, both rates are the same crossing.
            if (move !== 0 && Math.abs(after - before) < MIN_RATE_CHANGE) {
                throw new Error(`showExchangeMarket needs a shift in demand big enough to change the exchange rate by at least ${MIN_RATE_CHANGE} quors per pell, or no shift at all.`);
            }
            if (after > before * MAX_RATE_RATIO || after < before / MAX_RATE_RATIO) {
                throw new Error(`showExchangeMarket needs the exchange rate after the shift to be from 1/${MAX_RATE_RATIO} of the rate before it to ${MAX_RATE_RATIO} times it, but it moves from ${short(before)} to ${short(after)}.`);
            }
            if (move !== 0 && Math.sign(after - before) !== Math.sign(move)) {
                throw new Error("showExchangeMarket needs the exchange rate to rise when demand shifts right and to fall when it shifts left.");
            }
            // A quantity demanded can't be negative: demand that shifts left must still leave pells demanded at the old exchange rate, where the surplus is measured.
            const demandedAtOldRate = dAtZero + move + dSlope * before;
            if (demandedAtOldRate < MIN_TRADED) {
                throw new Error(`showExchangeMarket needs a shift in demand that leaves at least ${MIN_TRADED} million pells a day demanded at the old exchange rate, but it leaves ${short(demandedAtOldRate)}.`);
            }

            const home = toNumbers(prices, "the prices");
            if (home.length < 1 || home.length > MAX_PRICES) {
                throw new Error(`showExchangeMarket needs from 1 to ${MAX_PRICES} prices, but it got ${home.length}.`);
            }
            const outside = home.find((p) => p < MIN_PRICE || p > MAX_PRICE);
            if (outside !== undefined) {
                throw new Error(`showExchangeMarket needs each price in pells to be from ${MIN_PRICE} to ${MAX_PRICE.toLocaleString("en-US")}, but one of them is ${outside}.`);
            }
            const abroad = (values: unknown, name: string) => {
                const list = toNumbers(values, name);
                if (list.length !== home.length) {
                    throw new Error(`showExchangeMarket needs one price in quors for each of the ${home.length} prices in pells, but ${name} has ${list.length}.`);
                }
                if (list.some((p) => p < 0 || p > MAX_QUORS)) {
                    throw new Error(`showExchangeMarket needs each price in quors to be from 0 to ${MAX_QUORS.toLocaleString("en-US")}.`);
                }
                return list;
            };

            sendMessage({
                type: "showExchangeMarket",
                demandAtZero: dAtZero,
                demandSlope: dSlope,
                supplyAtZero: sAtZero,
                supplySlope: sSlope,
                shift: move,
                rateBefore: before,
                rateAfter: after,
                prices: home,
                pricesBefore: abroad(pricesBefore, "the prices before the shift"),
                pricesAfter: abroad(pricesAfter, "the prices after the shift"),
            });
        },
    });
};

export default createExports;
