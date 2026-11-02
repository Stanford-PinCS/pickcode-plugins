# This code names a molecule's shape from the electron domains on its central atom.
# Change bondingPairs and lonePairs, then teach getShape more shapes.

bondingPairs = 2
lonePairs = 1

# Returns the name of the molecule's shape.
def getShape(bondingPairs, lonePairs):
    domains = bondingPairs + lonePairs
    if domains == 2:
        return "linear"
    elif domains == 4 and lonePairs == 0:
        return "tetrahedral"
    elif domains == 4 and lonePairs == 1:
        return "trigonal pyramidal"
    elif domains == 4 and lonePairs == 2:
        return "bent"
    elif domains == 3 and lonePairs == 0:
        return "trigonal planar"
    elif domains == 3 and lonePairs == 1:
        return "bent"
    return "unknown"

# Build the molecule, let its domains push apart, then label it with getShape.
buildMolecule(bondingPairs, lonePairs, getShape)
