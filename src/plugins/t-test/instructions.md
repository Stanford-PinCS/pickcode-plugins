# One-Sample t-Test

A cereal company says its boxes hold 500 grams of cereal on average. An inspector weighs 12 boxes picked at random, and their mean comes out a little under 500 g. Is that convincing evidence against the company's claim, or the kind of difference random sampling produces anyway? You'll carry out a **one-sample t-test for a population mean** to find out. Along the way you'll write a **function** with a **for loop** that adds up a sum, and see **functions that call other functions**.

Click **Next** to continue.

## Testing a claim about a mean

The parameter is μ, the mean weight in grams of all the company's boxes of this cereal. The company's claim is the **null hypothesis**, H0: μ = μ0, where μ0 = 500 is the claimed value. The **alternative hypothesis** is what the inspector is looking for evidence of. It's either one-sided, Ha: μ < 500 or Ha: μ > 500, or two-sided, Ha: μ ≠ 500.

The sample mean, x̄, varies from sample to sample. Its sampling distribution has mean μ and standard deviation σ/√n, where σ is the population standard deviation. Nobody knows σ for these boxes, so the test uses the **sample standard deviation** in its place: s = √( Σ(x − x̄)² / (n − 1) ), where Σ adds up (x − x̄)² over every value x in the sample.

With σ unknown, the test to use is a **one-sample t-test**. Its **test statistic** is t = (x̄ − μ0) / (s / √n), with **degrees of freedom** df = n − 1. When H0 is true, t has a **t-distribution** with n − 1 degrees of freedom: a symmetric, bell-shaped curve with wider tails than the standard normal.

The **p-value** is the probability of getting a test statistic as extreme as the observed one or more extreme, in the direction of Ha, given that H0 is true. The decision compares it to the **significance level**, α = 0.05: if the p-value ≤ α, reject H0. If the p-value > α, fail to reject H0.

## Three functions that work together

Here is your code:

```js
// Weights in grams of 12 boxes an inspector picked at random.
let weights = [497, 504, 493, 499, 490, 500, 496, 502, 494, 498, 492, 499];

// Returns the mean, x̄, of a list of values.
function mean(values) {
    let total = 0;
    for (let x of values) {
        total = total + x;
    }
    return total / values.length;
}

// Returns the sample standard deviation, s, of a list of values.
function standardDeviation(values) {
    return 1;
}

// Returns the test statistic t = (x̄ − μ0) / (s / √n).
function tStatistic(values, mu0) {
    let xBar = mean(values);
    let s = standardDeviation(values);
    return (xBar - mu0) / (s / Math.sqrt(values.length));
}

// Test H0: μ = 500 against Ha: μ ≠ 500 at α = 0.05.
runTest(weights, 500, "!=", tStatistic);
```

```python
import math

# Weights in grams of 12 boxes an inspector picked at random.
weights = [497, 504, 493, 499, 490, 500, 496, 502, 494, 498, 492, 499]

# Returns the mean, x̄, of a list of values.
def mean(values):
    total = 0
    for x in values:
        total = total + x
    return total / len(values)

# Returns the sample standard deviation, s, of a list of values.
def standardDeviation(values):
    return 1

# Returns the test statistic t = (x̄ − μ0) / (s / √n).
def tStatistic(values, mu0):
    xBar = mean(values)
    s = standardDeviation(values)
    return (xBar - mu0) / (s / math.sqrt(len(values)))

# Test H0: μ = 500 against Ha: μ ≠ 500 at α = 0.05.
runTest(weights, 500, "!=", tStatistic)
```

- `weights` holds the 12 weights in grams.
- `mean` uses a **for loop**. `total` starts at 0, and each time through the loop it adds one value, `x`. After the loop, dividing the sum by the number of values gives x̄.
- `standardDeviation` should return s. Right now it always returns 1.
- `tStatistic` **calls** `mean` and `standardDeviation` to get x̄ and s, then returns t. It can only be as right as the two functions it calls.
- The last line tests H0: μ = 500 against Ha: μ ≠ 500 (`"!="` stands for ≠). `runTest` hands the weights to your `tStatistic`, and to `mean` and `standardDeviation` to show x̄ and s. Then it finds df = n − 1 and the p-value from the t-distribution.

## Run it

Press the **Run** button.

At the top, a **dotplot** shows the 12 weights. The dashed amber line marks the claim, μ0 = 500, and the teal line marks the sample mean, x̄ = 497. The pink bar runs from x̄ − s to x̄ + s, one standard deviation on each side of the mean.

At the bottom is the t-distribution with df = 11. The pink line marks your t, and the dotted pink line marks the same distance on the other side of 0. For Ha: μ ≠ 500, the p-value is the area at or below −|t| plus the area at or above |t|: both tails beyond those lines, shaded pink. A mean far above 500 would count against H0 as much as one far below it. The bottom row shows **Mean**, **SD**, **t**, **df** and the **p-value**.

Your s is 1, so t = −10.39. That's so far out in the tails that the shaded areas are too thin to see, and the p-value is less than 0.001: reject H0. It looks convincing, but it's wrong. A standard deviation is a typical distance from the mean, and the pink bar covers only 496 to 498 g while the dots spread from 490 to 504 g: 9 of the 12 boxes are more than 1 g from 497. An s that's too small puts t too far from 0.

The dotplot also checks the conditions for a t-test. The boxes are a random sample, and 12 boxes is far less than 10% of all the boxes the company fills. Since n = 12 is less than 30, the sample should also be free from strong skewness and outliers, and the dotplot shows none.

## Step 1: Add up the squared deviations

To find s, take each value's deviation from the mean, x − x̄, square it, and add up the squares. Then divide by n − 1 and take the square root. Adding up the squares is the same loop as the one in `mean`, with (x − x̄)² in place of x.

Replace the `return` line inside `standardDeviation` with these lines:

```js
    let xBar = mean(values);
    let total = 0;
    for (let x of values) {
        total = total + (x - xBar) ** 2;
    }
    return Math.sqrt(total / (values.length - 1));
```

```python
    xBar = mean(values)
    total = 0
    for x in values:
        total = total + (x - xBar) ** 2
    return math.sqrt(total / (len(values) - 1))
```

`**` raises a number to a power, so `(x - xBar) ** 2` is one squared deviation. Now `standardDeviation` calls `mean` too.

Run it again.

**Look for:** the squared deviations add up to 192, so s = √(192 / 11) = 4.18 g. The pink bar now spans the middle of the dots, from about 492.8 to 501.2.

- t = (497 − 500) / (4.18 / √12) = −2.49, with df = 11.
- The p-value is 0.030: if the mean weight of all the boxes really were 500 g, the probability of getting a t at or below −2.49 or at or above 2.49 would be 0.030.
- Since 0.030 ≤ 0.05, reject H0. There is convincing statistical evidence that the mean weight of all the company's boxes of this cereal is different from 500 g.

## Step 2: Test for underfilled boxes

The alternative hypothesis comes from the question being asked, before anyone collects data. A consumer group only wants to know whether the boxes are **underfilled**, so its alternative is one-sided: Ha: μ < 500. Replace the last two lines of your code with these:

```js
// Test H0: μ = 500 against Ha: μ < 500 at α = 0.05.
runTest(weights, 500, "<", tStatistic);
```

```python
# Test H0: μ = 500 against Ha: μ < 500 at α = 0.05.
runTest(weights, 500, "<", tStatistic)
```

Run it again.

**Look for:** x̄, s, t and df stay the same, but only the left tail is shaded now. For Ha: μ < 500, "as extreme or more extreme" means at or below −2.49, so the p-value is 0.015, half of the two-sided 0.030. Since 0.015 ≤ 0.05, reject H0: there is convincing statistical evidence that the mean weight of all the company's boxes of this cereal is less than 500 g.

## Step 3: Count Type I errors

A test can be wrong. A **Type I error** happens when a small p-value gives convincing evidence for Ha, but Ha isn't true. Here, that's concluding the boxes are underfilled when they really average 500 g. The probability of a Type I error is the significance level, α.

`simulateTests` draws 1000 random samples of 12 boxes from a population where H0 is true: box weights that follow a normal distribution with mean 500 g and standard deviation 4 g. It runs your test on every sample. Replace the last two lines with these:

```js
// Test 1000 random samples of 12 boxes where H0 is true, against Ha: μ < 500.
simulateTests(500, 12, "<", tStatistic);
```

```python
# Test 1000 random samples of 12 boxes where H0 is true, against Ha: μ < 500.
simulateTests(500, 12, "<", tStatistic)
```

Run it again.

**Look for:** the samples pile up one by one.

- At the bottom, the 1000 test statistics take the shape of the t-distribution with df = 11. That's the **null distribution**, the distribution of t when H0 is true. The pink bars are the samples with p-value ≤ 0.05, every t at or below −1.796.
- About 5% of the samples reject H0, shown as the **Error rate**. Every one of them is a Type I error: H0 is true, but the test rejected it. Run it a few more times. The rate changes a little each time, usually landing between 3.6% and 6.4%, but it stays near α = 0.05.
- At the top, the 1000 sample means center at about 500 g with a standard deviation of about 1.15 g, as σ/√n = 4/√12 ≈ 1.15 predicts.

## Check your understanding

<Question>
In Step 1 the p-value was 0.030. Which statement interprets it correctly?
- [ ] The probability that the mean weight of all the boxes is 500 g is 0.030
- [x] If the mean weight of all the boxes is 500 g, the probability of a test statistic as extreme as −2.49 or more extreme is 0.030
- [ ] 3% of the boxes weigh less than 500 g
> A p-value is computed by assuming H0 is true, here that μ = 500. It's the probability of a result like the inspector's, not the probability that H0 is true.
</Question>

<Question>
Suppose the inspector had tested Ha: μ > 500 with the same 12 boxes. What would happen?
- [ ] The p-value would be 0.015, so reject H0
- [ ] The p-value would be 0.030, so reject H0
- [x] The p-value would be 0.985, so fail to reject H0
> The p-value goes in the direction of Ha: for Ha: μ > 500, it's the area at or above t = −2.49, almost the whole curve. A sample mean below 500 gives no evidence that μ > 500. Failing to reject H0 doesn't show that H0 is true, either.
</Question>

<Question>
In Step 2's test of Ha: μ < 500, which of these would be a Type I error?
- [x] Concluding that the boxes hold less than 500 g on average when they really average 500 g
- [ ] Not finding convincing evidence that the boxes are underfilled when they really average less than 500 g
- [ ] Weighing one box that holds less than 500 g
> A Type I error rejects H0 when H0 is true. The second choice is a Type II error: not finding convincing evidence for Ha when Ha is true.
</Question>

## Wrap up

You wrote `standardDeviation`, a function whose for loop adds up squared deviations, the same way `mean` adds up values. `tStatistic` called both functions to find t = (x̄ − μ0) / (s / √n), and the p-value came from the t-distribution with n − 1 degrees of freedom. The p-value follows the direction of Ha: a two-sided test counts both tails, a one-sided test only the tail Ha points to. With a p-value ≤ α = 0.05, the inspector rejected H0. But when H0 was true, the test still rejected it in about 5% of samples, because the probability of a Type I error is α.

Next, in **Least-Squares Regression**, you'll find the line that best predicts test scores from hours studied.
