# This code titrates an acid (HCl) with a base (NaOH) and graphs the pH.
# Read it, then press Run.

import math

acidConcentration = 0.100   # mol/L of HCl in the flask
baseConcentration = 0.100   # mol/L of NaOH in the buret

# Returns the pH of the flask from the moles of H+ and OH- added so far.
def calculatePH(molesH, molesOH, totalVolumeL):
    if molesH > molesOH:
        concentrationH = (molesH - molesOH) / totalVolumeL
        return -math.log10(concentrationH)
    return 7

# Drip the NaOH into the HCl and graph the pH after each addition.
runTitration(acidConcentration, baseConcentration, calculatePH)
