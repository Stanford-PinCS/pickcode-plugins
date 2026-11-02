// These numbers control the market graph: two curve shifts and your guess.
// Change one number at a time, then press Run again.

let supplyShift = 0;
let demandShift = 0;
let guessPrice = 1.25;
let guessQuantity = 0.9;

// Draw the market with your shifts, your guess, and the equilibrium.
showMarket(supplyShift, demandShift, guessPrice, guessQuantity);
