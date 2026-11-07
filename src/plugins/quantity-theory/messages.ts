/**
 * Every message the student's code can send to this plugin.
 *
 * `moneySupply` is the money supply in year 0, 1, 2, … from the student's moneySupplyByYear, in billions of dollars, so its index is the year. `velocity` and `realOutput` are the same every year. `priceLevels` is what the student's priceLevel function returned for each year. The plot works out each year's money growth and inflation rates from these two lists itself, so the bars always match the lines.
 */
export type Message = {
    type: "showEconomy";
    moneySupply: readonly number[];
    velocity: number;
    realOutput: number;
    priceLevels: readonly number[];
};
