# Summary Statistics

How long does it take students to get to school? You'll summarize 25 answers with a **five-number summary** and draw them as a **boxplot**. Along the way you'll write a **function** that finds the median by using a list **index**, plus an **if / else** that checks whether a list has an even or odd number of values.

Click **Next** to continue.

## Five numbers that describe a distribution

A **five-number summary** describes a quantitative variable with five values:

- The **minimum** and **maximum** are the smallest and largest values.
- The **median** is the middle value when the data are in order from smallest to largest. With an even number of values, it's the mean of the two middle values.
- The **first quartile (Q1)** is the median of the lower half of the ordered data. The **third quartile (Q3)** is the median of the upper half.

The middle 50% of the data lies between Q1 and Q3. The distance between them is the **interquartile range**: IQR = Q3 − Q1.

A **boxplot** draws the five-number summary. The box runs from Q1 to Q3 with a line at the median. The whiskers reach out to the smallest and largest values that aren't outliers. A value is an **outlier** if it's more than 1.5 × IQR above Q3 or below Q1, and it gets an asterisk.

## A function that finds the median

Here is your code:

```js
// Minutes to get to school, as 25 students in one class answered.
let minutes = [12, 25, 8, 15, 30, 5, 20, 10, 58, 14, 7, 22, 12,
               18, 3, 25, 10, 35, 15, 8, 28, 12, 6, 20, 17];

// Returns the median of values, a list sorted from smallest to largest.
function median(values) {
    return values[0];
}
```

```python
# Minutes to get to school, as 25 students in one class answered.
minutes = [12, 25, 8, 15, 30, 5, 20, 10, 58, 14, 7, 22, 12,
           18, 3, 25, 10, 35, 15, 8, 28, 12, 6, 20, 17]

# Returns the median of values, a list sorted from smallest to largest.
def median(values):
    return values[0]
```

- `minutes` holds the 25 answers in the order the students gave them.
- `median` takes `values`, a list that's already sorted from smallest to largest, and should return its median. Each value in a list has an **index**, its position counting from 0, so `values[0]` is the first and smallest value. Right now `median` always returns the smallest value.
- The last line, `drawBoxplot(minutes, median)`, sorts the minutes and calls your function three times: on the whole list for the median, on the lower 12 values for Q1, and on the upper 12 values for Q3. With 25 values the median is the 13th, so it belongs to neither half.

## Run it

Press the **Run** button.

At the top, a **dotplot** stacks one dot for each student above a number line. The dashed teal line marks the **mean**, x̄: the sum of the values divided by how many there are.

Below it, the pink **boxplot** is built from what your function returned. The dashed amber marks show where the correct Q1, median and Q3 are.

Your median line sits at the far left, on the smallest value, 3. Q1 is 3 too, and Q3 is 15, the smallest value of the upper half. The bottom row shows **Q1**, **Median**, **Q3**, **IQR** and **Mean**.

## Step 1: Return the middle value

The median of 25 sorted values is the 13th one. Counting from 0, that's index 12, and 25 ÷ 2 = 12.5 rounded down is 12. Replace the `return` line inside `median` with these two lines:

```js
    let middle = Math.floor(values.length / 2);
    return values[middle];
```

```python
    middle = len(values) // 2
    return values[middle]
```

The first line divides the number of values by 2 and rounds down, so `middle` is the index of the middle value.

Run it again.

**Look for:** the pink median line now sits on the amber mark at 15 minutes. But **Q1** reads 10 and **Q3** reads 25, so the box edges miss their amber marks.

## Step 2: Average the two middle values

Each half holds 12 values. That's an even number, so there's no single middle value: the 6th and 7th values (index 5 and 6) share the middle. The median is their mean. For the lower half that's (8 + 10) ÷ 2 = 9.

Replace the two lines inside `median` with these:

```js
    let middle = Math.floor(values.length / 2);
    if (values.length % 2 === 0) {
        return (values[middle - 1] + values[middle]) / 2;
    } else {
        return values[middle];
    }
```

```python
    middle = len(values) // 2
    if len(values) % 2 == 0:
        return (values[middle - 1] + values[middle]) / 2
    else:
        return values[middle]
```

`%` gives the remainder after dividing. A count is even when dividing it by 2 leaves a remainder of 0. Then `middle` is the index of the upper middle value, and `middle - 1` is the lower one.

Run it again.

**Look for:** the box lines up with the amber marks: Q1 = 9, median = 15 and Q3 = 23.5, so IQR = 14.5.

- The right whisker stops at 35, and 58 gets an asterisk. Q3 + 1.5 × IQR = 23.5 + 21.75 = 45.25, and 58 is past it.
- The mean, 17.4, is to the right of the median, 15. The right tail is longer than the left, so the distribution is **skewed right**, and the long tail pulls the mean toward it.

## Step 3: Make the outlier more extreme

Suppose the student who answered 58 really takes 98 minutes. In the first line of `minutes`, change `58` to `98`:

```js
let minutes = [12, 25, 8, 15, 30, 5, 20, 10, 98, 14, 7, 22, 12,
```

```python
minutes = [12, 25, 8, 15, 30, 5, 20, 10, 98, 14, 7, 22, 12,
```

Run it again.

**Look for:** the asterisk moves out to 98, and the mean moves right to 19. The box doesn't move: the median, Q1, Q3 and IQR are all the same as before. The median and IQR are **resistant**: one extreme value barely changes them, if at all. The mean is **nonresistant**, because it adds up every value.

## Check your understanding

<Question>
Why did Q1 come out as 10 in Step 1?
- [ ] The lower half had 13 values
- [x] The lower half had 12 values, so there were two middle values and Step 1 took only the larger one
- [ ] The data weren't sorted yet
> With an even number of values, the median is the mean of the two middle values: (8 + 10) ÷ 2 = 9.
</Question>

<Question>
Q1 = 9 minutes and Q3 = 23.5 minutes. Would a 45-minute trip be an outlier?
- [ ] Yes, because it's almost twice Q3
- [x] No, because it's less than Q3 + 1.5 × IQR = 45.25
- [ ] Yes, because it's more than the mean
> IQR = 23.5 − 9 = 14.5, and 1.5 × 14.5 = 21.75, so only values above 23.5 + 21.75 = 45.25 are outliers.
</Question>

<Question>
When 58 became 98 in Step 3, which of these changed?
- [ ] The median
- [ ] The IQR
- [x] The mean
> The mean adds up every value, so one extreme value pulls it. The median and quartiles depend only on the middle of the ordered data.
</Question>

## Wrap up

You wrote `median`, a function that uses a list index to find the middle value and an if / else with `%` to handle a list with an even number of values. `drawBoxplot` called it three times, on the whole list and on each half, to get the median, Q1 and Q3 of the five-number summary. The boxplot showed the 1.5 × IQR rule marking an outlier. The mean sat to the right of the median in this skewed-right distribution, and it moved when the outlier grew while the resistant median and IQR stayed put.

Next, in **Binomial Distribution**, you'll build the probability distribution of a basketball player's made free throws and check it against a simulation.
