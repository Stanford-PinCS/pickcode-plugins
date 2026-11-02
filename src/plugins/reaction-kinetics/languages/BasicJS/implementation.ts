import { Message } from "../../messages";

/**
 * The boundary between student code and the plugin. The visible helper
 * `runSimulation` (in prefix.js / prefix.py) runs the nested loops, calling
 * the student's `stepMolecule` function, and hands the plain results to
 * `showMolecules`.
 */

const MAX_MOLECULES = 2500;
const MAX_STEPS = 500;

const createExports = (sendMessage: (message: Message) => void) => {
  return Promise.resolve({
    /**
     * Draws the molecule grid and the amount-vs-time graph.
     *
     * @param reactedAt - for each molecule, the step it turned into B (0 = never)
     * @param numSteps  - how many one-second steps ran
     * @param k         - rate constant per second, for the rate-law curve
     */
    showMolecules: (reactedAt: unknown, numSteps: unknown, k: unknown) => {
      if (
        typeof numSteps !== "number" ||
        !Number.isInteger(numSteps) ||
        numSteps < 1 ||
        numSteps > MAX_STEPS
      ) {
        throw new Error(
          `numSteps should be a whole number from 1 to ${MAX_STEPS}, like 20 or 100.`
        );
      }
      if (typeof k !== "number" || !Number.isFinite(k) || k < 0 || k > 1) {
        throw new Error("k should be a number from 0 to 1, like 0.02.");
      }
      if (
        reactedAt == null ||
        typeof (reactedAt as Iterable<unknown>)[Symbol.iterator] !== "function"
      ) {
        throw new Error("showMolecules expects a list of step numbers.");
      }
      const steps = Array.from(reactedAt as Iterable<unknown>, (v) => {
        if (
          typeof v !== "number" ||
          !Number.isInteger(v) ||
          v < 0 ||
          v > numSteps
        ) {
          throw new Error(
            `showMolecules expects whole step numbers from 0 to ${numSteps}.`
          );
        }
        return v;
      });
      if (steps.length < 1 || steps.length > MAX_MOLECULES) {
        throw new Error(
          `numMolecules should be a whole number from 1 to ${MAX_MOLECULES}, like 100.`
        );
      }
      sendMessage({ type: "showMolecules", reactedAt: steps, numSteps, k });
    },
  });
};

export default createExports;
