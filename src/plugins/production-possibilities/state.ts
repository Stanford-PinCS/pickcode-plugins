import { action, observable } from "mobx";
import { Message } from "./messages";

/** What the student's describePoint can call a combination. */
export type Category = Message["answers"][number];

/** One combination of the two goods, in units. */
export interface Combination {
    consumption: number;
    capital: number;
}

/** Where a combination sits compared with a PPC, straight above or below it at the same consumption goods. */
export type Position = "on" | "inside" | "beyond";

/** Rounds to 9 decimal places, half up, so a floating-point leftover can't move a combination off the PPC. The hidden helpers round the most capital goods they hand describePoint the same way, in both languages. */
export const round9 = (v: number) => Math.floor(v * 1e9 + 0.5) / 1e9;

/** The opportunity cost of each additional unit of consumption goods: the capital goods given up from one row of the PPC table to the next. Item 0 is the 1st unit's. */
export function opportunityCostsOf(capitalGoods: readonly number[]): number[] {
    const costs: number[] = [];
    for (let i = 1; i < capitalGoods.length; i++) costs.push(capitalGoods[i - 1] - capitalGoods[i]);
    return costs;
}

/** The PPC's combinations after growth: every row of the table, (i, capitalGoods[i]), makes `growth` percent more of each good, which shifts the PPC outward. A growth of 0 gives the table itself. */
export function shiftedPpc(capitalGoods: readonly number[], growth: number): Combination[] {
    const factor = 1 + growth / 100;
    return capitalGoods.map((capital, units) => ({ consumption: units * factor, capital: capital * factor }));
}

/** The most capital goods on a PPC at an amount of consumption goods: the PPC's height there, on the straight line between the two rows around it, rounded with round9. The amount should be from 0 to the PPC's last row, where the PPC ends. The helpers allow an amount past it only by a floating-point leftover, and that gets the last row's height. */
export function mostCapitalAt(ppc: readonly Combination[], consumption: number): number {
    for (let i = 1; i < ppc.length; i++) {
        if (consumption <= ppc[i].consumption) {
            const a = ppc[i - 1];
            const b = ppc[i];
            return round9(a.capital + ((consumption - a.consumption) * (b.capital - a.capital)) / (b.consumption - a.consumption));
        }
    }
    return round9(ppc[ppc.length - 1].capital);
}

/** On the PPC when a combination's capital goods equal the PPC's height at its consumption goods, inside it when they're fewer, and beyond it when they're more. */
export function positionOf(capital: number, mostCapital: number): Position {
    if (capital === mostCapital) return "on";
    return capital < mostCapital ? "inside" : "beyond";
}

/** One tested combination, with what the student's describePoint called it. */
export interface TestedPoint extends Combination {
    /** The height of the PPC after growth at this combination's consumption goods: what describePoint got as mostCapital. */
    mostCapital: number;
    /** Where the combination really sits compared with that PPC. */
    position: Position;
    /** What the student's describePoint returned. */
    answer: Category;
}

/** Everything the graph and the bottom row show for one run. */
export interface Possibilities {
    /** The PPC table before growth: row i is i units of consumption goods with capitalGoods[i] capital goods. */
    ppc: Combination[];
    /** The PPC after growth, or null when growth is 0 and the PPC hasn't moved. */
    shifted: Combination[] | null;
    /** What the student's opportunityCosts returned, one number per additional unit of consumption goods. Only a right function makes them the opportunity costs. */
    costs: number[];
    /** The opportunity cost of each additional unit, from the table: the reference the student's costs are checked against. */
    trueCosts: number[];
    /** How many percent more of each good the country can make after growth. */
    growth: number;
    points: TestedPoint[];
    /** How many tested combinations describePoint put in each group. */
    counts: Record<Category, number>;
}

export function analyze(m: Message): Possibilities {
    const ppc = m.capitalGoods.map((capital, consumption) => ({ consumption, capital }));
    const current = shiftedPpc(m.capitalGoods, m.growth);
    const points = m.points.map((p, i) => {
        const mostCapital = mostCapitalAt(current, p.consumption);
        return { consumption: p.consumption, capital: p.capital, mostCapital, position: positionOf(p.capital, mostCapital), answer: m.answers[i] };
    });
    const counts: Record<Category, number> = { efficient: 0, inefficient: 0, unattainable: 0 };
    for (const p of points) counts[p.answer] += 1;
    return {
        ppc,
        shifted: m.growth > 0 ? current : null,
        costs: [...m.costs],
        trueCosts: opportunityCostsOf(m.capitalGoods),
        growth: m.growth,
        points,
        counts,
    };
}

export class State {
    @observable accessor possibilities: Possibilities | null = null;

    public init = () => {
        this.possibilities = null;
    };

    @action
    public onMessage = (m: Message) => {
        switch (m.type) {
            case "showPossibilities":
                this.possibilities = analyze(m);
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
