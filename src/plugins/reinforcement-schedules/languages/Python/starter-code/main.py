# This code decides which lever presses earn the rat a food pellet.
# Edit the if statement, then press Run.

# Returns True if this press earns a pellet. pressNumber counts 1, 2, 3, ...
def shouldReward(pressNumber):
    if pressNumber % 1 == 0:
        return True
    return False

# Put a rat in the Skinner box with your reward rule.
runSkinnerBox(shouldReward)
