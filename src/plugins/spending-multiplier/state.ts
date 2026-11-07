import { action, observable } from "mobx";
import { Message } from "./messages";

type Policy = Message["policy"];

/** The marginal propensity to save. The sum of the MPC and the MPS is equal to one. */
export function marginalPropensityToSave(mpc: number): number {
    return 1 - mpc;
}

/** The expenditure multiplier, 1 ÷ (1 − MPC) = 1 ÷ MPS. The AP course description doesn't print this formula; it's the standard one, and the rounds of spending add up to it. */
export function expenditureMultiplier(mpc: number): number {
    return 1 / (1 - mpc);
}

/** The tax multiplier, −MPC ÷ (1 − MPC) = −MPC ÷ MPS. Also not printed in the AP course description. */
export function taxMultiplier(mpc: number): number {
    return -mpc / (1 - mpc);
}

/** Round 1's new spending: all of new government spending, but only the MPC share of a tax cut, which first adds to disposable income. */
export function firstRoundSpending(policy: Policy, amount: number, mpc: number): number {
    return policy === "spending" ? amount : mpc * amount;
}

/** The change in real GDP the multiplier predicts once every round is counted. A tax cut is a change in taxes of −amount, so its prediction is the tax multiplier × −amount. */
export function predictedChange(policy: Policy, amount: number, mpc: number): number {
    return policy === "spending" ? expenditureMultiplier(mpc) * amount : taxMultiplier(mpc) * -amount;
}

/** The correct running total after each of the first `rounds` rounds: round r adds the first round × MPC^(r − 1). */
export function correctTotals(firstRound: number, mpc: number, rounds: number): number[] {
    const totals: number[] = [];
    let spending = firstRound;
    let total = 0;
    for (let r = 1; r <= rounds; r++) {
        total += spending;
        totals.push(total);
        spending *= mpc;
    }
    return totals;
}

/** What a list of running totals added in each round: the change from the round before, counting from 0 before round 1. */
export function addedEachRound(totals: readonly number[]): number[] {
    return totals.map((total, i) => total - (i > 0 ? totals[i - 1] : 0));
}

/** Everything the plot and the bottom row show for one run. */
export interface Rounds {
    policy: Policy;
    /** The new government spending or the tax cut, in millions of dollars. */
    amount: number;
    mpc: number;
    mps: number;
    /** The expenditure multiplier for new spending, the tax multiplier for a tax cut. */
    multiplier: number;
    /** The multiplier's prediction for the total change in real GDP, in millions of dollars. */
    predicted: number;
    /** The student's total change in real GDP after round 1, 2, 3, …: what changeInGDP returned for 1 round, 2 rounds, 3 rounds, … */
    totals: number[];
    /** How much the student's total grew in each round. For a correct loop, that's each round's new spending. */
    added: number[];
    /** The student's total after the last round. */
    total: number;
}

export function summarizeRounds(policy: Policy, amount: number, mpc: number, totals: readonly number[]): Rounds {
    return {
        policy,
        amount,
        mpc,
        mps: marginalPropensityToSave(mpc),
        multiplier: policy === "spending" ? expenditureMultiplier(mpc) : taxMultiplier(mpc),
        predicted: predictedChange(policy, amount, mpc),
        totals: [...totals],
        added: addedEachRound(totals),
        total: totals[totals.length - 1],
    };
}

export class State {
    @observable accessor rounds: Rounds | null = null;

    public init = () => {
        this.rounds = null;
    };

    @action
    public onMessage = (m: Message) => {
        switch (m.type) {
            case "showRounds":
                this.rounds = summarizeRounds(m.policy, m.amount, m.mpc, m.totals);
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
