import { Message } from "../../messages";

// Limits that keep the graph readable, the same ones the hidden helper checks: up to 20 units of consumption goods, table amounts up to 1000, growth from 0% to 100%, and up to 8 combinations whose capital goods are at most 2000, the most a PPC can reach after 100% growth.
const MAX_UNITS = 20;
const MAX_AMOUNT = 1000;
const MAX_POINT_CAPITAL = 2 * MAX_AMOUNT;
const MAX_GROWTH = 100;
const MAX_POINTS = 8;
const ANSWERS = ["efficient", "inefficient", "unattainable"] as const;
type Answer = (typeof ANSWERS)[number];

/** Shows a number with at most two decimals, for error messages. */
const fmt = (v: number) => String(Number(v.toFixed(2)));

/** Shows a value the way it looks in code, so a string "3" or a list [3] can't pass for the number 3. A list shows each of its items this way, so NaN and undefined in it don't turn into null. */
const show = (v: unknown): string => (Array.isArray(v) ? `[${v.map(show).join(", ")}]` : typeof v === "string" || (typeof v === "object" && v !== null) ? JSON.stringify(v) : String(v));

/** "1st", "2nd", "3rd", "4th", ... "11th", "21st". */
const nth = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th")}`;

/** "0 units", "1 unit", "2 units". */
const unitsOf = (n: number) => `${n} unit${n === 1 ? "" : "s"}`;

/** Rounds to 9 decimals, half up, the way the hidden helpers round the most consumption goods on the PPC after growth. */
const round9 = (v: number) => Math.floor(v * 1e9 + 0.5) / 1e9;

function toNumber(value: unknown, message: string): number {
    const n = Number(value);
    if (typeof value === "boolean" || value === null || value === undefined || typeof value === "string" || !Number.isFinite(n)) {
        throw new Error(message);
    }
    return n;
}

/** Student code may hand us a list (or a Python list proxy). */
function toList(value: unknown, message: string): unknown[] {
    if (value == null || typeof value === "string" || typeof (value as Iterable<unknown>)[Symbol.iterator] !== "function") {
        throw new Error(message);
    }
    return Array.from(value as Iterable<unknown>);
}

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        /**
         * Draws the PPC from its table, the student's opportunity cost of each additional unit of consumption goods as a drop from one row toward the next, the PPC after growth, and each tested combination with what the student's describePoint called it.
         *
         * @param capitalGoods - The PPC table: item i is the most capital goods the country can make with i units of consumption goods. 2 to 21 numbers from 0 to 1000, each less than the one before, the last one 0.
         * @param costs        - What the student's opportunityCosts returned: one number per additional unit of consumption goods, each from 0 to the capital goods in the row before that unit (costs[i] is at most capitalGoods[i])
         * @param growth       - How many percent more of each good the country can make after economic growth, from 0 to 100
         * @param points       - Up to 8 combinations, each [consumption goods, capital goods], with consumption goods no more than the PPC after growth reaches
         * @param answers      - What the student's describePoint returned for each combination: "efficient", "inefficient" or "unattainable"
         */
        showPossibilities: (capitalGoods: unknown, costs: unknown, growth: unknown, points: unknown, answers: unknown) => {
            const table = toList(capitalGoods, "showPossibilities: capitalGoods should be a list of numbers.").map((v, i) =>
                toNumber(v, `showPossibilities: the capital goods for ${unitsOf(i)} of consumption goods should be a number, but it is ${show(v)}.`)
            );
            if (table.length < 2 || table.length > MAX_UNITS + 1) {
                throw new Error(`showPossibilities: capitalGoods should have from 2 to ${MAX_UNITS + 1} rows, for 0 up to ${MAX_UNITS} units of consumption goods, but it has ${table.length}.`);
            }
            table.forEach((v, i) => {
                if (v < 0 || v > MAX_AMOUNT) {
                    throw new Error(`showPossibilities: each amount in capitalGoods should be from 0 to ${MAX_AMOUNT}, but the one for ${unitsOf(i)} of consumption goods is ${fmt(v)}.`);
                }
                if (i > 0 && v >= table[i - 1]) {
                    throw new Error(`showPossibilities: on a PPC, making more consumption goods means making fewer capital goods, so each amount in capitalGoods should be less than the one before it, but it goes from ${fmt(table[i - 1])} to ${fmt(v)} at ${unitsOf(i)} of consumption goods.`);
                }
            });
            const units = table.length - 1;
            if (table[units] !== 0) {
                throw new Error(`showPossibilities: the last amount in capitalGoods should be 0, so the PPC reaches the Consumption Goods axis, but it is ${fmt(table[units])}.`);
            }

            const g = toNumber(growth, `showPossibilities: growth should be a number, but it is ${show(growth)}.`);
            if (g < 0 || g > MAX_GROWTH) {
                throw new Error(`showPossibilities: growth should be from 0 to ${MAX_GROWTH} percent, but it is ${fmt(g)}.`);
            }

            const costList = toList(costs, "showPossibilities: the opportunity costs should be a list of numbers.").map((v, i) =>
                toNumber(v, `showPossibilities: the opportunity cost of the ${nth(i + 1)} unit of consumption goods should be a number, but it is ${show(v)}.`)
            );
            if (costList.length !== units) {
                throw new Error(`showPossibilities: there should be ${units} opportunity costs, one for each additional unit of consumption goods, but there are ${costList.length}.`);
            }
            // Each unit can give up at most the capital goods in the row before it, so every drop on the graph ends at 0 or above.
            costList.forEach((c, i) => {
                if (c < 0 || c > table[i]) {
                    throw new Error(`showPossibilities: the opportunity cost of the ${nth(i + 1)} unit of consumption goods should be from 0 to ${fmt(table[i])}, the capital goods made with ${unitsOf(i)} of consumption goods, but it is ${fmt(c)}.`);
                }
            });

            // The PPC after growth reaches this many units of consumption goods, rounded as the hidden helpers round it; the graph compares each combination with the PPC's height at its consumption goods, so none can go past it. Messages show it rounded down, so the amount they suggest is allowed.
            const mostConsumption = round9(units * (1 + g / 100));
            const mostShown = fmt(Math.floor(mostConsumption * 100 + 1e-9) / 100);
            const pointList = toList(points, "showPossibilities: points should be a list of combinations, each [consumption goods, capital goods].").map((p, i) => {
                const pair = toList(p, `showPossibilities: combination ${i + 1} should be two numbers, [consumption goods, capital goods], but it is ${show(p)}.`);
                if (pair.length !== 2) {
                    throw new Error(`showPossibilities: combination ${i + 1} should be two numbers, [consumption goods, capital goods], but it has ${pair.length}.`);
                }
                const consumption = toNumber(pair[0], `showPossibilities: the consumption goods in combination ${i + 1} should be a number, but they are ${show(pair[0])}.`);
                const capital = toNumber(pair[1], `showPossibilities: the capital goods in combination ${i + 1} should be a number, but they are ${show(pair[1])}.`);
                if (consumption < 0 || consumption > mostConsumption) {
                    throw new Error(`showPossibilities: the consumption goods in combination ${i + 1} should be from 0 to ${mostShown}, the most on the PPC, but they are ${fmt(consumption)}.`);
                }
                if (capital < 0 || capital > MAX_POINT_CAPITAL) {
                    throw new Error(`showPossibilities: the capital goods in combination ${i + 1} should be from 0 to ${MAX_POINT_CAPITAL}, but they are ${fmt(capital)}.`);
                }
                return { consumption, capital };
            });
            if (pointList.length > MAX_POINTS) {
                throw new Error(`showPossibilities: the graph can show up to ${MAX_POINTS} combinations, but there are ${pointList.length}.`);
            }

            const answerList = toList(answers, "showPossibilities: answers should be a list of words.").map((a, i) => {
                if (!(ANSWERS as readonly unknown[]).includes(a)) {
                    throw new Error(`showPossibilities: the answer for combination ${i + 1} should be "efficient", "inefficient" or "unattainable", but it is ${show(a)}.`);
                }
                return a as Answer;
            });
            if (answerList.length !== pointList.length) {
                throw new Error(`showPossibilities: there should be one answer for each of the ${pointList.length} combinations, but there are ${answerList.length}.`);
            }

            sendMessage({ type: "showPossibilities", capitalGoods: table, costs: costList, growth: g, points: pointList, answers: answerList });
        },
    });
};

export default createExports;
