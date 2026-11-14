// This code follows a new deposit from bank to bank and adds up the new money.
// Change createMoney so each bank lends out its excess reserves.

// Rosa deposits $1,000 of cash in Bank 1. Each loan is deposited in the next bank.
let newDeposit = 1000;    // the new deposit, in dollars
let reserveRatio = 0.2;   // the required reserve ratio

// Follows the new deposit from bank to bank. Each pass of the loop is one bank.
function createMoney(newDeposit, reserveRatio) {
    let deposit = newDeposit;
    while (deposit > 1) {
        let required = deposit * reserveRatio;     // required reserves
        let loan = 0;                              // the bank lends nothing
        addBank(deposit, loan);
        deposit = loan;   // the loan is spent and deposited in the next bank
    }
}

// Run the chain of banks, then draw each bank's deposit and the new money.
runBanks(newDeposit, reserveRatio, createMoney);
