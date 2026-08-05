import { action, observable, makeObservable } from "mobx";
import { DrawForceMessage } from "./messages";

export interface ForceArrow {
  x: number;
  y: number;
  color: string;
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
