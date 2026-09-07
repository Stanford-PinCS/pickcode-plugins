import type { Message } from "../../messages"
import type { Label } from "../../state"
const LABELS: readonly Label[] = ["cancer", "no-cancer"];
const FEATURE_MAX = 10;

/**
 * The boundary between student code and the plugin. Rules:
 *  - Never use `any` here. This is the one place untyped values enter the
 *    system, so it's the one place typing actually buys you something.
 *  - Validate and coerce; a student passing the wrong shape should get a
 *    clear error, not a blank chart.
 *  - The exported names are what students type. Short, plain words.
 *
 * Every error names the function, because the student sees it in the console
 * with no stack trace to read.
 *
 * This file keeps a little bookkeeping — how many cells exist, and which labels
 * have been recorded. Both are things the student did *through this file*, so
 * tracking them costs nothing and lets a wrong cell number or a too-early
 * predictCase() fail loudly instead of being silently dropped by state.
 */

/** Past this, cells no longer fit on the tray without overlapping. */
const MAX_CELLS = 25;

function toLabel(input: unknown, fnName: string): Label {
  const s = String(input).trim().toLowerCase().replace(/\s+/g, "-");
  if (!(LABELS as readonly string[]).includes(s)) {
    throw new Error(`${fnName}: label must be "${LABELS[0]}" or "${LABELS[1]}".`);
  }
  return s as Label;
}

function toFeature(input: unknown, fnName: string, argName: string): number {
  const n = Number(input);
  if (!Number.isFinite(n)) {
    throw new Error(`${fnName}: ${argName} must be a number.`);
  }
  if (n < 0 || n > FEATURE_MAX) {
    throw new Error(`${fnName}: ${argName} must be between 0 and ${FEATURE_MAX}.`);
  }
  return n;
}

const createExports = (sendMessage: (message: Message) => void) => {
  /** How many cells the student has brought in so far, so we can check numbers. */
  let cellCount = 0;
  /** Which labels have been recorded. The model needs at least one of each. */
  const recorded = new Set<Label>();

  
  /** A cell number the student typed. Must name a cell that actually exists. */
  const toTarget = (input: unknown, fnName: string): number => {
    const n = Number(input);
    if (!Number.isInteger(n) || n < 1) {
      throw new Error(`${fnName}: cell must be a whole number, like ${fnName}(1).`);
    }
    if (cellCount === 0) {
      throw new Error(`${fnName}: there are no cells yet. Call summonCells first.`);
    }
    if (n > cellCount) {
      throw new Error(`${fnName}: there is no cell ${n}. You have cells 1 to ${cellCount}.`);
    }
    return n;
  };

  /** The model can only draw a line once it has seen both kinds of cell. */
  const requireBothLabels = (fnName: string) => {
    const missing = LABELS.filter((l) => !recorded.has(l));
    if (missing.length > 0) {
      throw new Error(`${fnName}: add an example of a "${missing[0]}" cell first.`);
    }
  };

  return Promise.resolve({
    /** Bring new cells onto the tray. Adds to whatever is already there. */
    summonCells: (amount: unknown) => {
      const n = Number(amount);
      if (!Number.isInteger(n) || n < 1) {
        throw new Error("summonCells: amount must be a whole number, like summonCells(10).");
      }
      if (cellCount + n > MAX_CELLS) {
        throw new Error(`summonCells: the tray holds ${MAX_CELLS} cells at most.`);
      }
      cellCount += n;
      sendMessage({ type: "summonCells", amount: n });
    },

    /** Highlight one cell so its size and roundness can be read off the tray. */
    checkCell: (target: unknown) => {
      sendMessage({ type: "checkCell", target: toTarget(target, "checkCell") });
    },

    /** Record a measured, student-labelled cell into the dataset. */
    addExample: (
      target: unknown,
      size: unknown,
      roundness: unknown,
      label: unknown
    ) => {
      const t = toTarget(target, "addExample");
      const l = toLabel(label, "addExample");
      recorded.add(l);
      sendMessage({
        type: "addExample",
        target: t,
        size: toFeature(size, "addExample", "size"),
        roundness: toFeature(roundness, "addExample", "roundness"),
        label: l,
      });
    },

    /** Ask the model to label a cell, using everything recorded so far. */
    predictCase: (target: unknown) => {
      const t = toTarget(target, "predictCase");
      requireBothLabels("predictCase");
      sendMessage({ type: "predictCase", target: t });
    },

    /** Draw the model's dividing line on the graph. */
    showModel: () => {
      requireBothLabels("showModel");
      sendMessage({ type: "showModel" });
    },

    /** Reveal whether a cell really is cancerous, to check a prediction. */
    revealCancer: (target: unknown) => {
      sendMessage({ type: "revealCancer", target: toTarget(target, "revealCancer") });
    },
  });
};

export default createExports;
