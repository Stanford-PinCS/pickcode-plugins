// Hidden helper. Walks up the demand schedule one price increase at a time. For each stretch between two neighboring prices it asks the student's elasticity function for the price elasticity of demand and their describe function for how demand is described there, then sends everything to the graphs on the right, which add the total revenue (price × quantity) at each price.
const RANGE_NAMES = ["elastic", "inelastic", "unit elastic"];
// The most total revenue the graphs can label: from $10,000 up they write it in short form, like $48K, and past this the short form stops being short.
const MAX_REVENUE = 1e15;

function walkDemand(prices, quantities, elasticity, describe, raises = []) {
    const show = (value) => (typeof value === "string" ? JSON.stringify(value) : String(value));
    if (!Array.isArray(prices) || !Array.isArray(quantities)) {
        throw new Error("walkDemand needs two lists of numbers: the prices first, then the quantities.");
    }
    if (prices.length !== quantities.length) {
        throw new Error(`The two lists should be the same length, one quantity for each price, but there are ${prices.length} prices and ${quantities.length} quantities.`);
    }
    if (prices.length < 3 || prices.length > 15) {
        throw new Error(`walkDemand needs from 3 to 15 prices, but it got ${prices.length}.`);
    }
    for (const value of [...prices, ...quantities]) {
        if (typeof value !== "number" || !Number.isFinite(value)) {
            throw new Error(`Every price and quantity should be a number, but one of them is ${show(value)}.`);
        }
        if (value <= 0) {
            throw new Error(`Every price and quantity should be more than 0, because percentage changes are measured from them, but one of them is ${value}.`);
        }
    }
    for (let i = 1; i < prices.length; i++) {
        if (prices[i] <= prices[i - 1]) {
            throw new Error(`The prices should go from lowest to highest, each one higher than the last, but $${prices[i]} comes after $${prices[i - 1]}.`);
        }
    }
    for (let i = 1; i < quantities.length; i++) {
        if (quantities[i] >= quantities[i - 1]) {
            throw new Error(`By the law of demand, the quantity demanded should fall as the price rises, but it's ${quantities[i - 1]} at $${prices[i - 1]} and ${quantities[i]} at $${prices[i]}.`);
        }
    }
    for (let i = 0; i < prices.length; i++) {
        if (!(prices[i] * quantities[i] <= MAX_REVENUE)) {
            throw new Error(`The total revenue at $${prices[i]} is ${prices[i]} × ${quantities[i]}, more than the graphs can show. Use smaller prices or quantities.`);
        }
    }
    if (typeof elasticity !== "function") {
        throw new Error("walkDemand needs your elasticity function as its third input.");
    }
    if (typeof describe !== "function") {
        throw new Error("walkDemand needs your describe function as its fourth input.");
    }
    if (!Array.isArray(raises)) {
        throw new Error("raises should be a list of prices, like [10, 25], or [] for none.");
    }
    for (const price of raises) {
        if (!prices.slice(0, -1).includes(price)) {
            throw new Error(`Every price in raises should be one of the prices in the list except the highest, which has no next price to raise it to, but ${show(price)} isn't.`);
        }
    }

    const elasticities = [];
    const ranges = [];
    for (let i = 0; i + 1 < prices.length; i++) {
        const change = `the price increase from $${prices[i]} to $${prices[i + 1]}`;
        const e = elasticity(prices[i], quantities[i], prices[i + 1], quantities[i + 1]);
        if (e === undefined) {
            throw new Error(`elasticity returned undefined for ${change}. Make sure it ends with a return line.`);
        }
        if (typeof e !== "number") {
            throw new Error(`elasticity should return a number, but it returned ${show(e)} for ${change}.`);
        }
        if (!Number.isFinite(e)) {
            throw new Error(`elasticity returned ${String(e)} for ${change}. Check that you never divide by 0.`);
        }
        const name = describe(e);
        if (name === undefined) {
            throw new Error(`describe returned undefined for an elasticity of ${e}. Make sure every case ends with a return line.`);
        }
        // "Unit-Elastic" and "unit elastic" name the same range.
        const range = typeof name === "string" ? name.trim().toLowerCase().replace(/[\s-]+/g, " ") : "";
        if (!RANGE_NAMES.includes(range)) {
            throw new Error(`describe returned ${show(name)} for an elasticity of ${e}. It should return "elastic", "inelastic" or "unit elastic".`);
        }
        elasticities.push(e);
        ranges.push(range);
    }
    showDemand(prices, quantities, elasticities, ranges, raises);
}
