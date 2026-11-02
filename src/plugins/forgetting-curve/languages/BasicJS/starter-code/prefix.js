// Hidden helper. Steps through 30 days, a quarter day at a time. Each step it
// calls retention to find how much you remember. On a review day it resets
// the memory to 100% and makes stability bigger: more so when you had
// forgotten more. Then it sends the curve to the chart.
function trackMemory(reviewDays, stabilityBoost, retention) {
    if (!Array.isArray(reviewDays)) {
        throw new Error("reviewDays should be a list of days, like [] or [1, 3, 7].");
    }
    for (const day of reviewDays) {
        if (!Number.isInteger(day) || day < 1 || day > 30) {
            throw new Error(
                `reviewDays has ${String(day)} in it, but every review day should be a whole number from 1 to 30.`
            );
        }
    }
    if (typeof stabilityBoost !== "number" || !Number.isFinite(stabilityBoost) || stabilityBoost < 0 || stabilityBoost > 10) {
        throw new Error("stabilityBoost should be a number from 0 to 10, like 2.");
    }
    if (typeof retention !== "function") {
        throw new Error("trackMemory needs your retention function as its third input.");
    }

    const studyDays = Array.from(new Set(reviewDays)).sort((a, b) => a - b);
    const checked = (value, daysSinceReview) => {
        if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1.000001) {
            throw new Error(
                `retention(${daysSinceReview}, ...) returned ${String(value)}, but it should return a number from 0 to 1.`
            );
        }
        return Math.min(1, value);
    };

    let stability = 2; // days, right after you first learn the words
    let lastStudy = 0;
    const dayList = [];
    const retentionList = [];
    for (let step = 0; step <= 30 * 4; step++) {
        const day = step / 4;
        if (step % 4 === 0 && studyDays.includes(day)) {
            const before = checked(retention(day - lastStudy, stability), day - lastStudy);
            dayList.push(day);
            retentionList.push(before);
            stability = stability * (1 + stabilityBoost * (1 - before));
            lastStudy = day;
        }
        dayList.push(day);
        retentionList.push(checked(retention(day - lastStudy, stability), day - lastStudy));
    }

    showMemory(dayList, retentionList, studyDays, 0.5);
}
