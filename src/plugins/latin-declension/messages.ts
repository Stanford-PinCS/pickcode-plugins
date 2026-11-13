/**
 * Every message the student's code can send to this plugin.
 * The three arrays are the same length: one entry per word, in the order
 * the student wants them shown.
 */
export type Message = {
  type: "drawSentence";
  words: readonly string[];
  endings: readonly string[];
  roles: readonly string[];
};
