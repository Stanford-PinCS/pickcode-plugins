// ============================================
// Coin Flip Simulation: Law of Large Numbers
//
// Change totalFlips to see what happens!
// Try 50, 500, or 5000.
// ============================================

let totalFlips = 50;

let headsCount = 0;
let proportions = [];

for (let i = 1; i <= totalFlips; i++) {
    // Flip a coin: Math.random() gives a number 0-1
    let flip = Math.random() < 0.5 ? "H" : "T";

    // Count it if it's Heads
    if (flip === "H") {
        headsCount++;
    }

    // What fraction of ALL flips so far were Heads?
    proportions.push(headsCount / i);
}

// Draw the theoretical target line at 0.50
showTarget(0.5);

// Plot the running proportion over time
plotLine(proportions);
