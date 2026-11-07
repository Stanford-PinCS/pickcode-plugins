import { action, observable } from "mobx";
import { Message } from "./messages";

/** What a fixed basket costs at one year's prices: each good's quantity times its price that year, added up. */
export function basketCostOf(quantities: readonly number[], prices: readonly (readonly number[])[], year: number): number {
    let total = 0;
    quantities.forEach((quantity, i) => {
        total = total + quantity * prices[i][year];
    });
    return total;
}

/** The CPI in a year: the basket's cost that year relative to its cost in the base year (year 0), times 100, so the base year's CPI is 100. */
export function cpiOf(costs: readonly number[], year: number): number {
    return (costs[year] / costs[0]) * 100;
}

/** The percentage change from an old value to a new one. The inflation rate is the percentage change in a price index. */
export function percentChange(oldValue: number, newValue: number): number {
    return ((newValue - oldValue) / oldValue) * 100;
}

/** A nominal value deflated by the price level: divided by a price index and multiplied by 100. */
export function deflate(nominal: number, priceIndex: number): number {
    return (nominal / priceIndex) * 100;
}

/** Everything the graphs and the bottom row show for one run. Each list has one value per year, from the base year (year 0) on, except the inflation rates, which start at year 1. */
export interface PriceIndexRun {
    goods: string[];
    quantities: number[];
    prices: number[][];
    /** The worker's nominal wage each year. */
    wages: number[];
    /** How many years there are, counting the base year. */
    years: number;
    /** What the student's basketCost returned for each year. */
    costs: number[];
    /** What the student's cpi returned for each year. */
    cpis: number[];
    /** What the student's inflationRate returned for each year after the base year, from the CPI the year before to that year's. A right function returns percentages; the starter's returns changes in index points. */
    inflation: number[];
    /** What the student's realWage returned for each year. */
    realWages: number[];
    /** The correct values, worked out here from the basket and the wages: each year's basket cost, CPI, inflation rate (in percent, from year 1 on) and real wage. */
    correct: { costs: number[]; cpis: number[]; inflation: number[]; realWages: number[] };
}

export function runFrom(m: Message): PriceIndexRun {
    const years = m.wages.length;
    const yearList = Array.from({ length: years }, (_, year) => year);
    const costs = yearList.map((year) => basketCostOf(m.quantities, m.prices, year));
    const cpis = yearList.map((year) => cpiOf(costs, year));
    return {
        goods: [...m.goods],
        quantities: [...m.quantities],
        prices: m.prices.map((row) => [...row]),
        wages: [...m.wages],
        years,
        costs: [...m.costs],
        cpis: [...m.cpis],
        inflation: [...m.inflation],
        realWages: [...m.realWages],
        correct: {
            costs,
            cpis,
            inflation: yearList.slice(1).map((year) => percentChange(cpis[year - 1], cpis[year])),
            realWages: yearList.map((year) => deflate(m.wages[year], cpis[year])),
        },
    };
}

export class State {
    @observable accessor run: PriceIndexRun | null = null;

    public init = () => {
        this.run = null;
    };

    @action
    public onMessage = (m: Message) => {
        switch (m.type) {
            case "showPriceIndex":
                this.run = runFrom(m);
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
