import { action, observable } from "mobx";
import { GibbsLabel, Message } from "./messages";

export interface GibbsRun {
    temperatures: number[];
    deltaGs: number[];
    labels: GibbsLabel[];
    correct: boolean[];
    crossoverK: number | null;
}

export class State {
    /** One sweep across temperatures. A new object per run restarts the animation. */
    @observable accessor run: GibbsRun | null = null;

    public init = () => {};

    @action
    public onMessage = (m: Message) => {
        switch (m.type) {
            case "showGibbs":
                this.run = {
                    temperatures: Array.from(m.temperatures),
                    deltaGs: Array.from(m.deltaGs),
                    labels: Array.from(m.labels),
                    correct: Array.from(m.correct),
                    crossoverK: m.crossoverK,
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
