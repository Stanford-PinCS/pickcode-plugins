import { Message } from "../../messages";

/**
 * ⚠️ Confirm this filename matches the existing plugins before copying —
 * the template was written without sight of the real filename.
 *
 * The boundary between student code and the plugin. Rules:
 *  - Never use `any` here. This is the one place untyped values enter the
 *    system, so it's the one place typing actually buys you something.
 *  - Validate and coerce; a student passing the wrong shape should get a
 *    clear error, not a blank chart.
 *  - The exported names are what students type. They follow the host
 *    language's convention (snake_case in Python), not TypeScript's.
 */

/** Student code may hand us a list, tuple, or iterable of numbers. */
function toNumbers(input: unknown, fnName: string): number[] {
  if (typeof input === "number") return [input];
  if (
    input == null ||
    typeof (input as Iterable<unknown>)[Symbol.iterator] !== "function"
  ) {
    throw new Error(`${fnName} expects a list of numbers.`);
  }
  const out = Array.from(input as Iterable<unknown>, (v, i) => {
    const n = Number(v);
    if (!Number.isFinite(n)) {
      throw new Error(`${fnName}: item ${i} is not a number.`);
    }
    return n;
  });
  return out;
}

function toNumber(input: unknown, fnName: string): number {
  const n = Number(input);
  if (!Number.isFinite(n)) throw new Error(`${fnName} expects a number.`);
  return n;
}

const createExports = (sendMessage: (message: Message) => void) => {
  return Promise.resolve({
    plotSeries: (values: unknown) => {
      sendMessage({
        type: "plotSeries",
        values: toNumbers(values, "plotSeries"),
      });
    },

    setReference: (value: unknown) => {
      sendMessage({
        type: "setReference",
        value: toNumber(value, "setReference"),
      });
    },
  });
};

export default createExports;
