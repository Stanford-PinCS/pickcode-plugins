import { action, observable } from "mobx";
import { Message, Region } from "./messages";

export interface TitrationRun {
    acidConcentration: number;
    baseConcentration: number;
    acidVolumeML: number;
    equivalenceML: number;
    volumesML: number[];
    pHs: number[];
    regions: Region[];
}

export class State {
    /** One run of the titration. A new object per run restarts the animation. */
    @observable accessor run: TitrationRun | null = null;

    public init = () => {};

    @action
    public onMessage = (m: Message) => {
        switch (m.type) {
            case "showTitration":
                this.run = {
                    acidConcentration: m.acidConcentration,
                    baseConcentration: m.baseConcentration,
                    acidVolumeML: m.acidVolumeML,
                    equivalenceML: m.equivalenceML,
                    volumesML: Array.from(m.volumesML),
                    pHs: Array.from(m.pHs),
                    regions: Array.from(m.regions),
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
