# This code follows a new deposit from bank to bank and adds up the new money.
# Change createMoney so each bank lends out its excess reserves.

# Rosa deposits $1,000 of cash in Bank 1. Each loan is deposited in the next bank.
newDeposit = 1000    # the new deposit, in dollars
reserveRatio = 0.2   # the required reserve ratio

# Follows the new deposit from bank to bank. Each pass of the loop is one bank.
def createMoney(newDeposit, reserveRatio):
    deposit = newDeposit
    while deposit > 1:
        required = deposit * reserveRatio     # required reserves
        loan = 0                              # the bank lends nothing
        addBank(deposit, loan)
        deposit = loan   # the loan is spent and deposited in the next bank

# Run the chain of banks, then draw each bank's deposit and the new money.
runBanks(newDeposit, reserveRatio, createMoney)
