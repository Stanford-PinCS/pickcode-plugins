import { Message } from "../../messages";

// The range of each country's amounts, in tons. It keeps every axis finite, with distinct tick labels no wider than 4 characters.
const MIN_TONS = 1;
const MAX_TONS = 1000;

function toNumber(value: unknown, message: string): number {
    const n = Number(value);
    if (typeof value === "boolean" || value === null || value === undefined || typeof value === "string" || !Number.isFinite(n)) {
        throw new Error(message);
    }
    return n;
}

function toAmount(value: unknown, what: string): number {
    const n = toNumber(value, `showTrade: ${what} should be a number.`);
    if (n <= 0) {
        throw new Error(`showTrade: ${what} should be more than 0, but it is ${n}.`);
    }
    return n;
}

/** Shows a number with at most two decimals, for error messages. */
const fmt = (v: number) => String(Number(v.toFixed(2)));

function toTons(value: unknown, what: string): number {
    const n = toNumber(value, `showTrade: ${what} should be a number.`);
    if (n < MIN_TONS || n > MAX_TONS) {
        throw new Error(`showTrade: ${what} should be from ${MIN_TONS} to ${MAX_TONS} tons, so the graph can show it, but it is ${fmt(n)}.`);
    }
    return n;
}

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        /**
         * Draws both countries' straight-line PPCs, what each makes after it specializes, and what each consumes after the trade.
         *
         * @param arviaCorn     - The most corn Arvia can make, from 1 to 1000 tons, if it makes no fish
         * @param arviaFish     - The most fish Arvia can make, from 1 to 1000 tons, if it makes no corn
         * @param boviaCorn     - The most corn Bovia can make, from 1 to 1000 tons, if it makes no fish
         * @param boviaFish     - The most fish Bovia can make, from 1 to 1000 tons, if it makes no corn
         * @param arviaCornCost - What the student's opportunityCost returned for Arvia's corn (in tons of fish once the function is right)
         * @param boviaCornCost - What the student's opportunityCost returned for Bovia's corn (in tons of fish once the function is right)
         * @param cornMaker     - "Arvia" or "Bovia": the country that makes only corn; the other makes only fish
         * @param fishPerCorn   - The terms of trade: tons of fish paid for each ton of corn
         * @param cornTraded    - Tons of corn the corn maker ships to the other country
         */
        showTrade: (
            arviaCorn: unknown,
            arviaFish: unknown,
            boviaCorn: unknown,
            boviaFish: unknown,
            arviaCornCost: unknown,
            boviaCornCost: unknown,
            cornMaker: unknown,
            fishPerCorn: unknown,
            cornTraded: unknown
        ) => {
            const arvia = { corn: toTons(arviaCorn, "Arvia's corn"), fish: toTons(arviaFish, "Arvia's fish") };
            const bovia = { corn: toTons(boviaCorn, "Bovia's corn"), fish: toTons(boviaFish, "Bovia's fish") };
            const costs = [
                toNumber(arviaCornCost, "showTrade: Arvia's opportunity cost of corn should be a number."),
                toNumber(boviaCornCost, "showTrade: Bovia's opportunity cost of corn should be a number."),
            ];
            if (costs.some((c) => c < 0)) {
                throw new Error("showTrade: an opportunity cost is an amount given up, so it can't be negative.");
            }
            if (cornMaker !== "Arvia" && cornMaker !== "Bovia") {
                throw new Error(`showTrade: the corn maker should be "Arvia" or "Bovia", but it is ${JSON.stringify(cornMaker) ?? String(cornMaker)}.`);
            }
            const price = toAmount(fishPerCorn, "the terms of trade (fishPerCorn)");
            const traded = toAmount(cornTraded, "the corn traded");

            // The corn maker has to be able to make the corn it ships. The other country's PPC has to reach the corn it gets, because the graph measures its gain against its own PPC at that much corn. And the other country has to be able to pay for the corn in fish.
            const maker = cornMaker === "Arvia" ? { name: "Arvia", max: arvia } : { name: "Bovia", max: bovia };
            const payer = cornMaker === "Arvia" ? { name: "Bovia", max: bovia } : { name: "Arvia", max: arvia };
            if (maker.max.corn < traded) {
                throw new Error(`showTrade: ${maker.name} makes only ${fmt(maker.max.corn)} tons of corn, so it can't ship ${fmt(traded)}.`);
            }
            if (payer.max.corn < traded) {
                throw new Error(`showTrade: the graph compares what each country consumes with its own PPC at the same amount of corn, so ${payer.name}'s PPC has to reach the ${fmt(traded)} tons of corn it gets, but it reaches only ${fmt(payer.max.corn)}.`);
            }
            // A little slack, so a payment of exactly all its fish isn't turned away by floating-point math (10 × 0.28 comes out as 2.8000000000000003).
            if (traded * price > payer.max.fish * (1 + 1e-9)) {
                throw new Error(`showTrade: at ${fmt(price)} tons of fish per ton of corn, ${fmt(traded)} tons of corn cost ${fmt(traded * price)} tons of fish, but ${payer.name} can make only ${fmt(payer.max.fish)}.`);
            }

            sendMessage({
                type: "showTrade",
                arvia,
                bovia,
                arviaCornCost: costs[0],
                boviaCornCost: costs[1],
                cornMaker,
                fishPerCorn: price,
                cornTraded: traded,
            });
        },
    });
};

export default createExports;
