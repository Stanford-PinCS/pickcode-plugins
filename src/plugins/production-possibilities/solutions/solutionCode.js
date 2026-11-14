// This code draws Dovania's production possibilities curve (PPC) and tests points.
// Change opportunityCosts and describePoint so they match what the PPC shows.

// The most capital goods Dovania can make with 0, 1, 2, ... 5 consumption goods.
let capitalGoods = [30, 28, 25, 20, 12, 0];

// Economic growth: how many percent more of each good Dovania can make.
let growth = 25;

// Combinations to test, each [consumption goods, capital goods].
let points = [[3, 20], [1, 15], [4, 25], [5, 15]];

// Returns the opportunity cost of each additional unit of consumption goods.
function opportunityCosts(table) {
    let costs = [];
    for (let i = 1; i < table.length; i++) {
        // The capital goods given up to make unit i of consumption goods.
        costs.push(table[i - 1] - table[i]);
    }
    return costs;
}

// Describes a combination: "efficient", "inefficient" or "unattainable".
// mostCapital is the PPC's height at the combination's consumption goods.
function describePoint(capital, mostCapital) {
    if (capital === mostCapital) {
        return "efficient";
    } else if (capital < mostCapital) {
        return "inefficient";
    } else {
        return "unattainable";
    }
}

// Find the opportunity costs, shift the PPC by the growth, and test each combination.
drawPPC(capitalGoods, growth, points, opportunityCosts, describePoint);
