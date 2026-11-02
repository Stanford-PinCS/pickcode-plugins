import { Message } from "../../messages";

/**
 * The boundary between student code and the plugin. The visible helper
 * `runReaction` (in prefix.js / prefix.py) calls the student's
 * `reactionsPossible` function and hands the plain numbers to `showReaction`.
 */

/** Biggest starting amount the particle picture can draw. */
const MAX_MOLES = 30;
/** Biggest number of reactions the particle picture can draw. */
const MAX_REACTIONS = 30;

function toMoles(input: unknown, name: string): number {
  if (typeof input !== "number" || !Number.isFinite(input)) {
    throw new Error(`${name} should be a number of moles, like 6.`);
  }
  if (input < 0 || input > MAX_MOLES) {
    throw new Error(
      `${name} is ${input}. Use a number of moles from 0 to ${MAX_MOLES}, like 6.`
    );
  }
  return input;
}

const createExports = (sendMessage: (message: Message) => void) => {
  return Promise.resolve({
    /**
     * Animates 2 H2 + O2 -> 2 H2O happening `reactions` times, starting from
     * `molesH2` and `molesO2`. Each molecule drawn stands for 1 mole.
     */
    showReaction: (molesH2: unknown, molesO2: unknown, reactions: unknown) => {
      const h2 = toMoles(molesH2, "molesH2");
      const o2 = toMoles(molesO2, "molesO2");
      if (typeof reactions !== "number" || !Number.isFinite(reactions)) {
        throw new Error(
          `reactionsPossible should return a number, but it returned ${String(reactions)}.`
        );
      }
      if (reactions < 0) {
        throw new Error(
          `reactionsPossible returned ${reactions}, but a reaction can't happen a negative number of times.`
        );
      }
      if (reactions > MAX_REACTIONS) {
        throw new Error(
          `reactionsPossible returned ${reactions}. That's more than ${MAX_REACTIONS} reactions, too many to draw. Check your math.`
        );
      }
      sendMessage({
        type: "showReaction",
        molesH2: h2,
        molesO2: o2,
        reactions,
        maxReactions: Math.min(h2 / 2, o2 / 1),
      });
    },
  });
};

export default createExports;
