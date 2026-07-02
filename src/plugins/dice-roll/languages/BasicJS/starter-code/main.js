// ============================================
// Dice Roll Simulation: Law of Large Numbers
//
// This time there are TWO things to experiment with:
//   1. totalRolls  — how many times to roll
//   2. numSides    — how many sides the die has
//
// Try numSides = 6 with 100 rolls, then 10000.
// Then try numSides = 12 or 20. Does LLN still work?
// ============================================

let totalRolls = 100;
let numSides = 6;

// One counter for each face of the die
let faceCounts = new Array(numSides).fill(0);

for (let i = 0; i < totalRolls; i++) {
    // Roll the die: random integer from 1 to numSides
    let roll = Math.floor(Math.random() * numSides) + 1;

    // Add 1 to that face's counter
    faceCounts[roll - 1]++;
}

// Convert counts to percentages
let percentages = faceCounts.map(function (count) {
    return (count / totalRolls) * 100;
});

// The expected percentage for a fair die
showTarget(100 / numSides);
showBars(percentages);
