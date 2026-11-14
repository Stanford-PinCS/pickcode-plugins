/**
 * Every message the student's code can send to this plugin.
 *
 * `n` and `p` are the number of trials and the probability of success. `probabilities[k]` is what the student's binomialProbability returned for P(X = k), for k = 0, 1, …, n. `outcomes[i]` is the number of successes in simulated session i, in the order the sessions ran.
 */
export type Message = {
    type: "showBinomial";
    n: number;
    p: number;
    probabilities: readonly number[];
    outcomes: readonly number[];
};
