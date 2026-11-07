# Binomial Distribution

A basketball player makes 70% of her free throws. If she shoots 10, how many will she make? You'll build the **probability distribution** of that number with the **binomial probability function** and check it against a simulation. Along the way you'll write a **for loop** that builds up a product in an **accumulator**, inside a **function** that another function **calls**.

Click **Next** to continue.

## Counting successes

Let **X** be the number of free throws she makes out of 10.

- X is a **random variable**: its values are numerical outcomes of a random phenomenon. It's **discrete**: it can only be 0, 1, 2, …, 10.
- X is a **binomial random variable**. It counts the successes (makes) in n = 10 repeated **independent** trials (shots), each with only two possible outcomes: success, with probability p = 0.7, or failure, with probability 1 − p = 0.3.
- A **probability distribution** for X shows the probability of every possible value. The probabilities add up to 1.

The **binomial probability function** gives each probability:

> P(X = x) = (n choose x) · p^x · (1 − p)^(n − x),  for x = 0, 1, 2, …, n

Because the shots are independent, one particular order of x makes and n − x misses has probability p^x · (1 − p)^(n − x). The **binomial coefficient** (n choose x), usually written as n stacked above x inside one pair of parentheses, counts how many different orders have exactly x makes.

## A function that calls a function

Here is your code:

```js
let n = 10;   // the number of trials: free throws
let p = 0.7;  // the probability of success: making one

// Returns the number of ways to choose which k of the n trials are successes.
function choose(n, k) {
    return 1;
}

// Returns P(X = k), the probability of exactly k successes in n trials.
function binomialProbability(n, k, p) {
    return choose(n, k) * p ** k * (1 - p) ** (n - k);
}
```

```python
n = 10   # the number of trials: free throws
p = 0.7  # the probability of success: making one

# Returns the number of ways to choose which k of the n trials are successes.
def choose(n, k):
    return 1

# Returns P(X = k), the probability of exactly k successes in n trials.
def binomialProbability(n, k, p):
    return choose(n, k) * p ** k * (1 - p) ** (n - k)
```

- `n` and `p` describe the player: 10 shots, each made with probability 0.7.
- `binomialProbability` is the binomial probability function, already written for you. It uses k for the number of successes, and `**` raises a number to a power. It **calls** another function, `choose`, for the binomial coefficient, then multiplies by p^k · (1 − p)^(n − k).
- `choose` is yours to write. Right now it returns 1 for every k, as if there were only one order of makes and misses.
- The last line, `drawBinomial(n, p, binomialProbability)`, calls `binomialProbability` for every k from 0 to n and draws the answers as bars. It also simulates 10,000 sessions of n free throws, each shot made with probability p.

## Run it

Press the **Run** button.

The pink bars are your probability distribution: the bar over k is P(X = k), with its value on top. Each dashed amber mark is the **relative frequency** of simulated sessions with that many makes, an estimate of P(X = k). The marks jump around while only a few sessions are counted, then settle as the count reaches 10,000.

The dashed teal line marks the **mean** of X, μ_X = np, its long-run average outcome. The teal bracket reaches one **standard deviation**, σ_X = √(np(1 − p)), to each side: the typical distance of X from its mean over the long run.

Your bars sit far below the amber marks. With `choose` returning 1, each bar is the probability of just one order. For k = 7 that's 0.7^7 · 0.3^3 ≈ 0.002, while about 0.27 of the simulated sessions had 7 makes. The tallest pink bar is at 10: making all 10 is the most likely single order, since a make (0.7) is more likely than a miss (0.3).

The bottom row shows **Sum of P**, your **P(X = 7)**, the **Simulated** relative frequency of 7, and the **Mean** and **SD** of your bars, from μ_X = Σ xᵢ·P(xᵢ) and σ_X = √(Σ (xᵢ − μ_X)²·P(xᵢ)). Sum of P is 0.049, not 1, so your bars aren't a probability distribution yet. Their Mean, 0.46, and SD, 1.97, miss the teal marks.

## Step 1: Count the orders with a loop

To count the orders with k makes, pick which shots go in one at a time: n choices for the first, n − 1 for the second, and so on, k times. Each group of k shots gets picked in k × (k − 1) × … × 1 different orders, so divide by that. The loop does both at once: pass i multiplies by n − k + i, which runs through the same choices from n − k + 1 up to n, and divides by i.

Replace the `return` line inside `choose` with these lines:

```js
    let result = 1;
    for (let i = 1; i <= k; i++) {
        result = result * (n - k + i) / i;
    }
    return result;
```

```python
    result = 1
    for i in range(1, k + 1):
        result = result * (n - k + i) / i
    return result
```

The loop runs once for each i from 1 to k. `result` is an **accumulator**: each pass multiplies one more factor into it. It starts at 1, not 0, because multiplying by 0 would wipe out the product. For `choose(10, 7)`, `result` goes 1, 4, 10, 20, 35, 56, 84, 120.

Run it again.

**Look for:** the pink bars rise to meet the amber marks, so the rules of probability and the simulation now give the same distribution. **Sum of P** reads 1.000.

- P(X = 7) = 0.267: there are 120 orders, so it's 120 × 0.7^7 × 0.3^3. The simulation's relative frequency is about 0.27.
- **Mean** reads 7 and **SD** reads 1.45, the same as μ_X = np = 10 × 0.7 = 7 and σ_X = √(10 × 0.7 × 0.3) ≈ 1.45. For a binomial random variable, np and √(np(1 − p)) are shortcuts for the general formulas.
- The distribution is **skewed left**: the tail toward smaller values is longer.

## Step 2: A 50% shooter

Now try a player who makes half her free throws. In the `p` line, change `0.7` to `0.5`:

```js
let p = 0.5;  // the probability of success: making one
```

```python
p = 0.5  # the probability of success: making one
```

Run it again.

**Look for:** the distribution is **symmetric**, the left half a mirror image of the right half, centered at μ_X = np = 10 × 0.5 = 5. The tallest bar is P(X = 5) = 0.246, with P(X = 4) = P(X = 6) = 0.205 on either side, and σ_X = √(10 × 0.5 × 0.5) ≈ 1.58.

With p = 0.5, every order of 10 shots has the same probability, 0.5^10 = 1/1,024. So each bar is just choose(10, k) ÷ 1,024, and the bars have the shape of your `choose` numbers: `choose(10, 5)` = 252 is the largest, and `choose(10, 4)` = `choose(10, 6)` = 210.

## Step 3: Shoot 50 free throws

In the `n` line, change `10` to `50`:

```js
let n = 50;   // the number of trials: free throws
```

```python
n = 50   # the number of trials: free throws
```

Run it again.

**Look for:** the bars are centered at μ_X = np = 50 × 0.5 = 25, with σ_X = √(50 × 0.5 × 0.5) ≈ 3.54.

- The tops of the bars trace a smooth, **unimodal**, symmetric mound.
- The tallest bar, P(X = 25) = 0.112, is less than half as tall as P(X = 5) was in Step 2: the total probability of 1 is spread over more values. The SD grew from 1.58 to 3.54, so with more shots, the number made varies more.
- Compare a **normal distribution**: a continuous, unimodal, bell-shaped, symmetric curve that models a **continuous random variable**, one that can take on any value within an interval. X is still discrete: it can only be a whole number from 0 to 50, so its distribution is a set of separate bars.

## Check your understanding

<Question>
With 10 shots, `choose(10, 7)` is 120. What does 120 count?
- [ ] The number of sessions out of 1,000 with exactly 7 makes
- [x] The number of different orders of makes and misses with exactly 7 makes
- [ ] The number of free throws she needs to shoot to make 7
> Each order, like 7 makes followed by 3 misses, has probability 0.7^7 × 0.3^3. There are 120 of them, so P(X = 7) = 120 × 0.7^7 × 0.3^3 ≈ 0.267.
</Question>

<Question>
For n = 10 and p = 0.7, P(X = 9) = 0.121 and P(X = 10) = 0.028. What is the probability that she makes at least 9 of her 10 free throws?
- [ ] 0.028
- [ ] 0.121
- [x] 0.149
- [ ] 0.851
> "At least 9" means 9 or 10. She can't make exactly 9 and exactly 10 in the same session, so add: 0.121 + 0.028 = 0.149. The complement, P(X ≤ 8), is 1 − 0.149 = 0.851.
</Question>

<Question>
For n = 10 and p = 0.7, μ_X = 7. What does that mean in context?
- [ ] She makes exactly 7 in every session of 10 free throws
- [x] Over many sessions of 10 free throws, she makes 7 per session on average
- [ ] She makes 7 in more than half of her sessions
> The mean is the long-run average outcome: over many sessions, the numbers she makes average out to 7. P(X = 7) is only 0.267, so most sessions don't have exactly 7 makes.
</Question>

## Wrap up

You wrote `choose`, a function whose for loop builds up a product in an accumulator, and `binomialProbability` called it for the binomial coefficient in P(X = x) = (n choose x) · p^x · (1 − p)^(n − x). Once `choose` counted every order, the probabilities added up to 1 and matched the relative frequencies from 10,000 simulated sessions. The mean μ_X = np and standard deviation σ_X = √(np(1 − p)) gave the center and spread: with p = 0.5 the distribution was symmetric about np, and with 50 trials it spread into a smooth mound.

Next, you'll use simulation to see how a statistic varies from one random sample to the next.
