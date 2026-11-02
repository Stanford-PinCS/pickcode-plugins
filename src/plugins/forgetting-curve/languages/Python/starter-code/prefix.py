# Hidden helper. Steps through 30 days, a quarter day at a time. Each step it
# calls retention to find how much you remember. On a review day it resets
# the memory to 100% and makes stability bigger: more so when you had
# forgotten more. Then it sends the curve to the chart.
import math


def trackMemory(reviewDays, stabilityBoost, retention):
    if not isinstance(reviewDays, (list, tuple)):
        raise TypeError("reviewDays should be a list of days, like [] or [1, 3, 7].")
    for day in reviewDays:
        if isinstance(day, bool) or not isinstance(day, int) or day < 1 or day > 30:
            raise ValueError(
                f"reviewDays has {day!r} in it, but every review day should be a whole number from 1 to 30."
            )
    if (
        isinstance(stabilityBoost, bool)
        or not isinstance(stabilityBoost, (int, float))
        or not math.isfinite(stabilityBoost)
        or stabilityBoost < 0
        or stabilityBoost > 10
    ):
        raise ValueError("stabilityBoost should be a number from 0 to 10, like 2.")
    if not callable(retention):
        raise TypeError("trackMemory needs your retention function as its third input.")

    studyDays = sorted(set(reviewDays))

    def checked(value, daysSinceReview):
        if (
            isinstance(value, bool)
            or not isinstance(value, (int, float))
            or not math.isfinite(value)
            or value < 0
            or value > 1.000001
        ):
            raise ValueError(
                f"retention({daysSinceReview}, ...) returned {value!r}, but it should return a number from 0 to 1."
            )
        return min(1, value)

    stability = 2  # days, right after you first learn the words
    lastStudy = 0
    dayList = []
    retentionList = []
    for step in range(0, 30 * 4 + 1):
        day = step / 4
        if step % 4 == 0 and step // 4 in studyDays:
            before = checked(retention(day - lastStudy, stability), day - lastStudy)
            dayList.append(day)
            retentionList.append(before)
            stability = stability * (1 + stabilityBoost * (1 - before))
            lastStudy = day
        dayList.append(day)
        retentionList.append(checked(retention(day - lastStudy, stability), day - lastStudy))

    show_memory(dayList, retentionList, studyDays, 0.5)
