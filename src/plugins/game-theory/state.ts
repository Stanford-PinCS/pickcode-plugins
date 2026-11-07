import { action, observable } from "mobx";
import { Message } from "./messages";

/** A price, numbered the way the student's code numbers it: 0 is the high price (HIGH) and 1 is the low price (LOW). */
export type Price = 0 | 1;

/** One airline's payoffs as payoffs[myPrice][otherPrice]: its monthly profit, in thousands of dollars, when it charges myPrice and the other airline charges otherPrice. */
export type Table = readonly (readonly number[])[];

/** A cell of the payoff matrix: Gull's price, then Heron's. */
export type Cell = readonly [Price, Price];

export const PRICES: readonly Price[] = [0, 1];

/** The price that isn't `p`. */
export const otherPrice = (p: Price): Price => (p === 0 ? 1 : 0);

/** The two payoffs in one cell of the matrix, Gull's first and Heron's second, the way the CED's payoff matrices list them. Gull's table is indexed by Gull's price first and Heron's by Heron's price first. */
export function cellPayoffs(gull: Table, heron: Table, [g, h]: Cell): [number, number] {
    return [gull[g][h], heron[h][g]];
}

/** The best responses to one price of the other airline: the price whose payoff is higher, or both prices when their payoffs are equal. */
export function bestResponses(payoffs: Table, other: Price): Price[] {
    const high = payoffs[0][other];
    const low = payoffs[1][other];
    if (high === low) return [0, 1];
    return high > low ? [0] : [1];
}

/** The correct best responses to each of the other airline's prices, HIGH first. */
export function correctResponses(payoffs: Table): Price[][] {
    return PRICES.map((o) => bestResponses(payoffs, o));
}

/** The best responses the student's function found, one per price of the other airline, HIGH first. `picks[o]` is what it returned when the other airline charges o. When the two payoffs are equal, both prices are best responses whichever one it returned, so both count. */
export function yourResponses(payoffs: Table, picks: readonly Price[]): Price[][] {
    return PRICES.map((o) => (payoffs[0][o] === payoffs[1][o] ? [0, 1] : [picks[o]]));
}

/** A dominant strategy: the price whose payoff is always higher, whatever the other airline charges, given the best responses to each of its prices. Null when there isn't one, including when a tie means neither price is always higher. */
export function dominantStrategy(responses: readonly (readonly Price[])[]): Price | null {
    const [vsHigh, vsLow] = responses;
    return vsHigh.length === 1 && vsLow.length === 1 && vsHigh[0] === vsLow[0] ? vsHigh[0] : null;
}

/** The Nash equilibrium cells: Gull's price is a best response to Heron's and Heron's is a best response to Gull's, so neither airline can raise its payoff by changing its price alone. `gull[h]` holds Gull's best responses when Heron charges h, and `heron[g]` Heron's when Gull charges g. */
export function nashEquilibria(gull: readonly (readonly Price[])[], heron: readonly (readonly Price[])[]): Cell[] {
    const cells: Cell[] = [];
    for (const g of PRICES) {
        for (const h of PRICES) {
            if (gull[h].includes(g) && heron[g].includes(h)) cells.push([g, h]);
        }
    }
    return cells;
}

/** What one set of best responses says about the game: each airline's best responses, its dominant strategy (if any) and the Nash equilibrium cells. */
export interface Analysis {
    /** gull[h]: Gull's best responses when Heron charges h. */
    gull: Price[][];
    /** heron[g]: Heron's best responses when Gull charges g. */
    heron: Price[][];
    gullDominant: Price | null;
    heronDominant: Price | null;
    nash: Cell[];
}

export function analyze(gull: Price[][], heron: Price[][]): Analysis {
    return { gull, heron, gullDominant: dominantStrategy(gull), heronDominant: dominantStrategy(heron), nash: nashEquilibria(gull, heron) };
}

/** Everything the matrix shows for one run. `yours` comes from the prices the student's bestResponse returned; `correct` comes straight from the payoffs, for the dashed marks. */
export interface Game {
    gull: number[][];
    heron: number[][];
    gullPicks: Price[];
    heronPicks: Price[];
    yours: Analysis;
    correct: Analysis;
}

export function describeGame(gull: Table, heron: Table, gullPicks: readonly Price[], heronPicks: readonly Price[]): Game {
    return {
        gull: gull.map((row) => [...row]),
        heron: heron.map((row) => [...row]),
        gullPicks: [...gullPicks],
        heronPicks: [...heronPicks],
        yours: analyze(yourResponses(gull, gullPicks), yourResponses(heron, heronPicks)),
        correct: analyze(correctResponses(gull), correctResponses(heron)),
    };
}

/** A deal the two airlines make: the cell they agree on, what each earns there, and how much more each would earn by switching its own price while the other keeps the deal (negative when switching would earn less). */
export interface Deal {
    cell: Cell;
    profits: [number, number];
    gains: [number, number];
}

export function describeDeal(gull: Table, heron: Table, cell: Cell): Deal {
    const [g, h] = cell;
    const [gullProfit, heronProfit] = cellPayoffs(gull, heron, cell);
    return {
        cell,
        profits: [gullProfit, heronProfit],
        gains: [gull[otherPrice(g)][h] - gullProfit, heron[otherPrice(h)][g] - heronProfit],
    };
}

export class State {
    @observable accessor game: Game | null = null;
    @observable accessor deal: Deal | null = null;

    public init = () => {
        this.game = null;
        this.deal = null;
    };

    @action
    public onMessage = (m: Message) => {
        switch (m.type) {
            case "showGame":
                this.game = describeGame(m.gull, m.heron, m.gullPicks, m.heronPicks);
                // A new matrix starts without a deal; drawDeal marks one on it.
                this.deal = null;
                break;
            case "showDeal":
                if (this.game) this.deal = describeDeal(this.game.gull, this.game.heron, [m.gull, m.heron]);
                break;
            default:
                assertNever(m);
        }
    };
}

/** Compile-time guarantee that the switch above handles every Message variant. */
function assertNever(x: never): never {
    throw new Error(`Unhandled message: ${JSON.stringify(x)}`);
}

export default State;
