/**
 * Every message the student's code can send to this plugin.
 *
 * `placements` is every `placeElectrons(subshell, count)` call the student's
 * loop made, in order. `subshell` is an index into the Aufbau order
 * (0 = 1s, 1 = 2s, 2 = 2p, ...).
 */
export type Message = {
    type: "showAtom";
    atomicNumber: number;
    placements: readonly { subshell: number; count: number }[];
};
