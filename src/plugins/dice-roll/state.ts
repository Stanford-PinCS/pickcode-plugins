import { action, observable } from "mobx";
import { Message } from "./messages";

export class State {
    @observable accessor percentages: number[] = [];
    /** How many rolls the percentages came from, when the code said so. */
    @observable accessor totalRolls: number | null = null;
    @observable accessor target: number = 0;

    public init = () => {};

    @action
    public onMessage = (m: Message) => {
        switch (m.type) {
            case "showBars":
                this.percentages = Array.from(m.percentages);
                this.totalRolls = m.totalRolls ?? null;
                break;
            case "showTarget":
                this.target = m.value;
                break;
        }
    };
}

export default State;
