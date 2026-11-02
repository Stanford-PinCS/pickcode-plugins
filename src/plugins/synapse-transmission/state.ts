import { action, observable } from "mobx";
import { Message } from "./messages";

export interface SynapseRun {
    signals: number[];
    threshold: number;
    fires: boolean;
}

export class State {
    /** A new object per run, so the animation restarts on every Run. */
    @observable accessor run: SynapseRun | null = null;

    public init = () => {};

    @action
    public onMessage = (m: Message) => {
        switch (m.type) {
            case "showSynapse":
                this.run = {
                    signals: Array.from(m.signals, Number),
                    threshold: Number(m.threshold),
                    fires: m.fires === true,
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
