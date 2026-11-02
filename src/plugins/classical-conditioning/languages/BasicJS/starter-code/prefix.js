// Hidden helper. Runs the trials one at a time. Each trial's strength is
// handed to updateStrength, and the answer becomes the strength for the next
// trial. Then it sends every trial to the dog and the learning curve.
function trainDog(numPairedTrials, numBellOnlyTrials, updateStrength) {
    if (!Number.isInteger(numPairedTrials) || numPairedTrials < 0 || numPairedTrials > 100) {
        throw new Error("numPairedTrials should be a whole number from 0 to 100, like 5 or 15.");
    }
    if (!Number.isInteger(numBellOnlyTrials) || numBellOnlyTrials < 0 || numBellOnlyTrials > 100) {
        throw new Error("numBellOnlyTrials should be a whole number from 0 to 100, like 0 or 10.");
    }
    if (numPairedTrials + numBellOnlyTrials < 1) {
        throw new Error("Run at least one trial: make numPairedTrials 1 or more.");
    }
    if (typeof updateStrength !== "function") {
        throw new Error("trainDog needs your updateStrength function as its third input.");
    }

    const foodList = [];
    const strengthList = [];
    let strength = 0;
    for (let trial = 1; trial <= numPairedTrials + numBellOnlyTrials; trial++) {
        const foodPresent = trial <= numPairedTrials;
        strength = updateStrength(strength, foodPresent);
        if (typeof strength !== "number" || !Number.isFinite(strength)) {
            throw new Error(
                `updateStrength returned ${String(strength)} on trial ${trial}, but it should return a number. ` +
                    "Check that it ends with return strength."
            );
        }
        if (strength < -0.001 || strength > 100.001) {
            throw new Error(
                `On trial ${trial} the strength became ${strength.toFixed(1)}, but it should stay from 0 to 100. ` +
                    "Try a learningRate between 0 and 1."
            );
        }
        strength = Math.min(100, Math.max(0, strength));
        foodList.push(foodPresent ? 1 : 0);
        strengthList.push(strength);
    }

    showTrials(foodList, strengthList);
}
