# This code reacts hydrogen with oxygen to make water: 2 H2 + O2 -> 2 H2O.
# Read it, then press Run.

molesH2 = 6
molesO2 = 4

# Returns how many times the reaction can happen before a reactant runs out.
def reactionsPossible(molesH2, molesO2):
    fromH2 = molesH2 / 2   # each reaction uses 2 mol of H2
    return fromH2

# Send your amounts and your function to the reaction on the right.
runReaction(molesH2, molesO2, reactionsPossible)
