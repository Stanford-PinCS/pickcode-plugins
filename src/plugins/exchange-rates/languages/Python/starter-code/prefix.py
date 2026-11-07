# Hidden helper. Finds the equilibrium exchange rate of the pell, where the quantity of pells demanded equals the quantity supplied, before and after the demand for pells shifts by demandShift. Calls pricesInQuors at each of the two exchange rates, checks every price it gives back, and sends it all to the graphs on the right.
import math


def _exchangeIsNumber(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


# Whether a number is finite the way JavaScript sees it: a whole number too big for a float is Infinity there.
def _exchangeIsFinite(value):
    try:
        return math.isfinite(value)
    except OverflowError:
        return False


# Writes a number the way JavaScript's String() does, so messages read the same in both languages: 40.0 as 40, 5e-05 as 0.00005, 1e-07 as 1e-7 and inf as Infinity.
def _exchangeNumber(value):
    from decimal import Decimal

    # JavaScript has only floats: a whole number becomes the float nearest it, or Infinity when it's too big for one.
    try:
        value = float(value)
    except OverflowError:
        value = math.inf if value > 0 else -math.inf
    if math.isnan(value):
        return "NaN"
    if math.isinf(value):
        return "Infinity" if value > 0 else "-Infinity"
    if value == 0:
        return "0"
    # repr keeps the fewest digits that give the float back, as JavaScript does. From 0.000001 up to 1e21 JavaScript writes them out in full, with no exponent and no ".0"; outside that it writes an exponent with no leading zero, 1e-7 where Python writes 1e-07.
    text = repr(value)
    if 1e-6 <= abs(value) < 1e21:
        return format(Decimal(text[:-2] if text.endswith(".0") else text), "f")
    return text.replace("e-0", "e-")


# Shows a wrong value the way it looks in code: text in quotes and a list in brackets.
def _exchangeDescribe(value):
    if callable(value):
        return "a function"
    if _exchangeIsNumber(value):
        return _exchangeNumber(value)
    if isinstance(value, str) and len(value) > 40:
        return repr(value[:40] + "…")
    return repr(value)


def drawExchangeMarket(prices, demandShift, pricesInQuors):
    # At an exchange rate of rate quors per pell, the quantity of pells demanded is 600 - 100 × rate and the quantity supplied is 200 + 100 × rate, in millions of pells a day.
    demandAtZero = 600
    demandSlope = -100
    supplyAtZero = 200
    supplySlope = 100
    maxShift = 200
    maxPrices = 6
    minPrice = 0.01
    maxPrice = 1000
    maxQuors = 1000000

    if not isinstance(prices, (list, tuple)) or len(prices) < 1 or len(prices) > maxPrices:
        raise TypeError(f"prices should be a list of 1 to {maxPrices} prices in pells, like [20, 30, 50, 80], but it is {_exchangeDescribe(prices)}.")
    for price in prices:
        if not _exchangeIsNumber(price) or not _exchangeIsFinite(price) or price < minPrice or price > maxPrice:
            raise ValueError(f"Every price should be a number of pells from {_exchangeNumber(minPrice)} to {maxPrice}, but one of them is {_exchangeDescribe(price)}.")
    if not _exchangeIsNumber(demandShift) or not _exchangeIsFinite(demandShift) or demandShift != int(demandShift) or abs(demandShift) > maxShift:
        raise ValueError(f"demandShift should be a whole number of millions of pells a day from -{maxShift} to {maxShift}, but it is {_exchangeDescribe(demandShift)}.")
    if not callable(pricesInQuors):
        raise TypeError("drawExchangeMarket needs your pricesInQuors function as its third input.")

    # The exchange rate where the quantity of pells demanded equals the quantity supplied, once demand has shifted by shift.
    def equilibriumRate(shift):
        return (demandAtZero + shift - supplyAtZero) / (supplySlope - demandSlope)

    # Asks pricesInQuors for the price in quors of every export at one exchange rate, and checks each price it gives back.
    def pricesAt(rate):
        result = pricesInQuors(list(prices), rate)
        if not isinstance(result, (list, tuple)):
            raise TypeError(f"pricesInQuors should return a list of prices in quors, but it returned {_exchangeDescribe(result)}. Make sure it ends with return result.")
        if len(result) != len(prices):
            raise ValueError(f"pricesInQuors should return one price in quors for each of the {len(prices)} prices, but it returned {len(result)}.")
        for price, value in zip(prices, result):
            which = f"Your price in quors for {_exchangeNumber(price)} pells, when one pell costs {_exchangeNumber(rate)} quors,"
            if value is None:
                raise TypeError(f"{which} is None. Make sure convert ends with a return line.")
            if not _exchangeIsNumber(value) or not _exchangeIsFinite(value):
                raise TypeError(f"{which} is {_exchangeDescribe(value)}, but convert should return a number of quors.")
            if value < 0 or value > maxQuors:
                raise ValueError(f"{which} is {_exchangeNumber(value)}, but a price in quors should be from 0 to 1,000,000. Check the math in convert.")
        return list(result)

    rateBefore = equilibriumRate(0)
    rateAfter = equilibriumRate(demandShift)
    show_exchange_market(demandAtZero, demandSlope, supplyAtZero, supplySlope, demandShift, rateBefore, rateAfter, list(prices), pricesAt(rateBefore), pricesAt(rateAfter))
