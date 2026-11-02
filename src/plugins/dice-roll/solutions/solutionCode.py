# This code rolls a die many times and graphs how often each face comes up.
# Change totalRolls and numSides, then press Run.

import random

totalRolls = 10000
numSides = 12

# Rolls two 6-sided dice, then returns their total (2 to 12).
def rollDie():
    first = random.randint(1, 6)
    second = random.randint(1, 6)
    return first + second

# Roll your die totalRolls times and draw the bars.
rollDice(totalRolls, numSides, rollDie)
