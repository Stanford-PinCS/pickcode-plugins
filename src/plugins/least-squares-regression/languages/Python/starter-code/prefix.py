# Hidden helper. Checks the two lists, asks the student's slope function for b, finds the intercept a = ȳ − b·x̄ (the least-squares line passes through the point (x̄, ȳ)), and sends the line to the scatterplot on the right.
import math

_regressionDrawn = False


def _isNumber(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def drawRegression(xs, ys, slope):
    global _regressionDrawn
    if not isinstance(xs, (list, tuple)) or not isinstance(ys, (list, tuple)):
        raise TypeError("drawRegression needs two lists of numbers: the x-values first, then the y-values.")
    if len(xs) != len(ys):
        raise ValueError(f"The two lists should be the same length, one x-value and one y-value for each point, but there are {len(xs)} x-values and {len(ys)} y-values.")
    if len(xs) < 3:
        raise ValueError(f"drawRegression needs at least 3 points, but it got {len(xs)}.")
    for value in list(xs) + list(ys):
        if not _isNumber(value) or not math.isfinite(value):
            raise TypeError(f"Every value in the two lists should be a number, but one of them is {value!r}.")
    if all(x == xs[0] for x in xs):
        raise ValueError("All the x-values are the same, so no line can predict y from x. Use at least two different x-values.")
    if not callable(slope):
        raise TypeError("drawRegression needs your slope function as its third input.")

    b = slope(list(xs), list(ys))
    if b is None:
        raise TypeError("slope returned None. Make sure it ends with a return line.")
    if not _isNumber(b):
        raise TypeError(f"slope should return a number, but it returned {b!r}.")
    if not math.isfinite(b):
        raise ValueError(f"slope should return a number, but it returned {b!r}. Check that the sum you divide by isn't 0.")

    a = sum(ys) / len(ys) - b * (sum(xs) / len(xs))
    show_regression(list(xs), list(ys), b, a)
    _regressionDrawn = True


# Hidden helper. Marks the predicted response ŷ at one x-value on the line drawRegression drew.
def drawPrediction(x, predicted):
    if not _regressionDrawn:
        raise RuntimeError("Call drawRegression before drawPrediction, so there's a line to predict from.")
    if not _isNumber(x) or not math.isfinite(x):
        raise TypeError(f"drawPrediction needs an x-value that's a number as its first input, but it got {x!r}.")
    if not _isNumber(predicted) or not math.isfinite(predicted):
        raise TypeError(f"drawPrediction needs the predicted value as a number, but it got {predicted!r}.")
    show_prediction(x, predicted)
