# This code rolls a die many times and graphs how often each face comes up.
# Change totalRolls and numSides, then press Run.

import random

totalRolls = 10
numSides = 6

# Rolls one die and returns a whole number from 1 to numSides.
def rollDie():
    return random.randint(1, numSides)

# Roll your die totalRolls times and draw the bars.
rollDice(totalRolls, numSides, rollDie)
