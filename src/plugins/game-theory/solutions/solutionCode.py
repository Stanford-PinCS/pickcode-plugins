# This code draws the payoff matrix of a pricing game between two airlines.
# Change bestResponse so it picks the price that earns an airline more profit.

# Each airline charges a high or a low price. HIGH and LOW are their list indexes.
HIGH = 0
LOW = 1

# Monthly profit, in thousands of dollars, as payoffs[myPrice][otherPrice].
# Rows: the airline's own price. Columns: the other airline's price, HIGH then LOW.
gull = [[60, 20],    # Gull charges HIGH
        [80, 40]]    # Gull charges LOW
heron = [[60, 20],   # Heron charges HIGH
         [80, 40]]   # Heron charges LOW

# A fee Gull pays, in thousands of dollars, each month it charges LOW.
fee = 21
gull[LOW][HIGH] -= fee
gull[LOW][LOW] -= fee

# Returns HIGH or LOW: whichever earns more when the other airline charges otherPrice.
def bestResponse(payoffs, otherPrice):
    if payoffs[LOW][otherPrice] > payoffs[HIGH][otherPrice]:
        return LOW
    else:
        return HIGH

# Ask bestResponse which price each airline picks, then draw the payoff matrix.
drawGame(gull, heron, bestResponse)

# The airlines collude: they make a deal to both charge HIGH.
drawDeal(HIGH, HIGH)
