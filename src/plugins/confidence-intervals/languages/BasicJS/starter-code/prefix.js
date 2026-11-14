// Hidden helper. 100 pollsters each take a random sample of n students from a school of 2,500, where 1,550 students (p = 0.62) support a later start time. Each finds pHat, the proportion of their sample who support it, and calls the student's confidenceInterval function. Then every interval and the true p go to the plot on the right.
function runPolls(n, zStar, confidenceInterval) {
    const SCHOOL_SIZE = 2500;
    const SUPPORTERS = 1550;
    const POLLSTERS = 100;

    if (typeof n !== "number" || !Number.isInteger(n) || n < 1 || n > SCHOOL_SIZE) {
        throw new Error(`n is how many students each pollster asks, so it should be a whole number from 1 to ${SCHOOL_SIZE}, but it is ${String(n)}.`);
    }
    if (typeof zStar !== "number" || !Number.isFinite(zStar) || zStar <= 0) {
        throw new Error(`zStar should be a positive number, like 1.96 for 95% confidence, but it is ${String(zStar)}.`);
    }
    if (typeof confidenceInterval !== "function") {
        throw new Error("runPolls needs your confidenceInterval function as its third input.");
    }

    const show = (value) => (Array.isArray(value) ? `[${value.map(String).join(", ")}]` : String(value));

    // One entry per student: 1 if they support a later start time, 0 if they don't.
    const school = [];
    for (let i = 0; i < SCHOOL_SIZE; i++) {
        school.push(i < SUPPORTERS ? 1 : 0);
    }

    const pHats = [];
    const intervals = [];
    for (let pollster = 0; pollster < POLLSTERS; pollster++) {
        // A simple random sample without replacement: swap n randomly chosen students to the front of the list.
        let yes = 0;
        for (let i = 0; i < n; i++) {
            const j = i + Math.floor(Math.random() * (SCHOOL_SIZE - i));
            [school[i], school[j]] = [school[j], school[i]];
            yes += school[i];
        }
        const pHat = yes / n;

        const result = confidenceInterval(pHat, n, zStar);
        if (result === undefined) {
            throw new Error("confidenceInterval returned nothing. It should end with a return line that gives a list of two numbers, [lower, upper].");
        }
        if (!Array.isArray(result) || result.length !== 2) {
            throw new Error(`confidenceInterval should return a list of two numbers, [lower, upper], but it returned ${show(result)}.`);
        }
        const [lower, upper] = result;
        if (typeof lower !== "number" || typeof upper !== "number") {
            throw new Error(`confidenceInterval returned ${show(result)} when pHat was ${pHat}, but both items should be numbers.`);
        }
        if (Number.isNaN(lower) || Number.isNaN(upper)) {
            throw new Error(`confidenceInterval returned ${show(result)} when pHat was ${pHat}. NaN means "not a number": check for a square root of a negative number.`);
        }
        if (!Number.isFinite(lower) || !Number.isFinite(upper)) {
            throw new Error(`confidenceInterval returned ${show(result)} when pHat was ${pHat}. Infinity usually means something was divided by 0.`);
        }
        if (lower > upper) {
            throw new Error(`confidenceInterval returned ${show(result)} when pHat was ${pHat}, but the lower limit should come first: [lower, upper].`);
        }
        pHats.push(pHat);
        intervals.push([lower, upper]);
    }

    showIntervals(SUPPORTERS / SCHOOL_SIZE, n, zStar, pHats, intervals);
}
