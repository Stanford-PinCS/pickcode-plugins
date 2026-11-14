# This code graphs the market for paper made by the mills along a river.
# Change marginalSocialCost so it counts the cost of the mills' waste.

# Marginal private benefit (MPB): what the last ton is worth to buyers, in dollars.
def marginalPrivateBenefit(quantity):
    return 140 - 2 * quantity

# Marginal private cost (MPC): what the last ton costs the mills to make, in dollars.
def marginalPrivateCost(quantity):
    return 20 + 2 * quantity

# The waste from each ton costs the people downstream $40.
externalCost = 40

# The tax the mills pay on each ton they sell, in dollars.
tax = externalCost

# Returns the marginal social cost (MSC) of the last ton, in dollars.
def marginalSocialCost(quantity):
    return marginalPrivateCost(quantity) + externalCost

# Find the market and socially optimal quantities, then graph the market.
drawMarket(marginalPrivateBenefit, marginalPrivateCost, marginalSocialCost, tax)
