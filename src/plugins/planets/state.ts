import { action, observable } from "mobx";
import type { Planet } from "./messages";

export class State {
  @observable
  accessor planets: Planet[] = [];

  public init = () => {};

  @action
  public onMessage = (planet: Planet) => {
    this.planets = [...this.planets, planet];
  };
}

export default State;
