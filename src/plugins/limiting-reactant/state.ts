import { action, observable } from "mobx";
import { Message } from "./messages";

/** One run of the reaction, exactly as the student's code reported it. */
export interface ReactionRun {
  molesH2: number;
  molesO2: number;
  reactions: number;
  maxReactions: number;
}

/** Coefficients of the balanced equation 2 H2 + O2 -> 2 H2O. */
export const COEF = { h2: 2, o2: 1, h2o: 2 } as const;

/**
 * All plugin state. No JSX, no formatting, no colors in this file.
 */
export class State {
  /** A fresh object per run, so the animation restarts on every Run. */
  @observable accessor run: ReactionRun | null = null;

  public init = () => {};

  @action
  public onMessage = (m: Message) => {
    switch (m.type) {
      case "showReaction":
        this.run = {
          molesH2: m.molesH2,
          molesO2: m.molesO2,
          reactions: m.reactions,
          maxReactions: m.maxReactions,
        };
        break;
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
