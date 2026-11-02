// This code reacts hydrogen with oxygen to make water: 2 H2 + O2 -> 2 H2O.
// Read it, then press Run.

let molesH2 = 4;
let molesO2 = 10;

// Returns how many times the reaction can happen before a reactant runs out.
function reactionsPossible(molesH2, molesO2) {
    let fromH2 = molesH2 / 2;   // each reaction uses 2 mol of H2
    let fromO2 = molesO2 / 1;   // each reaction uses 1 mol of O2
    if (fromO2 < fromH2) {
        return fromO2;
    }
    return fromH2;
}

// Send your amounts and your function to the reaction on the right.
runReaction(molesH2, molesO2, reactionsPossible);
