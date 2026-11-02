# Hidden helper for N2O4 <=> 2NO2. A while loop calls the student's
# chooseDirection(Q, K) and reacts a little in the direction it returns,
# until it returns "equilibrium" or the loop reaches its pass limit.
# If addN2O4 is above 0, it then adds that much N2O4 and runs the loop again.
import math


def runReaction(startN2O4, startNO2, K, addN2O4, chooseDirection):
    STEP_LIMIT = 50  # most passes one while loop may take
    RATE_STEP = 0.1  # how much of the net reaction rate happens per pass
    MIN_STEP = 0.002  # smallest amount (mol/L of N2O4) that reacts per pass

    def checkAmount(value, name):
        if (
            isinstance(value, bool)
            or not isinstance(value, (int, float))
            or not math.isfinite(value)
            or value < 0
            or value > 5
        ):
            raise ValueError(f"{name} should be a concentration from 0 to 5, like 1.0.")

    checkAmount(startN2O4, "startN2O4")
    checkAmount(startNO2, "startNO2")
    checkAmount(addN2O4, "addN2O4")
    if startN2O4 == 0 and startNO2 == 0:
        raise ValueError(
            "Put some N2O4 or NO2 in the container: startN2O4 and startNO2 can't both be 0."
        )
    if (
        isinstance(K, bool)
        or not isinstance(K, (int, float))
        or not math.isfinite(K)
        or K <= 0
        or K > 100
    ):
        raise ValueError("K should be a number greater than 0, like 0.36.")
    if not callable(chooseDirection):
        raise TypeError("runReaction needs your chooseDirection function as its last input.")

    state = {"n2o4": float(startN2O4), "no2": float(startNO2)}
    n2o4Values = []
    no2Values = []
    answers = []

    # Q = [NO2]^2 / [N2O4]. With no N2O4 at all, Q is infinitely large.
    def reactionQuotient():
        if state["n2o4"] > 0:
            return (state["no2"] * state["no2"]) / state["n2o4"]
        return math.inf

    def ask():
        answer = chooseDirection(reactionQuotient(), K)
        if answer not in ("forward", "reverse", "equilibrium"):
            raise ValueError(
                f"chooseDirection returned {answer!r}, but it should return "
                '"forward", "reverse", or "equilibrium".'
            )
        n2o4Values.append(state["n2o4"])
        no2Values.append(state["no2"])
        answers.append(answer)
        return answer

    def runLoop():
        passes = 0
        direction = ask()
        while direction != "equilibrium" and passes < STEP_LIMIT:
            # Forward rate minus reverse rate sets how much reacts: a lot when
            # far from equilibrium, a little when close.
            netRate = abs(K * state["n2o4"] - state["no2"] * state["no2"])
            amount = max(MIN_STEP, netRate * RATE_STEP)
            if direction == "forward":
                amount = min(amount, state["n2o4"])
                state["n2o4"] = state["n2o4"] - amount
                state["no2"] = state["no2"] + 2 * amount
            else:
                amount = min(amount, state["no2"] / 2)
                state["n2o4"] = state["n2o4"] + amount
                state["no2"] = state["no2"] - 2 * amount
            passes = passes + 1
            direction = ask()

    runLoop()
    addAt = -1
    if addN2O4 > 0:
        # Le Chatelier: disturb the mixture, then let the loop shift it again.
        state["n2o4"] = state["n2o4"] + addN2O4
        addAt = len(n2o4Values)
        runLoop()

    show_reaction(n2o4Values, no2Values, answers, K, addAt, STEP_LIMIT)
