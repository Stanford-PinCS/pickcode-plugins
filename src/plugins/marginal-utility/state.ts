import { action, observable } from "mobx";
import { Message } from "./messages";

export class State {
    @observable
    accessor choices: string[] = [];
    @observable
    accessor error: string | null = null;

    public init = () => {};

    @action
    public onMessage = (message: Message) => {
        switch (message) {
            case "apple":
                this.choices.push("apple")
                return true;
            case "banana":
                this.choices.push("banana")
                return true;
            default:
                this.error = `choose returned ${JSON.stringify(message) ?? "nothing"}. Return "apple" or "banana".`;
                return false;
        }
    };
}

export default State;
