# This code adds up the signals that reach a neuron, then decides if it fires.
# Change the numbers in signals, then press Run.

signals = [4, 4]   # mV from each burst: + excites, - inhibits
threshold = -55    # mV the neuron must reach to fire

# Start at the resting potential (-70 mV) and add each signal.
potential = -70
for i in range(len(signals)):
    potential = potential + signals[i]

# All-or-none: the neuron fires only if potential reaches threshold.
fires = False
if potential >= threshold:
    fires = True

# Send your signals, threshold, potential and decision to the synapse.
sendSignals(signals, threshold, potential, fires)
