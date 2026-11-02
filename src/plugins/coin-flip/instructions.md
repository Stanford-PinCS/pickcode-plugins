# Coin Flip Simulation

Flip a coin over and over and watch what share of the flips land heads. You'll see that share settle down as you add more flips, which is called the **Law of Large Numbers**. Along the way you'll practice using **variables** and writing a **function that returns a value**.

Click **Next** to continue.

## Why a fair coin evens out

A fair coin has a 1 in 2 chance of landing heads, so the expected share of heads is `0.5`.

That doesn't mean 10 flips give exactly 5 heads. A few flips can come out lopsided just by luck. The **Law of Large Numbers** says that the more times you repeat a random event, the closer the share you measure gets to the true chance:

> heads ÷ total flips → the true chance of heads, as the number of flips grows

## Flipping with a function

<Python>
`import random` at the top loads the tools for making random numbers.
</Python>

Your code has a **variable**, a name that stores a value:

```js
let totalFlips = 10;
```

```python
totalFlips = 10
```

Next comes a **function**, a named block of code that does one job. `return` hands its answer back:

```js
function flipCoin() {
    if (Math.random() < 0.5) {
        return "H";
    }
    return "T";
}
```

```python
def flipCoin():
    if random.random() < 0.5:
        return "H"
    return "T"
```

<JavaScript>`Math.random()`</JavaScript><Python>`random.random()`</Python> gives a random decimal from 0 up to 1. Below `0.5` means heads, so `flipCoin` returns `"H"`. Otherwise it returns `"T"`.

The last line, `flipCoins(totalFlips, flipCoin)`, flips your coin `totalFlips` times and graphs the share of heads on the right.

## Run it

Press the **Run** button.

A pink line draws itself from left to right. Each point is the share of heads after that many flips. The dashed amber line at `0.5` is what a fair coin should give.

With only 10 flips the pink line jumps around a lot and may end far from the dashed line.

The bottom row shows **Total Flips**, **Final Proportion** (the share of heads after the last flip), **Target**, and **Error** (how far Final Proportion is from Target).

## Step 1: Flip 100 coins

Change the value of `totalFlips` from `10` to `100`:

```js
let totalFlips = 100;
```

```python
totalFlips = 100
```

Run it again.

**Look for:** **Total Flips** reads `100`. The pink line still jumps at the start, but by the end it stays closer to the dashed line. Compare the **Error** to your 10-flip run.

## Step 2: Flip 10000 coins

Change `totalFlips` again, this time to `10000`:

```js
let totalFlips = 10000;
```

```python
totalFlips = 10000
```

Run it again. Try it two or three times.

**Look for:** the pink line flattens out and hugs the dashed line at `0.5`. **Error** is usually below `0.01`. Each run is random, but with this many flips every run ends up close to `0.5`.

## Step 3: Make a trick coin

A trick coin lands heads more often than tails. Inside `flipCoin`, change the `0.5` in the `if` line to `0.7`:

```js
    if (Math.random() < 0.7) {
```

```python
    if random.random() < 0.7:
```

Now `flipCoin` returns `"H"` about 70% of the time. Keep `totalFlips` at `10000`.

Run it again.

**Look for:** the pink line settles near `0.7`, well above the dashed line. The dashed line still shows `0.5` because it marks a fair coin. **Error** is now about `0.2`.

## Check your understanding

<Question>
What happens to the pink line as you add more flips?
- [ ] It keeps jumping around just as much
- [x] It settles closer and closer to the coin's true chance of heads
- [ ] It climbs steadily toward 1
> Each new flip is averaged in with all the flips before it, so it moves the share less and less.
</Question>

<Question>
With the trick coin, why did the line settle near `0.7` instead of the dashed line?
- [ ] 10000 flips is not enough flips
- [ ] The dashed line is in the wrong place
- [x] `flipCoin` now returns `"H"` 70% of the time, so 0.7 is the true chance
> The Law of Large Numbers pulls the measured share toward the coin's real chance, whatever that chance is.
</Question>

## Wrap up

You flipped a trick coin 10000 times and watched the share of heads settle at `0.7`, its true chance. That's the **Law of Large Numbers**: many trials average out to the real probability.

On the code side, you changed a variable (`totalFlips`) and edited a function's logic so it returns a different answer (`flipCoin`).

Next, try the dice roll simulation to see the same idea with more than two outcomes.
