// Hidden helper. Uses the student's opportunityCost to find what 1 ton of corn costs each country in fish, asks whoMakesCorn which country makes corn, has each country make only one good, trades 10 tons of corn for fish at the terms of trade, and sends it all to the graph on the right.
function tradeAndCompare(arvia, bovia, fishPerCorn, opportunityCost, whoMakesCorn) {
    const CORN_TRADED = 10;
    // The range of each country's amounts, in tons, so the graph can show them.
    const MIN_TONS = 1;
    const MAX_TONS = 1000;
    const fmt = (v) => String(Number(v.toFixed(2)));
    // Shows a value the way it looks in code, so a string "3" or a list [3] can't pass for the number 3 and an object like arvia shows its fields, not [object Object]. NaN, undefined and functions go through String, since JSON.stringify would show NaN as null.
    const show = (v) => (typeof v === "string" || (typeof v === "object" && v !== null) ? JSON.stringify(v) : String(v));
    const isNumber = (v) => typeof v === "number" && Number.isFinite(v);
    const isAmount = (v) => isNumber(v) && v > 0;

    for (const [name, max] of [["arvia", arvia], ["bovia", bovia]]) {
        if (typeof max !== "object" || max === null || !isNumber(max.corn) || !isNumber(max.fish)) {
            throw new Error(`${name} should look like { corn: 30, fish: 120 }, with the most corn and the most fish the country can make, each a number of tons from ${MIN_TONS} to ${MAX_TONS}.`);
        }
        for (const good of ["corn", "fish"]) {
            if (max[good] < MIN_TONS || max[good] > MAX_TONS) {
                throw new Error(`${name}'s amounts should each be from ${MIN_TONS} to ${MAX_TONS} tons, so the graph can show them, but its ${good} is ${fmt(max[good])}.`);
            }
        }
    }
    if (!isAmount(fishPerCorn)) {
        throw new Error(`fishPerCorn is the terms of trade, so it should be a number more than 0, but it is ${show(fishPerCorn)}.`);
    }
    if (typeof opportunityCost !== "function") {
        throw new Error("tradeAndCompare needs your opportunityCost function as its fourth input.");
    }
    if (typeof whoMakesCorn !== "function") {
        throw new Error("tradeAndCompare needs your whoMakesCorn function as its fifth input.");
    }

    // What 1 ton of corn costs a country, in tons of fish, from the student's function.
    function cornCost(max) {
        const cost = opportunityCost(max.corn, max.fish);
        if (!isNumber(cost)) {
            throw new Error(`opportunityCost(${max.corn}, ${max.fish}) should return a number, but it returned ${show(cost)}.`);
        }
        if (cost < 0) {
            throw new Error(`opportunityCost(${max.corn}, ${max.fish}) returned ${fmt(cost)}. An opportunity cost is an amount given up, so it can't be negative.`);
        }
        return cost;
    }
    const arviaCornCost = cornCost(arvia);
    const boviaCornCost = cornCost(bovia);

    const cornMaker = whoMakesCorn(arviaCornCost, boviaCornCost);
    if (cornMaker !== "Arvia" && cornMaker !== "Bovia") {
        throw new Error(`whoMakesCorn should return "Arvia" or "Bovia", but it returned ${show(cornMaker)}.`);
    }

    // The corn maker ships CORN_TRADED tons of corn, and the other country pays fishPerCorn tons of fish for each.
    const maker = cornMaker === "Arvia" ? arvia : bovia;
    const payerName = cornMaker === "Arvia" ? "Bovia" : "Arvia";
    const payer = cornMaker === "Arvia" ? bovia : arvia;
    if (maker.corn < CORN_TRADED) {
        throw new Error(`${cornMaker} makes only ${fmt(maker.corn)} tons of corn, so it can't ship ${CORN_TRADED}.`);
    }
    // The graph measures each country's gain against its own PPC at the corn it consumes, so the other country's PPC has to reach the corn it gets.
    if (payer.corn < CORN_TRADED) {
        throw new Error(`This lesson trades ${CORN_TRADED} tons of corn and compares what each country consumes with its own PPC at the same amount of corn, so both PPCs need to reach at least ${CORN_TRADED} tons of corn, but ${payerName}'s reaches only ${fmt(payer.corn)}.`);
    }
    // A little slack, so paying exactly all its fish isn't turned away by floating-point math.
    if (CORN_TRADED * fishPerCorn > payer.fish * (1 + 1e-9)) {
        throw new Error(`At ${fmt(fishPerCorn)} tons of fish per ton of corn, ${CORN_TRADED} tons of corn cost ${fmt(CORN_TRADED * fishPerCorn)} tons of fish, but ${payerName} can make only ${fmt(payer.fish)}.`);
    }

    showTrade(arvia.corn, arvia.fish, bovia.corn, bovia.fish, arviaCornCost, boviaCornCost, cornMaker, fishPerCorn, CORN_TRADED);
}
