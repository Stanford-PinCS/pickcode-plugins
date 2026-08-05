import { action, observable } from "mobx";
import type { AddParticlesMessage } from "./messages";

export interface Particle {
  color: string;
  temperature: number;
}

export class State {
  @observable
  accessor particles: Particle[] = [];

  public init = () => {};

  @action
  public onMessage = (message: AddParticlesMessage) => {
    const newParticles = Array.from({ length: message.numParticles }, () => ({
      color: message.color,
      temperature: message.temperature,
    }));

    this.particles = [...this.particles, ...newParticles];
  };
}

export default State;
