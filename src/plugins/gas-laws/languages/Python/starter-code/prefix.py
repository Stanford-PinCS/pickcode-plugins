# Hidden helper. Pushes the piston from 44.8 L down to 2.8 L, asks the
# student's calculatePressure for the pressure at each volume, and sends the
# results to the piston, gauge and graph on the right.
import math


def isNumber(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def runPiston(moles, celsius, calculatePressure):
    if not isNumber(moles) or not (0 < moles <= 5):
        raise ValueError("moles should be a number more than 0 and at most 5, like 1.")
    if not isNumber(celsius) or not (-273.15 < celsius <= 1000):
        raise ValueError(
            "celsius should be a number above -273.15 (absolute zero) and at most 1000, like 25."
        )
    if not callable(calculatePressure):
        raise TypeError("runPiston needs your calculatePressure function as its third input.")

    volumes = []
    pressures = []
    for step in range(16, 0, -1):
        volume = round(step * 28) / 10
        pressure = calculatePressure(moles, volume, celsius)
        if not isNumber(pressure) or not math.isfinite(pressure):
            raise TypeError(
                "calculatePressure should return a number (the pressure in atm), "
                f"but it returned {pressure!r} at {volume} L."
            )
        if pressure < 0:
            raise ValueError(
                f"calculatePressure returned {pressure:.3g} atm at {volume} L. "
                "A pressure can't be negative. Is your temperature in kelvins?"
            )
        volumes.append(volume)
        pressures.append(pressure)
    show_piston(moles, celsius, volumes, pressures)
