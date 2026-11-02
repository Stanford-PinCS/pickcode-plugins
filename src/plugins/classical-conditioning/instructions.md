# Classical Conditioning

Ivan Pavlov rang a bell right before feeding his dogs. After enough pairings, the dogs drooled at the bell alone. You'll train a dog the same way and watch its learning curve grow, trial by trial. Along the way you'll write a **function** that returns a new value, and give its **if statement** an `else`.

Click **Next** to continue.

## How a dog learns a bell

At first the bell is a **neutral stimulus (NS)**: it means nothing to the dog. Food is an **unconditioned stimulus (UCS)**: it makes the dog drool without any learning. That drool is the **unconditioned response (UCR)**.

Pair the bell with food again and again, and the bell becomes a **conditioned stimulus (CS)**. Drooling at the bell is now a **conditioned response (CR)**. Building that link is **acquisition**.

Each pairing closes part of the gap between how strong the link is and the most it can be, 100:

> new strength = strength + learningRate × (100 − strength)

## Updating strength with a function

Your code starts with three numbers:

<JavaScript>

```js
let learningRate = 0.3;
let numPairedTrials = 5;    // bell, then food
let numBellOnlyTrials = 0;  // bell, no food
```

</JavaScript>
<Python>

```python
learningRate = 0.3
numPairedTrials = 5    # bell, then food
numBellOnlyTrials = 0  # bell, no food
```

</Python>

`learningRate` is how much of the gap one pairing closes. Next, `updateStrength` gets the `strength` so far and `foodPresent`, which is <JavaScript>`true`</JavaScript><Python>`True`</Python> when food comes. Its `if` applies the learning rule from the last page, then it returns the new `strength`:

<JavaScript>

```js
    if (foodPresent) {
        strength = strength + learningRate * (100 - strength);
    }
    return strength;
```

</JavaScript>
<Python>

```python
    if foodPresent:
        strength = strength + learningRate * (100 - strength)
    return strength
```

</Python>

The last line, `trainDog(numPairedTrials, numBellOnlyTrials, updateStrength)`, plays the paired trials, then the bell-only trials. Each trial, it calls `updateStrength` with the strength from the trial before (starting at `0`) and draws what comes back.

## Run it

Press the **Run** button.

On the right, a purple bell rings, the dog drools teal drops, and amber food lands in the bowl. The teal tube shows how much the dog drools at the bell on that trial, and the words above say which trial is playing.

On the left, a pink learning curve gains one point per trial. The dashed gray line marks the trial playing now, and the dashed amber line labeled **Max 100** is the most the dog can learn.

The bottom row shows **Trial**, **Phase**, and **Strength**. After 5 trials, **Strength** is 83.2.

## Step 1: Pair the bell more times

Change the `numPairedTrials` line to:

<JavaScript>

```js
let numPairedTrials = 15;   // bell, then food
```

</JavaScript>
<Python>

```python
numPairedTrials = 15   # bell, then food
```

</Python>

Run it again.

**Look for:** the pink curve climbs fast at first, then bends and levels off just under the dashed amber line. Early pairings add a lot. Later ones add only a little, because the gap to 100 is small. **Strength** ends at 99.5.

## Step 2: Slow down learning

Change the `learningRate` line to:

<JavaScript>

```js
let learningRate = 0.1;
```

</JavaScript>
<Python>

```python
learningRate = 0.1
```

</Python>

Run it again.

**Look for:** the curve rises slowly and is still well below 100 after 15 trials. **Strength** ends at 79.4. A faint bell or boring food is harder to notice, and that slows learning the way a smaller learning rate does.

## Step 3: Ring the bell with no food

Change the `numBellOnlyTrials` line to:

<JavaScript>

```js
let numBellOnlyTrials = 10; // bell, no food
```

</JavaScript>
<Python>

```python
numBellOnlyTrials = 10 # bell, no food
```

</Python>

Run it again.

**Look for:** after trial 15 a gray band labeled "Bell only" appears, with hollow points. **Phase** says Extinction, but the curve stays flat and **Strength** never drops. When `foodPresent` is <JavaScript>`false`</JavaScript><Python>`False`</Python>, the code inside your `if` is skipped, so `strength` comes back unchanged.

## Step 4: Add the extinction branch

Inside `updateStrength`, replace the whole `if` with this version. Its `else` moves `strength` toward 0 when there's no food:

<JavaScript>

```js
    if (foodPresent) {
        strength = strength + learningRate * (100 - strength);
    } else {
        strength = strength + learningRate * (0 - strength);
    }
```

Keep `return strength;` right after it.

</JavaScript>
<Python>

```python
    if foodPresent:
        strength = strength + learningRate * (100 - strength)
    else:
        strength = strength + learningRate * (0 - strength)
```

Keep `return strength` right after it.

</Python>

Run it again.

**Look for:** after trial 15 the pink curve slopes down. **Strength** ends at 27.7. This is **extinction**: the bell stops predicting food, so the CR fades.

## Step 5: Speed up learning again

Change `learningRate` back:

<JavaScript>

```js
let learningRate = 0.3;
```

</JavaScript>
<Python>

```python
learningRate = 0.3
```

</Python>

Run it again.

**Look for:** the same `learningRate` now speeds up both parts. The curve races up near the dashed amber line, then drops quickly once the food stops. **Strength** ends at 2.8.

## Check your understanding

<Question>
In this experiment, what is the bell after acquisition?
- [ ] The unconditioned stimulus (UCS)
- [x] The conditioned stimulus (CS)
- [ ] The unconditioned response (UCR)
> The bell started as a neutral stimulus. Pairing it with food made it a conditioned stimulus that triggers drooling.
</Question>

<Question>
Why does the curve rise fast at first and then level off?
- [ ] The dog gets bored of the bell
- [x] Each trial closes part of the gap to 100, and the gap keeps shrinking
- [ ] `learningRate` goes down each trial
> `learningRate` stays the same, but it multiplies `100 - strength`. As `strength` grows, that gap shrinks, so each step up does too.
</Question>

## Wrap up

You trained a dog with 15 bell-and-food trials (**acquisition**), then rang the bell alone 10 times (**extinction**). The curve rose, leveled off near 100, then fell back toward 0.

In code, `updateStrength` takes the strength so far and returns the next one, and your `if` / `else` picks which rule to use.

Real dogs also show **spontaneous recovery**: after a rest, the CR comes back weakly. Next, try operant conditioning, where rewards follow actions.
