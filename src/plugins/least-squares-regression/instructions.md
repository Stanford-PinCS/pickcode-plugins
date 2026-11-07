# Least-Squares Regression

Do students who study longer score higher on a test? You'll plot hours studied against test scores in a **scatterplot**, find the **least-squares regression line** that predicts a score from hours studied, and look at its **residuals**. Along the way you'll write a **for loop** that walks through two **parallel lists** at the same index and adds up two sums at once.

Click **Next** to continue.

## Two quantitative variables

A **scatterplot** shows the relationship between two quantitative variables measured on the same individuals, one point per individual. The **explanatory variable** goes on the x-axis: its values are used to explain or predict the values of the **response variable** on the y-axis. To describe the association, give its **form** (linear or non-linear), **direction** (positive or negative), **strength** (strong, moderate or weak: how closely the points follow the pattern) and any **unusual features**, such as clusters or points that don't fit the pattern.

The **correlation coefficient**, r, summarizes the strength and direction of a linear association. It has no units and is always between −1 and 1, inclusive. The closer it is to −1 or 1, the stronger the linear association, and r = 0 means there is no linear association.

A **linear regression model** uses a line to predict the response from the explanatory variable: ŷ = a + bx, where ŷ is the predicted response, a is the y-intercept and b is the slope. A point's **residual** is the difference between its observed and predicted response: residual = y − ŷ.

The **least-squares regression line** is the line that makes the sum of the squares of the residuals as small as possible, and it always passes through the point (x̄, ȳ). Calculators and software find its slope with

b = Σ(xᵢ − x̄)(yᵢ − ȳ) ÷ Σ(xᵢ − x̄)²

and, since the line passes through (x̄, ȳ), its intercept is a = ȳ − b·x̄.

## A loop over two lists

Here is your code:

```js
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
```

```python
# Hours each student in one class studied, and their test score out of 100.
# hours[i] and scores[i] belong to the same student.
hours = [3, 7, 1, 5, 9, 2, 6, 4, 7, 2, 9, 5]
scores = [59, 91, 51, 66, 95, 69, 68, 74, 81, 51, 91, 80]

# Returns the mean of a list of numbers: their sum divided by how many there are.
def mean(values):
    total = 0
    for i in range(len(values)):
        total += values[i]
    return total / len(values)

# Returns the slope b of the least-squares regression line for the points (xs[i], ys[i]).
def slope(xs, ys):
    return 0
```

- `hours` and `scores` are **parallel lists**: `hours[i]` and `scores[i]` are the same student's hours and score, so one index `i` picks out one point (xᵢ, yᵢ). Hours studied is the explanatory variable x, and test score is the response variable y.
- `mean` adds up a list with a **for loop**. The index `i` takes each value 0, 1, 2, … up to the last index, and each pass adds `values[i]` to `total`.
- `slope` should return b, the slope of the least-squares regression line. Right now it returns 0.
- The last line, `drawRegression(hours, scores, slope)`, calls your `slope` function, finds the intercept a = ȳ − b·x̄, and draws the line ŷ = a + bx with each student's residual.

## Run it

Press the **Run** button.

Each dot is one student. The points show a **linear** form and a **positive** direction: students who studied more hours tend to have higher scores. They stay close to that pattern, so the association is **strong**. The correlation agrees: **r** = 0.89, positive and close to 1.

The pink line is your line. With b = 0 it's flat: its intercept is a = ȳ − 0 · x̄ = ȳ = 73, so it predicts a score of 73 for every student, however long they studied. The cross marks the point (x̄, ȳ) = (5, 73). The dashed amber line is the least-squares regression line.

Each vertical segment is a residual. A teal one is positive: the student scored above the line, so the line **underpredicts** that score. A purple one is negative: the line **overpredicts**. Below the scatterplot, the **residual plot** shows each residual against hours studied, and the pink line at 0 stands for your line. For the flat line the residuals climb from left to right, a pattern your line is missing.

The bottom row shows **Slope** 0, **Intercept** 73, **r** 0.89, **r²** 0.8, and **Σ residual²**, the sum of the squared residuals, 2500. The values of r and r² come from the data, not from your line, so they won't change until the data do.

## Step 1: Add up two sums in one loop

The formula for b has a sum on top, Σ(xᵢ − x̄)(yᵢ − ȳ), and a sum on the bottom, Σ(xᵢ − x̄)². Both add one term for each point, so one loop can add up both. Replace the `return` line inside `slope` with these lines:

```js
    let xMean = mean(xs);
    let yMean = mean(ys);
    let top = 0;
    let bottom = 0;
    for (let i = 0; i < xs.length; i++) {
        top += (xs[i] - xMean) * (ys[i] - yMean);
        bottom += (xs[i] - xMean) ** 2;
    }
    return top / bottom;
```

```python
    xMean = mean(xs)
    yMean = mean(ys)
    top = 0
    bottom = 0
    for i in range(len(xs)):
        top += (xs[i] - xMean) * (ys[i] - yMean)
        bottom += (xs[i] - xMean) ** 2
    return top / bottom
```

`xMean` and `yMean` are x̄ and ȳ. Each pass of the loop uses the same index `i` in both lists, so `xs[i]` and `ys[i]` are one student's hours and score. `** 2` squares a number.

Run it again.

**Look for:** your line turns about the cross and lands on the dashed line: **Slope** 5 and **Intercept** 48, so ŷ = 48 + 5x.

- **Σ residual²** drops from 2500 to 500. No other line can make it smaller for these points, which is why this is the least-squares line.
- The flat line ignored hours, so its 2500 is all the variation in scores around ȳ. The least-squares line leaves 500 of it, 20%, unexplained. The other 80% is explained by the linear relationship with hours studied, and that's r² = 0.8, the **coefficient of determination**.
- The residual plot has no pattern now: the residuals scatter above and below 0 from the left side to the right. Apparent randomness in a residual plot confirms that the association is linear, so a linear model is appropriate. A value of r close to 1 couldn't tell you that by itself.

## Step 2: Predict a score

What score does the line predict for a student who studies 6.5 hours? Add these lines at the end of your code, after `drawRegression(hours, scores, slope)`:

```js
// Predict the score of a student who studies 6.5 hours.
let b = slope(hours, scores);
let a = mean(scores) - b * mean(hours);
let predicted = a + b * 6.5;
drawPrediction(6.5, predicted);
```

```python
# Predict the score of a student who studies 6.5 hours.
b = slope(hours, scores)
a = mean(scores) - b * mean(hours)
predicted = a + b * 6.5
drawPrediction(6.5, predicted)
```

The least-squares line passes through (x̄, ȳ), so ȳ = a + b·x̄, and the second line solves that for a. The third line is ŷ = a + bx with x = 6.5, and `drawPrediction` marks that point on the plot.

Run it again.

**Look for:** a pink ring on your line above 6.5 hours, at ŷ = 80.5. The model predicts a score of 80.5 for a student who studies 6.5 hours.

- The slope, 5, is the predicted increase in test score for each additional hour studied.
- 6.5 hours is inside the interval of hours in the data, 1 to 9, so this prediction is an **interpolation**. A prediction for 15 hours would be an **extrapolation**, and the further a prediction is extrapolated, the less reliable it is.
- The intercept, 48, is the predicted score for 0 hours of studying. No student in the data studied less than 1 hour, so that's an extrapolation too, and it may not be a reasonable prediction.

## Step 3: Add a point that doesn't fit the pattern

Suppose one more student studied 12 hours but scored only 50. Add 12 to the end of `hours` and 50 to the end of `scores`, so those two lines read:

```js
let hours = [3, 7, 1, 5, 9, 2, 6, 4, 7, 2, 9, 5, 12];
let scores = [59, 91, 51, 66, 95, 69, 68, 74, 81, 51, 91, 80, 50];
```

```python
hours = [3, 7, 1, 5, 9, 2, 6, 4, 7, 2, 9, 5, 12]
scores = [59, 91, 51, 66, 95, 69, 68, 74, 81, 51, 91, 80, 50]
```

Run it again.

**Look for:** the new point at the far right, well below where the pattern says it should be. It doesn't fit the general pattern of the association, an unusual feature of the scatterplot.

- The line tilts toward it. **Slope** falls from 5 to 2.01 and **Intercept** rises from 48 to 60.11, and the predicted score for 6.5 hours drops from 80.5 to 73.16.
- **r** falls from 0.89 to 0.41 and **r²** from 0.8 to 0.17. One student made the linear association look much weaker.
- The line makes Σ residual² as small as possible, and squaring makes one big residual count a lot. If the line stayed at ŷ = 48 + 5x, the new student's residual would be 50 − 108 = −58, and (−58)² = 3364 would bring the total to 500 + 3364 = 3864. Tilting toward the point brings it down to 2483.69.

## Check your understanding

<Question>
The least-squares regression line for the twelve students is ŷ = 48 + 5x, where x is hours studied and ŷ is the predicted test score. Which is the correct interpretation of the slope?
- [ ] Each extra hour of studying causes a student's score to go up by exactly 5 points
- [x] For each additional hour studied, the predicted test score increases by 5 points
- [ ] A student who studies 0 hours is predicted to score 5 points
> The slope is the predicted increase in the response for a one-unit increase in the explanatory variable. It's a prediction, not an exact change for every student, and a correlation doesn't show that studying causes the higher scores.
</Question>

<Question>
One of the twelve students studied 6 hours and scored 68. Using ŷ = 48 + 5x, what is this student's residual, and what does it tell you?
- [ ] 10, so the line underpredicts this student's score
- [x] −10, so the line overpredicts this student's score
- [ ] −10, so the line underpredicts this student's score
> The predicted score is ŷ = 48 + 5 × 6 = 78, so the residual is y − ŷ = 68 − 78 = −10. A negative residual means the observed score is below the line: the model overpredicts it.
</Question>

<Question>
In Step 3, why did one student who studied 12 hours and scored 50 change the slope so much?
- [ ] Because 50 is the lowest score in the data
- [x] Because the line makes the sum of the squared residuals as small as possible, and that student's big residual counts a lot once it's squared
- [ ] Because the least-squares line has to pass through every point
> From the old line, the new student's residual would be −58, and (−58)² = 3364 is more than six times the 500 of the other twelve students together. Tilting toward the point shrinks that one big square more than it grows the others. A score of 50 at 2 hours would also be the lowest, but it would sit near the pattern and only change the slope to 5.25.
</Question>

## Wrap up

You wrote `slope`, a function whose for loop walks through two parallel lists at the same index and adds up two sums at once, Σ(xᵢ − x̄)(yᵢ − ȳ) and Σ(xᵢ − x̄)². Their quotient is the slope of the least-squares regression line, the line that makes the sum of the squared residuals as small as possible. For these students it was ŷ = 48 + 5x, with r = 0.89, r² = 0.8 and a residual plot with no pattern. You used it to predict a score by interpolation and read its slope in context. Then one student who didn't fit the pattern pulled the slope from 5 to 2.01 and r from 0.89 to 0.41.

Next, you'll use residual plots to decide when a straight line isn't the right model for two quantitative variables.
