import { action, observable } from "mobx";
import { Message } from "./messages";

/** The price level the equation of exchange gives in each year: M × V = P × Y solved for P, so P = M × V ÷ Y. Entry i belongs to year i. */
export function equationPriceLevels(moneySupply: readonly number[], velocity: number, realOutput: number): number[] {
    return moneySupply.map((money) => (money * velocity) / realOutput);
}

/** The percentage change from the year before, for each year after year 0: (this year's value − last year's value) ÷ last year's value × 100. Entry i is the change from year i to year i + 1. */
export function percentChanges(values: readonly number[]): number[] {
    const changes: number[] = [];
    for (let year = 1; year < values.length; year++) {
        changes.push(((values[year] - values[year - 1]) / values[year - 1]) * 100);
    }
    return changes;
}

/** Everything the plot and the bottom row show for one run. Entry i of the yearly lists belongs to year i; entry i of the two rates belongs to year i + 1, since year 0 has no year before it. */
export interface Economy {
    /** The money supply in each year, from the student's moneySupplyByYear, in billions of dollars. */
    moneySupply: number[];
    velocity: number;
    /** Real output, the same every year, in billions of dollars. */
    realOutput: number;
    /** What the student's priceLevel returned for each year. */
    priceLevels: number[];
    /** The price level M × V ÷ Y gives for each year's money supply, for the dashed reference line. */
    correctPriceLevels: number[];
    /** The money growth rate: the percentage change in the money supply from the year before. */
    moneyGrowth: number[];
    /** The inflation rate: the percentage change in the student's price level from the year before. */
    inflation: number[];
}

/** Both rates come from the same lists the line graphs draw, so every bar, every rate in the bottom row and every line agree. */
export function summarizeEconomy(moneySupply: readonly number[], velocity: number, realOutput: number, priceLevels: readonly number[]): Economy {
    return {
        moneySupply: [...moneySupply],
        velocity,
        realOutput,
        priceLevels: [...priceLevels],
        correctPriceLevels: equationPriceLevels(moneySupply, velocity, realOutput),
        moneyGrowth: percentChanges(moneySupply),
        inflation: percentChanges(priceLevels),
    };
}

export class State {
    @observable accessor economy: Economy | null = null;

    public init = () => {
        this.economy = null;
    };

    @action
    public onMessage = (m: Message) => {
        switch (m.type) {
            case "showEconomy":
                this.economy = summarizeEconomy(m.moneySupply, m.velocity, m.realOutput, m.priceLevels);
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
