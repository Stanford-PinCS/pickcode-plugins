// Hidden helper. Checks the orchard's numbers, asks the student's pickersToHire function how many pickers to hire, and sends everything to the plot on the right.
function runHiring(totalProduct, price, wage, pickersToHire) {
    // The largest a total product, the price or the wage can be, so every dollar amount on the plot stays readable.
    const LIMIT = 1000000;

    // Shows a value the way the student wrote it: text in quotes and lists in brackets, as Python does.
    function show(value) {
        if (typeof value === "string") return JSON.stringify(value);
        if (Array.isArray(value)) return `[${value.map(show).join(", ")}]`;
        return String(value);
    }

    if (!Array.isArray(totalProduct) || totalProduct.length < 2 || totalProduct.length > 21) {
        throw new Error("totalProduct should be a list of 2 to 21 numbers: the total product with 0 pickers, 1 picker, 2 pickers and so on.");
    }
    for (const value of totalProduct) {
        if (typeof value !== "number") {
            throw new Error(`Every value in totalProduct should be a number, but one of them is ${show(value)}.`);
        }
        // NaN fails every comparison and Infinity is past the limit, so this catches both.
        if (!(Math.abs(value) <= LIMIT)) {
            throw new Error(`Every value in totalProduct should be from -${LIMIT} to ${LIMIT}, but one of them is ${show(value)}.`);
        }
    }
    if (typeof price !== "number" || !(price > 0)) {
        throw new Error(`price should be a number greater than 0, but it's ${show(price)}.`);
    }
    if (price > LIMIT) {
        throw new Error(`price should be at most ${LIMIT}, but it's ${show(price)}.`);
    }
    if (typeof wage !== "number" || !(wage > 0)) {
        throw new Error(`wage should be a number greater than 0, but it's ${show(wage)}.`);
    }
    if (wage > LIMIT) {
        throw new Error(`wage should be at most ${LIMIT}, but it's ${show(wage)}.`);
    }
    if (typeof pickersToHire !== "function") {
        throw new Error("runHiring needs your pickersToHire function as its last input.");
    }

    // The table runs from 0 pickers to this many.
    const lastPicker = totalProduct.length - 1;
    // pickersToHire gets a copy of the table that stops with an error when the loop reads past its end, the way a Python list does, instead of giving undefined and quietly ending the loop.
    const table = new Proxy([...totalProduct], {
        get(target, key, receiver) {
            if (typeof key === "string" && /^(0|[1-9]\d*)$/.test(key) && Number(key) >= target.length) {
                throw new Error(`Your loop looked past the end of totalProduct, which only goes up to ${lastPicker} pickers. Make sure the loop stops by the last picker in the table.`);
            }
            return Reflect.get(target, key, receiver);
        },
    });
    const hired = pickersToHire(table, price, wage);
    if (hired === undefined) {
        throw new Error("pickersToHire should return how many pickers to hire, but it returned undefined. Does it end with return pickers?");
    }
    if (typeof hired !== "number" || !Number.isInteger(hired) || hired < 0 || hired > lastPicker) {
        throw new Error(`pickersToHire should return a whole number of pickers from 0 to ${lastPicker}, but it returned ${show(hired)}.`);
    }

    showHiring(totalProduct, price, wage, hired);
}
