# This code walks up a theater's demand curve, one price increase at a time.
# Change elasticity so it measures the price elasticity of demand, then fix describe.

# The theater's demand schedule: the quantity of tickets demanded at each price.
prices = [5, 10, 15, 20, 25, 30, 35]
quantities = [210, 180, 150, 120, 90, 60, 30]

# Price increases to test: each is a price the theater might raise to the next one.
raises = []

# Returns the magnitude of the price elasticity of demand for a change from old to new.
def elasticity(oldPrice, oldQuantity, newPrice, newQuantity):
    return (newQuantity - oldQuantity) / (newPrice - oldPrice)

# Describes demand with elasticity e: "elastic", "inelastic" or "unit elastic".
def describe(e):
    return "elastic"

# Walk up the demand curve one price increase at a time, using your two functions.
walkDemand(prices, quantities, elasticity, describe, raises)
