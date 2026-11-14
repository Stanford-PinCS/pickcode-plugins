# This code tests a cereal company's claim that its boxes hold 500 grams on average.
# Change standardDeviation so it finds the sample standard deviation, s.
import math

# Weights in grams of 12 boxes an inspector picked at random.
weights = [497, 504, 493, 499, 490, 500, 496, 502, 494, 498, 492, 499]

# Returns the mean, x̄, of a list of values.
def mean(values):
    total = 0
    for x in values:
        total = total + x
    return total / len(values)

# Returns the sample standard deviation, s, of a list of values.
def standardDeviation(values):
    xBar = mean(values)
    total = 0
    for x in values:
        total = total + (x - xBar) ** 2
    return math.sqrt(total / (len(values) - 1))

# Returns the test statistic t = (x̄ − μ0) / (s / √n).
def tStatistic(values, mu0):
    xBar = mean(values)
    s = standardDeviation(values)
    return (xBar - mu0) / (s / math.sqrt(len(values)))

# Test 1000 random samples of 12 boxes where H0 is true, against Ha: μ < 500.
simulateTests(500, 12, "<", tStatistic)
