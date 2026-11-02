import { action, observable } from "mobx";
import { Message } from "./messages";

/** Ideal gas constant in L·atm/(mol·K). */
export const R = 0.08206;

export const toKelvin = (celsius: number) => celsius + 273.15;

/** What the ideal gas law predicts: P = nRT / V, with T in kelvins. */
export const idealPressure = (moles: number, volume: number, kelvin: number) =>
    (moles * R * kelvin) / volume;

export class State {
    @observable accessor moles: number = 0;
    @observable accessor celsius: number = 0;
    @observable accessor volumes: number[] = [];
    /** What the student's calculatePressure returned at each volume. */
    @observable accessor pressures: number[] = [];

    public init = () => {
        this.moles = 0;
        this.celsius = 0;
        this.volumes = [];
        this.pressures = [];
    };

    @action
    public onMessage = (m: Message) => {
        switch (m.type) {
            case "showPiston":
                this.moles = m.moles;
                this.celsius = m.celsius;
                this.volumes = Array.from(m.volumes);
                this.pressures = Array.from(m.pressures);
                break;
            default:
                assertNever(m.type);
        }
    };
}

/** Compile-time guarantee that the switch above handles every Message variant. */
function assertNever(x: never): never {
    throw new Error(`Unhandled message: ${JSON.stringify(x)}`);
}

export default State;
