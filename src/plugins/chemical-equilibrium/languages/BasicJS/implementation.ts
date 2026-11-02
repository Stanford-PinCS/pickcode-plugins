import { Message } from "../../messages";

/**
 * The boundary between student code and the plugin. The hidden helper
 * (runReaction, in prefix.js / prefix.py) runs the while loop in the
 * student's language and hands the recorded frames to showReaction.
 */

const DIRECTIONS = ["forward", "reverse", "equilibrium"];

function toList(input: unknown, what: string): unknown[] {
  if (
    input == null ||
    typeof input === "string" ||
    typeof (input as Iterable<unknown>)[Symbol.iterator] !== "function"
  ) {
    throw new Error(`showReaction expects ${what} as a list.`);
  }
  return Array.from(input as Iterable<unknown>);
}

function toConcentrations(input: unknown, what: string): number[] {
  return toList(input, what).map((v) => {
    const n = Number(v);
    if (typeof v !== "number" || !Number.isFinite(n) || n < 0) {
      throw new Error(
        `showReaction expects ${what} as a list of concentrations of 0 or more.`
      );
    }
    return n;
  });
}

const createExports = (sendMessage: (message: Message) => void) => {
  return Promise.resolve({
    /**
     * Animates one run of the reaction N2O4 ⇌ 2NO2.
     *
     * @param n2o4Values - [N2O4] in mol/L at each frame
     * @param no2Values  - [NO2] in mol/L at each frame
     * @param answers    - what chooseDirection returned at each frame
     * @param K          - the equilibrium constant
     * @param addAt      - frame where extra N2O4 was added, or -1
     * @param stepLimit  - most passes one while loop may take
     */
    showReaction: (
      n2o4Values: unknown,
      no2Values: unknown,
      answers: unknown,
      K: unknown,
      addAt: unknown,
      stepLimit: unknown
    ) => {
      const n2o4 = toConcentrations(n2o4Values, "the N2O4 concentrations");
      const no2 = toConcentrations(no2Values, "the NO2 concentrations");
      const said = toList(answers, "the directions").map((a) => {
        if (typeof a !== "string" || !DIRECTIONS.includes(a)) {
          throw new Error(
            'showReaction expects each direction to be "forward", "reverse", or "equilibrium".'
          );
        }
        return a;
      });
      if (n2o4.length === 0 || n2o4.length !== no2.length || no2.length !== said.length) {
        throw new Error(
          "showReaction expects the same number of N2O4 values, NO2 values, and directions."
        );
      }
      if (n2o4.some((a, i) => a === 0 && no2[i] === 0)) {
        throw new Error("showReaction needs some N2O4 or NO2 in the container.");
      }
      const k = Number(K);
      if (typeof K !== "number" || !Number.isFinite(k) || k <= 0) {
        throw new Error("K should be a number greater than 0, like 0.36.");
      }
      const add = Number(addAt);
      if (!Number.isInteger(add) || add < -1 || add >= n2o4.length) {
        throw new Error("showReaction expects addAt to be a frame number, or -1.");
      }
      const limit = Number(stepLimit);
      if (!Number.isInteger(limit) || limit < 1) {
        throw new Error("showReaction expects stepLimit to be a whole number above 0.");
      }

      sendMessage({
        type: "showReaction",
        n2o4,
        no2,
        answers: said,
        K: k,
        addAt: add,
        stepLimit: limit,
      });
    },
  });
};

export default createExports;
