// This code tests a cereal company's claim that its boxes hold 500 grams on average.
// Change standardDeviation so it finds the sample standard deviation, s.

// Weights in grams of 12 boxes an inspector picked at random.
let weights = [497, 504, 493, 499, 490, 500, 496, 502, 494, 498, 492, 499];

// Returns the mean, x̄, of a list of values.
function mean(values) {
    let total = 0;
    for (let x of values) {
        total = total + x;
    }
    return total / values.length;
}

// Returns the sample standard deviation, s, of a list of values.
function standardDeviation(values) {
    return 1;
}

// Returns the test statistic t = (x̄ − μ0) / (s / √n).
function tStatistic(values, mu0) {
    let xBar = mean(values);
    let s = standardDeviation(values);
    return (xBar - mu0) / (s / Math.sqrt(values.length));
}

// Test H0: μ = 500 against Ha: μ ≠ 500 at α = 0.05.
runTest(weights, 500, "!=", tStatistic);
