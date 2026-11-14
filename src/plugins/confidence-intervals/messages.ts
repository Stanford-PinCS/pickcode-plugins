/**
 * Every message the student's code can send to this plugin.
 *
 * One run sends one message. Pollster i found the sample proportion `pHats[i]` from a random sample of `n` students, and the student's confidenceInterval function turned it into the interval from `lowers[i]` to `uppers[i]`. `p` is the true proportion for the whole school, which the pollsters don't know.
 */
export type Message = {
    type: "showIntervals";
    p: number;
    n: number;
    zStar: number;
    pHats: readonly number[];
    lowers: readonly number[];
    uppers: readonly number[];
};
