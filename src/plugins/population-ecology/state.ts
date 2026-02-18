import { action, observable } from "mobx";
import { Message } from "./messages";

export interface SimulationConfig {
    initialSize: number;
    growthRate: number;
    dayDuration: number; // milliseconds per simulated day
}

export interface DayRecord {
    day: number;
    population: number;
}

export class State {
    @observable
    accessor config: SimulationConfig | null = null;

    @observable
    accessor history: DayRecord[] = [];

    @observable
    accessor currentDay: number = 0;

    @observable
    accessor currentPopulation: number = 0;

    @observable
    accessor isRunning: boolean = false;

    @observable
    accessor error: string | null = null;

    public init = () => {};

    @action
    public onMessage = (message: Message) => {
        switch (message.type) {
            case "addPopulation":
                this.config = {
                    initialSize: message.initialSize,
                    growthRate: message.growthRate,
                    dayDuration: message.dayDuration ?? 3000,
                };
                this.history = [{ day: 0, population: message.initialSize }];
                this.currentDay = 0;
                this.currentPopulation = message.initialSize;
                this.isRunning = true;
                this.error = null;
                return true;

            case "tick":
                this.currentDay = message.day;
                this.currentPopulation = message.population;
                this.history.push({ day: message.day, population: message.population });
                return true;

            case "reset":
                this.config = null;
                this.history = [];
                this.currentDay = 0;
                this.currentPopulation = 0;
                this.isRunning = false;
                this.error = null;
                return true;

            default:
                this.error = `Unknown message type`;
                return false;
        }
    };
}

export default State;