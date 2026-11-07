// This code walks up a theater's demand curve, one price increase at a time.
// Change elasticity so it measures the price elasticity of demand, then fix describe.

// The theater's demand schedule: the quantity of tickets demanded at each price.
let prices = [15, 25, 35, 45, 55, 65];
let quantities = [130, 110, 90, 70, 50, 30];

// Price increases to test: each is a price the theater might raise to the next one.
let raises = [15, 35, 55];

// Returns the magnitude of the price elasticity of demand for a change from old to new.
function elasticity(oldPrice, oldQuantity, newPrice, newQuantity) {
    let averageQuantity = (oldQuantity + newQuantity) / 2;
    let averagePrice = (oldPrice + newPrice) / 2;
    let percentChangeQuantity = (newQuantity - oldQuantity) / averageQuantity * 100;
    let percentChangePrice = (newPrice - oldPrice) / averagePrice * 100;
    return Math.abs(percentChangeQuantity / percentChangePrice);
}

// Describes demand with elasticity e: "elastic", "inelastic" or "unit elastic".
function describe(e) {
    if (e > 1) {
        return "elastic";
    } else if (e < 1) {
        return "inelastic";
    } else {
        return "unit elastic";
    }
}

// Walk up the demand curve one price increase at a time, using your two functions.
walkDemand(prices, quantities, elasticity, describe, raises);
