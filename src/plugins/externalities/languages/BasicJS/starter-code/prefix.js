// Hidden helper. Calls the three functions at every whole quantity from 0 to 40 tons a day, uses a loop to find the market quantity (where MPB = MPC + tax) and the socially optimal quantity (where MSB = MSC), adds up the deadweight loss between them, and sends it all to the graph on the right.
function drawMarket(marginalPrivateBenefit, marginalPrivateCost, marginalSocialCost, tax) {
    const MAX_QUANTITY = 40;
    const inputs = [
        ["marginalPrivateBenefit", marginalPrivateBenefit, "first"],
        ["marginalPrivateCost", marginalPrivateCost, "second"],
        ["marginalSocialCost", marginalSocialCost, "third"],
    ];
    for (const [name, f, place] of inputs) {
        if (typeof f !== "function") {
            throw new Error(`drawMarket needs your ${name} function as its ${place} input.`);
        }
    }
    if (typeof tax !== "number" || !Number.isFinite(tax)) {
        throw new Error(`tax should be a number of dollars, like 0 or 20, but it is ${describe(tax)}.`);
    }

    function describe(value) {
        if (typeof value === "string") return JSON.stringify(value.length > 40 ? value.slice(0, 40) + "…" : value);
        return String(value);
    }

    // Calls one of the functions at one quantity and checks that it gave back a number of dollars.
    function ask(f, name, quantity) {
        const value = f(quantity);
        if (value === undefined) {
            throw new Error(`${name}(${quantity}) returned undefined. Make sure ${name} ends with a return line.`);
        }
        if (typeof value === "function" || typeof value === "string") {
            const kind = typeof value === "function" ? "a function" : "text";
            throw new Error(`${name}(${quantity}) returned ${kind}, not a number. To use another function's result, call it with its input, like marginalPrivateCost(quantity).`);
        }
        if (typeof value !== "number" || !Number.isFinite(value)) {
            throw new Error(`${name} should return a number of dollars, but ${name}(${quantity}) returned ${describe(value)}.`);
        }
        return value;
    }

    const quantities = [];
    const benefit = [];
    const privateCost = [];
    const socialCost = [];
    for (let quantity = 0; quantity <= MAX_QUANTITY; quantity++) {
        quantities.push(quantity);
        benefit.push(ask(marginalPrivateBenefit, "marginalPrivateBenefit", quantity));
        privateCost.push(ask(marginalPrivateCost, "marginalPrivateCost", quantity));
        socialCost.push(ask(marginalSocialCost, "marginalSocialCost", quantity));
    }
    // With a per-unit tax, one more ton costs the mills its MPC plus the tax.
    const taxedCost = privateCost.map((cost) => cost + tax);

    // The first quantity where the cost of one more ton is no longer below its benefit (MPB, which is also MSB). Between two whole quantities the lines are straight, so the crossing between them is found exactly. It's 0 if even the first ton costs at least what it's worth, and null if the cost stays below the benefit all the way to MAX_QUANTITY.
    function crossing(cost) {
        if (benefit[0] <= cost[0]) return 0;
        for (let i = 1; i < quantities.length; i++) {
            if (benefit[i] <= cost[i]) {
                const before = benefit[i - 1] - cost[i - 1];
                const after = benefit[i] - cost[i];
                return quantities[i - 1] + (before / (before - after)) * (quantities[i] - quantities[i - 1]);
            }
        }
        return null;
    }

    const marketQuantity = crossing(taxedCost);
    if (marketQuantity === null) {
        throw new Error(`MPB stays above MPC + tax at every quantity up to ${MAX_QUANTITY} tons, so the market quantity is past the right edge of the graph. Try a tax of 0 or more, and check that marginalPrivateBenefit and marginalPrivateCost are the way they started.`);
    }
    const optimalQuantity = crossing(socialCost);
    if (optimalQuantity === null) {
        throw new Error(`Your MSC stays below MSB at every quantity up to ${MAX_QUANTITY} tons, so the socially optimal quantity is past the right edge of the graph. Check that marginalSocialCost adds externalCost to marginalPrivateCost(quantity).`);
    }

    // The deadweight loss is the area between MSC and MSB from one quantity to the other. Add it up one slice at a time: between two whole quantities the gap changes in a straight line, so each slice is a trapezoid.
    const low = Math.min(marketQuantity, optimalQuantity);
    const high = Math.max(marketQuantity, optimalQuantity);
    let deadweightLoss = 0;
    for (let i = 0; i < quantities.length - 1; i++) {
        const left = Math.max(low, quantities[i]);
        const right = Math.min(high, quantities[i + 1]);
        if (right > left) {
            const gapBefore = socialCost[i] - benefit[i];
            const gapAfter = socialCost[i + 1] - benefit[i + 1];
            const gapAt = (q) => gapBefore + (gapAfter - gapBefore) * ((q - quantities[i]) / (quantities[i + 1] - quantities[i]));
            deadweightLoss += ((gapAt(left) + gapAt(right)) / 2) * (right - left);
        }
    }

    showMarket(quantities, benefit, privateCost, socialCost, tax, marketQuantity, optimalQuantity, Math.abs(deadweightLoss));
}
