# Hidden helper. Asks the student's marginalCosts for the marginal cost of each crate and their chooseOutput for how many crates to grow, applies the short-run shutdown rule at that output, and sends it all to the graph on the right.
import math


def _isNumber(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _ordinal(n):
    if 11 <= n % 100 <= 13:
        return f"{n}th"
    return f"{n}" + {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")


def runFarm(totalCosts, price, marginalCosts, chooseOutput):
    if not isinstance(totalCosts, (list, tuple)) or not 2 <= len(totalCosts) <= 21:
        raise TypeError("runFarm needs totalCosts as its first input: a list of 2 to 21 total costs, for 0 crates, 1 crate, 2 crates and so on.")
    for cost in totalCosts:
        if not _isNumber(cost) or not math.isfinite(cost) or cost < 0:
            raise ValueError(f"Every total cost should be a number of dollars, 0 or more, but one of them is {cost!r}.")
    if not _isNumber(price) or not math.isfinite(price) or price < 0:
        raise ValueError(f"price should be a number of dollars, 0 or more, but it is {price!r}.")
    if not callable(marginalCosts):
        raise TypeError("runFarm needs your marginalCosts function as its third input.")
    if not callable(chooseOutput):
        raise TypeError("runFarm needs your chooseOutput function as its fourth input.")

    # One marginal cost for each crate, from the 1st to the last.
    crates = len(totalCosts) - 1
    mc = marginalCosts(list(totalCosts))
    if mc is None:
        raise TypeError("marginalCosts returned None. Make sure it ends with a return line.")
    if not isinstance(mc, (list, tuple)):
        raise TypeError(f"marginalCosts should return a list of numbers, but it returned {mc!r}.")
    if len(mc) != crates:
        raise ValueError(f"marginalCosts should return {crates} marginal costs, one for each crate from the 1st to the {_ordinal(crates)}, but it returned {len(mc)}.")
    for i, cost in enumerate(mc):
        if not _isNumber(cost) or not math.isfinite(cost):
            raise TypeError(f"marginalCosts returned {cost!r} for the {_ordinal(i + 1)} crate, but each marginal cost should be a number.")

    chosen = chooseOutput(price, list(mc))
    if chosen is None:
        raise TypeError("chooseOutput returned None. Make sure it ends with a return line.")
    if isinstance(chosen, float) and chosen.is_integer():
        chosen = int(chosen)
    if not isinstance(chosen, int) or isinstance(chosen, bool) or not 0 <= chosen <= crates:
        raise ValueError(f"chooseOutput should return a whole number of crates from 0 to {crates}, but it returned {chosen!r}.")

    # The short-run shutdown rule: at the chosen output, compare total revenue with total variable cost, which is the same as comparing the price with average variable cost. Total variable cost is total cost minus the fixed cost, the total cost of 0 crates. If revenue is less, the farm shuts down and grows 0 crates.
    output = chosen
    if chosen > 0:
        revenue = price * chosen
        variableCost = totalCosts[chosen] - totalCosts[0]
        if revenue < variableCost:
            output = 0
    show_farm(list(totalCosts), price, list(mc), chosen, output)
