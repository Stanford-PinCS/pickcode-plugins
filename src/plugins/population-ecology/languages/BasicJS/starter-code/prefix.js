// Hidden helper. Calls the student's getPopulationParameters function and
// grows that population for 10 days, two seconds per day.
function simulatePopulation(getParameters) {
    if (typeof getParameters !== "function") {
        throw new Error(
            "simulatePopulation needs your getPopulationParameters function as its input."
        );
    }

    const parameters = getParameters();
    if (!Array.isArray(parameters) || parameters.length !== 2) {
        throw new Error(
            "getPopulationParameters should return two values: initialPopSize, then growthRate."
        );
    }

    const [startSize, rate] = parameters;
    if (typeof startSize !== "number" || typeof rate !== "number") {
        throw new Error("initialPopSize and growthRate should both be numbers.");
    }

    createSimulationExponential(startSize, rate, 10, 2000);
}
