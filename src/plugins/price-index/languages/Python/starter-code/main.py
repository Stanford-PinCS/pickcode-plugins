# This code measures inflation with the cost of Rosa's basket of goods and services.
# Change basketCost, inflationRate and realWage to measure inflation and real wages.

# Rosa's basket: how much of each good or service she buys a year, and its prices.
# prices[0] is the price in the base year, prices[1] in year 1, and so on.
basket = [
    {"good": "Bus ride", "quantity": 400, "prices": [2.00, 2.75, 3.50, 3.00]},
    {"good": "Bread", "quantity": 100, "prices": [3.00, 3.50, 4.00, 3.60]},
    {"good": "Haircut", "quantity": 10, "prices": [30, 30, 30, 33]},
]

# Rosa's nominal wage each year, in dollars per hour.
wages = [20, 24, 30, 30]

# Returns what the whole basket costs at the prices of one year.
def basketCost(basket, year):
    total = 0
    for item in basket:
        total = total + item["prices"][year]
    return total

# Returns the CPI in a year: the basket's cost that year relative to the base year.
def cpi(basket, year):
    return basketCost(basket, year) / basketCost(basket, 0) * 100

# Returns the inflation rate, in percent, from one year's CPI to the next year's.
def inflationRate(oldCPI, newCPI):
    return newCPI - oldCPI

# Returns the real wage: the nominal wage deflated by the price level.
def realWage(nominalWage, priceIndex):
    return nominalWage

# Find every year's basket cost and CPI, then draw them with inflation and wages.
measureInflation(basket, wages, basketCost, cpi, inflationRate, realWage)
