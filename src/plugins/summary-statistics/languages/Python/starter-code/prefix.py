# Hidden helper. Sorts the data, asks the student's median function for the median of the whole list and of each half (Q1 and Q3), and sends them to the dotplot and boxplot on the right.
import math


def isNumber(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def drawBoxplot(data, median):
    if not isinstance(data, (list, tuple)) or len(data) < 4:
        raise TypeError("drawBoxplot needs a list of at least 4 numbers as its first input.")
    for value in data:
        if not isNumber(value) or not math.isfinite(value):
            raise TypeError(f"Every value in the list should be a number, but one of them is {value!r}.")
    if not callable(median):
        raise TypeError("drawBoxplot needs your median function as its second input.")

    ordered = sorted(data)
    # With an odd count, the middle value belongs to neither half.
    half = len(ordered) // 2
    lower = ordered[:half]
    upper = ordered[len(ordered) - half:]

    def ask(values, name):
        result = median(list(values))
        if not isNumber(result) or not math.isfinite(result):
            raise TypeError(f"median should return a number, but it returned {result!r} for {name} ({len(values)} values).")
        return result

    show_boxplot(ordered, ask(ordered, "the whole list"), ask(lower, "the lower half"), ask(upper, "the upper half"))
