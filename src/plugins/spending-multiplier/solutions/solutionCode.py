# This code follows each round of new spending after Vellmark changes spending or taxes.
# Change changeInGDP so each round people spend just the MPC share of their new income.

mpc = 0.75    # the marginal propensity to consume
rounds = 20   # how many rounds of spending to follow

# Returns the total change in real GDP after the given number of rounds.
# firstRound is the new spending in round 1, in millions of dollars.
def changeInGDP(firstRound, mpc, rounds):
    spending = firstRound   # this round's new spending
    total = 0               # the running total of new spending so far
    for r in range(1, rounds + 1):
        total = total + spending
        spending = spending * mpc
    return total

# Instead, the government cuts taxes by $100 million. Follow each round and draw it.
cutTaxes(100, mpc, rounds, changeInGDP)
