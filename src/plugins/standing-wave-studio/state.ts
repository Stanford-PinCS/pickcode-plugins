import { action, computed, observable } from "mobx";
import { Curve, Message } from "./messages";

/**
 * All plugin state. No JSX, no formatting, no colors in this file.
 *
 * The node analysis lives here rather than in Component.tsx because it is a
 * result a student would ask about ("how many nodes did I make?"), not a
 * drawing detail.
 */

/**
 * A sample counts as a node when its largest displacement over the whole
 * animation stays under this fraction of the biggest displacement anywhere.
 * Loose enough to survive a coarse sample grid, tight enough that a
 * travelling wave reports no nodes at all.
 */
const NODE_THRESHOLD = 0.08;

export class State {
  @observable accessor xValues: number[] = [];
  @observable accessor frameTimes: number[] = [];
  @observable accessor curves: Curve[] = [];

  /** Runs once before the student's code. */
  public init = () => {
    this.xValues = [];
    this.frameTimes = [];
    this.curves = [];
  };

  @action
  public onMessage = (m: Message) => {
    switch (m.type) {
      case "showWaves":
        this.xValues = Array.from(m.xValues);
        this.frameTimes = Array.from(m.frameTimes);
        this.curves = m.curves.map((c) => ({
          name: c.name,
          role: c.role,
          frames: c.frames.map((f) => Array.from(f)),
        }));
        break;
      case "reset":
        this.init();
        break;
      default:
        assertNever(m);
    }
  };

  @computed
  get frameCount(): number {
    return this.frameTimes.length;
  }

  /** The wave the student built. */
  @computed
  get result(): Curve | null {
    return this.curves.find((c) => c.role === "result") ?? null;
  }

  @computed
  get components(): Curve[] {
    return this.curves.filter((c) => c.role === "component");
  }

  /**
   * Largest displacement reached at each point over the whole animation.
   * This is the standing-wave envelope — flat for a travelling wave,
   * scalloped down to zero at the nodes for a standing one.
   */
  @computed
  get envelope(): number[] {
    const result = this.result;
    if (!result) return [];
    const out = new Array<number>(this.xValues.length).fill(0);
    for (const frame of result.frames) {
      for (let i = 0; i < frame.length && i < out.length; i++) {
        const magnitude = Math.abs(frame[i]);
        if (magnitude > out[i]) out[i] = magnitude;
      }
    }
    return out;
  }

  /** Biggest displacement the result wave ever reaches. */
  @computed
  get peakDisplacement(): number {
    return this.envelope.reduce((max, v) => (v > max ? v : max), 0);
  }

  /** Biggest displacement across every curve — used to scale the y axis. */
  @computed
  get peakOverall(): number {
    let max = 0;
    for (const curve of this.curves) {
      for (const frame of curve.frames) {
        for (const v of frame) {
          const magnitude = Math.abs(v);
          if (magnitude > max) max = magnitude;
        }
      }
    }
    return max;
  }

  /**
   * Sample indices that stay still for the whole animation. A node usually
   * spans several quiet samples, so each run collapses to its quietest one —
   * the midpoint would drag a node sitting on the end of the string inward.
   */
  @computed
  get nodeIndices(): number[] {
    const envelope = this.envelope;
    const peak = this.peakDisplacement;
    if (envelope.length === 0 || peak <= 1e-9) return [];

    const threshold = peak * NODE_THRESHOLD;
    const nodes: number[] = [];
    let quietest = -1;

    for (let i = 0; i < envelope.length; i++) {
      const isQuiet = envelope[i] <= threshold;
      if (isQuiet && (quietest === -1 || envelope[i] < envelope[quietest])) {
        quietest = i;
      }
      const runEnds = quietest !== -1 && (!isQuiet || i === envelope.length - 1);
      if (runEnds) {
        nodes.push(quietest);
        quietest = -1;
      }
    }
    return nodes;
  }

  @computed
  get nodePositions(): number[] {
    return this.nodeIndices.map((i) => this.xValues[i]);
  }

  /**
   * Two node spacings make one wavelength. Averaged across every node so a
   * single misplaced sample doesn't skew it.
   */
  @computed
  get wavelength(): number | null {
    const positions = this.nodePositions;
    if (positions.length < 2) return null;
    const span = positions[positions.length - 1] - positions[0];
    return (2 * span) / (positions.length - 1);
  }
}

/** Compile-time guarantee that the switch above handles every Message variant. */
function assertNever(x: never): never {
  throw new Error(`Unhandled message: ${JSON.stringify(x)}`);
}

export default State;
