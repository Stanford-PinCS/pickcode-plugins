# Hidden helpers. drawGame checks the two payoff tables, asks the student's bestResponse function which price each airline picks for each price the other might charge, and sends the answers to the payoff matrix on the right. drawDeal marks a deal on that matrix.
import math

_gameDrawn = False
_PRICE_NAMES = ["HIGH", "LOW"]


def _isNumber(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _isPrice(value):
    return _isNumber(value) and value in (0, 1)


def _checkTable(table, name):
    shape = f"{name} should be a list of 2 rows, one for each of its own prices, and each row a list of 2 profits, one for each price the other airline might charge."
    if not isinstance(table, (list, tuple)) or len(table) != 2:
        raise TypeError(shape)
    for row in table:
        if not isinstance(row, (list, tuple)) or len(row) != 2:
            raise TypeError(shape)
        for value in row:
            if not _isNumber(value) or not math.isfinite(value):
                raise TypeError(f"Every profit in {name} should be a number, but one of them is {value!r}.")


def drawGame(gull, heron, bestResponse):
    global _gameDrawn
    _checkTable(gull, "gull")
    _checkTable(heron, "heron")
    if not callable(bestResponse):
        raise TypeError("drawGame needs your bestResponse function as its third input.")

    # Each call gets a copy of the table, so bestResponse can't change the payoffs that get drawn.
    def ask(table, airline, otherAirline, otherPrice):
        when = f"for {airline} when {otherAirline} charges {_PRICE_NAMES[otherPrice]}"
        result = bestResponse([list(table[0]), list(table[1])], otherPrice)
        if result is None:
            raise TypeError(f"bestResponse returned None {when}. Make sure it ends with a return line.")
        if not _isPrice(result):
            raise TypeError(f"bestResponse should return HIGH or LOW, but it returned {result!r} {when}.")
        return int(result)

    gullPicks = [ask(gull, "Gull", "Heron", 0), ask(gull, "Gull", "Heron", 1)]
    heronPicks = [ask(heron, "Heron", "Gull", 0), ask(heron, "Heron", "Gull", 1)]
    show_game([list(row) for row in gull], [list(row) for row in heron], gullPicks, heronPicks)
    _gameDrawn = True


def drawDeal(gullPrice, heronPrice):
    if not _gameDrawn:
        raise RuntimeError("Call drawGame before drawDeal, so there's a payoff matrix to mark the deal on.")
    if not _isPrice(gullPrice):
        raise TypeError(f"drawDeal needs Gull's price, HIGH or LOW, as its first input, but it got {gullPrice!r}.")
    if not _isPrice(heronPrice):
        raise TypeError(f"drawDeal needs Heron's price, HIGH or LOW, as its second input, but it got {heronPrice!r}.")
    show_deal(int(gullPrice), int(heronPrice))
