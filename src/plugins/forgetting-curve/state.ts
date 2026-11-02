import { action, observable } from "mobx";
import { Message } from "./messages";

export interface Memory {
    days: number[];
    retentions: number[];
    studyDays: number[];
    threshold: number;
}

export class State {
    @observable accessor memory: Memory | null = null;

    public init = () => {};

    @action
    public onMessage = (m: Message) => {
        switch (m.type) {
            case "showMemory":
                this.memory = {
                    days: Array.from(m.days),
                    retentions: Array.from(m.retentions),
                    studyDays: Array.from(m.studyDays),
                    threshold: m.threshold,
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
