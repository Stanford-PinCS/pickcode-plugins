# Hidden helper. Runs the nested loops: for every time step, it calls your
# stepMolecule function once for every molecule that is still A.
import random


def runSimulation(numMolecules, k, numSteps, stepMolecule):
    if isinstance(numMolecules, bool) or not isinstance(numMolecules, int) or numMolecules < 1 or numMolecules > 2500:
        raise ValueError("numMolecules should be a whole number from 1 to 2500, like 100.")
    if isinstance(k, bool) or not isinstance(k, (int, float)) or k < 0 or k > 1:
        raise ValueError("k should be a number from 0 to 1, like 0.02.")
    if isinstance(numSteps, bool) or not isinstance(numSteps, int) or numSteps < 1 or numSteps > 500:
        raise ValueError("numSteps should be a whole number from 1 to 500, like 20 or 100.")
    if not callable(stepMolecule):
        raise TypeError("runSimulation needs your stepMolecule function as its fourth input.")

    molecules = ["A"] * numMolecules
    reactedAt = [0] * numMolecules
    for step in range(1, numSteps + 1):
        for i in range(numMolecules):
            if molecules[i] == "A":
                result = stepMolecule()
                if result == "B":
                    molecules[i] = "B"
                    reactedAt[i] = step
                elif result != "A":
                    raise ValueError(
                        f'stepMolecule should return "A" or "B", but it returned {result!r}.'
                    )

    show_molecules(reactedAt, numSteps, k)
