# Hidden helper. Runs the trials one at a time. Each trial's strength is
# handed to updateStrength, and the answer becomes the strength for the next
# trial. Then it sends every trial to the dog and the learning curve.
import math


def trainDog(numPairedTrials, numBellOnlyTrials, updateStrength):
    if not isinstance(numPairedTrials, int) or numPairedTrials < 0 or numPairedTrials > 100:
        raise ValueError("numPairedTrials should be a whole number from 0 to 100, like 5 or 15.")
    if not isinstance(numBellOnlyTrials, int) or numBellOnlyTrials < 0 or numBellOnlyTrials > 100:
        raise ValueError("numBellOnlyTrials should be a whole number from 0 to 100, like 0 or 10.")
    if numPairedTrials + numBellOnlyTrials < 1:
        raise ValueError("Run at least one trial: make numPairedTrials 1 or more.")
    if not callable(updateStrength):
        raise TypeError("trainDog needs your updateStrength function as its third input.")

    foodList = []
    strengthList = []
    strength = 0
    for trial in range(1, numPairedTrials + numBellOnlyTrials + 1):
        foodPresent = trial <= numPairedTrials
        strength = updateStrength(strength, foodPresent)
        if isinstance(strength, bool) or not isinstance(strength, (int, float)) or not math.isfinite(strength):
            raise ValueError(
                f"updateStrength returned {strength!r} on trial {trial}, but it should return a number. "
                "Check that it ends with return strength."
            )
        if strength < -0.001 or strength > 100.001:
            raise ValueError(
                f"On trial {trial} the strength became {strength:.1f}, but it should stay from 0 to 100. "
                "Try a learningRate between 0 and 1."
            )
        strength = min(100, max(0, strength))
        foodList.append(1 if foodPresent else 0)
        strengthList.append(strength)

    show_trials(foodList, strengthList)
