/**
 * Every message the student's code can send to this plugin.
 *
 * `showReaction` carries one whole run of the hidden while loop, one entry
 * per frame: frame 0 is the starting mixture, every later frame is one pass
 * of the loop, except `addAt`, the frame where extra N2O4 was added (-1 when
 * none was). `answers[i]` is what chooseDirection returned for frame i.
 */
export type Message = {
    type: "showReaction";
    n2o4: readonly number[];
    no2: readonly number[];
    answers: readonly string[];
    K: number;
    addAt: number;
    stepLimit: number;
};
