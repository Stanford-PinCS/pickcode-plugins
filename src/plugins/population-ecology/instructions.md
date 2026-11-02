# Population Growth Simulation

Let's use what we know to visualize the exponential population growth model we've been talking about! You'll watch a population of organisms grow day by day. Along the way you'll practice **variables** and **functions that return values**.

Click **Next** to continue.

## How populations grow

Two things shape how a population changes: how big it is at the start, and how fast it grows. The per capita growth rate *r* is how much each organism adds to the population (births minus deaths) over time.

In **exponential growth**, the population grows in proportion to its own size. The bigger it gets, the more organisms are added each day:

> N(t) = N₀ · e^(r·t)

Here N₀ is the starting population, *r* is the growth rate, and t is the number of days.

## Returning values from a function

Your code is one **function**, `getPopulationParameters`, a named block of code whose job is to set up your population:

```js
function getPopulationParameters() {
    let initialPopSize = 30;
    let growthRate = 0.5;

    return [initialPopSize, growthRate];
}
```

```python
def getPopulationParameters():
    initialPopSize = 30
    growthRate = 0.5

    return initialPopSize, growthRate
```

Inside it, two **variables** store values: `initialPopSize` is 30 organisms, and `growthRate` is the *r* of 0.5. The `return` line hands both values back, `initialPopSize` first and `growthRate` second. The order matters.

The last line, `simulatePopulation(getPopulationParameters)`, calls your function and grows that population for 10 days on the right.

## Run it

Press the **Run** button. The simulation takes about 20 seconds, two seconds per day.

On the left, a pink line with pink dots graphs **Population** against **Day**. The amber label in the corner shows r = 0.5. On the right, a box shows the organisms moving around. Pink dots are existing organisms and teal dots are newly born.

The bottom row shows **Day**, **Population**, **Initial Size**, and **Growth Rate**.

The curve starts slow, then gets steeper and steeper. That's an exponential growth curve. By day 10 the population is about 4,452.

## Step 1: Speed up growth

Inside `getPopulationParameters`, change the value of `growthRate` from `0.5` to `1.2`:

```js
    let growthRate = 1.2;
```

```python
    growthRate = 1.2
```

Run it again and let it finish all 10 days.

**Look for:** the curve shoots up much more steeply. By day 10, **Population** is in the millions. The box can't fit them all, so it shows 10,000 of them.

## Step 2: Slow down growth

Change `growthRate` again, this time to `0.1`:

```js
    let growthRate = 0.1;
```

```python
    growthRate = 0.1
```

Run it again and let it finish.

**Look for:** the line rises gently, ending at only about 82. It's still exponential growth, just much less dramatic.

## Step 3: Make the population shrink

Before you run it, predict what a negative growth rate will do.

Then change `growthRate` to `-0.2`:

```js
    let growthRate = -0.2;
```

```python
    growthRate = -0.2
```

Run it again and let it finish.

**Look for:** the curve slopes down. The population drops to about 4 by day 10, because deaths are outpacing births.

## Step 4: Model an endangered species

A species starts with 200 organisms and has a growth rate of -0.3.

Change both variables: `initialPopSize` to `200` and `growthRate` to `-0.3`:

```js
    let initialPopSize = 200;
    let growthRate = -0.3;
```

```python
    initialPopSize = 200
    growthRate = -0.3
```

Run it again and let it finish.

**Look for:** **Initial Size** shows 200. The curve drops quickly at first, then levels off. **Population** on day 10 is just 10.

## Check your understanding

<Question>
What does a negative `growthRate` mean for a population?
- [ ] It grows faster than a positive rate
- [ ] It stays the same size forever
- [x] Deaths outpace births, so it shrinks over time
> A negative growth rate means each organism adds less than nothing on average, so the population keeps getting smaller.
</Question>

<Question>
Why does order matter in the `return` line of `getPopulationParameters`?
- [ ] It doesn't matter; the simulation figures out which is which
- [x] The simulation reads the first value as the starting size and the second as the growth rate
- [ ] Only the last value gets returned
> Values returned together arrive in the same order they were listed. Swap them and the simulation would start with 0.5 organisms!
</Question>

## Wrap up

You modeled an endangered species: 200 organisms with a growth rate of -0.3 shrink to about 10 in just 10 days. You also saw that a large positive `growthRate` makes a population explode, and a small one makes it grow gently.

On the code side, you edited variables inside a function and saw how `return` hands their values back, in order.

Next, you'll add one more variable to the model: a limit on how large the population can get. That's where things get really interesting!
