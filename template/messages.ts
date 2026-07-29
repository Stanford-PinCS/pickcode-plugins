/**
 * Every message the student's code can send to this plugin.
 *
 * Rules:
 *  - Discriminated union on `type`. No optional fields on a variant — if two
 *    shapes differ, they are two variants.
 *  - `type` is camelCase and names an action the student performs
 *    (`plotSeries`), not an internal event (`dataChanged`).
 *  - Payloads are plain JSON-safe values. No functions, no class instances.
 *  - Arrays arrive as `readonly` here and are copied in state.ts.
 */

export type Message =
  | { type: "plotSeries"; values: readonly number[] }
  | { type: "setReference"; value: number };
