import { action, observable } from "mobx";
import { Message } from "./messages";

/** The marginal cost of each unit: the change in total cost from one output to the next. Index i holds the marginal cost of unit i + 1, since the 1st unit's cost is the change from totalCosts[0] to totalCosts[1]. */
export function marginalCostsOf(totalCosts: readonly number[]): number[] {
    const mc: number[] = [];
    for (let q = 1; q < totalCosts.length; q++) {
        mc.push(totalCosts[q] - totalCosts[q - 1]);
    }
    return mc;
}

/** Average total cost at an output of q ≥ 1 units: total cost divided by output. */
export function averageTotalCost(totalCosts: readonly number[], q: number): number {
    return totalCosts[q] / q;
}

/** Total variable cost at an output of q units: total cost minus the fixed cost, which is all of the total cost at zero output. */
export function totalVariableCost(totalCosts: readonly number[], q: number): number {
    return totalCosts[q] - totalCosts[0];
}

/** Average variable cost at an output of q ≥ 1 units: total variable cost divided by output. */
export function averageVariableCost(totalCosts: readonly number[], q: number): number {
    return totalVariableCost(totalCosts, q) / q;
}

/** The short-run shutdown rule (CED PRD-2.A.1): a firm that would produce q > 0 units shuts down, producing zero output, when its total revenue there is less than its total variable cost, which is the same as price below average variable cost. The hidden helper in each prefix applies this same comparison, and implementation.ts checks it. */
export function shutsDown(totalCosts: readonly number[], price: number, q: number): boolean {
    return q > 0 && price * q < totalVariableCost(totalCosts, q);
}

/** Everything the plot and the bottom row show for one run. Costs come from `totalCosts`, so only `yourMc`, `chosen` and `output` depend on the student's code. */
export interface Farm {
    totalCosts: number[];
    price: number;
    /** The number of units in the table: outputs run from 0 to `units`. */
    units: number;
    /** What the student's marginalCosts returned. Index i is their marginal cost of unit i + 1. */
    yourMc: number[];
    /** The correct marginal costs, for the dashed reference line. Index i is unit i + 1. */
    mc: number[];
    /** Average total cost and average variable cost at outputs 1 to `units`. Index i is output i + 1. */
    atc: number[];
    avc: number[];
    fixedCost: number;
    /** The output the student's chooseOutput returned. */
    chosen: number;
    /** What the farm produces: `chosen`, or 0 when the shutdown rule stopped it. */
    output: number;
    /** True when chooseOutput picked a positive output but total revenue there was less than total variable cost, so the farm shut down. */
    shutDown: boolean;
    /** Total revenue, total cost and profit (total revenue minus total cost) at `output`. */
    revenue: number;
    totalCost: number;
    profit: number;
}

export function summarizeFarm(totalCosts: readonly number[], price: number, yourMc: readonly number[], chosen: number, output: number): Farm {
    const units = totalCosts.length - 1;
    const outputs = Array.from({ length: units }, (_, i) => i + 1);
    const revenue = price * output;
    return {
        totalCosts: [...totalCosts],
        price,
        units,
        yourMc: [...yourMc],
        mc: marginalCostsOf(totalCosts),
        atc: outputs.map((q) => averageTotalCost(totalCosts, q)),
        avc: outputs.map((q) => averageVariableCost(totalCosts, q)),
        fixedCost: totalCosts[0],
        chosen,
        output,
        // implementation.ts already makes output 0 exactly when the rule says so; checking the rule here too keeps the shutdown label from ever contradicting the numbers.
        shutDown: output === 0 && shutsDown(totalCosts, price, chosen),
        revenue,
        totalCost: totalCosts[output],
        profit: revenue - totalCosts[output],
    };
}

export class State {
    @observable accessor farm: Farm | null = null;

    public init = () => {
        this.farm = null;
    };

    @action
    public onMessage = (m: Message) => {
        switch (m.type) {
            case "showFarm":
                this.farm = summarizeFarm(m.totalCosts, m.price, m.marginalCosts, m.chosen, m.output);
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
