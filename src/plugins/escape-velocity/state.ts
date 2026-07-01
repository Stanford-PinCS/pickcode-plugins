import { action, observable } from "mobx";
import { SimulationResult } from "./messages";

export class State {
    @observable
    accessor result: SimulationResult | null = null;

    public init = () => {};

    @action
    public onMessage = (msg: SimulationResult) => {
        this.result = msg;
    };
}

export default State;
