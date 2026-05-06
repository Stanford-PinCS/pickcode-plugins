import { makeAutoObservable } from "mobx";

class State {
    concentration = 0.3;
    epsilon = 1.5;
    pathLength = 1.0;

    constructor() {
        makeAutoObservable(this);
    }

    init() {
        // Required by the Pickcode plugin system.
    }

    setConcentration(value: number) {
        this.concentration = value;
    }

    setEpsilon(value: number) {
        this.epsilon = value;
    }

    setPathLength(value: number) {
        this.pathLength = value;
    }
}

export default State;