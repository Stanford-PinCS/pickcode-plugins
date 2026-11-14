# Hidden helper. Uses the student's opportunityCosts to find what each additional unit of consumption goods costs in capital goods, shifts the PPC outward by the growth, asks the student's describePoint about each combination, and sends it all to the graph on the right.
import math


def isNumber(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def drawPPC(capitalGoods, growth, points, opportunityCosts, describePoint):
    from decimal import ROUND_HALF_UP, Decimal

    # Limits that keep the graph readable: up to 20 units of consumption goods, table amounts up to 1000, growth from 0% to 100%, and up to 8 combinations with at most 2000 capital goods, the most a PPC can reach after 100% growth.
    MAX_UNITS = 20
    MAX_AMOUNT = 1000
    MAX_POINT_CAPITAL = 2 * MAX_AMOUNT
    MAX_GROWTH = 100
    MAX_POINTS = 8
    ANSWERS = ("efficient", "inefficient", "unattainable")

    # Shows a number with at most 2 decimals, rounding a tie away from zero the way JavaScript's toFixed does, so both languages show the same numbers.
    def fmt(v):
        # Very large numbers keep their exponent, the way JavaScript shows them.
        if abs(v) >= 1e21:
            return str(float(v))
        rounded = float(Decimal(v).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
        return str(int(rounded)) if rounded == int(rounded) else str(rounded)

    # "1st", "2nd", "3rd", "4th", ... "11th", "21st".
    def nth(n):
        if 11 <= n % 100 <= 13:
            return f"{n}th"
        return f"{n}{ {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th') }"

    # "0 units", "1 unit", "2 units".
    def unitsOf(n):
        return f"{n} unit{'' if n == 1 else 's'}"

    # Rounds to 9 decimals, half up the way JavaScript's Math.round does, so a floating-point leftover can't move a combination off the PPC.
    def round9(v):
        return math.floor(v * 1e9 + 0.5) / 1e9

    if not isinstance(capitalGoods, (list, tuple)) or len(capitalGoods) < 2 or len(capitalGoods) > MAX_UNITS + 1:
        raise TypeError(f"capitalGoods should be a list of 2 to {MAX_UNITS + 1} numbers: the most capital goods Dovania can make with 0, 1, 2, ... units of consumption goods.")
    for i, v in enumerate(capitalGoods):
        if not isNumber(v) or v < 0 or v > MAX_AMOUNT:
            raise ValueError(f"Each amount in capitalGoods should be a number from 0 to {MAX_AMOUNT}, but the one for {unitsOf(i)} of consumption goods is {v!r}.")
        if i > 0 and v >= capitalGoods[i - 1]:
            raise ValueError(f"On a PPC, making more consumption goods means making fewer capital goods, so each amount in capitalGoods should be less than the one before it. But it goes from {fmt(capitalGoods[i - 1])} to {fmt(v)} at {unitsOf(i)} of consumption goods.")
    units = len(capitalGoods) - 1
    # The table has to reach the most consumption goods Dovania can make, where it makes no capital goods, so the PPC meets both axes.
    if capitalGoods[units] != 0:
        raise ValueError(f"The last amount in capitalGoods should be 0: when Dovania makes the most consumption goods it can, it makes no capital goods, so the PPC reaches the Consumption Goods axis. But the last amount is {fmt(capitalGoods[units])}.")

    if not isNumber(growth) or growth < 0 or growth > MAX_GROWTH:
        raise ValueError(f"growth should be a number of percent from 0 to {MAX_GROWTH}, but it is {growth!r}.")
    # The PPC after growth: every row of the table makes growth percent more of each good, which shifts the PPC outward. With no growth it's the table itself.
    factor = 1 + growth / 100
    shifted = [(i * factor, capital * factor) for i, capital in enumerate(capitalGoods)]
    # The most consumption goods on the PPC after growth. Messages show it rounded down to 2 decimals, so the amount they suggest is always allowed.
    mostConsumption = round9(units * factor)
    mostShown = fmt(math.floor(mostConsumption * 100 + 1e-9) / 100)

    if not isinstance(points, (list, tuple)) or len(points) > MAX_POINTS:
        raise TypeError(f"points should be a list of up to {MAX_POINTS} combinations, each like [3, 20]: [consumption goods, capital goods].")
    for p in points:
        if not isinstance(p, (list, tuple)) or len(p) != 2 or not isNumber(p[0]) or not isNumber(p[1]):
            raise TypeError(f"Each combination in points should be two numbers, like [3, 20]: [consumption goods, capital goods]. One of them is {p!r}.")
        combination = f"[{fmt(p[0])}, {fmt(p[1])}]"
        if p[0] < 0 or p[1] < 0 or p[1] > MAX_POINT_CAPITAL:
            raise ValueError(f"The combination {combination} should have from 0 to {mostShown} consumption goods and from 0 to {MAX_POINT_CAPITAL} capital goods.")
        if p[0] > mostConsumption:
            raise ValueError(f"The combination {combination} has more consumption goods than the PPC reaches ({mostShown}), so describePoint has no height of the PPC to compare it with. Use consumption goods from 0 to {mostShown}.")
    if not callable(opportunityCosts):
        raise TypeError("drawPPC needs your opportunityCosts function as its fourth input.")
    if not callable(describePoint):
        raise TypeError("drawPPC needs your describePoint function as its fifth input.")

    costs = opportunityCosts(list(capitalGoods))
    if not isinstance(costs, (list, tuple)) or len(costs) != units:
        returned = f"a list of {len(costs)}" if isinstance(costs, (list, tuple)) else repr(costs)
        # A table with 2 rows has just 1 additional unit of consumption goods.
        wanted = "a list of 1 opportunity cost, the one for the 1st unit of consumption goods" if units == 1 else f"a list of {units} opportunity costs, one for each additional unit of consumption goods from the 1st to the {nth(units)}"
        raise ValueError(f"opportunityCosts should return {wanted}, but it returned {returned}.")
    for i, cost in enumerate(costs):
        if not isNumber(cost):
            raise TypeError(f"opportunityCosts returned {cost!r} for the {nth(i + 1)} unit of consumption goods, but each opportunity cost should be a number. A list index has to be a whole number from 0 to {units}.")
        if cost < 0:
            raise ValueError(f"opportunityCosts returned {fmt(cost)} for the {nth(i + 1)} unit of consumption goods. An opportunity cost is the capital goods given up, so it can't be negative.")
        # Unit i + 1 starts from row i of the table, so it can give up at most the capital goods made there, and its drop on the graph ends at 0 or above.
        if cost > capitalGoods[i]:
            raise ValueError(f"opportunityCosts returned {fmt(cost)} for the {nth(i + 1)} unit of consumption goods, but with {unitsOf(i)} of consumption goods, the most capital goods Dovania can make is {fmt(capitalGoods[i])}, so it can't give up more than that.")

    # The height of the PPC after growth at an amount of consumption goods: the most capital goods possible with it, on the straight line between the two rows around it. An amount past the last row by a floating-point leftover gets the last row's height.
    def mostCapitalAt(consumption):
        for i in range(1, len(shifted)):
            if consumption <= shifted[i][0]:
                (x0, y0), (x1, y1) = shifted[i - 1], shifted[i]
                return round9(y0 + ((consumption - x0) * (y1 - y0)) / (x1 - x0))
        return round9(shifted[units][1])

    answers = []
    for consumption, capital in points:
        answer = describePoint(capital, mostCapitalAt(consumption))
        if not isinstance(answer, str) or answer not in ANSWERS:
            raise ValueError(f'describePoint should return "efficient", "inefficient" or "unattainable", but for the combination [{fmt(consumption)}, {fmt(capital)}] it returned {answer!r}.')
        answers.append(answer)

    show_possibilities(list(capitalGoods), list(costs), growth, [list(p) for p in points], answers)
