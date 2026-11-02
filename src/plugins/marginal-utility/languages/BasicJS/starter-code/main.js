// Your choose function picks which fruit to buy each round.
// Change what it returns, then press Run again.

function choose(mu_a, p_a, mu_b, p_b) {
    // mu = marginal utility, p = price; _a = apple, _b = banana
    return "apple";
}

// Go shopping: optimize calls choose once for every fruit you buy.
optimize(choose);
