import { action, observable } from "mobx";
import { Message } from "./messages";

export interface Session {
    /** Seconds since the session started, one per lever press. */
    pressTimes: number[];
    /** Same length as pressTimes: true when that press earned a pellet. */
    rewarded: boolean[];
    foodOffAt: number;
    endAt: number;
}

export class State {
    @observable accessor session: Session | null = null;

    public init = () => {};

    @action
    public onMessage = (m: Message) => {
        switch (m.type) {
            case "showSession":
                this.session = {
                    pressTimes: Array.from(m.pressTimes),
                    rewarded: Array.from(m.rewarded, (r) => r === 1),
                    foodOffAt: m.foodOffAt,
                    endAt: m.endAt,
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
