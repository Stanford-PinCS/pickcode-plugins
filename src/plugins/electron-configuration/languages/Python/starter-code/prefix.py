# Hidden helpers for the orbital diagram. The student's loop calls
# getCapacity and placeElectrons; drawOrbitals sends every electron it placed
# to the diagram on the right.
subshellNames = [
    "1s", "2s", "2p", "3s", "3p", "4s", "3d", "4p", "5s", "4d",
    "5p", "6s", "4f", "5d", "6p", "7s", "5f", "6d", "7p",
]
subshellCapacity = {"s": 2, "p": 6, "d": 10, "f": 14}
placedElectrons = []
capacityChecks = 0

loopTooLong = (
    "Your while loop has run more than 100 times. Make sure electronsLeft "
    "gets smaller on every pass, so the loop can stop."
)


def isWholeNumber(value):
    return isinstance(value, int) and not isinstance(value, bool)


def checkSubshell(subshell, helperName):
    if not isWholeNumber(subshell) or subshell < 0:
        raise ValueError(
            f"{helperName} expects subshell to be a whole number: "
            "0 for 1s, 1 for 2s, 2 for 2p, and so on."
        )
    if subshell >= len(subshellNames):
        raise ValueError(
            "There's no subshell after 7p (subshell 18). Is atomicNumber bigger than 118?"
        )


# How many electrons a subshell can hold: s = 2, p = 6, d = 10, f = 14.
def getCapacity(subshell):
    global capacityChecks
    checkSubshell(subshell, "getCapacity")
    capacityChecks = capacityChecks + 1
    if capacityChecks > 100:
        raise RuntimeError(loopTooLong)
    return subshellCapacity[subshellNames[subshell][1]]


# Puts count electrons into a subshell.
def placeElectrons(subshell, count):
    checkSubshell(subshell, "placeElectrons")
    if not isWholeNumber(count) or count < 0:
        raise ValueError(
            f"placeElectrons expects a whole number of electrons, but got {count!r}."
        )
    placedElectrons.append([subshell, count])
    if len(placedElectrons) > 100:
        raise RuntimeError(loopTooLong)


# Sends everything the loop placed to the orbital diagram.
def drawOrbitals(atomicNumber):
    if not isWholeNumber(atomicNumber) or atomicNumber < 1 or atomicNumber > 118:
        raise ValueError(
            "atomicNumber should be a whole number from 1 to 118, like 6 for carbon."
        )
    show_atom(atomicNumber, placedElectrons)
