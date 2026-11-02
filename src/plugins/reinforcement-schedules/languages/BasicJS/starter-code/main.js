// This code decides which lever presses earn the rat a food pellet.
// Edit the if statement, then press Run.

// Returns true if this press earns a pellet. pressNumber counts 1, 2, 3, ...
function shouldReward(pressNumber) {
    if (pressNumber % 1 === 0) {
        return true;
    }
    return false;
}

// Put a rat in the Skinner box with your reward rule.
runSkinnerBox(shouldReward);
