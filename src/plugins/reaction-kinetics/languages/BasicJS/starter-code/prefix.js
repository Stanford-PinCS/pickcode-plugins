// Hidden helper. Runs the nested loops: for every time step, it calls your
// stepMolecule function once for every molecule that is still A.
function runSimulation(numMolecules, k, numSteps, stepMolecule) {
    if (!Number.isInteger(numMolecules) || numMolecules < 1 || numMolecules > 2500) {
        throw new Error("numMolecules should be a whole number from 1 to 2500, like 100.");
    }
    if (typeof k !== "number" || !Number.isFinite(k) || k < 0 || k > 1) {
        throw new Error("k should be a number from 0 to 1, like 0.02.");
    }
    if (!Number.isInteger(numSteps) || numSteps < 1 || numSteps > 500) {
        throw new Error("numSteps should be a whole number from 1 to 500, like 20 or 100.");
    }
    if (typeof stepMolecule !== "function") {
        throw new Error("runSimulation needs your stepMolecule function as its fourth input.");
    }

    const molecules = new Array(numMolecules).fill("A");
    const reactedAt = new Array(numMolecules).fill(0);
    for (let step = 1; step <= numSteps; step++) {
        for (let i = 0; i < numMolecules; i++) {
            if (molecules[i] === "A") {
                const result = stepMolecule();
                if (result === "B") {
                    molecules[i] = "B";
                    reactedAt[i] = step;
                } else if (result !== "A") {
                    throw new Error(
                        `stepMolecule should return "A" or "B", but it returned ${String(result)}.`
                    );
                }
            }
        }
    }

    showMolecules(reactedAt, numSteps, k);
}
