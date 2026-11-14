# Hidden helper. 100 pollsters each take a random sample of n students from a school of 2,500, where 1,550 students (p = 0.62) support a later start time. Each finds pHat, the proportion of their sample who support it, and calls the student's confidenceInterval function. Then every interval and the true p go to the plot on the right.
import math
import random


def isNumber(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def runPolls(n, zStar, confidenceInterval):
    SCHOOL_SIZE = 2500
    SUPPORTERS = 1550
    POLLSTERS = 100

    if isinstance(n, float) and n.is_integer():
        n = int(n)
    if not isinstance(n, int) or isinstance(n, bool) or n < 1 or n > SCHOOL_SIZE:
        raise ValueError(f"n is how many students each pollster asks, so it should be a whole number from 1 to {SCHOOL_SIZE}, but it is {n!r}.")
    if not isNumber(zStar) or not math.isfinite(zStar) or zStar <= 0:
        raise ValueError(f"zStar should be a positive number, like 1.96 for 95% confidence, but it is {zStar!r}.")
    if not callable(confidenceInterval):
        raise TypeError("runPolls needs your confidenceInterval function as its third input.")

    # One entry per student: 1 if they support a later start time, 0 if they don't.
    school = [1] * SUPPORTERS + [0] * (SCHOOL_SIZE - SUPPORTERS)

    pHats = []
    intervals = []
    for pollster in range(POLLSTERS):
        # A simple random sample of n students, without replacement.
        pHat = sum(random.sample(school, n)) / n

        result = confidenceInterval(pHat, n, zStar)
        if result is None:
            raise TypeError("confidenceInterval returned None. It should end with a return line that gives a list of two numbers, [lower, upper].")
        if not isinstance(result, (list, tuple)) or len(result) != 2:
            raise TypeError(f"confidenceInterval should return a list of two numbers, [lower, upper], but it returned {result!r}.")
        lower, upper = result
        if not isNumber(lower) or not isNumber(upper) or math.isnan(lower) or math.isnan(upper):
            raise TypeError(f"confidenceInterval returned {result!r} when pHat was {pHat}, but both items should be numbers.")
        if not math.isfinite(lower) or not math.isfinite(upper):
            raise ValueError(f"confidenceInterval returned {result!r} when pHat was {pHat}. Infinity usually means something was divided by 0.")
        if lower > upper:
            raise ValueError(f"confidenceInterval returned {result!r} when pHat was {pHat}, but the lower limit should come first: [lower, upper].")
        pHats.append(pHat)
        intervals.append([lower, upper])

    show_intervals(SUPPORTERS / SCHOOL_SIZE, n, zStar, pHats, intervals)
