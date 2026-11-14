import { action, observable } from "mobx";
import { Message } from "./messages";

/** The mean of a list: the sum of the values divided by how many there are. */
export function mean(values: readonly number[]): number {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** The least-squares regression line ŷ = a + bx: b = Σ(xᵢ − x̄)(yᵢ − ȳ) / Σ(xᵢ − x̄)², and a = ȳ − b·x̄ because the line passes through (x̄, ȳ). */
export function leastSquares(xs: readonly number[], ys: readonly number[]): { slope: number; intercept: number } {
    const xMean = mean(xs);
    const yMean = mean(ys);
    let top = 0;
    let bottom = 0;
    for (let i = 0; i < xs.length; i++) {
        top += (xs[i] - xMean) * (ys[i] - yMean);
        bottom += (xs[i] - xMean) ** 2;
    }
    const slope = top / bottom;
    return { slope, intercept: yMean - slope * xMean };
}

/** The correlation coefficient r of the points (xs[i], ys[i]), or null when every x or every y is the same and r isn't defined. */
export function correlation(xs: readonly number[], ys: readonly number[]): number | null {
    const xMean = mean(xs);
    const yMean = mean(ys);
    let sxy = 0;
    let sxx = 0;
    let syy = 0;
    for (let i = 0; i < xs.length; i++) {
        sxy += (xs[i] - xMean) * (ys[i] - yMean);
        sxx += (xs[i] - xMean) ** 2;
        syy += (ys[i] - yMean) ** 2;
    }
    return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : null;
}

/** Each point's residual from the line ŷ = intercept + slope · x: observed y minus predicted y. */
export function residuals(xs: readonly number[], ys: readonly number[], intercept: number, slope: number): number[] {
    return xs.map((x, i) => ys[i] - (intercept + slope * x));
}

/** The sum of the squares of a list of residuals. */
export function sumOfSquares(values: readonly number[]): number {
    return values.reduce((sum, v) => sum + v * v, 0);
}

/** Everything the plot shows for one run. `slope`, `intercept`, `residuals` and `sumSquares` belong to the student's line; `exact` is the least-squares line drawn dashed. */
export interface Fit {
    xs: number[];
    ys: number[];
    slope: number;
    intercept: number;
    xMean: number;
    yMean: number;
    residuals: number[];
    sumSquares: number;
    /** The correlation of the data. It doesn't depend on the line. Null when it isn't defined. */
    r: number | null;
    exact: { slope: number; intercept: number; sumSquares: number };
}

export function describeFit(xs: readonly number[], ys: readonly number[], slope: number, intercept: number): Fit {
    const exact = leastSquares(xs, ys);
    const own = residuals(xs, ys, intercept, slope);
    return {
        xs: [...xs],
        ys: [...ys],
        slope,
        intercept,
        xMean: mean(xs),
        yMean: mean(ys),
        residuals: own,
        sumSquares: sumOfSquares(own),
        r: correlation(xs, ys),
        exact: { ...exact, sumSquares: sumOfSquares(residuals(xs, ys, exact.intercept, exact.slope)) },
    };
}

/** A predicted response ŷ the student's code worked out for one x-value. */
export interface Prediction {
    x: number;
    predicted: number;
}

export class State {
    @observable accessor fit: Fit | null = null;
    @observable accessor prediction: Prediction | null = null;

    public init = () => {
        this.fit = null;
        this.prediction = null;
    };

    @action
    public onMessage = (m: Message) => {
        switch (m.type) {
            case "showRegression":
                this.fit = describeFit(m.xs, m.ys, m.slope, m.intercept);
                break;
            case "showPrediction":
                this.prediction = { x: m.x, predicted: m.predicted };
                break;
            default:
                assertNever(m);
        }
    };
}

/** Compile-time guarantee that the switch above handles every Message variant. */
function assertNever(x: never): never {
    throw new Error(`Unhandled message: ${JSON.stringify(x)}`);
}

export default State;
