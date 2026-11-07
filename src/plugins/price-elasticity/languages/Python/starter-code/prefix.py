# Hidden helper. Walks up the demand schedule one price increase at a time. For each stretch between two neighboring prices it asks the student's elasticity function for the price elasticity of demand and their describe function for how demand is described there, then sends everything to the graphs on the right, which add the total revenue (price × quantity) at each price.
import math

_RANGE_NAMES = ["elastic", "inelastic", "unit elastic"]
# The most total revenue the graphs can label: from $10,000 up they write it in short form, like $48K, and past this the short form stops being short.
_MAX_REVENUE = 1e15


def _isNumber(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def walkDemand(prices, quantities, elasticity, describe, raises=None):
    if raises is None:
        raises = []
    if not isinstance(prices, (list, tuple)) or not isinstance(quantities, (list, tuple)):
        raise TypeError("walkDemand needs two lists of numbers: the prices first, then the quantities.")
    if len(prices) != len(quantities):
        raise ValueError(f"The two lists should be the same length, one quantity for each price, but there are {len(prices)} prices and {len(quantities)} quantities.")
    if len(prices) < 3 or len(prices) > 15:
        raise ValueError(f"walkDemand needs from 3 to 15 prices, but it got {len(prices)}.")
    for value in list(prices) + list(quantities):
        if not _isNumber(value) or not math.isfinite(value):
            raise TypeError(f"Every price and quantity should be a number, but one of them is {value!r}.")
        if value <= 0:
            raise ValueError(f"Every price and quantity should be more than 0, because percentage changes are measured from them, but one of them is {value}.")
    for i in range(1, len(prices)):
        if prices[i] <= prices[i - 1]:
            raise ValueError(f"The prices should go from lowest to highest, each one higher than the last, but ${prices[i]} comes after ${prices[i - 1]}.")
    for i in range(1, len(quantities)):
        if quantities[i] >= quantities[i - 1]:
            raise ValueError(f"By the law of demand, the quantity demanded should fall as the price rises, but it's {quantities[i - 1]} at ${prices[i - 1]} and {quantities[i]} at ${prices[i]}.")
    for price, quantity in zip(prices, quantities):
        if not price * quantity <= _MAX_REVENUE:
            raise ValueError(f"The total revenue at ${price} is {price} × {quantity}, more than the graphs can show. Use smaller prices or quantities.")
    if not callable(elasticity):
        raise TypeError("walkDemand needs your elasticity function as its third input.")
    if not callable(describe):
        raise TypeError("walkDemand needs your describe function as its fourth input.")
    if not isinstance(raises, (list, tuple)):
        raise TypeError("raises should be a list of prices, like [10, 25], or [] for none.")
    for price in raises:
        if not _isNumber(price) or price not in prices[:-1]:
            raise ValueError(f"Every price in raises should be one of the prices in the list except the highest, which has no next price to raise it to, but {price!r} isn't.")

    elasticities = []
    ranges = []
    for i in range(len(prices) - 1):
        change = f"the price increase from ${prices[i]} to ${prices[i + 1]}"
        e = elasticity(prices[i], quantities[i], prices[i + 1], quantities[i + 1])
        if e is None:
            raise TypeError(f"elasticity returned None for {change}. Make sure it ends with a return line.")
        if not _isNumber(e):
            raise TypeError(f"elasticity should return a number, but it returned {e!r} for {change}.")
        if not math.isfinite(e):
            raise ValueError(f"elasticity returned {e!r} for {change}. Check that you never divide by 0.")
        name = describe(e)
        if name is None:
            raise TypeError(f"describe returned None for an elasticity of {e}. Make sure every case ends with a return line.")
        # "Unit-Elastic" and "unit elastic" name the same range.
        rangeName = " ".join(name.lower().replace("-", " ").split()) if isinstance(name, str) else ""
        if rangeName not in _RANGE_NAMES:
            raise ValueError(f'describe returned {name!r} for an elasticity of {e}. It should return "elastic", "inelastic" or "unit elastic".')
        elasticities.append(e)
        ranges.append(rangeName)
    show_demand(list(prices), list(quantities), elasticities, ranges, list(raises))
