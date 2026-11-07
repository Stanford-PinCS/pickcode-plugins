# This code draws Dovania's production possibilities curve (PPC) and tests points.
# Change opportunityCosts and describePoint so they match what the PPC shows.

# The most capital goods Dovania can make with 0, 1, 2, ... 5 consumption goods.
capitalGoods = [30, 28, 25, 20, 12, 0]

# Economic growth: how many percent more of each good Dovania can make.
growth = 25

# Combinations to test, each [consumption goods, capital goods].
points = [[3, 20], [1, 15], [4, 25], [5, 15]]

# Returns the opportunity cost of each additional unit of consumption goods.
def opportunityCosts(table):
    costs = []
    for i in range(1, len(table)):
        # The capital goods given up to make unit i of consumption goods.
        costs.append(table[i - 1] - table[i])
    return costs

# Describes a combination: "efficient", "inefficient" or "unattainable".
# mostCapital is the PPC's height at the combination's consumption goods.
def describePoint(capital, mostCapital):
    if capital == mostCapital:
        return "efficient"
    elif capital < mostCapital:
        return "inefficient"
    else:
        return "unattainable"

# Find the opportunity costs, shift the PPC by the growth, and test each combination.
drawPPC(capitalGoods, growth, points, opportunityCosts, describePoint)
