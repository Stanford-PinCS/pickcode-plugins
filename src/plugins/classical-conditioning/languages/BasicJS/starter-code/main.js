// This code trains a dog to drool when it hears a bell.
// Change the numbers, then press Run.

let learningRate = 0.3;
let numPairedTrials = 5;    // bell, then food
let numBellOnlyTrials = 0;  // bell, no food

// Returns the new strength of the bell-food link after one trial.
function updateStrength(strength, foodPresent) {
    if (foodPresent) {
        strength = strength + learningRate * (100 - strength);
    }
    return strength;
}

// Run every trial and draw the learning curve.
trainDog(numPairedTrials, numBellOnlyTrials, updateStrength);
