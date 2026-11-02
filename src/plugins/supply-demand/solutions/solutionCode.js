// These numbers control the market graph: two curve shifts and your guess.
// Change one number at a time, then press Run again.

let supplyShift = -0.4;
let demandShift = 0.4;
let guessPrice = 1.4;
let guessQuantity = 1;

// Draw the market with your shifts, your guess, and the equilibrium.
showMarket(supplyShift, demandShift, guessPrice, guessQuantity);
