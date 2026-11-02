# Hidden helper. Checks your values, then sends them to the synapse.


def _isNumber(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def sendSignals(signals, threshold, potential, fires):
    if not isinstance(signals, (list, tuple)) or len(signals) < 1 or len(signals) > 10:
        raise ValueError("signals should be a list of 1 to 10 numbers, like [4, 4].")
    for i in range(len(signals)):
        if not _isNumber(signals[i]) or abs(signals[i]) > 20:
            raise ValueError(
                f"signals[{i}] is {signals[i]!r}. "
                "Each signal should be a number of mV from -20 to 20."
            )
    if not _isNumber(threshold) or threshold < -80 or threshold > 0:
        raise ValueError("threshold should be a number of mV from -80 to 0, like -55.")
    expected = -70
    for i in range(len(signals)):
        expected = expected + signals[i]
    if not _isNumber(potential) or abs(potential - expected) > 1e-6:
        raise ValueError(
            f"potential is {potential!r}, but starting at -70 and adding every signal "
            f"gives {round(expected, 2)}. Check that your loop adds each signal once."
        )
    if not isinstance(fires, bool):
        raise TypeError("fires should be True or False.")
    show_synapse(list(signals), threshold, fires)
