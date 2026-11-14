import { Message } from "../../messages";

// The limits the prefixes check too, so every message this accepts can be drawn: at most 10 goods, 2 to 6 years (the base year and up to 5 more), quantities from 0.01 to 10000, prices from $0.01 to $10,000, wages from $1 to $10,000, and every value the student's functions return within a trillion of 0. The wage axis runs past the largest wage, so with every wage at least $1 its ticks are whole cents and no two read the same.
const MAX_GOODS = 10;
const MIN_YEARS = 2;
const MAX_YEARS = 6;
const MIN_AMOUNT = 0.01;
const MIN_WAGE = 1;
const MAX_AMOUNT = 10000;
const MAX_NAME = 40;
const LIMIT = 1e12;

/** Shows a value the way it looks in code, so a string "3" or a list [3] can't pass for the number 3. NaN, undefined and functions go through String, since JSON.stringify would show NaN as null. */
function show(value: unknown): string {
    if (typeof value === "string" || (typeof value === "object" && value !== null)) {
        try {
            return JSON.stringify(value) ?? String(value);
        } catch {
            return String(value);
        }
    }
    return String(value);
}

function toNumber(value: unknown, what: string): number {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new Error(`showPriceIndex: ${what} should be a number, but it is ${show(value)}.`);
    }
    return value;
}

/** Student code may hand us a list (or a Python list proxy). */
function toList(value: unknown, what: string): unknown[] {
    if (value == null || typeof value === "string" || typeof (value as Iterable<unknown>)[Symbol.iterator] !== "function") {
        throw new Error(`showPriceIndex: ${what} should be a list, but it is ${show(value)}.`);
    }
    return Array.from(value as Iterable<unknown>);
}

function toNumbers(value: unknown, what: string, length: number): number[] {
    const list = toList(value, what);
    if (list.length !== length) {
        throw new Error(`showPriceIndex: ${what} should have ${length} value${length === 1 ? "" : "s"}, but it has ${list.length}.`);
    }
    return list.map((v, i) => toNumber(v, `item ${i} of ${what}`));
}

function inRange(value: number, low: number, high: number, what: string): number {
    if (value < low || value > high) {
        throw new Error(`showPriceIndex: ${what} should be from ${low} to ${high}, but it is ${value}.`);
    }
    return value;
}

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        /**
         * Draws the CPI of a fixed basket of goods and services for each year with the basket's cost, the inflation rate from each year to the next, and a worker's nominal and real wages, each next to its correct value.
         *
         * @param goods      - The name of each good or service in the basket: 1 to 10 names
         * @param quantities - How much of each good is bought every year, each from 0.01 to 10000
         * @param prices     - For each good, its price in each year from the base year on: 2 to 6 prices, each from 0.01 to 10000, the same number for every good
         * @param wages      - The worker's nominal wage in each year, each from 1 to 10000
         * @param costs      - What the student's basketCost returned for each year: from 0 to a trillion, and more than 0 for the base year
         * @param cpis       - What the student's cpi returned for each year: more than 0 and at most a trillion
         * @param inflation  - What the student's inflationRate returned for each year after the base year, each within a trillion of 0
         * @param realWages  - What the student's realWage returned for each year: from 0 to a trillion
         */
        showPriceIndex: (
            goods: unknown,
            quantities: unknown,
            prices: unknown,
            wages: unknown,
            costs: unknown,
            cpis: unknown,
            inflation: unknown,
            realWages: unknown
        ) => {
            const names = toList(goods, "goods");
            if (names.length < 1 || names.length > MAX_GOODS) {
                throw new Error(`showPriceIndex: the basket should have 1 to ${MAX_GOODS} goods, but it has ${names.length}.`);
            }
            names.forEach((name, i) => {
                if (typeof name !== "string" || name.trim() === "" || name.length > MAX_NAME) {
                    throw new Error(`showPriceIndex: item ${i} of goods should be a name of 1 to ${MAX_NAME} characters, but it is ${show(name)}.`);
                }
            });
            const count = names.length;

            const amounts = toNumbers(quantities, "quantities", count).map((q, i) => inRange(q, MIN_AMOUNT, MAX_AMOUNT, `the quantity of ${show(names[i])}`));

            const rows = toList(prices, "prices");
            if (rows.length !== count) {
                throw new Error(`showPriceIndex: prices should have one list of prices for each of the ${count} goods, but it has ${rows.length}.`);
            }
            const firstRow = toList(rows[0], `the prices of ${show(names[0])}`);
            const years = firstRow.length;
            if (years < MIN_YEARS || years > MAX_YEARS) {
                throw new Error(`showPriceIndex: each good should have ${MIN_YEARS} to ${MAX_YEARS} prices, one for each year, but ${show(names[0])} has ${years}.`);
            }
            const table = rows.map((row, i) =>
                toNumbers(row, `the prices of ${show(names[i])}`, years).map((p, year) => inRange(p, MIN_AMOUNT, MAX_AMOUNT, `the year ${year} price of ${show(names[i])}`))
            );

            const pay = toNumbers(wages, "wages", years).map((w, year) => inRange(w, MIN_WAGE, MAX_AMOUNT, `the year ${year} wage`));

            const costList = toNumbers(costs, "costs", years).map((c, year) => inRange(c, 0, LIMIT, `the basket's year ${year} cost`));
            if (costList[0] === 0) {
                throw new Error("showPriceIndex: the basket's cost in the base year should be more than 0, since the CPI divides by it.");
            }
            const cpiList = toNumbers(cpis, "cpis", years).map((v, year) => {
                if (v <= 0) {
                    throw new Error(`showPriceIndex: the year ${year} CPI should be more than 0, but it is ${v}.`);
                }
                return inRange(v, 0, LIMIT, `the year ${year} CPI`);
            });
            const rateList = toNumbers(inflation, "inflation", years - 1).map((r, i) => inRange(r, -LIMIT, LIMIT, `the year ${i + 1} inflation rate`));
            const realList = toNumbers(realWages, "realWages", years).map((w, year) => inRange(w, 0, LIMIT, `the year ${year} real wage`));

            sendMessage({
                type: "showPriceIndex",
                goods: names as string[],
                quantities: amounts,
                prices: table,
                wages: pay,
                costs: costList,
                cpis: cpiList,
                inflation: rateList,
                realWages: realList,
            });
        },
    });
};

export default createExports;
