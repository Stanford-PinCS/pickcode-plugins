// This code tracks how much of a new list of words you remember over 30 days.
// Add days to reviewDays, then press Run.

let reviewDays = [];      // days you study the list again
let stabilityBoost = 2;   // how much each review strengthens the memory

// Returns the share of the words you still remember, from 0 to 1.
function retention(daysSinceReview, stability) {
    return Math.exp(-daysSinceReview / stability);
}

// Follow your memory day by day, then draw the forgetting curve.
trackMemory(reviewDays, stabilityBoost, retention);
