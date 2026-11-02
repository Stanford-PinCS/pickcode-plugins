// This code names a molecule's shape from the electron domains on its central atom.
// Change bondingPairs and lonePairs, then teach getShape more shapes.

let bondingPairs = 2;
let lonePairs = 1;

// Returns the name of the molecule's shape.
function getShape(bondingPairs, lonePairs) {
    let domains = bondingPairs + lonePairs;
    if (domains === 2) {
        return "linear";
    } else if (domains === 4 && lonePairs === 0) {
        return "tetrahedral";
    } else if (domains === 4 && lonePairs === 1) {
        return "trigonal pyramidal";
    } else if (domains === 4 && lonePairs === 2) {
        return "bent";
    } else if (domains === 3 && lonePairs === 0) {
        return "trigonal planar";
    } else if (domains === 3 && lonePairs === 1) {
        return "bent";
    }
    return "unknown";
}

// Build the molecule, let its domains push apart, then label it with getShape.
buildMolecule(bondingPairs, lonePairs, getShape);
