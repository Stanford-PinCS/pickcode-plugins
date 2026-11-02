// Hidden helper. Asks shouldReward about press 1, press 2, and so on up to
// press 300, then puts a simulated rat in the Skinner box. The rat gets food
// only on the presses you said yes to. After 60 seconds the food runs out,
// and the box shows how long the rat keeps pressing anyway.
function runSkinnerBox(shouldReward) {
    if (typeof shouldReward !== "function") {
        throw new Error("runSkinnerBox needs your shouldReward function as its input.");
    }

    const rewardList = [];
    for (let pressNumber = 1; pressNumber <= 300; pressNumber++) {
        const answer = shouldReward(pressNumber);
        if (answer !== true && answer !== false) {
            throw new Error(
                `shouldReward(${pressNumber}) returned ${String(answer)}, but it should return true or false.`
            );
        }
        rewardList.push(answer ? 1 : 0);
    }

    showSkinnerBox(rewardList);
}
