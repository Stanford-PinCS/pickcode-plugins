# This function sets up the population your simulation starts with.
# Read it, then press Run.

def getPopulationParameters():
    initialPopSize = 30
    growthRate = 0.5

    return initialPopSize, growthRate

# Hand your function to the simulation, which grows the population for 10 days.
simulatePopulation(getPopulationParameters)
