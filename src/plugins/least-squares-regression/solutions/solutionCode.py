# This code plots hours studied against test scores, with a line that predicts each score.
# Change slope so the line is the least-squares regression line.

# Hours each student in one class studied, and their test score out of 100.
# hours[i] and scores[i] belong to the same student.
hours = [3, 7, 1, 5, 9, 2, 6, 4, 7, 2, 9, 5, 12]
scores = [59, 91, 51, 66, 95, 69, 68, 74, 81, 51, 91, 80, 50]

# Returns the mean of a list of numbers: their sum divided by how many there are.
def mean(values):
    total = 0
    for i in range(len(values)):
        total += values[i]
    return total / len(values)

# Returns the slope b of the least-squares regression line for the points (xs[i], ys[i]).
def slope(xs, ys):
    xMean = mean(xs)
    yMean = mean(ys)
    top = 0
    bottom = 0
    for i in range(len(xs)):
        top += (xs[i] - xMean) * (ys[i] - yMean)
        bottom += (xs[i] - xMean) ** 2
    return top / bottom

# Find slope b and intercept a with your slope function, then draw the line and residuals.
drawRegression(hours, scores, slope)

# Predict the score of a student who studies 6.5 hours.
b = slope(hours, scores)
a = mean(scores) - b * mean(hours)
predicted = a + b * 6.5
drawPrediction(6.5, predicted)
