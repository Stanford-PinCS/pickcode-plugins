// This code simulates the reaction A -> B, one time step (1 second) at a time.
// Change numMolecules, k, and numSteps, then press Run.

let numMolecules = 100;
let k = 0.02;        // rate constant: chance one A molecule reacts each second
let numSteps = 20;   // how many seconds to run

// Runs once for every A molecule, every time step.
function stepMolecule() {
    if (Math.random() < k) {
        return "B";   // this molecule reacted
    }
    return "A";       // still A this time
}

// Run every step on every molecule, then draw the grid and the graph.
runSimulation(numMolecules, k, numSteps, stepMolecule);
