# Hidden helper. Checks the numbers, asks the student's changeInGDP function for the total after 1 round, 2 rounds and so on, and sends the totals to the plot on the right.


def isNumber(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def followRounds(policy, helperName, amount, mpc, rounds, changeInGDP):
    # The largest a running total can be, so every dollar amount on the plot stays readable.
    limit = 1000000

    def roundsText(r):
        return f"{r} round{'' if r == 1 else 's'}"

    what = "the new government spending" if policy == "spending" else "the tax cut"
    # nan fails every comparison and inf is past the range, so these checks catch both.
    if not isNumber(amount) or not 1 <= amount <= 10000:
        raise ValueError(f"{helperName}'s first input, {what} in millions of dollars, should be a number from 1 to 10000, but it's {amount!r}.")
    if isNumber(mpc) and mpc == 1:
        raise ValueError("mpc should be less than 1. With an MPC of 1, each round's new spending would be as big as the round before, so the total would never level off. Try a number from 0 to 0.95.")
    if isNumber(mpc) and 1 < mpc <= 100:
        raise ValueError(f"mpc should be a share from 0 to 0.95, like 0.8 for 80%, but it's {mpc!r}.")
    if not isNumber(mpc) or not 0 <= mpc <= 0.95:
        raise ValueError(f"mpc should be a number from 0 to 0.95, but it's {mpc!r}.")
    if not isNumber(rounds) or not 1 <= rounds <= 50 or rounds != int(rounds):
        raise ValueError(f"rounds should be a whole number from 1 to 50, but it's {rounds!r}.")
    if not callable(changeInGDP):
        raise TypeError(f"{helperName} needs your changeInGDP function as its last input.")

    # Round 1's new spending: the government spends all of its new spending, but people spend only the MPC share of a tax cut.
    firstRound = amount if policy == "spending" else mpc * amount

    # The total after 1 round, 2 rounds and so on, so the plot can show the running total after every round.
    totals = []
    for r in range(1, int(rounds) + 1):
        total = changeInGDP(firstRound, mpc, r)
        if total is None:
            raise TypeError("changeInGDP should return the total change in real GDP, but it returned None. Does it end with return total?")
        if not isNumber(total):
            raise TypeError(f"changeInGDP should return a number, but it returned {total!r} for {roundsText(r)}.")
        # Only nan isn't equal to itself.
        if total != total:
            raise ValueError(f"changeInGDP returned {total!r} for {roundsText(r)}, which isn't a number. Check that spending and total both start as numbers before the loop.")
        # inf is past the limit too, so this catches it.
        if total > limit:
            raise ValueError(f"changeInGDP returned {total!r} for {roundsText(r)}, but the total should be at most {limit}. Check that each round's spending gets smaller: multiply it by mpc.")
        if total < 0:
            raise ValueError(f"changeInGDP returned {total!r} for {roundsText(r)}, but each round's new spending here is 0 or more, so the total should never be negative. Check how your loop adds to total.")
        # A round adds 0 or more, so the total after r rounds is never less than after r - 1 rounds. Adding a number that isn't negative never makes a sum smaller, so a correct loop never trips this.
        if r > 1 and total < totals[-1]:
            raise ValueError(f"changeInGDP returned {total!r} for {roundsText(r)}, less than the {totals[-1]!r} it returned for {roundsText(r - 1)}. Each round's new spending is 0 or more, so the total should never go down. Check how your loop adds to total.")
        totals.append(total)

    show_rounds(policy, amount, mpc, totals)


# The government spends `amount` million dollars more. Round 1's new spending is all of it.
def spendMore(amount, mpc, rounds, changeInGDP):
    followRounds("spending", "spendMore", amount, mpc, rounds, changeInGDP)


# The government cuts taxes by `amount` million dollars. Round 1's new spending is the MPC share of it.
def cutTaxes(amount, mpc, rounds, changeInGDP):
    followRounds("taxCut", "cutTaxes", amount, mpc, rounds, changeInGDP)
