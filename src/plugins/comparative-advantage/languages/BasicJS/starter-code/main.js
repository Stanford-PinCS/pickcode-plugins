// This code draws two countries' production possibilities curves and their trade.
// Change opportunityCost and whoMakesCorn to follow comparative advantage.

// The most each country can make in a year, in tons, if it makes only that good.
let arvia = { corn: 30, fish: 120 };
let bovia = { corn: 20, fish: 40 };

// The terms of trade: how many tons of fish trade for 1 ton of corn.
let fishPerCorn = 3;

// Returns how much of the other good is given up to make one more unit of this good.
function opportunityCost(maxOfThisGood, maxOfOtherGood) {
    return maxOfThisGood / maxOfOtherGood;
}

// Returns the country that should make corn: "Arvia" or "Bovia".
function whoMakesCorn(arviaCornCost, boviaCornCost) {
    // Arvia can make more corn than Bovia, so Arvia makes corn.
    return "Arvia";
}

// Each country makes only one good, then they trade 10 tons of corn for fish.
tradeAndCompare(arvia, bovia, fishPerCorn, opportunityCost, whoMakesCorn);
