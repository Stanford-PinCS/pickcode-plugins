# This code flips a coin and graphs the share of flips that land heads.
# Change totalFlips, then press Run.

import random

totalFlips = 10000

# Returns "H" for heads or "T" for tails.
def flipCoin():
    if random.random() < 0.7:
        return "H"
    return "T"

# Flip your coin totalFlips times and draw the graph.
flipCoins(totalFlips, flipCoin)
