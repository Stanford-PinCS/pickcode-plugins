import { action, observable, makeObservable } from "mobx";
import { DrawForceMessage } from "./messages";

export interface ForceArrow {
  x: number;
  y: number;
  color: string;
  /**
   * Set by drawForces: "force" for one of the forces, "net" for the net
   * force. Component picks the token color from it. Arrows from drawForce
   * have no role and keep the color the code passed.
   */
  role?: "force" | "net";
}

export class State {
  @observable
  accessor forceArrows: ForceArrow[] = [];

  constructor() {
    makeObservable(this);
  }

  // Required by the plugin loader (plugin.tsx calls state.init on mount).
  // No setup needed here, so it's a no-op — same as coin-flip.
  public init = () => {};

  @action
  public onMessage = (message: DrawForceMessage) => {
    this.forceArrows.push(message.forceToDraw);
    return true;
  };
}

export default State;
