// This code draws Dovania's production possibilities curve (PPC) and tests points.
// Change opportunityCosts and describePoint so they match what the PPC shows.

// The most capital goods Dovania can make with 0, 1, 2, ... 5 consumption goods.
let capitalGoods = [30, 28, 25, 20, 12, 0];

// Economic growth: how many percent more of each good Dovania can make.
let growth = 0;

// Combinations to test, each [consumption goods, capital goods].
let points = [[3, 20], [1, 15], [4, 25], [5, 15]];

// Returns the opportunity cost of each additional unit of consumption goods.
function opportunityCosts(table) {
    let costs = [];
    for (let i = 1; i < table.length; i++) {
        // Spread the capital goods evenly over the units of consumption goods.
        costs.push(table[0] / (table.length - 1));
    }
    return costs;
}

// Describes a combination: "efficient", "inefficient" or "unattainable".
// mostCapital is the PPC's height at the combination's consumption goods.
function describePoint(capital, mostCapital) {
    return "efficient";
}

// Find the opportunity costs, shift the PPC by the growth, and test each combination.
drawPPC(capitalGoods, growth, points, opportunityCosts, describePoint);
