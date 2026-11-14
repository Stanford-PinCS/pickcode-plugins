/** How the CED describes demand by the magnitude of its price elasticity: greater than 1 is elastic, less than 1 is inelastic, equal to 1 is unit elastic. */
export type Range = "elastic" | "unit elastic" | "inelastic";

/**
 * Every message the student's code can send to this plugin.
 *
 * `prices` and `quantities` are the demand schedule, prices from lowest to highest. Stretch i of the demand curve is the price increase from prices[i] to prices[i + 1]: `elasticities[i]` is what the student's elasticity function returned for it and `ranges[i]` what their describe function returned. `raises` lists the stretches, by i, whose price increase the student asked to test.
 */
export type Message = {
    type: "showDemand";
    prices: readonly number[];
    quantities: readonly number[];
    elasticities: readonly number[];
    ranges: readonly Range[];
    raises: readonly number[];
};
