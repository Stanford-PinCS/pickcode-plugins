import { action, observable } from "mobx";
import { Message } from "./messages";

/**
 * All plugin state. No JSX, no formatting, no colors in this file.
 *
 * Rules:
 *  - Every field is `@observable accessor` with an explicit type and an
 *    initial value that is valid before the student runs anything.
 *  - `onMessage` is `@action` and is an exhaustive switch over `Message`.
 *  - Copy incoming arrays (`Array.from`) so MobX owns the reference.
 *  - Derived values that need no memoization live in Component.tsx.
 */
export const FEATURE_MAX = 10;
export const LABELS = ["cancer", "no-cancer"] as const;
export type Label = (typeof LABELS)[number];
const MIN_GAP = 0.20; // Here to avoid overlapping cells in the initial random placement.
const MAX_TRIES = 60;

/**
 * Summoned cells are drawn from a seeded generator rather than Math.random().
 * Every Play re-runs the student's code from scratch, so unseeded cells would
 * differ on every run — and a student who predicts cell 12, then adds a
 * revealCancer(12) line and runs again, would be revealing a different cell 12.
 *
 * Two streams, not one, so that tuning MIN_GAP or MAX_TRIES (which changes how
 * many draws placement consumes) doesn't also reshuffle every cell's size and
 * roundness. Change PLACE_SEED and the layout moves; change FEATURE_SEED and
 * the measurements move. They stay independent.
 */
const PLACE_SEED = 20260906;
const FEATURE_SEED = 71828182;

/** mulberry32: small, fast, no dependencies, good enough for scattering dots. */
function makeRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}


const STARTING_CELLS: readonly Omit<Cell, "cancerous">[] = [ // the first ten cells are pre-set
  { target: 1, size: 8, roundness: 6, x: 0.18, y: 0.30 },
  { target: 2, size: 3, roundness: 9, x: 0.47, y: 0.16 },
  { target: 3, size: 9, roundness: 7, x: 0.72, y: 0.31 },
  { target: 4, size: 2, roundness: 7, x: 0.83, y: 0.58 },
  { target: 5, size: 6, roundness: 6, x: 0.24, y: 0.78 },
  { target: 6, size: 4, roundness: 10, x: 0.56, y: 0.67 },
  { target: 7, size: 7, roundness: 8, x: 0.36, y: 0.48 },
  { target: 8, size: 3, roundness: 6, x: 0.91, y: 0.82 },
  { target: 9, size: 5, roundness: 8, x: 0.11, y: 0.52 },
  { target: 10, size: 9, roundness: 5, x: 0.68, y: 0.89 },
];

export interface Example {
  target: number;
  size: number;
  roundness: number;
  label: Label;
}

export interface Prediction {
  target: number;
  label: Label;
}

export interface Model {
  sizeWeight: number;
  roundnessWeight: number;
  bias: number;
}

export interface Cell {
  target: number; size: number; roundness: number;
  cancerous: boolean; x: number; y: number;
}

export class State {
  @observable accessor example: Example[] = [];
  @observable accessor prediction: Prediction[] = [];
  @observable accessor cells: Cell[] = [];
  @observable accessor modelShown: boolean = false;
  @observable accessor revealed: number[] = [];
  @observable accessor checked: number[] = [];

  /**
   * Not observable: nothing renders the generators, and rewinding them is a
   * side effect of init rather than a change the view should react to.
   */
  private placeRandom: () => number = makeRandom(PLACE_SEED);
  private featureRandom: () => number = makeRandom(FEATURE_SEED);

  /** Runs once before the student's code. Reset anything stateful here. */
    /** Runs once before the student's code. Reset anything stateful here. */
  public init = () => {
    this.cells = [];
    // Rewind both streams so summonCells produces the same cells every run.
    this.placeRandom = makeRandom(PLACE_SEED);
    this.featureRandom = makeRandom(FEATURE_SEED);
    this.example = [];
    this.prediction = [];
    this.modelShown = false;
    this.revealed = [];
    this.checked = [];
  };

  /**
   * The model, refit from scratch every time the student records another
   * example. Null until both labels have been recorded.
   */
  public get model(): Model | null {
    return fit(this.example);
  }

  /** Which side of the boundary a pair of measurements falls on. */
  private classify = (size: number, roundness: number): Label | null => {
    const m = this.model;
    if (!m) return null;
    const score = m.sizeWeight * size + m.roundnessWeight * roundness + m.bias;
    return score > 0 ? LABELS[0] : LABELS[1];
  };

  @action
  public onMessage = (m: Message) => {
    switch (m.type) {
      case "addExample":
        this.example = [
          ...this.example.filter((e) => e.target !== m.target),
          { target: m.target, size: m.size, roundness: m.roundness, label: m.label },
        ];
        break;
      case "predictCase": {
        const cell = this.cells.find((c) => c.target === m.target);
        const label = cell && this.classify(cell.size, cell.roundness);
        if (!cell || !label) break;
        this.prediction = [
          ...this.prediction.filter((p) => p.target !== m.target),
          { target: m.target, label },
        ];
        break;
      }
      case "summonCells": {
        const start = this.cells.length;
        const fixed = STARTING_CELLS.slice(start, start + m.amount);
        const generated = m.amount - fixed.length;

        const spots = placePositions(
          generated,
          [...this.cells, ...fixed],
          this.placeRandom
        );

        this.cells = [
          ...this.cells,
          ...fixed.map((c) => ({ ...c, cancerous: isCancerous(c.size, c.roundness) })),
          ...spots.map((p, i) => {
            const size = randomSize(this.featureRandom);
            const roundness = randomRoundness(this.featureRandom);
            return {
              target: start + fixed.length + i + 1,
              size,
              roundness,
              cancerous: isCancerous(size, roundness),
              x: p.x,
              y: p.y,
            };
          }),
        ];
        break;
      }
      case "checkCell":
        this.checked = this.checked.includes(m.target)
          ? this.checked
          : [...this.checked, m.target];
        break;
      case "showModel":
        this.modelShown = true;
        break;
      case "revealCancer":
        this.revealed = this.revealed.includes(m.target)
          ? this.revealed
          : [...this.revealed, m.target];
        break;
      default:
        assertNever(m);
    }
  };

}

/** Compile-time proof the switch above handles every Message variant. */
function assertNever(x: never): never {
  throw new Error(`Unhandled message: ${JSON.stringify(x)}`);
}

function randomSize(rand: () => number): number {
  return Math.round(2 + rand() * 8);
}

function randomRoundness(rand: () => number): number {
  return Math.round(rand() * 4 + 6);
}

const TRUTH_SIZE_WEIGHT = 0.6;
const TRUTH_ROUNDNESS_WEIGHT = 0.7;
const TRUTH_BIAS = 2.0;

function isCancerous(size: number, roundness: number): boolean {
  return (
    TRUTH_SIZE_WEIGHT * size - TRUTH_ROUNDNESS_WEIGHT * roundness + TRUTH_BIAS >
    0
  );
}

function placePositions( //makes sure the cells don't overlap when summoned
  count: number,
  existing: readonly { x: number; y: number }[],
  rand: () => number
): { x: number; y: number }[] {
  const placed = [...existing];
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    let best = { x: rand(), y: rand() };
    for (let t = 0; t < MAX_TRIES; t++) {
      const p = { x: rand(), y: rand() };
      const ok = placed.every(
        (q) => Math.hypot(p.x - q.x, p.y - q.y) >= MIN_GAP
      );
      if (ok) {
        best = p;
        break;
      }
    }
    placed.push(best);
    out.push(best);
  }
  return out;
}

/** Mean size and roundness of every example carrying one label. */
function centroid(examples: readonly Example[], label: Label) {
  const group = examples.filter((e) => e.label === label);
  if (group.length === 0) return null;
  const n = group.length;
  return {
    size: group.reduce((t, e) => t + e.size, 0) / n,
    roundness: group.reduce((t, e) => t + e.roundness, 0) / n,
  };
}


/**
 * The classifier: nearest centroid. Average each class, then put the boundary
 * halfway between the two averages, at right angles to the line joining them.
 *
 * One pass over the examples, no fitting loop. It's a real linear boundary —
 * the score is positive on the cancerous side and negative on the other — and
 * it improves as the student records more cells, which is the point.
 */
function fit(examples: readonly Example[]): Model | null {
  const cancerous = centroid(examples, LABELS[0]);
  const healthy = centroid(examples, LABELS[1]);
  if (!cancerous || !healthy) return null;

  const sizeWeight = cancerous.size - healthy.size;
  const roundnessWeight = cancerous.roundness - healthy.roundness;
  if (sizeWeight === 0 && roundnessWeight === 0) return null;

  const midSize = (cancerous.size + healthy.size) / 2;
  const midRoundness = (cancerous.roundness + healthy.roundness) / 2;
  return {
    sizeWeight,
    roundnessWeight,
    bias: -(sizeWeight * midSize + roundnessWeight * midRoundness),
  };
}


export default State;