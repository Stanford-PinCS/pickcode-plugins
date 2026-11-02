# This code simulates the reaction A -> B, one time step (1 second) at a time.
# Change numMolecules, k, and numSteps, then press Run.

import random

numMolecules = 2500
k = 0.04        # rate constant: chance one A molecule reacts each second
numSteps = 100  # how many seconds to run

# Runs once for every A molecule, every time step.
def stepMolecule():
    if random.random() < k:
        return "B"   # this molecule reacted
    return "A"       # still A this time

# Run every step on every molecule, then draw the grid and the graph.
runSimulation(numMolecules, k, numSteps, stepMolecule)
