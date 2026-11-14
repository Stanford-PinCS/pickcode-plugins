import { Message } from "../../messages";

const MAX_POINTS = 500;

function toNumber(value: unknown, message: string): number {
    const n = Number(value);
    if (typeof value === "boolean" || value === null || value === undefined || !Number.isFinite(n)) {
        throw new Error(message);
    }
    return n;
}

/** Student code may hand us a list (or Python list proxy) of numbers. */
function toNumbers(input: unknown, name: string): number[] {
    if (input == null || typeof input === "string" || typeof (input as Iterable<unknown>)[Symbol.iterator] !== "function") {
        throw new Error(`showRegression expects the ${name} to be a list of numbers.`);
    }
    return Array.from(input as Iterable<unknown>, (v, i) => toNumber(v, `showRegression: item ${i} of the ${name} is not a number.`));
}

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        /**
         * Draws a scatterplot of the points (xs[i], ys[i]) and the line ŷ = intercept + slope · x, with each point's residual.
         *
         * @param xs        - The x-values (explanatory variable), from 3 to 500 numbers
         * @param ys        - The y-values (response variable), one for each x-value
         * @param slope     - The slope b of the student's line
         * @param intercept - The y-intercept a of the student's line
         */
        showRegression: (xs: unknown, ys: unknown, slope: unknown, intercept: unknown) => {
            const x = toNumbers(xs, "x-values");
            const y = toNumbers(ys, "y-values");
            if (x.length !== y.length) {
                throw new Error(`showRegression needs one y-value for each x-value, but it got ${x.length} x-values and ${y.length} y-values.`);
            }
            if (x.length < 3 || x.length > MAX_POINTS) {
                throw new Error(`showRegression needs from 3 to ${MAX_POINTS} points, but it got ${x.length}.`);
            }
            if (x.every((v) => v === x[0])) {
                throw new Error("showRegression needs at least two different x-values.");
            }
            const b = toNumber(slope, "showRegression: the slope should be a number.");
            const a = toNumber(intercept, "showRegression: the intercept should be a number.");
            sendMessage({ type: "showRegression", xs: x, ys: y, slope: b, intercept: a });
        },

        /**
         * Marks a predicted response on the line.
         *
         * @param x         - The x-value to predict at
         * @param predicted - The predicted response ŷ at that x-value
         */
        showPrediction: (x: unknown, predicted: unknown) => {
            const at = toNumber(x, "showPrediction: the x-value should be a number.");
            const yHat = toNumber(predicted, "showPrediction: the predicted value should be a number.");
            sendMessage({ type: "showPrediction", x: at, predicted: yHat });
        },
    });
};

export default createExports;
