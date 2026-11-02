# Reaction Rates and Half-Life

In a reaction like A → B, molecules don't all react at once. Each one reacts at a random moment, yet together they follow a smooth, predictable curve. You'll write a function that uses a **random number** to decide whether one molecule reacts, then watch thousands of those choices add up. Modeling something real with random choices is called a **Monte Carlo simulation**.

Click **Next** to continue.

## How fast A turns into B

In a **first-order** reaction, the rate depends on how much A is left: rate = k[A]. The **rate constant** `k` is the chance that one A molecule reacts each second.

Because the rate shrinks as A gets used up, [A] follows the **integrated rate law**:

> [A] = [A]₀ · e^(−kt)

The **half-life** t½ is the time it takes for half of the A to react:

> t½ = 0.693 ÷ k

For a first-order reaction the half-life is **constant**. After one half-life, half the A is left. After two, a quarter. After three, an eighth.

## Deciding with a random number

Your code starts with three values: `numMolecules` A molecules, a rate constant `k` of 2% per second, and `numSteps`, the number of seconds to run.

Then comes the function that decides what one A molecule does in one second:

```js
function stepMolecule() {
    if (Math.random() < k) {
        return "B";   // this molecule reacted
    }
    return "A";       // still A this time
}
```

```python
def stepMolecule():
    if random.random() < k:
        return "B"   # this molecule reacted
    return "A"       # still A this time
```

<JavaScript>`Math.random()`</JavaScript><Python>`random.random()`</Python> gives a random decimal from 0 up to 1. It lands below `k` about 2% of the time, so the `if` returns `"B"` (reacted) about 2% of the time and `"A"` the rest.<Python> The `import random` line at the top is what lets you use `random.random()`.</Python>

The last line, `runSimulation(numMolecules, k, numSteps, stepMolecule)`, asks your `stepMolecule` about every A molecule, once each second, for `numSteps` seconds, and draws the results on the right.

## Run it

Press the **Run** button.

On the left, pink A molecules in a grid turn teal, a few each second, as they become B. Molecules that react in the step on screen get a dark outline. The caption under the grid shows which step you're on, like "Step 20 of 20".

On the right, a pink line shows how many A molecules are left, building second by second. The dashed amber curve is the integrated rate law.

The bottom row shows **Time**, **A Left**, **Measured t½**, and **Predicted t½** (0.693 ÷ k = 34.7 s). After 20 seconds only about a third of the molecules have reacted, so **Measured t½** is still a dash.

## Step 1: Run the reaction longer

Change the `numSteps` line to:

```js
let numSteps = 100;  // how many seconds to run
```

```python
numSteps = 100  # how many seconds to run
```

Run it again.

**Look for:** **Measured t½** fills in when A drops to 50. It usually lands within several seconds of the **Predicted t½** of 34.7 s. Amber markers appear at t½ and 2t½. At 2t½ about 25 molecules are left: half of a half.

## Step 2: Double the rate constant

Change the `k` line to:

```js
let k = 0.04;        // rate constant: chance one A molecule reacts each second
```

```python
k = 0.04        # rate constant: chance one A molecule reacts each second
```

Run it again, then press **Run** two more times.

**Look for:** the pink line drops twice as fast. **Predicted t½** is now 17.3 s, half of before, and the markers move left. A third marker, 3t½, appears where about one eighth of the A is left. Each run is a little different, because every molecule reacts at random: the pink line wiggles around the dashed curve, and **Measured t½** shifts by a few seconds.

## Step 3: Use many more molecules

Change the `numMolecules` line to:

```js
let numMolecules = 2500;
```

```python
numMolecules = 2500
```

Run it again, two or three times.

**Look for:** the grid fills with tiny molecules, and the pink line now hugs the dashed curve. **Measured t½** lands at 17 or 18 s almost every run. More molecules means less random noise. The half-life is still 17.3 s with 25 times more A, because a first-order half-life doesn't depend on how much you start with.

## Check your understanding

<Question>
A first-order reaction with a half-life of 10 s starts with 800 molecules of A. How many are left after 30 s?
- [ ] 400
- [ ] 200
- [x] 100
> 30 s is three half-lives: 800 → 400 → 200 → 100.
</Question>

<Question>
`k` is `0.04` and <JavaScript>`Math.random()`</JavaScript><Python>`random.random()`</Python> gives `0.01`. What does `stepMolecule` return?
- [x] `"B"`
- [ ] `"A"`
> 0.01 is less than 0.04, so the `if` is true and the molecule reacts.
</Question>

<Question>
Why did the pink line get smoother with 2500 molecules?
- [ ] Each molecule had a smaller chance of reacting
- [x] Random ups and downs average out when there are more molecules
- [ ] The rate constant `k` got bigger
> With thousands of molecules, the lucky and unlucky ones cancel out.
</Question>

## Wrap up

You simulated a first-order reaction molecule by molecule. A random chance `k` for each molecule produced the smooth curve [A] = [A]₀ · e^(−kt), with a constant half-life of 0.693 ÷ k that doesn't depend on how many molecules you start with.

On the code side, your `stepMolecule` function compared a random number with `k` in an `if` and returned `"B"` or `"A"`. Thousands of those small random choices added up to a predictable result.

Next, you'll see how temperature changes `k`, and with it how fast a reaction goes.
