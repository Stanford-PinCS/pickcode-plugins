// This code names a molecule's shape from the electron domains on its central atom.
// Change bondingPairs and lonePairs, then teach getShape more shapes.

let bondingPairs = 2;
let lonePairs = 0;

// Returns the name of the molecule's shape.
function getShape(bondingPairs, lonePairs) {
    let domains = bondingPairs + lonePairs;
    if (domains === 2) {
        return "linear";
    }
    return "unknown";
}

// Build the molecule, let its domains push apart, then label it with getShape.
buildMolecule(bondingPairs, lonePairs, getShape);
