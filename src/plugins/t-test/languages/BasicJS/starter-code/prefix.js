// Hidden helpers. runTest asks the student's mean, standardDeviation and tStatistic about one sample and sends the test to the plots on the right, which find the p-value from the t-distribution with df = n − 1.
// simulateTests draws many random samples from a population where H0 is true, asks the student's functions about each one, and sends them all to the plots, which count how often the test rejects H0.

// How many samples simulateTests draws.
const SIMULATED_SAMPLES = 1000;
// The simulated boxes' weights follow a normal distribution with mean μ0 and this standard deviation, in grams.
const POPULATION_SD = 4;

function checkAlternative(alternative, helper) {
    if (alternative !== "!=" && alternative !== "<" && alternative !== ">") {
        throw new Error(`${helper} needs the alternative hypothesis as "!=" (for Ha: μ ≠ μ0), "<" (for Ha: μ < μ0) or ">" (for Ha: μ > μ0), but it got ${JSON.stringify(alternative)}.`);
    }
}

function checkMu0(mu0, helper) {
    if (typeof mu0 !== "number" || !Number.isFinite(mu0)) {
        throw new Error(`${helper} needs μ0, the mean in the null hypothesis, as a number, like 500.`);
    }
}

function checkFunctions(tStatistic, helper) {
    if (typeof tStatistic !== "function") {
        throw new Error(`${helper} needs your tStatistic function as its last input.`);
    }
    if (typeof mean !== "function" || typeof standardDeviation !== "function") {
        throw new Error(`${helper} uses your mean and standardDeviation functions, so keep both of them in your code.`);
    }
}

function checkResult(name, result, n) {
    if (result === undefined) {
        throw new Error(`${name} returned undefined for a sample of ${n} values. Make sure it ends with a return line.`);
    }
    if (typeof result !== "number" || !Number.isFinite(result)) {
        throw new Error(`${name} should return a number, but it returned ${String(result)} for a sample of ${n} values.`);
    }
    return result;
}

// Asks the student's functions for x̄, s and t of one sample.
function testOneSample(sample, mu0, tStatistic) {
    const n = sample.length;
    const xBar = checkResult("mean", mean([...sample]), n);
    const s = checkResult("standardDeviation", standardDeviation([...sample]), n);
    if (s < 0) {
        throw new Error(`standardDeviation returned ${s}, but a standard deviation can't be negative.`);
    }
    if (s === 0) {
        throw new Error("standardDeviation returned 0, and tStatistic divides by s / √n. s is 0 only when every value is the same.");
    }
    const t = checkResult("tStatistic", tStatistic([...sample], mu0), n);
    return { xBar, s, t };
}

function runTest(data, mu0, alternative, tStatistic) {
    if (!Array.isArray(data) || data.length < 2 || data.length > 500) {
        throw new Error("runTest needs a list of 2 to 500 numbers as its first input.");
    }
    for (const value of data) {
        if (typeof value !== "number" || !Number.isFinite(value)) {
            throw new Error(`Every value in the list should be a number, but one of them is ${String(value)}.`);
        }
    }
    checkMu0(mu0, "runTest");
    checkAlternative(alternative, "runTest");
    checkFunctions(tStatistic, "runTest");

    const { xBar, s, t } = testOneSample(data, mu0, tStatistic);
    showTest([...data], mu0, xBar, s, t, data.length - 1, alternative);
}

// A random weight from a normal distribution, by the Box–Muller method.
function randomNormal(center, sd) {
    const u = 1 - Math.random();
    const v = Math.random();
    return center + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function simulateTests(mu0, n, alternative, tStatistic) {
    checkMu0(mu0, "simulateTests");
    if (typeof n !== "number" || !Number.isInteger(n) || n < 2 || n > 100) {
        throw new Error("simulateTests needs the sample size, n, as a whole number from 2 to 100, like 12.");
    }
    checkAlternative(alternative, "simulateTests");
    checkFunctions(tStatistic, "simulateTests");

    const means = [];
    const tValues = [];
    for (let i = 0; i < SIMULATED_SAMPLES; i++) {
        const sample = [];
        for (let j = 0; j < n; j++) {
            sample.push(randomNormal(mu0, POPULATION_SD));
        }
        const { xBar, t } = testOneSample(sample, mu0, tStatistic);
        means.push(xBar);
        tValues.push(t);
    }
    showSimulation(mu0, n, n - 1, alternative, means, tValues);
}
