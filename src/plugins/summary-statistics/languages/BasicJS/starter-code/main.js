// This code draws a dotplot and a boxplot of how long students take to get to school.
// Change median so it finds the middle of a sorted list.

// Minutes to get to school, as 25 students in one class answered.
let minutes = [12, 25, 8, 15, 30, 5, 20, 10, 58, 14, 7, 22, 12,
               18, 3, 25, 10, 35, 15, 8, 28, 12, 6, 20, 17];

// Returns the median of values, a list sorted from smallest to largest.
function median(values) {
    return values[0];
}

// Sort the minutes, then use your median function to find the median, Q1 and Q3.
drawBoxplot(minutes, median);
