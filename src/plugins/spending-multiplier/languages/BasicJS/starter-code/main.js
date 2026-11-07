// This code follows each round of new spending after Vellmark changes spending or taxes.
// Change changeInGDP so each round people spend just the MPC share of their new income.

let mpc = 0.8;     // the marginal propensity to consume
let rounds = 20;   // how many rounds of spending to follow

// Returns the total change in real GDP after the given number of rounds.
// firstRound is the new spending in round 1, in millions of dollars.
function changeInGDP(firstRound, mpc, rounds) {
    let spending = firstRound;   // this round's new spending
    let total = 0;               // the running total of new spending so far
    for (let r = 1; r <= rounds; r++) {
        total = total + spending;
    }
    return total;
}

// The government spends $100 million more on a bridge. Follow each round and draw it.
spendMore(100, mpc, rounds, changeInGDP);
