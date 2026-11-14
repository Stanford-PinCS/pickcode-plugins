# This code draws the probability distribution of X, the number of free throws a player makes.
# Change choose so it counts the ways to pick which shots go in.

n = 50   # the number of trials: free throws
p = 0.5  # the probability of success: making one

# Returns the number of ways to choose which k of the n trials are successes.
def choose(n, k):
    result = 1
    for i in range(1, k + 1):
        result = result * (n - k + i) / i
    return result

# Returns P(X = k), the probability of exactly k successes in n trials.
def binomialProbability(n, k, p):
    return choose(n, k) * p ** k * (1 - p) ** (n - k)

# Find P(X = k) for each k, simulate 10,000 sessions of n free throws, and draw both.
drawBinomial(n, p, binomialProbability)
