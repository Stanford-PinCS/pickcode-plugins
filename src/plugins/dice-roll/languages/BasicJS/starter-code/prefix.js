// Hidden helper. Rolls the student's die totalRolls times, turns the counts
// for each face into percentages, and sends them to the bar chart.
function rollDice(totalRolls, numSides, rollDie) {
    if (!Number.isInteger(totalRolls) || totalRolls < 1 || totalRolls > 100000) {
        throw new Error(
            "totalRolls should be a whole number from 1 to 100000, like 10 or 1000."
        );
    }
    if (!Number.isInteger(numSides) || numSides < 2 || numSides > 30) {
        throw new Error("numSides should be a whole number from 2 to 30, like 6 or 12.");
    }
    if (typeof rollDie !== "function") {
        throw new Error("rollDice needs your rollDie function as its third input.");
    }

    const faceCounts = new Array(numSides).fill(0);
    for (let i = 0; i < totalRolls; i++) {
        const roll = rollDie();
        if (!Number.isInteger(roll) || roll < 1 || roll > numSides) {
            throw new Error(
                `rollDie returned ${String(roll)}, but it should return a whole number from 1 to ${numSides}. ` +
                    "Change rollDie, or make numSides bigger."
            );
        }
        faceCounts[roll - 1]++;
    }

    const percentages = faceCounts.map((count) => (count / totalRolls) * 100);
    showTarget(100 / numSides);
    showBars(percentages, totalRolls);
}
