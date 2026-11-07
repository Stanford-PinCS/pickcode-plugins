// This code draws the payoff matrix of a pricing game between two airlines.
// Change bestResponse so it picks the price that earns an airline more profit.

// Each airline charges a high or a low price. HIGH and LOW are their list indexes.
let HIGH = 0;
let LOW = 1;

// Monthly profit, in thousands of dollars, as payoffs[myPrice][otherPrice].
// Rows: the airline's own price. Columns: the other airline's price, HIGH then LOW.
let gull = [[60, 20],    // Gull charges HIGH
            [80, 40]];   // Gull charges LOW
let heron = [[60, 20],   // Heron charges HIGH
             [80, 40]];  // Heron charges LOW

// Returns HIGH or LOW: whichever earns more when the other airline charges otherPrice.
function bestResponse(payoffs, otherPrice) {
    return HIGH;
}

// Ask bestResponse which price each airline picks, then draw the payoff matrix.
drawGame(gull, heron, bestResponse);
