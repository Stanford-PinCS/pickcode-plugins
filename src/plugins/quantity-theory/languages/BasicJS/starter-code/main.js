// This code follows Selvaro's money supply, price level and real output year by year.
// Change priceLevel and moneySupplyByYear to match the quantity theory of money.

// Selvaro's economy, at full employment. Amounts are in billions of dollars.
let money = 500;        // the money supply in year 0, M
let velocity = 4;       // times a dollar is spent on output in a year, V
let realOutput = 1000;  // real output, Y
let moneyGrowth = 5;    // the money supply's growth rate, in % a year
let years = 10;         // how many years to follow

// Returns the price level, P, from the equation of exchange M × V = P × Y.
function priceLevel(money, velocity, realOutput) {
    return money;
}

// Returns a list of the money supply in each year, from year 0 to the last year.
function moneySupplyByYear(money, moneyGrowth, years) {
    let supply = [money];
    for (let year = 1; year <= years; year++) {
        supply.push(money);
    }
    return supply;
}

// Find the money supply in each year, then draw the economy year by year.
let supply = moneySupplyByYear(money, moneyGrowth, years);
drawEconomy(supply, velocity, realOutput, priceLevel);
