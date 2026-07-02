import { action, observable } from "mobx";
import { Message } from "./messages";

export class State {
    @observable accessor percentages: number[] = [];
    @observable accessor target: number = 0;

    public init = () => {};

    @action
    public onMessage = (m: Message) => {
        switch (m.type) {
            case "showBars":
                this.percentages = Array.from(m.percentages);
                break;
            case "showTarget":
                this.target = m.value;
                break;
        }
    };
}

export default State;
