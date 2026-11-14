# Hidden helper. Calls the three functions at every whole quantity from 0 to 40 tons a day, uses a loop to find the market quantity (where MPB = MPC + tax) and the socially optimal quantity (where MSB = MSC), adds up the deadweight loss between them, and sends it all to the graph on the right.
import math


def _marketIsNumber(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def drawMarket(marginalPrivateBenefit, marginalPrivateCost, marginalSocialCost, tax):
    maxQuantity = 40
    inputs = [
        ("marginalPrivateBenefit", marginalPrivateBenefit, "first"),
        ("marginalPrivateCost", marginalPrivateCost, "second"),
        ("marginalSocialCost", marginalSocialCost, "third"),
    ]
    for name, f, place in inputs:
        if not callable(f):
            raise TypeError(f"drawMarket needs your {name} function as its {place} input.")
    if not _marketIsNumber(tax) or not math.isfinite(tax):
        raise TypeError(f"tax should be a number of dollars, like 0 or 20, but it is {tax!r}.")

    # Calls one of the functions at one quantity and checks that it gave back a number of dollars.
    def ask(f, name, quantity):
        try:
            value = f(quantity)
        except TypeError as error:
            # Using a function without calling it, like marginalPrivateCost + externalCost, does math with the function itself.
            if "'function'" not in str(error):
                raise
            raise TypeError(f"{name}({quantity}) did math with a function instead of a number. To use another function's result, call it with its input, like marginalPrivateCost(quantity).") from error
        if value is None:
            raise TypeError(f"{name}({quantity}) returned None. Make sure {name} ends with a return line.")
        if callable(value) or isinstance(value, str):
            kind = "a function" if callable(value) else "text"
            raise TypeError(f"{name}({quantity}) returned {kind}, not a number. To use another function's result, call it with its input, like marginalPrivateCost(quantity).")
        if not _marketIsNumber(value) or not math.isfinite(value):
            raise TypeError(f"{name} should return a number of dollars, but {name}({quantity}) returned {value!r}.")
        return value

    quantities = []
    benefit = []
    privateCost = []
    socialCost = []
    for quantity in range(maxQuantity + 1):
        quantities.append(quantity)
        benefit.append(ask(marginalPrivateBenefit, "marginalPrivateBenefit", quantity))
        privateCost.append(ask(marginalPrivateCost, "marginalPrivateCost", quantity))
        socialCost.append(ask(marginalSocialCost, "marginalSocialCost", quantity))
    # With a per-unit tax, one more ton costs the mills its MPC plus the tax.
    taxedCost = [cost + tax for cost in privateCost]

    # The first quantity where the cost of one more ton is no longer below its benefit (MPB, which is also MSB). Between two whole quantities the lines are straight, so the crossing between them is found exactly. It's 0 if even the first ton costs at least what it's worth, and None if the cost stays below the benefit all the way to maxQuantity.
    def crossing(cost):
        if benefit[0] <= cost[0]:
            return 0
        for i in range(1, len(quantities)):
            if benefit[i] <= cost[i]:
                before = benefit[i - 1] - cost[i - 1]
                after = benefit[i] - cost[i]
                return quantities[i - 1] + (before / (before - after)) * (quantities[i] - quantities[i - 1])
        return None

    marketQuantity = crossing(taxedCost)
    if marketQuantity is None:
        raise ValueError(f"MPB stays above MPC + tax at every quantity up to {maxQuantity} tons, so the market quantity is past the right edge of the graph. Try a tax of 0 or more, and check that marginalPrivateBenefit and marginalPrivateCost are the way they started.")
    optimalQuantity = crossing(socialCost)
    if optimalQuantity is None:
        raise ValueError(f"Your MSC stays below MSB at every quantity up to {maxQuantity} tons, so the socially optimal quantity is past the right edge of the graph. Check that marginalSocialCost adds externalCost to marginalPrivateCost(quantity).")

    # The deadweight loss is the area between MSC and MSB from one quantity to the other. Add it up one slice at a time: between two whole quantities the gap changes in a straight line, so each slice is a trapezoid.
    low = min(marketQuantity, optimalQuantity)
    high = max(marketQuantity, optimalQuantity)
    deadweightLoss = 0
    for i in range(len(quantities) - 1):
        left = max(low, quantities[i])
        right = min(high, quantities[i + 1])
        if right > left:
            gapBefore = socialCost[i] - benefit[i]
            gapAfter = socialCost[i + 1] - benefit[i + 1]

            def gapAt(q):
                return gapBefore + (gapAfter - gapBefore) * ((q - quantities[i]) / (quantities[i + 1] - quantities[i]))

            deadweightLoss += ((gapAt(left) + gapAt(right)) / 2) * (right - left)

    show_market(quantities, benefit, privateCost, socialCost, tax, marketQuantity, optimalQuantity, abs(deadweightLoss))
