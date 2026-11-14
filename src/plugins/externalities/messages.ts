/**
 * Every message the student's code can send to this plugin.
 *
 * drawMarket called the three functions at each of `quantities` (tons of paper a day). `benefit[i]` is the marginal private benefit there, which is also the marginal social benefit, `privateCost[i]` the marginal private cost and `socialCost[i]` the marginal social cost the student's function returned, all in dollars per ton. `tax` is the per-unit tax the mills pay on each ton.
 *
 * `marketQuantity` is where MPB meets MPC + tax, `optimalQuantity` is where MSB meets the student's MSC, and `deadweightLoss` is the area between MSB and MSC from one of those quantities to the other, in dollars a day.
 */
export type Message = {
    type: "showMarket";
    quantities: readonly number[];
    benefit: readonly number[];
    privateCost: readonly number[];
    socialCost: readonly number[];
    tax: number;
    marketQuantity: number;
    optimalQuantity: number;
    deadweightLoss: number;
};
