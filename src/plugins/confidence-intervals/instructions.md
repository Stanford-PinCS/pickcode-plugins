# Confidence Intervals

Do most students at a large school support a later start time? 100 pollsters each ask a random sample of students, and each turns their sample into a **confidence interval**: a range of plausible values for the true proportion. You'll write a **function that returns a list of two values**, the interval's lower and upper limits, using a **square root** in its math.

Click **Next** to continue.

## Estimating a proportion

The school has 2,500 students, and 1,550 of them support a later start time. So the **population proportion** is p = 1,550 ÷ 2,500 = 0.62: the proportion of all students at the school who support a later start time. The pollsters don't know that. Each one takes a **random sample** of n = 50 students and finds the **sample proportion**, p̂ ("p-hat"), the proportion of their sample who say yes.

- p̂ is a **point estimator** of p: the value of p̂ from a sample is a single-number estimate of p.
- Different samples give different values of p̂. When the sampled values are independent, the **sampling distribution** of p̂ has mean p and standard deviation √(p(1 − p) / n). Here that's √(0.62 × 0.38 / 50) ≈ 0.069. It's approximately normal, since np = 31 and n(1 − p) = 19 are both at least 10.
- Because its mean is p, p̂ is an **unbiased** estimator: on average, it doesn't overestimate or underestimate p.

## Building a confidence interval

A **confidence interval** is an interval estimate for a population parameter, here p. It's built as point estimate ± margin of error:

> p̂ ± z\* √(p̂(1 − p̂) / n)

- The **standard error**, SE = √(p̂(1 − p̂) / n), estimates the standard deviation of the sampling distribution of p̂. It uses p̂, since p is unknown.
- The **critical value** z\* is the value where −z\* and z\* enclose the middle C% of the standard normal distribution, for a confidence level of C%. For 95% confidence, z\* = 1.96.
- The **margin of error** is z\* × SE, half the width of the interval.

This one-sample z-interval for a population proportion requires three conditions: the data come from a **random sample**; the **10% condition**, since the pollsters sample without replacement, n ≤ 10% of the population size N (here 50 ≤ 250); and the **normality condition**, the observed number of successes, np̂, and of failures, n(1 − p̂), are both at least 10.

## A function that returns two values

Here is your code:

```js
// How many students each pollster asks.
let n = 50;
// The critical value z* for 95% confidence.
let zStar = 1.96;

// Returns a confidence interval [lower, upper] for p, the school-wide proportion in favor.
// pHat is the proportion who support it in one pollster's sample of n students.
function confidenceInterval(pHat, n, zStar) {
    return [pHat, pHat];
}
```

```python
import math

# How many students each pollster asks.
n = 50
# The critical value z* for 95% confidence.
zStar = 1.96

# Returns a confidence interval [lower, upper] for p, the school-wide proportion in favor.
# pHat is the proportion who support it in one pollster's sample of n students.
def confidenceInterval(pHat, n, zStar):
    return [pHat, pHat]
```

- `n` is the sample size, and `zStar` is the critical value z\*.
- `confidenceInterval` takes one pollster's `pHat` along with `n` and `zStar`, and returns a **list of two values**, `[lower, upper]`: the lower limit first, then the upper limit. Right now both limits are `pHat`, so the interval has no width. It's just the point estimate.
- The last line, `runPolls(n, zStar, confidenceInterval)`, has each of the 100 pollsters take a random sample of `n` students, find `pHat` and call your function.

## Run it

Press the **Run** button.

Each row is one pollster, with a dot at their p̂. When all 100 are drawn, a dashed amber line drops in at the true proportion, p = 0.62. An interval **captures** p when its lower limit is at most p and its upper limit is at least p. Intervals that capture p turn pink, and the ones that miss turn teal.

The dots scatter on both sides of the dashed line. **Avg. estimate**, the mean of the 100 values of p̂, comes out close to 0.62, as it should for an unbiased estimator.

Almost every row is teal, though. **Captured** shows about 12 / 100, usually between 6 and 18: only the pollsters whose sample had exactly 31 of 50 students saying yes got p̂ = 0.62. A point estimate rarely lands exactly on p, and **Avg. margin**, the average margin of error, is 0.

The bottom row also shows **Confidence**, the confidence level that goes with your z\*, and the **Sample size**.

## Step 1: Add the margin of error

Replace the `return` line inside `confidenceInterval` with these three lines:

```js
    let standardError = Math.sqrt(pHat * (1 - pHat) / n);
    let marginOfError = zStar * standardError;
    return [pHat - marginOfError, pHat + marginOfError];
```

```python
    standardError = math.sqrt(pHat * (1 - pHat) / n)
    marginOfError = zStar * standardError
    return [pHat - marginOfError, pHat + marginOfError]
```

`sqrt` finds the square root of what's inside its parentheses, so the first line is SE = √(p̂(1 − p̂) / n). The `return` line builds the list with the lower limit, p̂ − margin of error, first.

For example, a pollster whose sample has 29 of 50 students saying yes has p̂ = 0.58. That's 29 successes and 21 failures, both at least 10. SE = √(0.58 × 0.42 / 50) ≈ 0.0698, the margin of error is 1.96 × 0.0698 ≈ 0.137, and the interval is 0.58 ± 0.137, from 0.443 to 0.717. We are 95% confident that the interval from 0.443 to 0.717 contains the true proportion of all students at the school who support a later start time.

Run it again.

**Look for:** **Captured** shows about 95 / 100. It changes from run to run, usually between 90 and 99. **Avg. margin** is about 0.13.

- The teal intervals are from pollsters whose random sample happened to give a p̂ far from 0.62. Any one interval either captures p or misses it.
- That's what 95% confidence means: in repeated random sampling with the same sample size, about 95% of the confidence intervals calculated will capture p.

## Step 2: Lower the confidence level

For 90% confidence, z\* = 1.645: the middle 90% of the standard normal distribution lies between −1.645 and 1.645. Change the `zStar` line and the comment above it to:

```js
// The critical value z* for 90% confidence.
let zStar = 1.645;
```

```python
# The critical value z* for 90% confidence.
zStar = 1.645
```

Run it again.

**Look for:** **Confidence** reads 90%, and the intervals are narrower: **Avg. margin** drops to about 0.11. **Captured** shows about 90 / 100, usually between 84 and 95, so more intervals miss p than before.

A lower confidence level has a smaller critical value, so the margin of error z\* × SE is smaller and the intervals are narrower. Narrower intervals miss p more often.

## Step 3: Ask more students

Have each pollster ask 200 students instead of 50. The 10% condition still holds: 200 ≤ 10% of 2,500 = 250. Change the `n` line to:

```js
let n = 200;
```

```python
n = 200
```

Run it again.

**Look for:** the intervals are about half as wide: **Avg. margin** is about 0.056, down from about 0.11. **Confidence** still reads 90%, and **Captured** still shows about 90 / 100, usually between 84 and 96.

A larger sample size gives a smaller standard error, so the intervals are narrower at the same confidence level. The width is about proportional to 1 / √n. Four times the sample size gives about 1 / √4 = 1/2 the width.

## Check your understanding

<Question>
In Step 1, about 95 of the 100 intervals captured p. What does the 95% confidence level describe?
- [ ] 95% of the students in each sample support a later start time
- [x] In repeated random sampling with the same sample size, about 95% of the intervals calculated capture p
- [ ] Each interval contains 95% of the 100 values of p̂
> The confidence level describes the method, not one interval. Any single interval either captures p or misses it, the way the teal ones did.
</Question>

<Question>
Suppose you changed `zStar` to 2.576, the critical value for 99% confidence. What would happen to the intervals?
- [ ] They'd get narrower, and more of them would capture p
- [x] They'd get wider, and more of them would capture p
- [ ] They'd stay the same width, and more of them would capture p
> A higher confidence level has a larger critical value z\*, so the margin of error z\* × SE grows and the intervals get wider. Wider intervals capture p more often.
</Question>

<Question>
Two pollsters both found p̂ = 0.60. One asked 50 students and got the 95% confidence interval from 0.464 to 0.736. The other asked 200 students and got the interval from 0.532 to 0.668. Which interval gives convincing evidence that more than half of all students at the school support a later start time?
- [ ] Both, because p̂ = 0.60 is more than 0.5
- [ ] Only the one from 50 students, because it's wider
- [x] Only the one from 200 students, because every plausible value in it is more than 0.5
> A confidence interval gives a range of plausible values for p. The interval from 50 students includes 0.5 and values below it, so it can't rule out that half or fewer of the students support a later start time.
</Question>

## Wrap up

You wrote `confidenceInterval`, a function that returns a list of two values: p̂ − z\* × SE and p̂ + z\* × SE, with a square root for the standard error SE = √(p̂(1 − p̂) / n). 100 random samples showed what a confidence level means: about 95% of the 95% intervals and about 90% of the 90% intervals captured p. A lower confidence level made the intervals narrower, and so did a larger sample size, with the width about proportional to 1 / √n.

Next, in **One-Sample t-Test**, you'll test a cereal company's claim about the mean weight of its boxes.
