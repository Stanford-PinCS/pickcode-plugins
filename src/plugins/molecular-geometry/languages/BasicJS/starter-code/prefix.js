// Hidden helper. Checks the student's numbers, asks their getShape function
// to name the shape, and sends everything to the molecule on the right.
function buildMolecule(bondingPairs, lonePairs, getShape) {
    if (!Number.isInteger(bondingPairs) || bondingPairs < 2 || bondingPairs > 6) {
        throw new Error("bondingPairs should be a whole number from 2 to 6, like 4 for CH4.");
    }
    if (!Number.isInteger(lonePairs) || lonePairs < 0 || lonePairs > 4) {
        throw new Error("lonePairs should be a whole number from 0 to 4, like 2 for H2O.");
    }
    if (bondingPairs + lonePairs > 6) {
        throw new Error("bondingPairs + lonePairs should be 6 or less.");
    }
    if (typeof getShape !== "function") {
        throw new Error("buildMolecule needs your getShape function as its third input.");
    }

    const shape = getShape(bondingPairs, lonePairs);
    if (typeof shape !== "string") {
        throw new Error(
            `getShape should return a shape name in quotes, like "linear", but it returned ${String(shape)}.`
        );
    }
    showMolecule(bondingPairs, lonePairs, shape);
}
