// Hidden helper. Uses the student's opportunityCosts to find what each additional unit of consumption goods costs in capital goods, shifts the PPC outward by the growth, asks the student's describePoint about each combination, and sends it all to the graph on the right.
function drawPPC(capitalGoods, growth, points, opportunityCosts, describePoint) {
    // Limits that keep the graph readable: up to 20 units of consumption goods, table amounts up to 1000, growth from 0% to 100%, and up to 8 combinations with at most 2000 capital goods, the most a PPC can reach after 100% growth.
    const MAX_UNITS = 20;
    const MAX_AMOUNT = 1000;
    const MAX_POINT_CAPITAL = 2 * MAX_AMOUNT;
    const MAX_GROWTH = 100;
    const MAX_POINTS = 8;
    const ANSWERS = ["efficient", "inefficient", "unattainable"];
    // Shows a number with at most 2 decimals. toFixed rounds a tie away from zero, and the Python helper rounds the same way, so both languages show the same numbers.
    const fmt = (v) => String(Number(v.toFixed(2)));
    // Shows a value the way it looks in code, so a string "3" or a list [3] can't pass for the number 3. A list shows each of its items this way, so NaN and undefined in it don't turn into null, as JSON.stringify would show them.
    const show = (v) => (Array.isArray(v) ? `[${v.map(show).join(", ")}]` : typeof v === "string" || (typeof v === "object" && v !== null) ? JSON.stringify(v) : String(v));
    const isNumber = (v) => typeof v === "number" && Number.isFinite(v);
    // "1st", "2nd", "3rd", "4th", ... "11th", "21st".
    const nth = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th")}`;
    // "0 units", "1 unit", "2 units".
    const unitsOf = (n) => `${n} unit${n === 1 ? "" : "s"}`;
    // Rounds to 9 decimals, so a floating-point leftover can't move a combination off the PPC.
    const round9 = (v) => Math.floor(v * 1e9 + 0.5) / 1e9;

    if (!Array.isArray(capitalGoods) || capitalGoods.length < 2 || capitalGoods.length > MAX_UNITS + 1) {
        throw new Error(`capitalGoods should be a list of 2 to ${MAX_UNITS + 1} numbers: the most capital goods Dovania can make with 0, 1, 2, ... units of consumption goods.`);
    }
    for (let i = 0; i < capitalGoods.length; i++) {
        const v = capitalGoods[i];
        if (!isNumber(v) || v < 0 || v > MAX_AMOUNT) {
            throw new Error(`Each amount in capitalGoods should be a number from 0 to ${MAX_AMOUNT}, but the one for ${unitsOf(i)} of consumption goods is ${show(v)}.`);
        }
        if (i > 0 && v >= capitalGoods[i - 1]) {
            throw new Error(`On a PPC, making more consumption goods means making fewer capital goods, so each amount in capitalGoods should be less than the one before it. But it goes from ${fmt(capitalGoods[i - 1])} to ${fmt(v)} at ${unitsOf(i)} of consumption goods.`);
        }
    }
    const units = capitalGoods.length - 1;
    // The table has to reach the most consumption goods Dovania can make, where it makes no capital goods, so the PPC meets both axes.
    if (capitalGoods[units] !== 0) {
        throw new Error(`The last amount in capitalGoods should be 0: when Dovania makes the most consumption goods it can, it makes no capital goods, so the PPC reaches the Consumption Goods axis. But the last amount is ${fmt(capitalGoods[units])}.`);
    }

    if (!isNumber(growth) || growth < 0 || growth > MAX_GROWTH) {
        throw new Error(`growth should be a number of percent from 0 to ${MAX_GROWTH}, but it is ${show(growth)}.`);
    }
    // The PPC after growth: every row of the table makes growth percent more of each good, which shifts the PPC outward. With no growth it's the table itself.
    const factor = 1 + growth / 100;
    const shifted = capitalGoods.map((capital, i) => ({ consumption: i * factor, capital: capital * factor }));
    // The most consumption goods on the PPC after growth. Messages show it rounded down to 2 decimals, so the amount they suggest is always allowed.
    const mostConsumption = round9(units * factor);
    const mostShown = fmt(Math.floor(mostConsumption * 100 + 1e-9) / 100);

    if (!Array.isArray(points) || points.length > MAX_POINTS) {
        throw new Error(`points should be a list of up to ${MAX_POINTS} combinations, each like [3, 20]: [consumption goods, capital goods].`);
    }
    for (const p of points) {
        if (!Array.isArray(p) || p.length !== 2 || !isNumber(p[0]) || !isNumber(p[1])) {
            throw new Error(`Each combination in points should be two numbers, like [3, 20]: [consumption goods, capital goods]. One of them is ${show(p)}.`);
        }
        const combination = `[${fmt(p[0])}, ${fmt(p[1])}]`;
        if (p[0] < 0 || p[1] < 0 || p[1] > MAX_POINT_CAPITAL) {
            throw new Error(`The combination ${combination} should have from 0 to ${mostShown} consumption goods and from 0 to ${MAX_POINT_CAPITAL} capital goods.`);
        }
        if (p[0] > mostConsumption) {
            throw new Error(`The combination ${combination} has more consumption goods than the PPC reaches (${mostShown}), so describePoint has no height of the PPC to compare it with. Use consumption goods from 0 to ${mostShown}.`);
        }
    }
    if (typeof opportunityCosts !== "function") {
        throw new Error("drawPPC needs your opportunityCosts function as its fourth input.");
    }
    if (typeof describePoint !== "function") {
        throw new Error("drawPPC needs your describePoint function as its fifth input.");
    }

    const costs = opportunityCosts([...capitalGoods]);
    if (!Array.isArray(costs) || costs.length !== units) {
        // A table with 2 rows has just 1 additional unit of consumption goods.
        const wanted = units === 1 ? "a list of 1 opportunity cost, the one for the 1st unit of consumption goods" : `a list of ${units} opportunity costs, one for each additional unit of consumption goods from the 1st to the ${nth(units)}`;
        throw new Error(`opportunityCosts should return ${wanted}, but it returned ${Array.isArray(costs) ? `a list of ${costs.length}` : show(costs)}.`);
    }
    costs.forEach((cost, i) => {
        if (!isNumber(cost)) {
            throw new Error(`opportunityCosts returned ${show(cost)} for the ${nth(i + 1)} unit of consumption goods, but each opportunity cost should be a number. A list index has to be a whole number from 0 to ${units}.`);
        }
        if (cost < 0) {
            throw new Error(`opportunityCosts returned ${fmt(cost)} for the ${nth(i + 1)} unit of consumption goods. An opportunity cost is the capital goods given up, so it can't be negative.`);
        }
        // Unit i + 1 starts from row i of the table, so it can give up at most the capital goods made there, and its drop on the graph ends at 0 or above.
        if (cost > capitalGoods[i]) {
            throw new Error(`opportunityCosts returned ${fmt(cost)} for the ${nth(i + 1)} unit of consumption goods, but with ${unitsOf(i)} of consumption goods, the most capital goods Dovania can make is ${fmt(capitalGoods[i])}, so it can't give up more than that.`);
        }
    });

    // The height of the PPC after growth at an amount of consumption goods: the most capital goods possible with it, on the straight line between the two rows around it. An amount past the last row by a floating-point leftover gets the last row's height.
    function mostCapitalAt(consumption) {
        for (let i = 1; i < shifted.length; i++) {
            if (consumption <= shifted[i].consumption) {
                const a = shifted[i - 1];
                const b = shifted[i];
                return round9(a.capital + ((consumption - a.consumption) * (b.capital - a.capital)) / (b.consumption - a.consumption));
            }
        }
        return round9(shifted[units].capital);
    }

    const answers = points.map(([consumption, capital]) => {
        const answer = describePoint(capital, mostCapitalAt(consumption));
        if (!ANSWERS.includes(answer)) {
            throw new Error(`describePoint should return "efficient", "inefficient" or "unattainable", but for the combination [${fmt(consumption)}, ${fmt(capital)}] it returned ${show(answer)}.`);
        }
        return answer;
    });

    showPossibilities(capitalGoods, costs, growth, points, answers);
}
