/**
 * Every message the student's code can send to this plugin.
 * The reaction is fixed: 2 H2 + O2 -> 2 H2O.
 */
export type Message = {
  type: "showReaction";
  /** Starting moles of each reactant. */
  molesH2: number;
  molesO2: number;
  /** How many times the student's code says the reaction happens. */
  reactions: number;
  /** How many times it really can happen: the smaller of H2 / 2 and O2 / 1. */
  maxReactions: number;
};
