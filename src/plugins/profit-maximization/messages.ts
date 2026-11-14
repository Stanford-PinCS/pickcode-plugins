/**
 * Every message the student's code can send to this plugin.
 *
 * `totalCosts` is the total cost of producing 0, 1, 2, … units, so `totalCosts[0]` is the fixed cost, and `price` is the market price of one unit. `marginalCosts` is what the student's marginalCosts function returned, one value per unit from the 1st, and `chosen` is what their chooseOutput function returned. `output` is what the firm produces after the hidden helper applied the short-run shutdown rule: `chosen`, or 0 when total revenue at `chosen` is less than total variable cost.
 */
export type Message = {
    type: "showFarm";
    totalCosts: readonly number[];
    price: number;
    marginalCosts: readonly number[];
    chosen: number;
    output: number;
};
