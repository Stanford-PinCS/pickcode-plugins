function getPopulationParameters(){
    let initialPopSize = 30;
    let growthRate = 0.5;
    return [initialPopSize, growthRate];
}

const [N0, r] = getPopulationParameters();
createSimulationExponential(N0, r, 10, 2000);