// Hidden helper. Asks the student's marginalCosts for the marginal cost of each crate and their chooseOutput for how many crates to grow, applies the short-run shutdown rule at that output, and sends it all to the graph on the right.
function runFarm(totalCosts, price, marginalCosts, chooseOutput) {
    if (!Array.isArray(totalCosts) || totalCosts.length < 2 || totalCosts.length > 21) {
        throw new Error("runFarm needs totalCosts as its first input: a list of 2 to 21 total costs, for 0 crates, 1 crate, 2 crates and so on.");
    }
    for (const cost of totalCosts) {
        if (typeof cost !== "number" || !Number.isFinite(cost) || cost < 0) {
            throw new Error(`Every total cost should be a number of dollars, 0 or more, but one of them is ${describe(cost)}.`);
        }
    }
    if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
        throw new Error(`price should be a number of dollars, 0 or more, but it is ${describe(price)}.`);
    }
    if (typeof marginalCosts !== "function") {
        throw new Error("runFarm needs your marginalCosts function as its third input.");
    }
    if (typeof chooseOutput !== "function") {
        throw new Error("runFarm needs your chooseOutput function as its fourth input.");
    }

    // One marginal cost for each crate, from the 1st to the last.
    const crates = totalCosts.length - 1;
    const mc = marginalCosts([...totalCosts]);
    if (mc === undefined) {
        throw new Error("marginalCosts returned undefined. Make sure it ends with a return line.");
    }
    if (!Array.isArray(mc)) {
        throw new Error(`marginalCosts should return a list of numbers, but it returned ${describe(mc)}.`);
    }
    if (mc.length !== crates) {
        throw new Error(`marginalCosts should return ${crates} marginal costs, one for each crate from the 1st to the ${ordinal(crates)}, but it returned ${mc.length}.`);
    }
    mc.forEach((cost, i) => {
        // undefined or NaN comes from reading past the end of totalCosts, so point at the indexes; anything else just isn't a number.
        if (cost === undefined || Number.isNaN(cost)) {
            throw new Error(`marginalCosts returned ${describe(cost)} for the ${ordinal(i + 1)} crate. Check that every list index it uses is a whole number from 0 to ${crates}.`);
        }
        if (typeof cost !== "number" || !Number.isFinite(cost)) {
            throw new Error(`marginalCosts returned ${describe(cost)} for the ${ordinal(i + 1)} crate, but each marginal cost should be a number.`);
        }
    });

    const chosen = chooseOutput(price, [...mc]);
    if (chosen === undefined) {
        throw new Error("chooseOutput returned undefined. Make sure it ends with a return line.");
    }
    if (typeof chosen !== "number" || !Number.isInteger(chosen) || chosen < 0 || chosen > crates) {
        throw new Error(`chooseOutput should return a whole number of crates from 0 to ${crates}, but it returned ${describe(chosen)}.`);
    }

    // The short-run shutdown rule: at the chosen output, compare total revenue with total variable cost, which is the same as comparing the price with average variable cost. Total variable cost is total cost minus the fixed cost, the total cost of 0 crates. If revenue is less, the farm shuts down and grows 0 crates.
    let output = chosen;
    if (chosen > 0) {
        const revenue = price * chosen;
        const variableCost = totalCosts[chosen] - totalCosts[0];
        if (revenue < variableCost) {
            output = 0;
        }
    }
    showFarm(totalCosts, price, mc, chosen, output);
}

// Shows a value the way it looks in code: strings in quotes, and lists and objects with their brackets, so [17] doesn't read as 17.
function describe(value) {
    if (typeof value === "string") {
        return JSON.stringify(value);
    }
    if (typeof value === "function") {
        return "a function";
    }
    if (typeof value === "object" && value !== null) {
        try {
            return JSON.stringify(value) ?? String(value);
        } catch (e) {
            return String(value);
        }
    }
    return String(value);
}

function ordinal(n) {
    const teen = n % 100 >= 11 && n % 100 <= 13;
    const suffix = teen ? "th" : { 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th";
    return `${n}${suffix}`;
}
