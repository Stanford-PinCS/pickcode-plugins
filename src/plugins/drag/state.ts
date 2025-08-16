import { action, observable } from "mobx";
import { Message, Position } from "./messages";

export class State {
    @observable
    accessor predictedPath: Position[] = [];

    @observable
    accessor actualPath: Position[] = [];

    @observable
    accessor ballPosition: Position = { x: 0, y: 0 };

    @observable
    accessor isComplete: boolean = false;

    @observable
    accessor currentAnimation: "predicted" | "actual" = "predicted";

    @observable
    accessor error: string | null = null;

    public init = () => {
        this.predictedPath = [];
        this.actualPath = [];
        this.ballPosition = { x: 0, y: 0 };
        this.isComplete = false;
        this.error = null;
        this.currentAnimation = "predicted";
    };

    @action
    public onMessage = (message: Message) => {
        if (message.type === "simulationUpdate") {
            this.predictedPath = message.predictedPath;
            this.actualPath = message.actualPath;
            this.ballPosition = message.ballPosition;
            this.isComplete = message.isComplete;
            this.currentAnimation = message.currentAnimation;
            return true;
        }
        this.error = `Unknown message type: ${message.type}`;
        return false;
    };
}

export default State;
