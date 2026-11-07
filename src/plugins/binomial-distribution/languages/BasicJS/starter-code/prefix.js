// Hidden helper. Asks the student's binomialProbability for P(X = k) for every k from 0 to n, simulates 10,000 sessions of n free throws, and sends both to the bar chart on the right.
function drawBinomial(n, p, binomialProbability) {
    const SESSIONS = 10000;
    if (typeof n !== "number" || !Number.isInteger(n) || n < 1 || n > 100) {
        throw new Error(`n is the number of free throws, so it should be a whole number from 1 to 100, but it is ${String(n)}.`);
    }
    if (typeof p !== "number" || !Number.isFinite(p) || p < 0 || p > 1) {
        throw new Error(`p is a probability, so it should be a number from 0 to 1, but it is ${String(p)}.`);
    }
    if (typeof binomialProbability !== "function") {
        throw new Error("drawBinomial needs the binomialProbability function as its third input.");
    }

    // The probability distribution from the student's functions: P(X = k) for every possible number of successes.
    const probabilities = [];
    for (let k = 0; k <= n; k++) {
        const value = binomialProbability(n, k, p);
        if (typeof value !== "number" || !Number.isFinite(value)) {
            throw new Error(`binomialProbability(${n}, ${k}, ${p}) returned ${String(value)}, not a number. Check that choose returns a number for every k from 0 to n.`);
        }
        probabilities.push(value);
    }

    // The simulation: in each session, each of the n shots goes in with probability p, independently of the others.
    const outcomes = [];
    for (let session = 0; session < SESSIONS; session++) {
        let made = 0;
        for (let shot = 0; shot < n; shot++) {
            if (Math.random() < p) made++;
        }
        outcomes.push(made);
    }

    showBinomial(n, p, probabilities, outcomes);
}
