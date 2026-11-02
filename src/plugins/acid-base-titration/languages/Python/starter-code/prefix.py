# Hidden helper. Adds NaOH to 25.0 mL of HCl, 0.5 mL at a time up to 50.0 mL,
# asks your calculatePH function for the pH after each addition, and draws the run.
import math


def runTitration(acidConcentration, baseConcentration, calculatePH):
    _checkTitrationConcentration(acidConcentration, "acidConcentration")
    _checkTitrationConcentration(baseConcentration, "baseConcentration")
    if not callable(calculatePH):
        raise TypeError("runTitration needs your calculatePH function as its third input.")

    acidVolumeML = 25.0
    volumesML = []
    pHs = []
    regions = []
    for i in range(101):
        baseVolumeML = i * 0.5
        molesH = _roundTitrationMoles(acidConcentration * acidVolumeML / 1000)
        molesOH = _roundTitrationMoles(baseConcentration * baseVolumeML / 1000)
        totalVolumeL = (acidVolumeML + baseVolumeML) / 1000

        where = f"{baseVolumeML:.1f} mL of base"
        try:
            pH = calculatePH(molesH, molesOH, totalVolumeL)
        except ValueError:
            raise ValueError(
                f"calculatePH tried to take the log of 0 or a negative number at {where}. "
                "Give that case its own branch."
            ) from None
        if isinstance(pH, bool) or not isinstance(pH, (int, float)):
            raise TypeError(
                f"calculatePH should return a pH number, but at {where} it returned {pH!r}."
            )
        if not math.isfinite(pH):
            raise ValueError(
                f"calculatePH tried to take the log of 0 or a negative number at {where}. "
                "Give that case its own branch."
            )

        volumesML.append(baseVolumeML)
        pHs.append(pH)
        if molesH > molesOH:
            regions.append("excessH")
        elif molesOH > molesH:
            regions.append("excessOH")
        else:
            regions.append("equivalence")

    show_titration(acidConcentration, baseConcentration, acidVolumeML, volumesML, pHs, regions)


def _checkTitrationConcentration(value, name):
    if (
        isinstance(value, bool)
        or not isinstance(value, (int, float))
        or not math.isfinite(value)
        or value < 0.001
        or value > 1
    ):
        raise ValueError(f"{name} should be a number of mol/L from 0.001 to 1, like 0.100.")


# Rounds away tiny floating-point leftovers so equal moles compare as equal.
def _roundTitrationMoles(moles):
    return round(moles * 1e12) / 1e12
