# This code decides how many crates of tomatoes a farm grows each day.
# Change marginalCosts and chooseOutput so the farm makes as much profit as it can.

# Total cost, in dollars, of growing 0, 1, 2, ... 10 crates of tomatoes in a day.
totalCosts = [40, 57, 70, 82, 96, 114, 137, 166, 202, 246, 299]

# The market price of one crate, in dollars.
price = 36

# Returns the marginal cost of each crate, from the 1st crate to the last.
def marginalCosts(totalCosts):
    mc = []
    for q in range(1, len(totalCosts)):
        mc.append(totalCosts[q])
    return mc

# Returns how many crates to grow at this price.
def chooseOutput(price, mc):
    return len(mc)

# Find the marginal costs, choose the output, and draw the farm's cost curves.
runFarm(totalCosts, price, marginalCosts, chooseOutput)
