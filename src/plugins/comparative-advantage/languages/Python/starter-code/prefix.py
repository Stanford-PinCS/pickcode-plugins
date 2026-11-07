# Hidden helper. Uses the student's opportunityCost to find what 1 ton of corn costs each country in fish, asks whoMakesCorn which country makes corn, has each country make only one good, trades 10 tons of corn for fish at the terms of trade, and sends it all to the graph on the right.
import math


def isNumber(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def tradeAndCompare(arvia, bovia, fishPerCorn, opportunityCost, whoMakesCorn):
    CORN_TRADED = 10
    # The range of each country's amounts, in tons, so the graph can show them.
    MIN_TONS = 1
    MAX_TONS = 1000

    def fmt(v):
        rounded = round(v, 2)
        # Very large numbers keep their exponent, the way JavaScript shows them.
        if abs(rounded) >= 1e21:
            return str(float(rounded))
        return str(int(rounded)) if rounded == int(rounded) else str(rounded)

    def isAmount(v):
        return isNumber(v) and v > 0

    for name, most in (("arvia", arvia), ("bovia", bovia)):
        if not isinstance(most, dict) or not isNumber(most.get("corn")) or not isNumber(most.get("fish")):
            raise TypeError(f'{name} should look like {{"corn": 30, "fish": 120}}, with the most corn and the most fish the country can make, each a number of tons from {MIN_TONS} to {MAX_TONS}.')
        for good in ("corn", "fish"):
            if most[good] < MIN_TONS or most[good] > MAX_TONS:
                raise ValueError(f"{name}'s amounts should each be from {MIN_TONS} to {MAX_TONS} tons, so the graph can show them, but its {good} is {fmt(most[good])}.")
    if not isAmount(fishPerCorn):
        raise ValueError(f"fishPerCorn is the terms of trade, so it should be a number more than 0, but it is {fishPerCorn!r}.")
    if not callable(opportunityCost):
        raise TypeError("tradeAndCompare needs your opportunityCost function as its fourth input.")
    if not callable(whoMakesCorn):
        raise TypeError("tradeAndCompare needs your whoMakesCorn function as its fifth input.")

    # What 1 ton of corn costs a country, in tons of fish, from the student's function.
    def cornCost(most):
        cost = opportunityCost(most["corn"], most["fish"])
        if not isNumber(cost):
            raise TypeError(f"opportunityCost({most['corn']}, {most['fish']}) should return a number, but it returned {cost!r}.")
        if cost < 0:
            raise ValueError(f"opportunityCost({most['corn']}, {most['fish']}) returned {fmt(cost)}. An opportunity cost is an amount given up, so it can't be negative.")
        return cost

    arviaCornCost = cornCost(arvia)
    boviaCornCost = cornCost(bovia)

    cornMaker = whoMakesCorn(arviaCornCost, boviaCornCost)
    if cornMaker != "Arvia" and cornMaker != "Bovia":
        raise ValueError(f'whoMakesCorn should return "Arvia" or "Bovia", but it returned {cornMaker!r}.')

    # The corn maker ships CORN_TRADED tons of corn, and the other country pays fishPerCorn tons of fish for each.
    maker = arvia if cornMaker == "Arvia" else bovia
    payerName = "Bovia" if cornMaker == "Arvia" else "Arvia"
    payer = bovia if cornMaker == "Arvia" else arvia
    if maker["corn"] < CORN_TRADED:
        raise ValueError(f"{cornMaker} makes only {fmt(maker['corn'])} tons of corn, so it can't ship {CORN_TRADED}.")
    # The graph measures each country's gain against its own PPC at the corn it consumes, so the other country's PPC has to reach the corn it gets.
    if payer["corn"] < CORN_TRADED:
        raise ValueError(f"This lesson trades {CORN_TRADED} tons of corn and compares what each country consumes with its own PPC at the same amount of corn, so both PPCs need to reach at least {CORN_TRADED} tons of corn, but {payerName}'s reaches only {fmt(payer['corn'])}.")
    # A little slack, so paying exactly all its fish isn't turned away by floating-point math.
    if CORN_TRADED * fishPerCorn > payer["fish"] * (1 + 1e-9):
        raise ValueError(f"At {fmt(fishPerCorn)} tons of fish per ton of corn, {CORN_TRADED} tons of corn cost {fmt(CORN_TRADED * fishPerCorn)} tons of fish, but {payerName} can make only {fmt(payer['fish'])}.")

    show_trade(arvia["corn"], arvia["fish"], bovia["corn"], bovia["fish"], arviaCornCost, boviaCornCost, cornMaker, fishPerCorn, CORN_TRADED)
