# Hidden helper. Rolls the student's die totalRolls times, turns the counts
# for each face into percentages, and sends them to the bar chart.
import random


def rollDice(totalRolls, numSides, rollDie):
    if not isinstance(totalRolls, int) or totalRolls < 1 or totalRolls > 100000:
        raise ValueError(
            "totalRolls should be a whole number from 1 to 100000, like 10 or 1000."
        )
    if not isinstance(numSides, int) or numSides < 2 or numSides > 30:
        raise ValueError("numSides should be a whole number from 2 to 30, like 6 or 12.")
    if not callable(rollDie):
        raise TypeError("rollDice needs your rollDie function as its third input.")

    faceCounts = [0] * numSides
    for _ in range(totalRolls):
        roll = rollDie()
        if not isinstance(roll, int) or roll < 1 or roll > numSides:
            raise ValueError(
                f"rollDie returned {roll!r}, but it should return a whole number "
                f"from 1 to {numSides}. Change rollDie, or make numSides bigger."
            )
        faceCounts[roll - 1] += 1

    percentages = [(count / totalRolls) * 100 for count in faceCounts]
    show_target(100 / numSides)
    show_bars(percentages, totalRolls)
