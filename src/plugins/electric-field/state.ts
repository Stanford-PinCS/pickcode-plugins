import { action, observable } from "mobx";
import { Message } from "./messages";

export interface Particle {
    id: number;
    x: number; // 0–1 normalized
    y: number; // 0–1 normalized
    q: number; // charge in arbitrary units (positive or negative)
}

export class State {
    @observable
    accessor particles: Particle[] = [];

    @observable
    accessor error: string | null = null;

    public init = () => {};

    @action
    public onMessage = (message: Message) => {
        switch (message.type) {
            case "addParticle":
                this.particles = [
                    ...this.particles,
                    { id: message.id, x: message.x, y: message.y, q: message.q },
                ];
                this.error = null;
                return true;

            case "clearParticles":
                this.particles = [];
                this.error = null;
                return true;

            case "reset":
                this.particles = [];
                this.error = null;
                return true;

            default:
                this.error = `Unknown message type`;
                return false;
        }
    };
}

export default State;