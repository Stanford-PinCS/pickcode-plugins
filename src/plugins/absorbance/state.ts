import { action, observable } from "mobx";
import { FromRuntimeMessage, ToRuntimeMessage } from "./messages";

export default class State {
    @observable
    accessor value: any = null;

    private sendMessage = (_message: ToRuntimeMessage) => {};

    public init = (sendMessage: (message: ToRuntimeMessage) => void) => {
        this.sendMessage = sendMessage;
    };

    @action
    public onMessage = (message: FromRuntimeMessage) => {
        this.value = message.setValue;
    };

    public send = (message: ToRuntimeMessage) => {
        this.sendMessage(message);
    };
}