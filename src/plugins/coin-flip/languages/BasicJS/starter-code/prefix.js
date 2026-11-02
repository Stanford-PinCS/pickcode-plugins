// Hidden helper. Flips the student's coin totalFlips times, tracks the
// running proportion of heads, and sends it to the graph.
function flipCoins(totalFlips, flipCoin) {
    if (!Number.isInteger(totalFlips) || totalFlips < 1 || totalFlips > 100000) {
        throw new Error(
            "totalFlips should be a whole number from 1 to 100000, like 10 or 1000."
        );
    }
    if (typeof flipCoin !== "function") {
        throw new Error("flipCoins needs your flipCoin function as its second input.");
    }

    let heads = 0;
    const proportions = [];
    for (let i = 1; i <= totalFlips; i++) {
        const flip = flipCoin();
        if (flip === "H") {
            heads++;
        } else if (flip !== "T") {
            throw new Error(
                `flipCoin should return "H" or "T", but it returned ${String(flip)}.`
            );
        }
        proportions.push(heads / i);
    }

    showTarget(0.5);
    plotLine(proportions);
}
