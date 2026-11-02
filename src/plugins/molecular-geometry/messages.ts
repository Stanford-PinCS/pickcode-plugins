/**
 * Every message the student's code can send to this plugin.
 *
 * `shape` is whatever the student's getShape function returned, as typed.
 */
export type Message = {
    type: "showMolecule";
    bondingPairs: number;
    lonePairs: number;
    shape: string;
};
