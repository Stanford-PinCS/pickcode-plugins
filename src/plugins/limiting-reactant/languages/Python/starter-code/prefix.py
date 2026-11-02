# Hidden helper. Asks your reactionsPossible function how many times
# 2 H2 + O2 -> 2 H2O happens, then sends the amounts to the animation.


def runReaction(molesH2, molesO2, reactionsPossible):
    for name, value in [("molesH2", molesH2), ("molesO2", molesO2)]:
        if isinstance(value, bool) or not isinstance(value, (int, float)) or value < 0 or value > 30:
            raise ValueError(f"{name} should be a number of moles from 0 to 30, like 6.")
    if not callable(reactionsPossible):
        raise TypeError("runReaction needs your reactionsPossible function as its third input.")

    reactions = reactionsPossible(molesH2, molesO2)
    if isinstance(reactions, bool) or not isinstance(reactions, (int, float)):
        raise ValueError(
            f"reactionsPossible should return a number, but it returned {reactions!r}. "
            "Check that it ends with a return line."
        )

    show_reaction(molesH2, molesO2, reactions)
