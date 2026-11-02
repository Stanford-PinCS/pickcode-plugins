import { action, observable } from "mobx";
import { Message } from "./messages";

export class State {
    /** One entry per trial: true when food followed the bell. */
    @observable accessor foodPresent: boolean[] = [];
    /** Bell-food strength (0 to 100) after each trial. */
    @observable accessor strengths: number[] = [];

    public init = () => {};

    @action
    public onMessage = (m: Message) => {
        switch (m.type) {
            case "showTrials":
                this.foodPresent = Array.from(m.foodPresent, (f) => f === 1);
                this.strengths = Array.from(m.strengths);
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
