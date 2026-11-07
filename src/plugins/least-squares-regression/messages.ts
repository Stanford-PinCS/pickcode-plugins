/**
 * Every message the student's code can send to this plugin.
 *
 * `showRegression` draws the points (xs[i], ys[i]) and the line ŷ = intercept + slope · x, where `slope` is what the student's slope function returned. `showPrediction` marks the predicted response `predicted` at one x-value on that line.
 */
export type Message =
    | {
          type: "showRegression";
          xs: readonly number[];
          ys: readonly number[];
          slope: number;
          intercept: number;
      }
    | {
          type: "showPrediction";
          x: number;
          predicted: number;
      };
