import { action, observable } from "mobx";
import { Message } from "./messages";

export type Country = "Arvia" | "Bovia";
export type Good = "corn" | "fish";

/** On a straight-line PPC, the opportunity cost of one more unit of a good: the most of the other good divided by the most of this good. */
export function opportunityCostOf(maxOfThisGood: number, maxOfOtherGood: number): number {
    return maxOfOtherGood / maxOfThisGood;
}

/** The height of a straight-line PPC from (0, maxFish) to (maxCorn, 0) at a given amount of corn: the most fish a country can make while it makes that much corn. */
export function fishOnPPC(maxCorn: number, maxFish: number, corn: number): number {
    return maxFish - opportunityCostOf(maxCorn, maxFish) * corn;
}

/** One country's side of the trade. Every amount is in tons. */
export interface CountryOutcome {
    name: Country;
    /** The ends of its PPC: the most corn it can make (with no fish), and the most fish (with no corn). */
    maxCorn: number;
    maxFish: number;
    /** What the student's opportunityCost returned for this country's corn. Only a right function makes it the opportunity cost of corn in tons of fish; the starter's returns tons of corn per ton of fish. */
    returnedCost: number;
    /** The opportunity cost of 1 ton of corn, in tons of fish, from the ends of its PPC: the reference the returned value is checked against. */
    opportunityCost: number;
    /** The one good it makes. */
    makes: Good;
    /** What it makes: all corn or all fish, one end of its PPC. */
    production: { corn: number; fish: number };
    /** What it has after the trade. */
    consumption: { corn: number; fish: number };
    /** The most fish it could make on its own while making the corn it consumes: its PPC's height at that much corn. */
    fishOnOwnPPC: number;
    /** Consumed fish minus `fishOnOwnPPC`: how many tons of fish its consumption point sits beyond its PPC (positive) or inside it (negative). */
    gain: number;
}

/** Everything the graph and the bottom row show for one run. */
export interface Trade {
    arvia: CountryOutcome;
    bovia: CountryOutcome;
    cornMaker: Country;
    /** The terms of trade: tons of fish paid for each ton of corn. */
    fishPerCorn: number;
    /** Tons of corn the corn maker ships to the other country. */
    cornTraded: number;
    /** Tons of fish the other country pays for it: cornTraded × fishPerCorn. */
    fishTraded: number;
}

/** Each country makes only one good: the corn maker makes all the corn it can and the other country all the fish it can. The corn maker then ships `cornTraded` tons of corn and gets `fishPerCorn` tons of fish for each. */
export function tradeOutcome(m: Message): Trade {
    const fishTraded = m.cornTraded * m.fishPerCorn;
    const side = (name: Country, max: { corn: number; fish: number }, returnedCost: number): CountryOutcome => {
        const makesCorn = name === m.cornMaker;
        const production = makesCorn ? { corn: max.corn, fish: 0 } : { corn: 0, fish: max.fish };
        const consumption = makesCorn
            ? { corn: max.corn - m.cornTraded, fish: fishTraded }
            : { corn: m.cornTraded, fish: max.fish - fishTraded };
        const fishOnOwnPPC = fishOnPPC(max.corn, max.fish, consumption.corn);
        return {
            name,
            maxCorn: max.corn,
            maxFish: max.fish,
            returnedCost,
            opportunityCost: opportunityCostOf(max.corn, max.fish),
            makes: makesCorn ? "corn" : "fish",
            production,
            consumption,
            fishOnOwnPPC,
            gain: consumption.fish - fishOnOwnPPC,
        };
    };
    return {
        arvia: side("Arvia", m.arvia, m.arviaCornCost),
        bovia: side("Bovia", m.bovia, m.boviaCornCost),
        cornMaker: m.cornMaker,
        fishPerCorn: m.fishPerCorn,
        cornTraded: m.cornTraded,
        fishTraded,
    };
}

export class State {
    @observable accessor trade: Trade | null = null;

    public init = () => {
        this.trade = null;
    };

    @action
    public onMessage = (m: Message) => {
        switch (m.type) {
            case "showTrade":
                this.trade = tradeOutcome(m);
                break;
            default:
                assertNever(m.type);
        }
    };
}

/** Compile-time guarantee that the switch above handles every Message variant. */
function assertNever(x: never): never {
    throw new Error(`Unhandled message: ${JSON.stringify(x)}`);
}

export default State;
