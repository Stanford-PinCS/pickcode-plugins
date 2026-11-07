# Hidden helpers. runTest asks the student's mean, standardDeviation and tStatistic about one sample and sends the test to the plots on the right, which find the p-value from the t-distribution with df = n − 1.
# simulateTests draws many random samples from a population where H0 is true, asks the student's functions about each one, and sends them all to the plots, which count how often the test rejects H0.
import math
import random

# How many samples simulateTests draws.
SIMULATED_SAMPLES = 1000
# The simulated boxes' weights follow a normal distribution with mean μ0 and this standard deviation, in grams.
POPULATION_SD = 4


def isNumber(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def checkAlternative(alternative, helper):
    if not isinstance(alternative, str) or alternative not in ("!=", "<", ">"):
        raise ValueError(f'{helper} needs the alternative hypothesis as "!=" (for Ha: μ ≠ μ0), "<" (for Ha: μ < μ0) or ">" (for Ha: μ > μ0), but it got {alternative!r}.')


def checkMu0(mu0, helper):
    if not isNumber(mu0) or not math.isfinite(mu0):
        raise TypeError(f"{helper} needs μ0, the mean in the null hypothesis, as a number, like 500.")


def checkFunctions(tStatistic, helper):
    if not callable(tStatistic):
        raise TypeError(f"{helper} needs your tStatistic function as its last input.")
    if not callable(globals().get("mean")) or not callable(globals().get("standardDeviation")):
        raise NameError(f"{helper} uses your mean and standardDeviation functions, so keep both of them in your code.")


def checkResult(name, result, n):
    if result is None:
        raise TypeError(f"{name} returned None for a sample of {n} values. Make sure it ends with a return line.")
    if not isNumber(result) or not math.isfinite(result):
        raise TypeError(f"{name} should return a number, but it returned {result!r} for a sample of {n} values.")
    return result


# Asks the student's functions for x̄, s and t of one sample.
def testOneSample(sample, mu0, tStatistic):
    n = len(sample)
    xBar = checkResult("mean", mean(list(sample)), n)
    s = checkResult("standardDeviation", standardDeviation(list(sample)), n)
    if s < 0:
        raise ValueError(f"standardDeviation returned {s}, but a standard deviation can't be negative.")
    if s == 0:
        raise ValueError("standardDeviation returned 0, and tStatistic divides by s / √n. s is 0 only when every value is the same.")
    t = checkResult("tStatistic", tStatistic(list(sample), mu0), n)
    return xBar, s, t


def runTest(data, mu0, alternative, tStatistic):
    if not isinstance(data, (list, tuple)) or len(data) < 2 or len(data) > 500:
        raise TypeError("runTest needs a list of 2 to 500 numbers as its first input.")
    for value in data:
        if not isNumber(value) or not math.isfinite(value):
            raise TypeError(f"Every value in the list should be a number, but one of them is {value!r}.")
    checkMu0(mu0, "runTest")
    checkAlternative(alternative, "runTest")
    checkFunctions(tStatistic, "runTest")

    xBar, s, t = testOneSample(data, mu0, tStatistic)
    show_test(list(data), mu0, xBar, s, t, len(data) - 1, alternative)


def simulateTests(mu0, n, alternative, tStatistic):
    checkMu0(mu0, "simulateTests")
    if not isinstance(n, int) or isinstance(n, bool) or n < 2 or n > 100:
        raise TypeError("simulateTests needs the sample size, n, as a whole number from 2 to 100, like 12.")
    checkAlternative(alternative, "simulateTests")
    checkFunctions(tStatistic, "simulateTests")

    means = []
    tValues = []
    for i in range(SIMULATED_SAMPLES):
        sample = [random.gauss(mu0, POPULATION_SD) for j in range(n)]
        xBar, s, t = testOneSample(sample, mu0, tStatistic)
        means.append(xBar)
        tValues.append(t)
    show_simulation(mu0, n, n - 1, alternative, means, tValues)
