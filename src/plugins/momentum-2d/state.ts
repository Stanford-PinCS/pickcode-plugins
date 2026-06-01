import { action, observable } from "mobx";
import type {
    Message,
    MomentumDerived,
    MomentumDisplayOptions,
    MomentumInputs,
} from "./messages";
import { buildReport, cloneInputs, DEFAULT_INPUTS } from "./momentumCore";

const defaultReport = buildReport({ inputs: DEFAULT_INPUTS });
const DEFAULT_DISPLAY_OPTIONS: MomentumDisplayOptions = {
    showGuides: false,
    points: [],
};

export class State {
    @observable accessor inputs: MomentumInputs = cloneInputs(defaultReport.inputs);
    @observable accessor derived: MomentumDerived = defaultReport.derived;
    @observable accessor displayOptions: MomentumDisplayOptions =
        DEFAULT_DISPLAY_OPTIONS;
    @observable accessor stage: "ready" | "running" | "complete" = "ready";
    @observable accessor elapsedTime = 0;

    public init = () => {
        const configParam = new URLSearchParams(window.location.search).get("config");
        if (configParam) {
            try {
                const override = JSON.parse(configParam);
                const report = buildReport({ inputs: override });
                this.inputs = cloneInputs(report.inputs);
                this.derived = report.derived;
                this.displayOptions = DEFAULT_DISPLAY_OPTIONS;
                this.stage = "ready";
                this.elapsedTime = 0;
                return;
            } catch {
                // fall through to default
            }
        }
        this.reset();
    };

    @action
    public reset = () => {
        const report = buildReport({ inputs: DEFAULT_INPUTS });
        this.inputs = cloneInputs(report.inputs);
        this.derived = report.derived;
        this.displayOptions = DEFAULT_DISPLAY_OPTIONS;
        this.stage = "ready";
        this.elapsedTime = 0;
    };

    @action
    public onMessage = (message: Message) => {
        if (message.type === "configureSimulation") {
            this.inputs = cloneInputs(message.inputs);
            this.derived = message.derived;
            this.displayOptions = message.displayOptions;
            this.stage = "ready";
            this.elapsedTime = 0;
            return;
        }

        if (message.type === "start") {
            this.stage = "running";
            this.elapsedTime = 0;
        }
    };

    @action
    public setElapsedTime = (elapsedTime: number) => {
        this.elapsedTime = elapsedTime;
    };

    @action
    public completePlayback = () => {
        if (this.stage === "complete") {
            return;
        }

        this.stage = "complete";
    };
}

export default State;