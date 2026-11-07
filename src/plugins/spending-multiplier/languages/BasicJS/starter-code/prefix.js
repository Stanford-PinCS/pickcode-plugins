// Hidden helper. Checks the numbers, asks the student's changeInGDP function for the total after 1 round, 2 rounds and so on, and sends the totals to the plot on the right.
function followRounds(policy, helperName, amount, mpc, rounds, changeInGDP) {
    // The largest a running total can be, so every dollar amount on the plot stays readable.
    const LIMIT = 1000000;

    // Shows a value the way the student wrote it: text in quotes and lists in brackets, as Python does.
    function show(value) {
        if (typeof value === "number" || value === undefined) return String(value);
        if (typeof value === "function") return "a function";
        if (Array.isArray(value)) return `[${value.map(show).join(", ")}]`;
        try {
            return JSON.stringify(value) ?? String(value);
        } catch {
            return String(value);
        }
    }

    const roundsText = (r) => `${r} round${r === 1 ? "" : "s"}`;

    const what = policy === "spending" ? "the new government spending" : "the tax cut";
    if (typeof amount !== "number" || !(amount >= 1 && amount <= 10000)) {
        throw new Error(`${helperName}'s first input, ${what} in millions of dollars, should be a number from 1 to 10000, but it's ${show(amount)}.`);
    }
    if (mpc === 1) {
        throw new Error("mpc should be less than 1. With an MPC of 1, each round's new spending would be as big as the round before, so the total would never level off. Try a number from 0 to 0.95.");
    }
    if (typeof mpc === "number" && mpc > 1 && mpc <= 100) {
        throw new Error(`mpc should be a share from 0 to 0.95, like 0.8 for 80%, but it's ${show(mpc)}.`);
    }
    if (typeof mpc !== "number" || !(mpc >= 0 && mpc <= 0.95)) {
        throw new Error(`mpc should be a number from 0 to 0.95, but it's ${show(mpc)}.`);
    }
    if (typeof rounds !== "number" || !Number.isInteger(rounds) || rounds < 1 || rounds > 50) {
        throw new Error(`rounds should be a whole number from 1 to 50, but it's ${show(rounds)}.`);
    }
    if (typeof changeInGDP !== "function") {
        throw new Error(`${helperName} needs your changeInGDP function as its last input.`);
    }

    // Round 1's new spending: the government spends all of its new spending, but people spend only the MPC share of a tax cut.
    const firstRound = policy === "spending" ? amount : mpc * amount;

    // The total after 1 round, 2 rounds and so on, so the plot can show the running total after every round.
    const totals = [];
    for (let r = 1; r <= rounds; r++) {
        const total = changeInGDP(firstRound, mpc, r);
        if (total === undefined) {
            throw new Error("changeInGDP should return the total change in real GDP, but it returned undefined. Does it end with return total?");
        }
        if (typeof total !== "number") {
            throw new Error(`changeInGDP should return a number, but it returned ${show(total)} for ${roundsText(r)}.`);
        }
        if (Number.isNaN(total)) {
            throw new Error(`changeInGDP returned ${show(total)} for ${roundsText(r)}, which isn't a number. Check that spending and total both start as numbers before the loop.`);
        }
        // Infinity is past the limit too, so this catches it.
        if (total > LIMIT) {
            throw new Error(`changeInGDP returned ${show(total)} for ${roundsText(r)}, but the total should be at most ${LIMIT}. Check that each round's spending gets smaller: multiply it by mpc.`);
        }
        if (total < 0) {
            throw new Error(`changeInGDP returned ${show(total)} for ${roundsText(r)}, but each round's new spending here is 0 or more, so the total should never be negative. Check how your loop adds to total.`);
        }
        // A round adds 0 or more, so the total after r rounds is never less than after r - 1 rounds. Adding a number that isn't negative never makes a sum smaller, so a correct loop never trips this.
        if (r > 1 && total < totals[totals.length - 1]) {
            throw new Error(`changeInGDP returned ${show(total)} for ${roundsText(r)}, less than the ${show(totals[totals.length - 1])} it returned for ${roundsText(r - 1)}. Each round's new spending is 0 or more, so the total should never go down. Check how your loop adds to total.`);
        }
        totals.push(total);
    }

    showRounds(policy, amount, mpc, totals);
}

// The government spends `amount` million dollars more. Round 1's new spending is all of it.
function spendMore(amount, mpc, rounds, changeInGDP) {
    followRounds("spending", "spendMore", amount, mpc, rounds, changeInGDP);
}

// The government cuts taxes by `amount` million dollars. Round 1's new spending is the MPC share of it.
function cutTaxes(amount, mpc, rounds, changeInGDP) {
    followRounds("taxCut", "cutTaxes", amount, mpc, rounds, changeInGDP);
}
