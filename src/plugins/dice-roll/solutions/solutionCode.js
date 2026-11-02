// This code rolls a die many times and graphs how often each face comes up.
// Change totalRolls and numSides, then press Run.

let totalRolls = 10000;
let numSides = 12;

// Rolls two 6-sided dice, then returns their total (2 to 12).
function rollDie() {
    let first = Math.floor(Math.random() * 6) + 1;
    let second = Math.floor(Math.random() * 6) + 1;
    return first + second;
}

// Roll your die totalRolls times and draw the bars.
rollDice(totalRolls, numSides, rollDie);
