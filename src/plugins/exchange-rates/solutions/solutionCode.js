// This code graphs the foreign exchange market for the pell, Pellia's currency.
// Change convert so it turns a price in pells into a price in quors.

// What four of Pellia's exports sell for in Pellia, in pells.
let prices = [20, 30, 50, 80];

// How far the demand for pells shifts, in millions of pells a day. 0 means no shift.
let demandShift = -100;

// Returns amount pells in quors, when one pell costs rate quors.
function convert(amount, rate) {
    return amount * rate;
}

// Returns the price of each export in quors, when one pell costs rate quors.
function pricesInQuors(prices, rate) {
    let result = [];
    for (let price of prices) {
        result.push(convert(price, rate));
    }
    return result;
}

// Find the exchange rate before and after the shift, then price the exports at each.
drawExchangeMarket(prices, demandShift, pricesInQuors);
