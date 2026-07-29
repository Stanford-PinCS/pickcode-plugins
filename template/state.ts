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
export class State {
  @observable accessor values: number[] = [];
  @observable accessor reference: number | null = null;

  /** Runs once before the student's code. Reset anything stateful here. */
  public init = () => {
    this.values = [];
    this.reference = null;
  };

  @action
  public onMessage = (m: Message) => {
    switch (m.type) {
      case "plotSeries":
        this.values = Array.from(m.values);
        break;
      case "setReference":
        this.reference = m.value;
        break;
      default:
        assertNever(m);
    }
  };
}

/** Compile-time guarantee that the switch above handles every Message variant. */
function assertNever(x: never): never {
  throw new Error(`Unhandled message: ${JSON.stringify(x)}`);
}

export default State;
