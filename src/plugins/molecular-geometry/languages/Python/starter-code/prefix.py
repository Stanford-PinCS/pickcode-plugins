# Hidden helper. Checks the student's numbers, asks their getShape function
# to name the shape, and sends everything to the molecule on the right.


def isWholeNumber(value):
    return isinstance(value, int) and not isinstance(value, bool)


def buildMolecule(bondingPairs, lonePairs, getShape):
    if not isWholeNumber(bondingPairs) or bondingPairs < 2 or bondingPairs > 6:
        raise ValueError("bondingPairs should be a whole number from 2 to 6, like 4 for CH4.")
    if not isWholeNumber(lonePairs) or lonePairs < 0 or lonePairs > 4:
        raise ValueError("lonePairs should be a whole number from 0 to 4, like 2 for H2O.")
    if bondingPairs + lonePairs > 6:
        raise ValueError("bondingPairs + lonePairs should be 6 or less.")
    if not callable(getShape):
        raise TypeError("buildMolecule needs your getShape function as its third input.")

    shape = getShape(bondingPairs, lonePairs)
    if not isinstance(shape, str):
        raise TypeError(
            f'getShape should return a shape name in quotes, like "linear", but it returned {shape!r}.'
        )
    show_molecule(bondingPairs, lonePairs, shape)
