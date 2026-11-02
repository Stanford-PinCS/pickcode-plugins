import { action, observable } from "mobx";
import { Message } from "./messages";

export type Direction = "forward" | "reverse" | "equilibrium";

/** One recorded run of the while loop, frame by frame. */
export interface ReactionRun {
    n2o4: number[];
    no2: number[];
    answers: Direction[];
    K: number;
    /** Frame where extra N2O4 was added, or -1. */
    addAt: number;
    stepLimit: number;
}

const toDirection = (s: string): Direction =>
    s === "forward" || s === "reverse" ? s : "equilibrium";

export class State {
    @observable accessor run: ReactionRun | null = null;

    /** Runs once before the student's code. */
    public init = () => {
        this.run = null;
    };

    @action
    public onMessage = (m: Message) => {
        switch (m.type) {
            case "showReaction":
                this.run = {
                    n2o4: Array.from(m.n2o4),
                    no2: Array.from(m.no2),
                    answers: Array.from(m.answers, toDirection),
                    K: m.K,
                    addAt: m.addAt,
                    stepLimit: m.stepLimit,
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
