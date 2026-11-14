# This code follows Selvaro's money supply, price level and real output year by year.
# Change priceLevel and moneySupplyByYear to match the quantity theory of money.

# Selvaro's economy, at full employment. Amounts are in billions of dollars.
money = 500        # the money supply in year 0, M
velocity = 4       # times a dollar is spent on output in a year, V
realOutput = 1000  # real output, Y
moneyGrowth = 5    # the money supply's growth rate, in % a year
years = 10         # how many years to follow

# Returns the price level, P, from the equation of exchange M × V = P × Y.
def priceLevel(money, velocity, realOutput):
    return money

# Returns a list of the money supply in each year, from year 0 to the last year.
def moneySupplyByYear(money, moneyGrowth, years):
    supply = [money]
    for year in range(1, years + 1):
        supply.append(money)
    return supply

# Find the money supply in each year, then draw the economy year by year.
supply = moneySupplyByYear(money, moneyGrowth, years)
drawEconomy(supply, velocity, realOutput, priceLevel)
