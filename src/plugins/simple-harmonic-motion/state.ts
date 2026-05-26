// Spring Lab — MobX state. Mirrors momentum-2d/state.ts.
// Component subscribes to these via @observer; physics is in the core layer.

import { makeObservable, observable } from "mobx";
import type { Command, Derived, Model, Phase } from "./messages";

export class SpringLabState {
  @observable accessor phase: Phase = "idle";
  @observable accessor model: Model | null = null;
  @observable accessor derived: Derived | null = null;
  @observable accessor simTime: number = 0;
  @observable accessor errorMessage: string | null = null;

  // Per-instance seed for reproducible noise across reloads of the same lesson.
  // Bumped when a new ConfigureSimulation arrives.
  @observable accessor seed: number = 0;

  constructor() {
    makeObservable(this);
  }

  public init = () => {
    this.reset();
  };

  public onMessage = (cmd: Command) => {
    if (cmd.type === "ConfigureSimulation") {
      const m = cmd.model.inputs;
      const seed =
        (m.method === "static" ? 1013 : 2027) ^
        Math.floor(m.activeMass * 1e6) ^
        (cmd.derived.rowCount * 7919);
      this.configure(cmd.model, cmd.derived, seed);
    } else if (cmd.type === "StartAnimation") {
      this.startAnimation();
    }
  };

  configure(model: Model, derived: Derived, seed: number) {
    this.model = model;
    this.derived = derived;
    this.seed = seed;
    this.simTime = 0;
    this.errorMessage = null;
    this.phase = "configured";
  }

  startAnimation() {
    if (this.phase !== "configured") return;
    this.phase = "playing";
  }

  advanceTime(dt: number) {
    if (this.phase !== "playing") return;
    this.simTime += dt;
  }

  finish() {
    this.phase = "done";
  }

  reset() {
    this.phase = "idle";
    this.model = null;
    this.derived = null;
    this.simTime = 0;
    this.errorMessage = null;
  }

  setError(msg: string) {
    this.errorMessage = msg;
  }
}

export default SpringLabState;
