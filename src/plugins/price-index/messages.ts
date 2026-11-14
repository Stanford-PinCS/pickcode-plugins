/**
 * Every message the student's code can send to this plugin.
 *
 * The basket is fixed: good `goods[i]` is bought in quantity `quantities[i]` every year, at price `prices[i][year]`, where year 0 is the base year. `wages[year]` is a worker's nominal wage that year. The rest is what the student's functions returned: `costs[year]` from basketCost, `cpis[year]` from cpi, `inflation` from inflationRate for each year after the base year (so `inflation[0]` is for year 1, from the base year's CPI to year 1's), and `realWages[year]` from realWage.
 */
export type Message = {
    type: "showPriceIndex";
    goods: readonly string[];
    quantities: readonly number[];
    prices: readonly (readonly number[])[];
    wages: readonly number[];
    costs: readonly number[];
    cpis: readonly number[];
    inflation: readonly number[];
    realWages: readonly number[];
};
