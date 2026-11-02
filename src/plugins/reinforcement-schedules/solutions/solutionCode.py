# This code decides which lever presses earn the rat a food pellet.
# Edit the if statement, then press Run.
import random

# Returns True if this press earns a pellet. pressNumber counts 1, 2, 3, ...
def shouldReward(pressNumber):
    if random.random() < 1 / 10:
        return True
    return False

# Put a rat in the Skinner box with your reward rule.
runSkinnerBox(shouldReward)
