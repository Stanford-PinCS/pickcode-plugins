import { action, observable } from "mobx";
import { Message } from "./messages";

/** One finished run of the student's while loop, ready to replay. */
export interface CalorimeterRun {
  metalMass: number;
  metalC: number;
  waterMass: number;
  waterC: number;
  metalTemps: number[];
  waterTemps: number[];
  /** T_final = (m1c1T1 + m2c2T2) / (m1c1 + m2c2), from the starting temps. */
  predictedFinal: number;
}

/**
 * All plugin state. No JSX, no formatting, no colors in this file.
 */
export class State {
  /** A fresh object per run, so the animation restarts on every Run. */
  @observable accessor run: CalorimeterRun | null = null;

  public init = () => {};

  @action
  public onMessage = (m: Message) => {
    switch (m.type) {
      case "showCalorimeter": {
        const metalTemps = Array.from(m.metalTemps);
        const waterTemps = Array.from(m.waterTemps);
        const metalHeat = m.metalMass * m.metalC;
        const waterHeat = m.waterMass * m.waterC;
        this.run = {
          metalMass: m.metalMass,
          metalC: m.metalC,
          waterMass: m.waterMass,
          waterC: m.waterC,
          metalTemps,
          waterTemps,
          predictedFinal:
            (metalHeat * metalTemps[0] + waterHeat * waterTemps[0]) /
            (metalHeat + waterHeat),
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
