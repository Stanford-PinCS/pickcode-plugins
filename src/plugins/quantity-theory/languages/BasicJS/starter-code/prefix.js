// Hidden helper. Checks the economy's numbers, runs the years by asking the student's priceLevel function for each year's price level, and sends everything to the plot on the right, which works out each year's money growth and inflation rates.
function drawEconomy(supply, velocity, realOutput, priceLevel) {
    // The plot can show money supplies, velocities, real outputs and price levels in these ranges, so every axis stays readable and every growth rate is a number.
    const MAX_YEARS = 50;
    const SMALLEST = 0.000001;
    const MAX_MONEY = 1000000;
    const MAX_VELOCITY = 100;
    const MAX_OUTPUT = 1000000;
    const MAX_PRICE_LEVEL = 100000000;

    // Shows a value the way the student wrote it, as Python does: text in quotes, lists in brackets, other objects as JSON, and a function by its name.
    function show(value) {
        if (typeof value === "string") return JSON.stringify(value);
        if (typeof value === "function") return value.name ? `the function ${value.name}` : "a function";
        if (Array.isArray(value)) return `[${value.map(show).join(", ")}]`;
        if (value !== null && typeof value === "object") {
            try {
                return JSON.stringify(value) ?? String(value);
            } catch {
                return String(value);
            }
        }
        return String(value);
    }

    if (supply === undefined) {
        throw new Error("drawEconomy needs a list of the money supply in each year, but it got undefined. Does moneySupplyByYear end with return supply?");
    }
    if (!Array.isArray(supply)) {
        throw new Error(`drawEconomy needs a list of the money supply in each year, but it got ${show(supply)}.`);
    }
    if (supply.length < 2 || supply.length > MAX_YEARS + 1) {
        throw new Error(`The list of money supplies should have one value for each year, from year 0 to a last year from 1 to ${MAX_YEARS}, so 2 to ${MAX_YEARS + 1} values. It has ${supply.length}.`);
    }
    supply.forEach((money, year) => {
        if (typeof money !== "number") {
            throw new Error(`Every money supply in the list should be a number, but the one for year ${year} is ${show(money)}.`);
        }
        // NaN fails every comparison and Infinity is past the limit, so this catches both.
        if (!(money >= SMALLEST && money <= MAX_MONEY)) {
            // A money supply that grew too big needs a smaller growth rate; one that shrank too far needs a rate closer to 0.
            let hint = "Check that your loop grows it by moneyGrowth percent a year.";
            if (year === 0) hint = "Start from a money supply in that range.";
            else if (money > MAX_MONEY) hint = "Check that your loop grows it by moneyGrowth percent a year, or try a smaller moneyGrowth or fewer years.";
            else if (money < SMALLEST) hint = "Check that your loop grows it by moneyGrowth percent a year, or try a moneyGrowth closer to 0 or fewer years.";
            throw new Error(`The money supply in year ${year} is ${show(money)}, but the plot can show money supplies from 0.000001 to ${MAX_MONEY} (billions of dollars). ${hint}`);
        }
    });
    if (typeof velocity !== "number" || !(velocity > 0 && velocity <= MAX_VELOCITY)) {
        throw new Error(`velocity should be a number greater than 0 and at most ${MAX_VELOCITY}, but it's ${show(velocity)}.`);
    }
    if (typeof realOutput !== "number" || !(realOutput >= 1 && realOutput <= MAX_OUTPUT)) {
        throw new Error(`realOutput should be a number from 1 to ${MAX_OUTPUT}, but it's ${show(realOutput)}.`);
    }
    // The dashed line is the price level M × V ÷ Y, so it has to fit on the plot too. With the limits above it can't pass MAX_PRICE_LEVEL, but it can fall below SMALLEST.
    supply.forEach((money, year) => {
        const correct = money * velocity / realOutput;
        if (correct < SMALLEST) {
            // Velocity and real output are the same every year, so when year 0 is in range, a later year can only fall below it because the money supply shrank.
            const hint = year === 0 ? "Use a money supply, velocity and real output closer to the starting ones." : "Check that your loop grows the money supply by moneyGrowth percent a year, or try a moneyGrowth closer to 0 or fewer years, so it doesn't shrink so far.";
            throw new Error(`With these numbers, the price level M × V ÷ Y in year ${year} is ${show(correct)}, but the plot can show price levels from 0.000001 to ${MAX_PRICE_LEVEL}. ${hint}`);
        }
    });
    if (typeof priceLevel !== "function") {
        throw new Error("drawEconomy needs your priceLevel function as its last input.");
    }

    // Run the years: each year's price level from that year's money supply. M × V ÷ Y is in range by now, so a price level out of range means priceLevel isn't returning it.
    const levels = supply.map((money, year) => {
        const level = priceLevel(money, velocity, realOutput);
        if (level === undefined) {
            throw new Error(`priceLevel returned undefined for year ${year}. Does it end with a return line?`);
        }
        if (typeof level !== "number" || Number.isNaN(level)) {
            throw new Error(`priceLevel should return a number, but it returned ${show(level)} for year ${year}.`);
        }
        if (level <= 0) {
            throw new Error(`priceLevel returned ${show(level)} for year ${year}, but a price level should be greater than 0. Check how you rearranged M × V = P × Y.`);
        }
        if (!(level >= SMALLEST && level <= MAX_PRICE_LEVEL)) {
            throw new Error(`priceLevel returned ${show(level)} for year ${year}, but the plot can show price levels from 0.000001 to ${MAX_PRICE_LEVEL}. Check how you rearranged M × V = P × Y.`);
        }
        return level;
    });

    showEconomy([...supply], velocity, realOutput, levels);
}
