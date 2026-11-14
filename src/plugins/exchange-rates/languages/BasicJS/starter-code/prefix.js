// Hidden helper. Finds the equilibrium exchange rate of the pell, where the quantity of pells demanded equals the quantity supplied, before and after the demand for pells shifts by demandShift. Calls pricesInQuors at each of the two exchange rates, checks every price it gives back, and sends it all to the graphs on the right.
function drawExchangeMarket(prices, demandShift, pricesInQuors) {
    // At an exchange rate of rate quors per pell, the quantity of pells demanded is 600 - 100 × rate and the quantity supplied is 200 + 100 × rate, in millions of pells a day.
    const DEMAND_AT_ZERO = 600;
    const DEMAND_SLOPE = -100;
    const SUPPLY_AT_ZERO = 200;
    const SUPPLY_SLOPE = 100;
    const MAX_SHIFT = 200;
    const MAX_PRICES = 6;
    const MIN_PRICE = 0.01;
    const MAX_PRICE = 1000;
    const MAX_QUORS = 1000000;

    // Shows a wrong value the way it looks in code: text in quotes and a list in brackets.
    function describe(value) {
        if (value === undefined) return "undefined";
        if (typeof value === "function") return "a function";
        if (typeof value === "number") return String(value);
        if (typeof value === "string" && value.length > 40) return JSON.stringify(value.slice(0, 40) + "…");
        return JSON.stringify(value);
    }

    if (!Array.isArray(prices) || prices.length < 1 || prices.length > MAX_PRICES) {
        throw new Error(`prices should be a list of 1 to ${MAX_PRICES} prices in pells, like [20, 30, 50, 80], but it is ${describe(prices)}.`);
    }
    for (const price of prices) {
        if (typeof price !== "number" || !Number.isFinite(price) || price < MIN_PRICE || price > MAX_PRICE) {
            throw new Error(`Every price should be a number of pells from ${MIN_PRICE} to ${MAX_PRICE}, but one of them is ${describe(price)}.`);
        }
    }
    if (typeof demandShift !== "number" || !Number.isInteger(demandShift) || Math.abs(demandShift) > MAX_SHIFT) {
        throw new Error(`demandShift should be a whole number of millions of pells a day from -${MAX_SHIFT} to ${MAX_SHIFT}, but it is ${describe(demandShift)}.`);
    }
    if (typeof pricesInQuors !== "function") {
        throw new Error("drawExchangeMarket needs your pricesInQuors function as its third input.");
    }

    // The exchange rate where the quantity of pells demanded equals the quantity supplied, once demand has shifted by shift.
    function equilibriumRate(shift) {
        return (DEMAND_AT_ZERO + shift - SUPPLY_AT_ZERO) / (SUPPLY_SLOPE - DEMAND_SLOPE);
    }

    // Asks pricesInQuors for the price in quors of every export at one exchange rate, and checks each price it gives back.
    function pricesAt(rate) {
        const result = pricesInQuors([...prices], rate);
        if (!Array.isArray(result)) {
            throw new Error(`pricesInQuors should return a list of prices in quors, but it returned ${describe(result)}. Make sure it ends with return result.`);
        }
        if (result.length !== prices.length) {
            throw new Error(`pricesInQuors should return one price in quors for each of the ${prices.length} prices, but it returned ${result.length}.`);
        }
        result.forEach((value, i) => {
            const which = `Your price in quors for ${prices[i]} pells, when one pell costs ${rate} quors,`;
            if (value === undefined) {
                throw new Error(`${which} is undefined. Make sure convert ends with a return line.`);
            }
            if (typeof value !== "number" || !Number.isFinite(value)) {
                throw new Error(`${which} is ${describe(value)}, but convert should return a number of quors.`);
            }
            if (value < 0 || value > MAX_QUORS) {
                throw new Error(`${which} is ${value}, but a price in quors should be from 0 to 1,000,000. Check the math in convert.`);
            }
        });
        return result;
    }

    const rateBefore = equilibriumRate(0);
    const rateAfter = equilibriumRate(demandShift);
    showExchangeMarket(DEMAND_AT_ZERO, DEMAND_SLOPE, SUPPLY_AT_ZERO, SUPPLY_SLOPE, demandShift, rateBefore, rateAfter, [...prices], pricesAt(rateBefore), pricesAt(rateAfter));
}
