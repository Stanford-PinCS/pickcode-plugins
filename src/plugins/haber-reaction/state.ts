import { action, observable } from "mobx";
import { FromRuntimeMessage, ToRuntimeMessage } from "./messages";

export class State {
    @observable
    accessor value: string = "";

    // Run counter — increments on every play press
    @observable
    accessor run_id: number = 0;

    // Input values
    @observable
    accessor input_n2: number = 0;

    @observable
    accessor input_h2: number = 0;

    // True computed values
    @observable
    accessor true_nh3: number = 0;

    @observable
    accessor true_limiting: string = "";

    @observable
    accessor n2_consumed: number = 0;

    @observable
    accessor h2_consumed: number = 0;

    @observable
    accessor n2_remaining: number = 0;

    @observable
    accessor h2_remaining: number = 0;

    // Student's returned answers
    @observable
    accessor student_nh3: number = 0;

    @observable
    accessor student_limiting: string = "";

    // Correctness checks
    @observable
    accessor nh3_correct: boolean | null = null;

    @observable
    accessor limiting_correct: boolean | null = null;

    private sendMessage = (_message: ToRuntimeMessage) => {};

    public init = (sendMessage: (message: ToRuntimeMessage) => void) => {
        this.sendMessage = sendMessage;
    };

    @action
    public onMessage = (m: FromRuntimeMessage) => {
        if (m.setValue !== undefined) this.value = m.setValue;
        if (m.run_id !== undefined) this.run_id = m.run_id;
        if (m.input_n2 !== undefined) this.input_n2 = m.input_n2;
        if (m.input_h2 !== undefined) this.input_h2 = m.input_h2;
        if (m.true_nh3 !== undefined) this.true_nh3 = m.true_nh3;
        if (m.true_limiting !== undefined) this.true_limiting = m.true_limiting;
        if (m.n2_consumed !== undefined) this.n2_consumed = m.n2_consumed;
        if (m.h2_consumed !== undefined) this.h2_consumed = m.h2_consumed;
        if (m.n2_remaining !== undefined) this.n2_remaining = m.n2_remaining;
        if (m.h2_remaining !== undefined) this.h2_remaining = m.h2_remaining;
        if (m.student_nh3 !== undefined) this.student_nh3 = m.student_nh3;
        if (m.student_limiting !== undefined) this.student_limiting = m.student_limiting;
        if (m.nh3_correct !== undefined) this.nh3_correct = m.nh3_correct;
        if (m.limiting_correct !== undefined) this.limiting_correct = m.limiting_correct;
    };

    public send = (m: ToRuntimeMessage) => {
        this.sendMessage(m);
    };
}

export default State;
