// Hidden helper. Checks the two lists, asks the student's slope function for b, finds the intercept a = ȳ − b·x̄ (the least-squares line passes through the point (x̄, ȳ)), and sends the line to the scatterplot on the right.
let regressionDrawn = false;

function drawRegression(xs, ys, slope) {
    if (!Array.isArray(xs) || !Array.isArray(ys)) {
        throw new Error("drawRegression needs two lists of numbers: the x-values first, then the y-values.");
    }
    if (xs.length !== ys.length) {
        throw new Error(`The two lists should be the same length, one x-value and one y-value for each point, but there are ${xs.length} x-values and ${ys.length} y-values.`);
    }
    if (xs.length < 3) {
        throw new Error(`drawRegression needs at least 3 points, but it got ${xs.length}.`);
    }
    for (const value of [...xs, ...ys]) {
        if (typeof value !== "number" || !Number.isFinite(value)) {
            throw new Error(`Every value in the two lists should be a number, but one of them is ${typeof value === "string" ? JSON.stringify(value) : String(value)}.`);
        }
    }
    if (xs.every((x) => x === xs[0])) {
        throw new Error("All the x-values are the same, so no line can predict y from x. Use at least two different x-values.");
    }
    if (typeof slope !== "function") {
        throw new Error("drawRegression needs your slope function as its third input.");
    }

    const b = slope([...xs], [...ys]);
    if (b === undefined) {
        throw new Error("slope returned undefined. Make sure it ends with a return line.");
    }
    if (typeof b !== "number") {
        throw new Error(`slope should return a number, but it returned ${typeof b === "string" ? JSON.stringify(b) : String(b)}.`);
    }
    if (!Number.isFinite(b)) {
        throw new Error(`slope should return a number, but it returned ${String(b)}. Check that the sum you divide by isn't 0.`);
    }

    let xTotal = 0;
    let yTotal = 0;
    for (let i = 0; i < xs.length; i++) {
        xTotal += xs[i];
        yTotal += ys[i];
    }
    const a = yTotal / ys.length - b * (xTotal / xs.length);
    showRegression(xs, ys, b, a);
    regressionDrawn = true;
}

// Hidden helper. Marks the predicted response ŷ at one x-value on the line drawRegression drew.
function drawPrediction(x, predicted) {
    if (!regressionDrawn) {
        throw new Error("Call drawRegression before drawPrediction, so there's a line to predict from.");
    }
    if (typeof x !== "number" || !Number.isFinite(x)) {
        throw new Error(`drawPrediction needs an x-value that's a number as its first input, but it got ${String(x)}.`);
    }
    if (typeof predicted !== "number" || !Number.isFinite(predicted)) {
        throw new Error(`drawPrediction needs the predicted value as a number, but it got ${String(predicted)}.`);
    }
    showPrediction(x, predicted);
}
