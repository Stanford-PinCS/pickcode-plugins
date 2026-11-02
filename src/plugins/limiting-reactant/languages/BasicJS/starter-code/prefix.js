// Hidden helper. Asks your reactionsPossible function how many times
// 2 H2 + O2 -> 2 H2O happens, then sends the amounts to the animation.
function runReaction(molesH2, molesO2, reactionsPossible) {
    for (const [name, value] of [["molesH2", molesH2], ["molesO2", molesO2]]) {
        if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 30) {
            throw new Error(`${name} should be a number of moles from 0 to 30, like 6.`);
        }
    }
    if (typeof reactionsPossible !== "function") {
        throw new Error("runReaction needs your reactionsPossible function as its third input.");
    }

    const reactions = reactionsPossible(molesH2, molesO2);
    if (typeof reactions !== "number" || !Number.isFinite(reactions)) {
        throw new Error(
            `reactionsPossible should return a number, but it returned ${String(reactions)}. ` +
                "Check that it ends with a return line."
        );
    }

    showReaction(molesH2, molesO2, reactions);
}
