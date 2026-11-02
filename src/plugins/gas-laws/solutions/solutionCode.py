# This code squeezes a gas with a piston and reads its pressure from your function.
# Change calculatePressure so the gauge follows the ideal gas law.

moles = 1    # n, the amount of gas in mol
celsius = 273  # the gas temperature in °C

# Returns the pressure in atm of n mol of gas in volume L at temperature °C.
def calculatePressure(n, volume, temperature):
    kelvin = temperature + 273.15
    return (n * 0.08206 * kelvin) / volume

# Push the piston from 44.8 L to 2.8 L, calling your function at each volume.
runPiston(moles, celsius, calculatePressure)
