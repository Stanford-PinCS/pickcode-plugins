# Hidden helper. Flips the student's coin totalFlips times, tracks the
# running proportion of heads, and sends it to the graph.
import random


def flipCoins(totalFlips, flipCoin):
    if not isinstance(totalFlips, int) or totalFlips < 1 or totalFlips > 100000:
        raise ValueError(
            "totalFlips should be a whole number from 1 to 100000, like 10 or 1000."
        )
    if not callable(flipCoin):
        raise TypeError("flipCoins needs your flipCoin function as its second input.")

    heads = 0
    proportions = []
    for i in range(1, totalFlips + 1):
        flip = flipCoin()
        if flip == "H":
            heads += 1
        elif flip != "T":
            raise ValueError(
                f'flipCoin should return "H" or "T", but it returned {flip!r}.'
            )
        proportions.append(heads / i)

    show_target(0.5)
    plot_line(proportions)
