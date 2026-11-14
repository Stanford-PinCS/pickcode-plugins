# Hidden helper. Checks the basket and the wages, asks the student's basketCost and cpi for every year's basket cost and CPI, inflationRate for the inflation rate of each year after the base year, and realWage for every year's real wage, and sends it all to the graphs on the right.
import json
import math


def isNumber(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def measureInflation(basket, wages, basketCost, cpi, inflationRate, realWage):
    # The limits that keep every number on the graphs readable: at most 10 goods, 2 to 6 years (the base year and up to 5 more), quantities from 0.01 to 10000, prices from $0.01 to $10,000, wages from $1 to $10,000, and every value your functions return within a trillion of 0.
    MAX_GOODS = 10
    MIN_YEARS = 2
    MAX_YEARS = 6
    MIN_AMOUNT = 0.01
    MIN_WAGE = 1
    MAX_AMOUNT = 10000
    MAX_NAME = 40
    LIMIT = 1e12
    EXAMPLE = '{"good": "Bread", "quantity": 100, "prices": [3.00, 3.50, 4.00, 3.60]}'

    def fmt(v):
        rounded = round(v, 2)
        # Very large numbers keep their exponent, the way JavaScript shows them.
        if abs(rounded) >= 1e21:
            return str(float(rounded))
        return str(int(rounded)) if rounded == int(rounded) else str(rounded)

    # A good's name in double quotes, as the JavaScript version writes it.
    def quoted(name):
        return json.dumps(name, ensure_ascii=False)

    def yearName(year):
        return "the base year" if year == 0 else f"year {year}"

    if not isinstance(basket, list) or not 1 <= len(basket) <= MAX_GOODS:
        raise TypeError(f"basket should be a list of 1 to {MAX_GOODS} records, one for each good or service, like {EXAMPLE}.")
    for item in basket:
        if not isinstance(item, dict):
            raise TypeError(f"Each item in basket should be a record like {EXAMPLE}, but one of them is {item!r}.")
        good = item.get("good")
        if not isinstance(good, str) or good.strip() == "" or len(good) > MAX_NAME:
            raise TypeError(f'Each record in basket needs a "good": its name in quotes, 1 to {MAX_NAME} characters long. One record\'s good is {good!r}.')
        name = quoted(good)
        quantity = item.get("quantity")
        if not isNumber(quantity):
            raise TypeError(f"The quantity of {name} should be a number, but it is {quantity!r}.")
        if quantity < MIN_AMOUNT or quantity > MAX_AMOUNT:
            raise ValueError(f"The quantity of {name} should be from {MIN_AMOUNT} to {MAX_AMOUNT}, but it is {fmt(quantity)}.")
        prices = item.get("prices")
        if not isinstance(prices, list):
            raise TypeError(f"The prices of {name} should be a list of its price in each year, but they are {prices!r}.")
        for price in prices:
            if not isNumber(price):
                raise TypeError(f"Every price of {name} should be a number, but one of them is {price!r}.")
            if price < MIN_AMOUNT or price > MAX_AMOUNT:
                raise ValueError(f"Every price of {name} should be from {MIN_AMOUNT} to {MAX_AMOUNT} dollars, but one of them is {fmt(price)}.")
    years = len(basket[0]["prices"])
    if years < MIN_YEARS or years > MAX_YEARS:
        raise ValueError(f"Each good needs {MIN_YEARS} to {MAX_YEARS} prices, one for each year from the base year on, but {quoted(basket[0]['good'])} has {years}.")
    for item in basket:
        if len(item["prices"]) != years:
            raise ValueError(f"Every good needs a price for each year, but {quoted(basket[0]['good'])} has {years} prices and {quoted(item['good'])} has {len(item['prices'])}.")
    if not isinstance(wages, list) or len(wages) != years:
        raise TypeError(f"wages should be a list with one wage for each year, {years} in all to match the prices, but it is {wages!r}.")
    for wage in wages:
        if not isNumber(wage):
            raise TypeError(f"Every wage should be a number, but one of them is {wage!r}.")
        if wage < MIN_WAGE or wage > MAX_AMOUNT:
            raise ValueError(f"Every wage should be from {MIN_WAGE} to {MAX_AMOUNT} dollars, but one of them is {fmt(wage)}.")
    for fnName, fn in (("basketCost", basketCost), ("cpi", cpi), ("inflationRate", inflationRate), ("realWage", realWage)):
        if not callable(fn):
            raise TypeError(f"measureInflation needs your {fnName} function, but it got {fn!r}.")

    # A record that says which keys it has when your code asks for one it doesn't have, and says to use square brackets when your code reads one with a dot.
    class Record(dict):
        def __missing__(self, key):
            raise LookupError(f'Each record in basket has the keys "good", "quantity" and "prices", but your code asked for {key!r}.')

        # Python calls this only for a name the dictionary doesn't have, like item.quantity. Names that start with _ are left alone, since Python itself looks some of those up.
        def __getattr__(self, name):
            if name.startswith("_"):
                raise AttributeError(name)
            raise AttributeError(f'Read a record in basket with square brackets, like item["{name}"], not with a dot, like item.{name}.')

    # A prices list that says which years it covers when your code asks for a year before year 0 or past its end. A negative year would otherwise quietly count back from the last year.
    class Prices(list):
        def __init__(self, good, values):
            super().__init__(values)
            self.good = good

        def __getitem__(self, index):
            if isinstance(index, int) and not 0 <= index < len(self):
                raise IndexError(f"Your code asked for the price of {quoted(self.good)} in year {index}, but its prices only go from year 0 (the base year) to year {len(self) - 1}.")
            return list.__getitem__(self, index)

    # Your functions get a copy of the basket, so they can't change the data the graphs check them against.
    def basketCopy():
        return [Record(good=item["good"], quantity=item["quantity"], prices=Prices(item["good"], item["prices"])) for item in basket]

    # Checks that one of your functions returned a number the graphs can draw, and says which call returned what if not.
    def check(value, call, what):
        if value is None:
            raise TypeError(f"{call} returned None. Does your function end with a return line?")
        if not isNumber(value):
            raise TypeError(f"{call} should return {what}, a number, but it returned {value!r}.")
        if abs(value) > LIMIT:
            raise ValueError(f"{call} returned {fmt(value)}, more than a trillion away from 0, so the graphs can't draw it.")
        return value

    costs = []
    for year in range(years):
        call = f"basketCost(basket, {year})"
        value = check(basketCost(basketCopy(), year), call, f"the basket's cost in {yearName(year)}")
        if value < 0:
            raise ValueError(f"{call} returned {fmt(value)}, but a cost can't be less than $0.")
        costs.append(value)
    if costs[0] == 0:
        raise ValueError("basketCost(basket, 0) returned 0, but the CPI divides by the basket's cost in the base year, so that cost has to be more than $0.")
    cpis = []
    for year in range(years):
        call = f"cpi(basket, {year})"
        value = check(cpi(basketCopy(), year), call, f"the CPI in {yearName(year)}")
        if value <= 0:
            raise ValueError(f"{call} returned {fmt(value)}, but a price index compares a year's cost with the base year's, so it should be more than 0.")
        cpis.append(value)
    inflation = []
    for year in range(1, years):
        call = f"inflationRate({fmt(cpis[year - 1])}, {fmt(cpis[year])})"
        inflation.append(check(inflationRate(cpis[year - 1], cpis[year]), call, f"the inflation rate in year {year}"))
    realWages = []
    for year in range(years):
        call = f"realWage({fmt(wages[year])}, {fmt(cpis[year])})"
        value = check(realWage(wages[year], cpis[year]), call, f"the real wage in {yearName(year)}")
        if value < 0:
            raise ValueError(f"{call} returned {fmt(value)}, but a wage can't be less than $0.")
        realWages.append(value)

    show_price_index(
        [item["good"] for item in basket],
        [item["quantity"] for item in basket],
        [list(item["prices"]) for item in basket],
        list(wages),
        costs,
        cpis,
        inflation,
        realWages,
    )
