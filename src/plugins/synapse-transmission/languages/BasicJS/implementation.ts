import { Message } from "../../messages";

const MAX_SIGNALS = 10;
const MAX_SIGNAL_MV = 20;

function toSignals(input: unknown): number[] {
    if (
        input == null ||
        typeof input === "string" ||
        typeof (input as Iterable<unknown>)[Symbol.iterator] !== "function"
    ) {
        throw new Error("showSynapse expects signals to be a list of numbers, like [4, 4].");
    }
    const signals = Array.from(input as Iterable<unknown>, (value, i) => {
        if (typeof value !== "number" || !Number.isFinite(value)) {
            throw new Error(`showSynapse: signals item ${i} is not a number.`);
        }
        if (Math.abs(value) > MAX_SIGNAL_MV) {
            throw new Error(
                `showSynapse: each signal should be between -${MAX_SIGNAL_MV} and ${MAX_SIGNAL_MV} mV, but item ${i} is ${value}.`
            );
        }
        return value;
    });
    if (signals.length < 1 || signals.length > MAX_SIGNALS) {
        throw new Error(
            `showSynapse expects 1 to ${MAX_SIGNALS} signals, but got ${signals.length}.`
        );
    }
    return signals;
}

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        /**
         * Animates each signal crossing the synapse and the receiving neuron's
         * membrane potential adding up from rest (-70 mV), then fires an
         * action potential if `fires` is true.
         * Python: show_synapse(signals, threshold, fires)
         */
        showSynapse: (signals: unknown, threshold: unknown, fires: unknown) => {
            if (typeof threshold !== "number" || threshold < -80 || threshold > 0) {
                throw new Error("showSynapse expects threshold to be a number of mV from -80 to 0, like -55.");
            }
            if (typeof fires !== "boolean") {
                throw new Error("showSynapse expects fires to be true or false.");
            }
            sendMessage({ type: "showSynapse", signals: toSignals(signals), threshold, fires });
        },
    });
};

export default createExports;
