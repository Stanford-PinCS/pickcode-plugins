// This code plots hours studied against test scores, with a line that predicts each score.
// Change slope so the line is the least-squares regression line.

// Hours each student in one class studied, and their test score out of 100.
// hours[i] and scores[i] belong to the same student.
let hours = [3, 7, 1, 5, 9, 2, 6, 4, 7, 2, 9, 5];
let scores = [59, 91, 51, 66, 95, 69, 68, 74, 81, 51, 91, 80];

// Returns the mean of a list of numbers: their sum divided by how many there are.
function mean(values) {
    let total = 0;
    for (let i = 0; i < values.length; i++) {
        total += values[i];
    }
    return total / values.length;
}

// Returns the slope b of the least-squares regression line for the points (xs[i], ys[i]).
function slope(xs, ys) {
    return 0;
}

// Find slope b and intercept a with your slope function, then draw the line and residuals.
drawRegression(hours, scores, slope);
