// Hidden helper. Checks your values, then sends them to the synapse.
function sendSignals(signals, threshold, potential, fires) {
    if (!Array.isArray(signals) || signals.length < 1 || signals.length > 10) {
        throw new Error("signals should be an array of 1 to 10 numbers, like [4, 4].");
    }
    for (let i = 0; i < signals.length; i++) {
        if (typeof signals[i] !== "number" || Math.abs(signals[i]) > 20) {
            throw new Error(
                `signals[${i}] is ${String(signals[i])}. Each signal should be a number of mV from -20 to 20.`
            );
        }
    }
    if (typeof threshold !== "number" || threshold < -80 || threshold > 0) {
        throw new Error("threshold should be a number of mV from -80 to 0, like -55.");
    }
    let expected = -70;
    for (let i = 0; i < signals.length; i++) {
        expected = expected + signals[i];
    }
    if (typeof potential !== "number" || Math.abs(potential - expected) > 1e-6) {
        throw new Error(
            `potential is ${String(potential)}, but starting at -70 and adding every signal gives ${Number(expected.toFixed(2))}. ` +
                "Check that your loop adds each signal once."
        );
    }
    if (typeof fires !== "boolean") {
        throw new Error("fires should be true or false.");
    }
    showSynapse(signals, threshold, fires);
}
