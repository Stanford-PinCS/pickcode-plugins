// This code rolls a die many times and graphs how often each face comes up.
// Change totalRolls and numSides, then press Run.

let totalRolls = 10;
let numSides = 6;

// Rolls one die and returns a whole number from 1 to numSides.
function rollDie() {
    return Math.floor(Math.random() * numSides) + 1;
}

// Roll your die totalRolls times and draw the bars.
rollDice(totalRolls, numSides, rollDie);
