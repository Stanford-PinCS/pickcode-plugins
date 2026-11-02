import { action, observable } from "mobx";
import { Message } from "./messages";

/** One finished simulation, ready to replay step by step. */
export interface KineticsRun {
  /** Step each molecule reacted in, or 0 if it never did. */
  reactedAt: number[];
  numSteps: number;
  k: number;
  numMolecules: number;
  /** countA[t] = molecules still A after t steps, for t = 0..numSteps. */
  countA: number[];
}

/**
 * All plugin state. No JSX, no formatting, no colors in this file.
 */
export class State {
  /** A fresh object per run, so the animation restarts on every Run. */
  @observable accessor run: KineticsRun | null = null;

  public init = () => {};

  @action
  public onMessage = (m: Message) => {
    switch (m.type) {
      case "showMolecules": {
        const reactedAt = Array.from(m.reactedAt);
        const reactedPerStep = new Array(m.numSteps + 1).fill(0);
        for (const step of reactedAt) if (step > 0) reactedPerStep[step]++;
        const countA = [reactedAt.length];
        for (let t = 1; t <= m.numSteps; t++) {
          countA.push(countA[t - 1] - reactedPerStep[t]);
        }
        this.run = {
          reactedAt,
          numSteps: m.numSteps,
          k: m.k,
          numMolecules: reactedAt.length,
          countA,
        };
        break;
      }
      default:
        assertNever(m.type);
    }
  };
}

/** Compile-time guarantee that the switch above handles every Message variant. */
function assertNever(x: never): never {
  throw new Error(`Unhandled message: ${JSON.stringify(x)}`);
}

export default State;
