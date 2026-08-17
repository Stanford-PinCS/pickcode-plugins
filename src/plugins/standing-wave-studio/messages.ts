/**
 * Every message the student's code can send to this plugin.
 *
 * The whole animation is precomputed in the runtime and delivered in one
 * `showWaves`. Messages only travel runtime -> UI, so the component cannot
 * call the student's frame functions itself; it replays sampled frames.
 */

export type CurveRole = "component" | "result";

export interface Curve {
  /** The label shown in the legend. */
  name: string;
  /** `result` is the wave the student built; `component` are the given parts. */
  role: CurveRole;
  /** `frames[frameIndex][sampleIndex]` — displacement in metres. */
  frames: readonly (readonly number[])[];
}

export type Message =
  | {
      type: "showWaves";
      /** Position in metres of each sample point along the string. */
      xValues: readonly number[];
      /** Time in seconds of each frame. */
      frameTimes: readonly number[];
      curves: readonly Curve[];
    }
  | { type: "reset" };
