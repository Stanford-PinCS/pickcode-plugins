# Hidden helper. Asks shouldReward about press 1, press 2, and so on up to
# press 300, then puts a simulated rat in the Skinner box. The rat gets food
# only on the presses you said yes to. After 60 seconds the food runs out,
# and the box shows how long the rat keeps pressing anyway.

def runSkinnerBox(shouldReward):
    if not callable(shouldReward):
        raise TypeError("runSkinnerBox needs your shouldReward function as its input.")

    rewardList = []
    for pressNumber in range(1, 301):
        answer = shouldReward(pressNumber)
        if answer is not True and answer is not False:
            raise ValueError(
                f"shouldReward({pressNumber}) returned {answer!r}, but it should return True or False."
            )
        rewardList.append(1 if answer else 0)

    show_skinner_box(rewardList)
