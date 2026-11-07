# Hidden helper. Checks the orchard's numbers, asks the student's pickersToHire function how many pickers to hire, and sends everything to the plot on the right.


def isNumber(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def runHiring(totalProduct, price, wage, pickersToHire):
    # The largest a total product, the price or the wage can be, so every dollar amount on the plot stays readable.
    limit = 1000000

    if not isinstance(totalProduct, (list, tuple)) or not 2 <= len(totalProduct) <= 21:
        raise TypeError("totalProduct should be a list of 2 to 21 numbers: the total product with 0 pickers, 1 picker, 2 pickers and so on.")
    for value in totalProduct:
        if not isNumber(value):
            raise TypeError(f"Every value in totalProduct should be a number, but one of them is {value!r}.")
        # nan fails every comparison and inf is past the limit, so this catches both.
        if not -limit <= value <= limit:
            raise ValueError(f"Every value in totalProduct should be from -{limit} to {limit}, but one of them is {value!r}.")
    if not isNumber(price) or not price > 0:
        raise ValueError(f"price should be a number greater than 0, but it's {price!r}.")
    if price > limit:
        raise ValueError(f"price should be at most {limit}, but it's {price!r}.")
    if not isNumber(wage) or not wage > 0:
        raise ValueError(f"wage should be a number greater than 0, but it's {wage!r}.")
    if wage > limit:
        raise ValueError(f"wage should be at most {limit}, but it's {wage!r}.")
    if not callable(pickersToHire):
        raise TypeError("runHiring needs your pickersToHire function as its last input.")

    # The table runs from 0 pickers to this many.
    lastPicker = len(totalProduct) - 1
    try:
        hired = pickersToHire(list(totalProduct), price, wage)
    except IndexError:
        raise IndexError(f"Your loop looked past the end of totalProduct, which only goes up to {lastPicker} pickers. Make sure the loop stops by the last picker in the table.") from None
    if hired is None:
        raise TypeError("pickersToHire should return how many pickers to hire, but it returned None. Does it end with return pickers?")
    if not isNumber(hired) or not 0 <= hired <= lastPicker or hired != int(hired):
        raise ValueError(f"pickersToHire should return a whole number of pickers from 0 to {lastPicker}, but it returned {hired!r}.")

    show_hiring(list(totalProduct), price, wage, int(hired))
