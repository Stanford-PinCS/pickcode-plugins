// 100 pollsters each ask a random sample of students if they support a later start time.
// Change confidenceInterval so it builds a confidence interval from one pollster's sample.

// How many students each pollster asks.
let n = 200;
// The critical value z* for 90% confidence.
let zStar = 1.645;

// Returns a confidence interval [lower, upper] for p, the school-wide proportion in favor.
// pHat is the proportion who support it in one pollster's sample of n students.
function confidenceInterval(pHat, n, zStar) {
    let standardError = Math.sqrt(pHat * (1 - pHat) / n);
    let marginOfError = zStar * standardError;
    return [pHat - marginOfError, pHat + marginOfError];
}

// Each pollster takes a random sample of n students, finds pHat and calls your function.
runPolls(n, zStar, confidenceInterval);
