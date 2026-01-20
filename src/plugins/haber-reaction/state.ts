import { action, observable } from "mobx";
import { FromRuntimeMessage, ToRuntimeMessage } from "./messages";

export class State {
    @observable
    accessor value: string = "";

    @observable
    accessor nh3_made: number = 0;

    @observable
    accessor n2_left: number = 0;

    @observable
    accessor h2_left: number = 0;

    @observable
    accessor limiting: string = "";

    private sendMessage = (_message: ToRuntimeMessage) => {};

    public init = (sendMessage: (message: ToRuntimeMessage) => void) => {
        this.sendMessage = sendMessage;
    };

    @action
    public onMessage = (m: FromRuntimeMessage) => {
        if (m.setValue !== undefined) {
            this.value = m.setValue;
        }
        if (m.nh3_made !== undefined) {
            this.nh3_made = m.nh3_made;
        }
        if (m.n2_left !== undefined) {
            this.n2_left = m.n2_left;
        }
        if (m.h2_left !== undefined) {
            this.h2_left = m.h2_left;
        }
        if (m.limiting !== undefined) {
            this.limiting = m.limiting;
        }
    };

    public send = (m: ToRuntimeMessage) => {
        this.sendMessage(m);
    };
}

export default State;
