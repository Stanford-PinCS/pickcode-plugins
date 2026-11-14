/**
 * Every message the student's code can send to this plugin.
 *
 * `values` is the data sorted from smallest to largest. `median`, `q1` and `q3` are what the student's median function returned for the whole list, its lower half and its upper half.
 */
export type Message = {
    type: "showBoxplot";
    values: readonly number[];
    median: number;
    q1: number;
    q3: number;
};
