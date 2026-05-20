import { action, observable } from "mobx";
import { Message } from "./messages";

export class State {
    @observable accessor points: number[] = [];
    @observable accessor target: number = 0.5;

    public init = () => {};

    @action
    public onMessage = (m: Message) => {
        switch (m.type) {
            case "plotLine":
                this.points = Array.from(m.points);
                break;
            case "showTarget":
                this.target = m.value;
                break;
        }
    };
}

export default State;
