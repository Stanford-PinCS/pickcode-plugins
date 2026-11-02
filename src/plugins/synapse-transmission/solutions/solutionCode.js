// This code adds up the signals that reach a neuron, then decides if it fires.
// Change the numbers in signals, then press Run.

let signals = [6, 6, -3, 6, 6];   // mV from each burst: + excites, - inhibits
let threshold = -55;    // mV the neuron must reach to fire

// Start at the resting potential (-70 mV) and add each signal.
let potential = -70;
for (let i = 0; i < signals.length; i++) {
    potential = potential + signals[i];
}

// All-or-none: the neuron fires only if potential reaches threshold.
let fires = false;
if (potential >= threshold) {
    fires = true;
}

// Send your signals, threshold, potential and decision to the synapse.
sendSignals(signals, threshold, potential, fires);
