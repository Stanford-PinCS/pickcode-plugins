# Hidden helper. Calls the student's getPopulationParameters function and
# grows that population for 10 days, two seconds per day.
def simulatePopulation(getParameters):
    if not callable(getParameters):
        raise TypeError(
            "simulatePopulation needs your getPopulationParameters function as its input."
        )

    parameters = getParameters()
    if not isinstance(parameters, (tuple, list)) or len(parameters) != 2:
        raise ValueError(
            "getPopulationParameters should return two values: initialPopSize, then growthRate."
        )

    startSize, rate = parameters
    if not all(isinstance(v, (int, float)) for v in (startSize, rate)):
        raise TypeError("initialPopSize and growthRate should both be numbers.")

    create_simulation_exponential(startSize, rate, 10, 2000)
