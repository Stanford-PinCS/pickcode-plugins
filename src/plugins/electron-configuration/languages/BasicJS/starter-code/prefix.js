// Hidden helpers for the orbital diagram. The student's loop calls
// getCapacity and placeElectrons; drawOrbitals sends every electron it placed
// to the diagram on the right.
const subshellNames = [
    "1s", "2s", "2p", "3s", "3p", "4s", "3d", "4p", "5s", "4d",
    "5p", "6s", "4f", "5d", "6p", "7s", "5f", "6d", "7p",
];
const subshellCapacity = { s: 2, p: 6, d: 10, f: 14 };
const placedElectrons = [];
let capacityChecks = 0;

const loopTooLong =
    "Your while loop has run more than 100 times. Make sure electronsLeft " +
    "gets smaller on every pass, so the loop can stop.";

function checkSubshell(subshell, helperName) {
    if (!Number.isInteger(subshell) || subshell < 0) {
        throw new Error(
            `${helperName} expects subshell to be a whole number: 0 for 1s, 1 for 2s, 2 for 2p, and so on.`
        );
    }
    if (subshell >= subshellNames.length) {
        throw new Error(
            "There's no subshell after 7p (subshell 18). Is atomicNumber bigger than 118?"
        );
    }
}

// How many electrons a subshell can hold: s = 2, p = 6, d = 10, f = 14.
function getCapacity(subshell) {
    checkSubshell(subshell, "getCapacity");
    capacityChecks = capacityChecks + 1;
    if (capacityChecks > 100) {
        throw new Error(loopTooLong);
    }
    return subshellCapacity[subshellNames[subshell][1]];
}

// Puts count electrons into a subshell.
function placeElectrons(subshell, count) {
    checkSubshell(subshell, "placeElectrons");
    if (!Number.isInteger(count) || count < 0) {
        throw new Error(
            `placeElectrons expects a whole number of electrons, but got ${String(count)}.`
        );
    }
    placedElectrons.push([subshell, count]);
    if (placedElectrons.length > 100) {
        throw new Error(loopTooLong);
    }
}

// Sends everything the loop placed to the orbital diagram.
function drawOrbitals(atomicNumber) {
    if (!Number.isInteger(atomicNumber) || atomicNumber < 1 || atomicNumber > 118) {
        throw new Error(
            "atomicNumber should be a whole number from 1 to 118, like 6 for carbon."
        );
    }
    showAtom(atomicNumber, placedElectrons);
}
