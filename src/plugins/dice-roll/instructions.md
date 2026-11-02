# Dice Roll Simulation

Roll a die over and over and watch how often each face comes up. With enough rolls, every face of a fair die evens out, which is the **Law of Large Numbers**. Then you'll change your die-rolling **function** to roll two dice at once and discover a very different shape.

Click **Next** to continue.

## Why every face evens out

On a fair die with `numSides` sides, every face has the same chance of coming up:

> expected share for each face = 100% ÷ `numSides`

For a 6-sided die, that's about 16.7% per face. A handful of rolls can still look lopsided just by luck. The **Law of Large Numbers** says that the more rolls you make, the closer each face's share gets to its true chance.

## Rolling with a function

<Python>
`import random` at the top loads the tools for making random numbers.
</Python>

Two **variables** store your settings: `totalRolls` is how many times to roll, and `numSides` is how many sides the die has.

```js
let totalRolls = 10;
let numSides = 6;
```

```python
totalRolls = 10
numSides = 6
```

A **function** is a named block of code that does one job, and `return` hands its answer back. `rollDie` uses `numSides` to return a random face from 1 to `numSides`:

```js
function rollDie() {
    return Math.floor(Math.random() * numSides) + 1;
}
```

```python
def rollDie():
    return random.randint(1, numSides)
```

<JavaScript>
`Math.random() * numSides` gives a decimal from 0 up to `numSides`. `Math.floor` rounds it down to a whole number, and `+ 1` shifts the range to 1 through `numSides`.
</JavaScript>
<Python>
`random.randint(1, numSides)` picks a whole number from 1 through `numSides`.
</Python>

The last line, `rollDice(totalRolls, numSides, rollDie)`, rolls your die `totalRolls` times and draws a bar chart of how often each face came up.

## Run it

Press the **Run** button.

A bar chart appears with one bar per face, labeled 1 to 6 along the bottom. The rolls land one at a time, and the bar each roll hits gets outlined as it grows. The bars take turns being pink, teal, amber, and purple. The dashed amber line marks the expected share, about 16.7%.

With only 10 rolls, some bars stick up far above the dashed line and some may be empty.

The bottom row shows **Number of Sides**, **Rolls**, **Most Common** (the face with the tallest bar), and **Max Deviation** (how far the most lopsided bar is from the dashed line).

## Step 1: Roll 1000 times

Change the value of `totalRolls` from `10` to `1000`:

```js
let totalRolls = 1000;
```

```python
totalRolls = 1000
```

Run it again.

**Look for:** the bars are much closer to the dashed line. **Max Deviation** is far smaller than it was with 10 rolls.

## Step 2: Roll 10000 times

Change `totalRolls` again, this time to `10000`:

```js
let totalRolls = 10000;
```

```python
totalRolls = 10000
```

Run it again.

**Look for:** all six bars almost touch the dashed line. **Max Deviation** is usually under 1%. Which face is **Most Common** now changes from run to run, because the faces are nearly tied.

## Step 3: Use a 12-sided die

Change the value of `numSides` from `6` to `12`, and keep `totalRolls` at `10000`:

```js
let numSides = 12;
```

```python
numSides = 12
```

Run it again.

**Look for:** 12 bars, and the dashed line drops to about 8.3%, because 100% ÷ 12 ≈ 8.3%. The bars are flat again: every face is equally likely.

## Step 4: Roll two dice and add them

Now make `rollDie` roll two 6-sided dice and return their total. Keep `numSides` at `12`, since the biggest total is 6 + 6 = 12.

Replace the comment above `rollDie` and the whole function with this:

```js
// Rolls two 6-sided dice, then returns their total (2 to 12).
function rollDie() {
    let first = Math.floor(Math.random() * 6) + 1;
    let second = Math.floor(Math.random() * 6) + 1;
    return first + second;
}
```

```python
# Rolls two 6-sided dice, then returns their total (2 to 12).
def rollDie():
    first = random.randint(1, 6)
    second = random.randint(1, 6)
    return first + second
```

Run it again.

**Look for:** a triangle instead of flat bars. Face 7 is tallest, so **Most Common** shows Face 7. The bar for 1 is empty, because two dice can never total 1.

## Check your understanding

<Question>
Why did the bars get closer to the dashed line when you went from 10 rolls to 10000?
- [ ] The die became more fair
- [x] With more rolls, lucky streaks average out and each face's share gets close to its true chance
- [ ] The dashed line moved to match the bars
> The die never changed. You just rolled enough times to see its true chances.
</Question>

<Question>
Why is 7 the most common total of two dice?
- [ ] The number 7 is lucky
- [ ] Each die lands on 7 more often
- [x] More pairs add up to 7 than to any other total
> Six pairs make 7 (1+6, 2+5, 3+4, 4+3, 5+2, 6+1). Only one pair makes 2, and only one makes 12.
</Question>

## Wrap up

You rolled thousands of dice and watched every face of a fair die even out toward 100% ÷ `numSides`. That's the **Law of Large Numbers**. Then you changed `rollDie` to add two dice together. With 10000 rolls, the chart showed their true shape: a triangle peaking at 7.

On the code side, you changed variables and rewrote a function so it returns a new kind of answer.

This same idea, adding up random results, is why so many things in science follow a bell-shaped curve.
