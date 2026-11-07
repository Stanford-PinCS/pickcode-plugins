# Hidden helper. Asks the student's binomialProbability for P(X = k) for every k from 0 to n, simulates 10,000 sessions of n free throws, and sends both to the bar chart on the right.
import math


def isNumber(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def drawBinomial(n, p, binomialProbability):
    import random
    SESSIONS = 10000
    if not isNumber(n) or not math.isfinite(n) or n != int(n) or n < 1 or n > 100:
        raise ValueError(f"n is the number of free throws, so it should be a whole number from 1 to 100, but it is {n!r}.")
    n = int(n)
    if not isNumber(p) or not math.isfinite(p) or p < 0 or p > 1:
        raise ValueError(f"p is a probability, so it should be a number from 0 to 1, but it is {p!r}.")
    if not callable(binomialProbability):
        raise TypeError("drawBinomial needs the binomialProbability function as its third input.")

    # The probability distribution from the student's functions: P(X = k) for every possible number of successes.
    probabilities = []
    for k in range(n + 1):
        try:
            value = binomialProbability(n, k, p)
        except TypeError as error:
            raise TypeError(f"binomialProbability({n}, {k}, {p}) couldn't do its math ({error}). Check that choose returns a number for every k from 0 to n.") from error
        if not isNumber(value) or not math.isfinite(value):
            raise TypeError(f"binomialProbability({n}, {k}, {p}) returned {value!r}, not a number. Check that choose returns a number for every k from 0 to n.")
        probabilities.append(value)

    # The simulation: in each session, each of the n shots goes in with probability p, independently of the others.
    rand = random.random
    outcomes = []
    for _ in range(SESSIONS):
        made = 0
        for _ in range(n):
            if rand() < p:
                made += 1
        outcomes.append(made)

    show_binomial(n, p, probabilities, outcomes)
