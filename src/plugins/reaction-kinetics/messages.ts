/**
 * Every message the student's code can send to this plugin.
 */
export type Message = {
  type: "showMolecules";
  /**
   * One entry per molecule: the time step in which it turned from A into B,
   * or 0 if it was still A at the end.
   */
  reactedAt: readonly number[];
  /** How many time steps (seconds) the simulation ran. */
  numSteps: number;
  /** Rate constant, per second: the chance one A molecule reacts in one step. */
  k: number;
};
