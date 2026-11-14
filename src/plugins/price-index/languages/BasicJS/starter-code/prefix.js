// Hidden helper. Checks the basket and the wages, asks the student's basketCost and cpi for every year's basket cost and CPI, inflationRate for the inflation rate of each year after the base year, and realWage for every year's real wage, and sends it all to the graphs on the right.
function measureInflation(basket, wages, basketCost, cpi, inflationRate, realWage) {
    // The limits that keep every number on the graphs readable: at most 10 goods, 2 to 6 years (the base year and up to 5 more), quantities from 0.01 to 10000, prices from $0.01 to $10,000, wages from $1 to $10,000, and every value your functions return within a trillion of 0.
    const MAX_GOODS = 10;
    const MIN_YEARS = 2;
    const MAX_YEARS = 6;
    const MIN_AMOUNT = 0.01;
    const MIN_WAGE = 1;
    const MAX_AMOUNT = 10000;
    const MAX_NAME = 40;
    const LIMIT = 1e12;
    const EXAMPLE = '{ good: "Bread", quantity: 100, prices: [3.00, 3.50, 4.00, 3.60] }';

    // Shows a value the way it looks in code, so a string "3" or a list [3] can't pass for the number 3 and a record shows its fields, not [object Object]. NaN, undefined and functions go through String, since JSON.stringify would show NaN as null.
    function show(value) {
        if (typeof value === "string" || (typeof value === "object" && value !== null)) {
            try {
                return JSON.stringify(value) ?? String(value);
            } catch {
                return String(value);
            }
        }
        return String(value);
    }
    const fmt = (v) => String(Number(v.toFixed(2)));
    const isNumber = (v) => typeof v === "number" && Number.isFinite(v);
    const yearName = (year) => (year === 0 ? "the base year" : `year ${year}`);

    if (!Array.isArray(basket) || basket.length < 1 || basket.length > MAX_GOODS) {
        throw new Error(`basket should be a list of 1 to ${MAX_GOODS} records, one for each good or service, like ${EXAMPLE}.`);
    }
    for (const item of basket) {
        if (typeof item !== "object" || item === null || Array.isArray(item)) {
            throw new Error(`Each item in basket should be a record like ${EXAMPLE}, but one of them is ${show(item)}.`);
        }
        if (typeof item.good !== "string" || item.good.trim() === "" || item.good.length > MAX_NAME) {
            throw new Error(`Each record in basket needs a good: its name in quotes, 1 to ${MAX_NAME} characters long. One record's good is ${show(item.good)}.`);
        }
        const name = show(item.good);
        if (!isNumber(item.quantity)) {
            throw new Error(`The quantity of ${name} should be a number, but it is ${show(item.quantity)}.`);
        }
        if (item.quantity < MIN_AMOUNT || item.quantity > MAX_AMOUNT) {
            throw new Error(`The quantity of ${name} should be from ${MIN_AMOUNT} to ${MAX_AMOUNT}, but it is ${fmt(item.quantity)}.`);
        }
        if (!Array.isArray(item.prices)) {
            throw new Error(`The prices of ${name} should be a list of its price in each year, but they are ${show(item.prices)}.`);
        }
        for (const price of item.prices) {
            if (!isNumber(price)) {
                throw new Error(`Every price of ${name} should be a number, but one of them is ${show(price)}.`);
            }
            if (price < MIN_AMOUNT || price > MAX_AMOUNT) {
                throw new Error(`Every price of ${name} should be from ${MIN_AMOUNT} to ${MAX_AMOUNT} dollars, but one of them is ${fmt(price)}.`);
            }
        }
    }
    const years = basket[0].prices.length;
    if (years < MIN_YEARS || years > MAX_YEARS) {
        throw new Error(`Each good needs ${MIN_YEARS} to ${MAX_YEARS} prices, one for each year from the base year on, but ${show(basket[0].good)} has ${years}.`);
    }
    for (const item of basket) {
        if (item.prices.length !== years) {
            throw new Error(`Every good needs a price for each year, but ${show(basket[0].good)} has ${years} prices and ${show(item.good)} has ${item.prices.length}.`);
        }
    }
    if (!Array.isArray(wages) || wages.length !== years) {
        throw new Error(`wages should be a list with one wage for each year, ${years} in all to match the prices, but it is ${show(wages)}.`);
    }
    for (const wage of wages) {
        if (!isNumber(wage)) {
            throw new Error(`Every wage should be a number, but one of them is ${show(wage)}.`);
        }
        if (wage < MIN_WAGE || wage > MAX_AMOUNT) {
            throw new Error(`Every wage should be from ${MIN_WAGE} to ${MAX_AMOUNT} dollars, but one of them is ${fmt(wage)}.`);
        }
    }
    for (const [name, fn] of [["basketCost", basketCost], ["cpi", cpi], ["inflationRate", inflationRate], ["realWage", realWage]]) {
        if (typeof fn !== "function") {
            throw new Error(`measureInflation needs your ${name} function, but it got ${show(fn)}.`);
        }
    }

    // Your functions get a copy of the basket, so they can't change the data the graphs check them against. The copy stops with a clear error when your code asks a record for a field it doesn't have, or a prices list for a year before year 0 or past its end, instead of quietly giving undefined.
    function basketCopy() {
        return basket.map((item) => {
            const prices = new Proxy([...item.prices], {
                get(target, key, receiver) {
                    if (typeof key === "string" && /^-?(0|[1-9]\d*)$/.test(key) && (key.startsWith("-") || Number(key) >= target.length)) {
                        throw new Error(`Your code asked for the price of ${show(item.good)} in year ${key}, but its prices only go from year 0 (the base year) to year ${target.length - 1}.`);
                    }
                    return Reflect.get(target, key, receiver);
                },
            });
            const record = { good: item.good, quantity: item.quantity, prices };
            return new Proxy(record, {
                get(target, key, receiver) {
                    // JSON.stringify asks for toJSON, await asks for then, and the site's console.log asks for nodeType and nodeName, so those aren't mistakes in your code.
                    if (typeof key === "string" && !(key in target) && !["toJSON", "then", "nodeType", "nodeName"].includes(key)) {
                        throw new Error(`Each record in basket has the fields good, quantity and prices, but your code asked for ${key}.`);
                    }
                    return Reflect.get(target, key, receiver);
                },
            });
        });
    }

    // Checks that one of your functions returned a number the graphs can draw, and says which call returned what if not.
    function check(value, call, what) {
        if (value === undefined) {
            throw new Error(`${call} returned undefined. Does your function end with a return line?`);
        }
        if (!isNumber(value)) {
            throw new Error(`${call} should return ${what}, a number, but it returned ${show(value)}.`);
        }
        if (Math.abs(value) > LIMIT) {
            throw new Error(`${call} returned ${fmt(value)}, more than a trillion away from 0, so the graphs can't draw it.`);
        }
        return value;
    }

    const yearList = Array.from({ length: years }, (_, year) => year);
    const costs = yearList.map((year) => {
        const call = `basketCost(basket, ${year})`;
        const value = check(basketCost(basketCopy(), year), call, `the basket's cost in ${yearName(year)}`);
        if (value < 0) {
            throw new Error(`${call} returned ${fmt(value)}, but a cost can't be less than $0.`);
        }
        return value;
    });
    if (costs[0] === 0) {
        throw new Error("basketCost(basket, 0) returned 0, but the CPI divides by the basket's cost in the base year, so that cost has to be more than $0.");
    }
    const cpis = yearList.map((year) => {
        const call = `cpi(basket, ${year})`;
        const value = check(cpi(basketCopy(), year), call, `the CPI in ${yearName(year)}`);
        if (value <= 0) {
            throw new Error(`${call} returned ${fmt(value)}, but a price index compares a year's cost with the base year's, so it should be more than 0.`);
        }
        return value;
    });
    const inflation = yearList.slice(1).map((year) => {
        const call = `inflationRate(${fmt(cpis[year - 1])}, ${fmt(cpis[year])})`;
        return check(inflationRate(cpis[year - 1], cpis[year]), call, `the inflation rate in year ${year}`);
    });
    const realWages = yearList.map((year) => {
        const call = `realWage(${fmt(wages[year])}, ${fmt(cpis[year])})`;
        const value = check(realWage(wages[year], cpis[year]), call, `the real wage in ${yearName(year)}`);
        if (value < 0) {
            throw new Error(`${call} returned ${fmt(value)}, but a wage can't be less than $0.`);
        }
        return value;
    });

    showPriceIndex(
        basket.map((item) => item.good),
        basket.map((item) => item.quantity),
        basket.map((item) => [...item.prices]),
        [...wages],
        costs,
        cpis,
        inflation,
        realWages
    );
}
