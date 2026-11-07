// Hidden helpers. drawGame checks the two payoff tables, asks the student's bestResponse function which price each airline picks for each price the other might charge, and sends the answers to the payoff matrix on the right. drawDeal marks a deal on that matrix.
let gameDrawn = false;

// How a value reads in an error message: a string in quotes, a list in brackets the way Python shows it, anything else as is.
function describeValue(value) {
    if (Array.isArray(value)) {
        return `[${value.map((item) => describeValue(item)).join(", ")}]`;
    }
    return typeof value === "string" ? JSON.stringify(value) : String(value);
}

function checkTable(table, name) {
    const shape = `${name} should be a list of 2 rows, one for each of its own prices, and each row a list of 2 profits, one for each price the other airline might charge.`;
    if (!Array.isArray(table) || table.length !== 2) {
        throw new Error(shape);
    }
    for (const row of table) {
        if (!Array.isArray(row) || row.length !== 2) {
            throw new Error(shape);
        }
        for (const value of row) {
            if (typeof value !== "number" || !Number.isFinite(value)) {
                throw new Error(`Every profit in ${name} should be a number, but one of them is ${describeValue(value)}.`);
            }
        }
    }
}

function drawGame(gull, heron, bestResponse) {
    checkTable(gull, "gull");
    checkTable(heron, "heron");
    if (typeof bestResponse !== "function") {
        throw new Error("drawGame needs your bestResponse function as its third input.");
    }

    const priceNames = ["HIGH", "LOW"];
    // Each call gets a copy of the table, so bestResponse can't change the payoffs that get drawn.
    function ask(table, airline, otherAirline, otherPrice) {
        const when = `for ${airline} when ${otherAirline} charges ${priceNames[otherPrice]}`;
        const result = bestResponse([[...table[0]], [...table[1]]], otherPrice);
        if (result === undefined) {
            throw new Error(`bestResponse returned undefined ${when}. Make sure it ends with a return line.`);
        }
        if (result !== 0 && result !== 1) {
            throw new Error(`bestResponse should return HIGH or LOW, but it returned ${describeValue(result)} ${when}.`);
        }
        return result;
    }

    const gullPicks = [ask(gull, "Gull", "Heron", 0), ask(gull, "Gull", "Heron", 1)];
    const heronPicks = [ask(heron, "Heron", "Gull", 0), ask(heron, "Heron", "Gull", 1)];
    showGame(gull, heron, gullPicks, heronPicks);
    gameDrawn = true;
}

function drawDeal(gullPrice, heronPrice) {
    if (!gameDrawn) {
        throw new Error("Call drawGame before drawDeal, so there's a payoff matrix to mark the deal on.");
    }
    if (gullPrice !== 0 && gullPrice !== 1) {
        throw new Error(`drawDeal needs Gull's price, HIGH or LOW, as its first input, but it got ${describeValue(gullPrice)}.`);
    }
    if (heronPrice !== 0 && heronPrice !== 1) {
        throw new Error(`drawDeal needs Heron's price, HIGH or LOW, as its second input, but it got ${describeValue(heronPrice)}.`);
    }
    showDeal(gullPrice, heronPrice);
}
