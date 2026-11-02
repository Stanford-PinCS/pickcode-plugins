// This code flips a coin and graphs the share of flips that land heads.
// Change totalFlips, then press Run.

let totalFlips = 10;

// Returns "H" for heads or "T" for tails.
function flipCoin() {
    if (Math.random() < 0.5) {
        return "H";
    }
    return "T";
}

// Flip your coin totalFlips times and draw the graph.
flipCoins(totalFlips, flipCoin);
