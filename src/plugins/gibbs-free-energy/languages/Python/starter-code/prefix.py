# Hidden helpers. plotPoint saves each point your loop sends. After your code
# finishes, drawGibbsChart (the last line of main) animates them on the chart.
import math

_gibbsTemperatures = []
_gibbsDeltaGs = []
_gibbsLabels = []


def _isNumber(value):
    return (
        not isinstance(value, bool)
        and isinstance(value, (int, float))
        and math.isfinite(value)
    )


def plotPoint(temperature, deltaG, label):
    if not _isNumber(temperature) or temperature <= 0:
        raise ValueError(
            f"plotPoint expects a temperature in kelvin above 0, like 300, but got {temperature!r}."
        )
    if not _isNumber(deltaG):
        raise ValueError(
            f"plotPoint expects deltaG to be a number, but at {temperature} K it got {deltaG!r}."
        )
    cleaned = label.strip().lower() if isinstance(label, str) else ""
    if cleaned not in ("spontaneous", "nonspontaneous", "not spontaneous"):
        raise ValueError(
            f'plotPoint expects label to be "spontaneous" or "nonspontaneous", '
            f"but at {temperature} K it got {label!r}."
        )
    if len(_gibbsTemperatures) >= 1000:
        raise ValueError("Your loop sent more than 1000 points. Use a bigger step, like 50.")
    _gibbsTemperatures.append(temperature)
    _gibbsDeltaGs.append(deltaG)
    _gibbsLabels.append(cleaned)


_drewGibbsChart = [False]


def drawGibbsChart():
    _drewGibbsChart[0] = True
    if len(_gibbsTemperatures) == 0:
        raise ValueError(
            "Your loop didn't send any points. Check the start, end, and step of your for loop."
        )
    show_gibbs(_gibbsTemperatures, _gibbsDeltaGs, _gibbsLabels)
