// Hidden helper. Sorts the data, asks the student's median function for the median of the whole list and of each half (Q1 and Q3), and sends them to the dotplot and boxplot on the right.
function drawBoxplot(data, median) {
    if (!Array.isArray(data) || data.length < 4) {
        throw new Error("drawBoxplot needs a list of at least 4 numbers as its first input.");
    }
    for (const value of data) {
        if (typeof value !== "number" || !Number.isFinite(value)) {
            throw new Error(`Every value in the list should be a number, but one of them is ${String(value)}.`);
        }
    }
    if (typeof median !== "function") {
        throw new Error("drawBoxplot needs your median function as its second input.");
    }

    const sorted = [...data].sort((a, b) => a - b);
    // With an odd count, the middle value belongs to neither half.
    const half = Math.floor(sorted.length / 2);
    const lower = sorted.slice(0, half);
    const upper = sorted.slice(sorted.length - half);

    function ask(values, name) {
        const result = median([...values]);
        if (result === undefined) {
            throw new Error(`median returned undefined for ${name} (${values.length} values). A list index has to be a whole number from 0 to ${values.length - 1}.`);
        }
        if (typeof result !== "number" || !Number.isFinite(result)) {
            throw new Error(`median should return a number, but it returned ${String(result)} for ${name} (${values.length} values).`);
        }
        return result;
    }

    showBoxplot(sorted, ask(sorted, "the whole list"), ask(lower, "the lower half"), ask(upper, "the upper half"));
}
