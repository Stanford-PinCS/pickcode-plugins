import { Message } from "../../messages";

const MAX_POINTS = 201;

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
        throw new Error(`showMarket expects the ${name} to be a list of numbers.`);
    }
    return Array.from(input as Iterable<unknown>, (v, i) => toNumber(v, `showMarket: item ${i} of the ${name} is not a number.`));
}

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        /**
         * Graphs a market with an external cost: MPB (which is also MSB), MPC and MSC, each sampled at the same quantities, the line MPC + tax when there's a tax, the market and socially optimal quantities, and the deadweight loss between them.
         *
         * @param quantities      - The quantities, from 2 to 201 numbers of 0 or more, in increasing order
         * @param benefit         - The marginal private benefit at each quantity
         * @param privateCost     - The marginal private cost at each quantity
         * @param socialCost      - The marginal social cost at each quantity
         * @param tax             - The per-unit tax sellers pay on each unit
         * @param marketQuantity  - Where MPB meets MPC + tax
         * @param optimalQuantity - Where MSB meets MSC
         * @param deadweightLoss  - The area between MSB and MSC from one of those quantities to the other
         */
        showMarket: (
            quantities: unknown,
            benefit: unknown,
            privateCost: unknown,
            socialCost: unknown,
            tax: unknown,
            marketQuantity: unknown,
            optimalQuantity: unknown,
            deadweightLoss: unknown
        ) => {
            const qs = toNumbers(quantities, "quantities");
            if (qs.length < 2 || qs.length > MAX_POINTS) {
                throw new Error(`showMarket needs from 2 to ${MAX_POINTS} quantities, but it got ${qs.length}.`);
            }
            if (qs.some((q, i) => i > 0 && q <= qs[i - 1])) {
                throw new Error("showMarket needs the quantities in increasing order.");
            }
            if (qs[0] < 0) {
                throw new Error(`showMarket needs quantities of 0 or more, but the first one is ${qs[0]}.`);
            }
            const lines = { benefit, privateCost, socialCost };
            const [mpb, mpc, msc] = Object.entries(lines).map(([name, values]) => {
                const list = toNumbers(values, name);
                if (list.length !== qs.length) {
                    throw new Error(`showMarket needs one ${name} value for each quantity, but it got ${list.length} for ${qs.length} quantities.`);
                }
                return list;
            });
            const perUnitTax = toNumber(tax, "showMarket: the tax should be a number.");
            const inRange = (q: number) => q >= qs[0] && q <= qs[qs.length - 1];
            const market = toNumber(marketQuantity, "showMarket: the market quantity should be a number.");
            const optimal = toNumber(optimalQuantity, "showMarket: the socially optimal quantity should be a number.");
            if (!inRange(market) || !inRange(optimal)) {
                throw new Error(`showMarket needs the market and socially optimal quantities to be from ${qs[0]} to ${qs[qs.length - 1]}.`);
            }
            const loss = toNumber(deadweightLoss, "showMarket: the deadweight loss should be a number.");
            if (loss < 0) {
                throw new Error("showMarket: the deadweight loss can't be negative.");
            }
            sendMessage({
                type: "showMarket",
                quantities: qs,
                benefit: mpb,
                privateCost: mpc,
                socialCost: msc,
                tax: perUnitTax,
                marketQuantity: market,
                optimalQuantity: optimal,
                deadweightLoss: loss,
            });
        },
    });
};

export default createExports;
