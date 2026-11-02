// Your choose function picks which fruit to buy each round.
// Change what it returns, then press Run again.

function choose(mu_a, p_a, mu_b, p_b) {
    // mu = marginal utility, p = price; _a = apple, _b = banana
    let appleRatio = mu_a / p_a;
    let bananaRatio = mu_b / p_b;
    if (appleRatio > bananaRatio) {
        return "apple";
    } else {
        return "banana";
    }
}

// Go shopping: optimize calls choose once for every fruit you buy.
optimize(choose);
