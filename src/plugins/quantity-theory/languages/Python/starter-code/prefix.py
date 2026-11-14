# Hidden helper. Checks the economy's numbers, runs the years by asking the student's priceLevel function for each year's price level, and sends everything to the plot on the right, which works out each year's money growth and inflation rates.
import math


def isNumber(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def drawEconomy(supply, velocity, realOutput, priceLevel):
    # The plot can show money supplies, velocities, real outputs and price levels in these ranges, so every axis stays readable and every growth rate is a number.
    maxYears = 50
    smallest = 0.000001
    maxMoney = 1000000
    maxVelocity = 100
    maxOutput = 1000000
    maxPriceLevel = 100000000

    # Shows a value the way the student wrote it, and the way the JavaScript version shows it: a function by its name, lists item by item, and a whole number too long to read in scientific notation.
    def show(value):
        if callable(value):
            name = getattr(value, "__name__", "")
            return f"the function {name}" if name and name != "<lambda>" else "a function"
        if isinstance(value, list):
            return "[" + ", ".join(show(item) for item in value) + "]"
        if isNumber(value) and isinstance(value, int) and abs(value) >= 10 ** 21:
            # A whole number past the largest float has more than 300 digits, and turning one with thousands of digits into text can fail.
            try:
                return repr(float(value))
            except OverflowError:
                return f"{'a negative' if value < 0 else 'a'} number with more than 300 digits"
        return repr(value)

    if supply is None:
        raise TypeError("drawEconomy needs a list of the money supply in each year, but it got None. Does moneySupplyByYear end with return supply?")
    if not isinstance(supply, (list, tuple)):
        raise TypeError(f"drawEconomy needs a list of the money supply in each year, but it got {show(supply)}.")
    if not 2 <= len(supply) <= maxYears + 1:
        raise ValueError(f"The list of money supplies should have one value for each year, from year 0 to a last year from 1 to {maxYears}, so 2 to {maxYears + 1} values. It has {len(supply)}.")
    for year, money in enumerate(supply):
        if not isNumber(money):
            raise TypeError(f"Every money supply in the list should be a number, but the one for year {year} is {show(money)}.")
        # nan fails every comparison and inf is past the limit, so this catches both.
        if not smallest <= money <= maxMoney:
            # A money supply that grew too big needs a smaller growth rate; one that shrank too far needs a rate closer to 0.
            hint = "Check that your loop grows it by moneyGrowth percent a year."
            if year == 0:
                hint = "Start from a money supply in that range."
            elif money > maxMoney:
                hint = "Check that your loop grows it by moneyGrowth percent a year, or try a smaller moneyGrowth or fewer years."
            elif money < smallest:
                hint = "Check that your loop grows it by moneyGrowth percent a year, or try a moneyGrowth closer to 0 or fewer years."
            raise ValueError(f"The money supply in year {year} is {show(money)}, but the plot can show money supplies from 0.000001 to {maxMoney} (billions of dollars). {hint}")
    if not isNumber(velocity) or not 0 < velocity <= maxVelocity:
        raise ValueError(f"velocity should be a number greater than 0 and at most {maxVelocity}, but it's {show(velocity)}.")
    if not isNumber(realOutput) or not 1 <= realOutput <= maxOutput:
        raise ValueError(f"realOutput should be a number from 1 to {maxOutput}, but it's {show(realOutput)}.")
    # The dashed line is the price level M × V ÷ Y, so it has to fit on the plot too. With the limits above it can't pass maxPriceLevel, but it can fall below smallest.
    for year, money in enumerate(supply):
        correct = money * velocity / realOutput
        if correct < smallest:
            # Velocity and real output are the same every year, so when year 0 is in range, a later year can only fall below it because the money supply shrank.
            hint = "Use a money supply, velocity and real output closer to the starting ones." if year == 0 else "Check that your loop grows the money supply by moneyGrowth percent a year, or try a moneyGrowth closer to 0 or fewer years, so it doesn't shrink so far."
            raise ValueError(f"With these numbers, the price level M × V ÷ Y in year {year} is {show(correct)}, but the plot can show price levels from 0.000001 to {maxPriceLevel}. {hint}")
    if not callable(priceLevel):
        raise TypeError("drawEconomy needs your priceLevel function as its last input.")

    # Run the years: each year's price level from that year's money supply. M × V ÷ Y is in range by now, so a price level out of range means priceLevel isn't returning it.
    levels = []
    for year, money in enumerate(supply):
        level = priceLevel(money, velocity, realOutput)
        if level is None:
            raise TypeError(f"priceLevel returned None for year {year}. Does it end with a return line?")
        # Only a float can be nan, and math.isnan can't take a whole number too big for a float.
        if not isNumber(level) or (isinstance(level, float) and math.isnan(level)):
            raise TypeError(f"priceLevel should return a number, but it returned {show(level)} for year {year}.")
        if level <= 0:
            raise ValueError(f"priceLevel returned {show(level)} for year {year}, but a price level should be greater than 0. Check how you rearranged M × V = P × Y.")
        if not smallest <= level <= maxPriceLevel:
            raise ValueError(f"priceLevel returned {show(level)} for year {year}, but the plot can show price levels from 0.000001 to {maxPriceLevel}. Check how you rearranged M × V = P × Y.")
        levels.append(level)

    show_economy(list(supply), velocity, realOutput, levels)
