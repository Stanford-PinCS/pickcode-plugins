/**
 * Every message the student's code can send to this plugin.
 *
 * `policy` is the change the government makes: "spending" for more government spending, "taxCut" for a tax cut. `amount` is its size in millions of dollars and `mpc` the marginal propensity to consume. `totals` is what the student's changeInGDP function returned for 1 round, 2 rounds, 3 rounds and so on: the student's total change in real GDP after each round.
 */
export type Message = {
    type: "showRounds";
    policy: "spending" | "taxCut";
    amount: number;
    mpc: number;
    totals: readonly number[];
};
