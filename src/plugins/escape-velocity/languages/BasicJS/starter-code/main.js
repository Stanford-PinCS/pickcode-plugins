// Launch an object from a planet and predict whether it escapes.
// Change v0, then fix isEscaping so its prediction is always right.

let v0 = 10;

// Returns true if an object moving at speed v escapes a planet
// with gravity strength mu, from a distance r from its center.
function isEscaping(v, mu, r) {
    return v > 0;
}

// Launch at speed v0 and check isEscaping's prediction.
runSimulation(v0, isEscaping);
