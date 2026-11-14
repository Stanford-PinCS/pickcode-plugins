/** The alternative hypothesis: "!=" is Ha: μ ≠ μ0, "<" is Ha: μ < μ0, and ">" is Ha: μ > μ0. */
export type Alternative = "!=" | "<" | ">";

/**
 * Every message the student's code can send to this plugin.
 *
 * `showTest` is one test of the inspector's sample: `values` is the sample, `mu0` the mean in H0, and `xBar`, `s` and `t` what the student's mean, standardDeviation and tStatistic returned for it, with df = n − 1.
 *
 * `showSimulation` is many samples of size `n` drawn from a population where H0 is true: `means` holds each sample's x̄ and `tValues` each sample's test statistic, in the order the samples were drawn.
 */
export type Message =
    | {
          type: "showTest";
          values: readonly number[];
          mu0: number;
          xBar: number;
          s: number;
          t: number;
          df: number;
          alternative: Alternative;
      }
    | {
          type: "showSimulation";
          mu0: number;
          n: number;
          df: number;
          alternative: Alternative;
          means: readonly number[];
          tValues: readonly number[];
      };
