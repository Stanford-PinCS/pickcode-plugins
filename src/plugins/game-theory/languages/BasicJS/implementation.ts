import { Message } from "../../messages";

type Price = 0 | 1;

function toNumber(value: unknown, message: string): number {
    const n = Number(value);
    if (typeof value === "boolean" || value === null || value === undefined || typeof value === "string" || !Number.isFinite(n)) {
        throw new Error(message);
    }
    return n;
}

/** Student code may hand us a list (or a Python list proxy). */
function toList(input: unknown, message: string): unknown[] {
    if (input == null || typeof input === "string" || typeof (input as Iterable<unknown>)[Symbol.iterator] !== "function") {
        throw new Error(message);
    }
    return Array.from(input as Iterable<unknown>);
}

/** One airline's payoffs: a list of 2 rows (its own prices), each a list of 2 numbers (the other airline's prices). */
function toTable(input: unknown, name: string): number[][] {
    const shape = `showGame expects ${name} to be a list of 2 rows, each a list of 2 numbers.`;
    const rows = toList(input, shape);
    if (rows.length !== 2) throw new Error(shape);
    return rows.map((row, i) => {
        const values = toList(row, shape);
        if (values.length !== 2) throw new Error(shape);
        return values.map((v, j) => toNumber(v, `showGame: ${name}[${i}][${j}] is not a number.`));
    });
}

/** A price: 0 for the high price or 1 for the low price. */
function toPrice(value: unknown, message: string): Price {
    const n = toNumber(value, message);
    if (n !== 0 && n !== 1) throw new Error(message);
    return n === 0 ? 0 : 1;
}

/** One airline's two answers from bestResponse: the price it picked when the other airline charges HIGH, then LOW. */
function toPicks(input: unknown, name: string): Price[] {
    const message = `showGame expects ${name} to be a list of 2 prices, each 0 (HIGH) or 1 (LOW).`;
    const values = toList(input, message);
    if (values.length !== 2) throw new Error(message);
    return values.map((v) => toPrice(v, message));
}

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        /**
         * Draws the payoff matrix of the pricing game, with the best responses the student's function found.
         *
         * @param gull       - Gull's payoffs, as gull[gullPrice][heronPrice]
         * @param heron      - Heron's payoffs, as heron[heronPrice][gullPrice]
         * @param gullPicks  - Gull's best response when Heron charges HIGH, then when Heron charges LOW
         * @param heronPicks - Heron's best response when Gull charges HIGH, then when Gull charges LOW
         */
        showGame: (gull: unknown, heron: unknown, gullPicks: unknown, heronPicks: unknown) => {
            sendMessage({
                type: "showGame",
                gull: toTable(gull, "Gull's payoffs"),
                heron: toTable(heron, "Heron's payoffs"),
                gullPicks: toPicks(gullPicks, "Gull's best responses"),
                heronPicks: toPicks(heronPicks, "Heron's best responses"),
            });
        },

        /**
         * Marks a deal on the payoff matrix: a price for each airline.
         *
         * @param gullPrice  - The price Gull agrees to, 0 (HIGH) or 1 (LOW)
         * @param heronPrice - The price Heron agrees to, 0 (HIGH) or 1 (LOW)
         */
        showDeal: (gullPrice: unknown, heronPrice: unknown) => {
            const gull = toPrice(gullPrice, "showDeal: Gull's price should be 0 (HIGH) or 1 (LOW).");
            const heron = toPrice(heronPrice, "showDeal: Heron's price should be 0 (HIGH) or 1 (LOW).");
            sendMessage({ type: "showDeal", gull, heron });
        },
    });
};

export default createExports;
