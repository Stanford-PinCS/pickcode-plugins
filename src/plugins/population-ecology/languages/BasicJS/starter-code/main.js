// This function sets up the population your simulation starts with.
// Read it, then press Run.

function getPopulationParameters() {
    let initialPopSize = 30;
    let growthRate = 0.5;

    return [initialPopSize, growthRate];
}

// Hand your function to the simulation, which grows the population for 10 days.
simulatePopulation(getPopulationParameters);
