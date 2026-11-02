# Schedules of Reinforcement

B. F. Skinner put rats in a box with a lever. Pressing the lever could drop a food pellet. You'll decide *which* presses pay off and watch how that rule changes the rat's behavior. Along the way you'll practice **if statements**, the **modulo operator** `%`, and **random numbers**.

Click **Next** to continue.

## How rewards shape behavior

In **operant conditioning**, a behavior followed by a reward (**positive reinforcement**) becomes more likely. Rewarding every response is **continuous reinforcement**. Rewarding only some is **partial reinforcement**, and it comes in four **schedules**:

- **Fixed ratio**: after every *n*th response (paid per 10 shirts sewn).
- **Variable ratio**: after an unpredictable number of responses (a slot machine).
- **Fixed interval**: for the first response after a set time (a quiz every Friday).
- **Variable interval**: for the first response after an unpredictable time (checking for new messages).

Ratio schedules count responses, so they produce fast responding. Your box counts lever presses, so you'll try the ratio schedules.

## Picking rewards with an if

Your function decides whether one press earns a pellet. `pressNumber` is 1 for the first press, 2 for the second, and so on:

<JavaScript>

```js
function shouldReward(pressNumber) {
    if (pressNumber % 1 === 0) {
        return true;
    }
    return false;
}
```

</JavaScript>
<Python>

```python
def shouldReward(pressNumber):
    if pressNumber % 1 == 0:
        return True
    return False
```

</Python>

`%` gives the remainder after dividing: `12 % 5` is `2`, and `10 % 5` is `0`. Every whole number divides evenly by 1, so `pressNumber % 1` is always `0`. The `if` is always true, and every press returns <JavaScript>`true`</JavaScript><Python>`True`</Python>: **continuous reinforcement**. The <JavaScript>`return false;`</JavaScript><Python>`return False`</Python> after the `if` only runs when the condition is false.

The last line of your code, `runSkinnerBox(shouldReward)`, puts a rat in the box on the right. A press pays off only when `shouldReward` says so.

## Run it

Press the **Run** button.

On the right, the rat presses the lever and amber pellets drop into the tray. The words above show which press the rat is on and whether the food is on.

On the left, the pink **cumulative record** climbs one step per press: steep means fast pressing, flat means none. Each amber tick marks a pellet. At 60 seconds the food runs out, shown by a gray band. The dashed gray line is the time now.

The bottom row shows **Time**, **Presses**, **Pellets**, and **Extinction Presses** (presses after the food stops). Expect about 30 pellets. Once the food stops, the line soon flattens, with only about 12 extinction presses.

## Step 1: Make it a fixed ratio

In the `if` line, change `pressNumber % 1` to `pressNumber % 5`:

<JavaScript>

```js
    if (pressNumber % 5 === 0) {
```

</JavaScript>
<Python>

```python
    if pressNumber % 5 == 0:
```

</Python>

Now only presses 5, 10, 15, and so on earn a pellet. Run it again.

**Look for:** a staircase. After each amber tick the line goes flat for a few seconds, then climbs steeply. That rest is the **post-reinforcement pause**: the next pellet is always 5 presses away, so the rat takes a break first. Expect about 9 pellets. When the food stops, the rat keeps pressing for a while: about 25 extinction presses.

## Step 2: Make it a variable ratio

A random number makes the reward unpredictable.<Python> First, add the line `import random` right after the two comment lines at the top of your code.</Python>

<JavaScript>Replace</JavaScript><Python>Then replace</Python> the whole `if` line with one that is true about 1 time in 5:

<JavaScript>

```js
    if (Math.random() < 1 / 5) {
```

</JavaScript>
<Python>

```python
    if random.random() < 1 / 5:
```

</Python>

<JavaScript>`Math.random()`</JavaScript><Python>`random.random()`</Python> gives a new number from 0 up to 1 on each press. Run it two or three times.

**Look for:** a steep, steady line with no pauses, and amber ticks at uneven spots. It's still about 1 pellet per 5 presses, but with no pausing the rat earns more (about 12). After the food stops, it keeps pressing longer than in Step 1, often 35 or more times.

## Step 3: Stretch the ratio

In the same line, change `1 / 5` to `1 / 10`:

<JavaScript>

```js
    if (Math.random() < 1 / 10) {
```

</JavaScript>
<Python>

```python
    if random.random() < 1 / 10:
```

</Python>

Now a press pays off about 1 time in 10. Run it again.

**Look for:** only about 6 pellets, yet the line stays steep and steady. When the food stops, the rat keeps pressing through most of the gray band, often 40 or more times. Long, uneven dry spells were normal before, so a dry spell now doesn't tell the rat the food is gone. That's why variable-ratio behavior is the hardest to extinguish.

## Check your understanding

<Question>
A slot machine pays out after an unpredictable number of pulls. Which schedule is that?
- [ ] Fixed ratio
- [x] Variable ratio
- [ ] Fixed interval
- [ ] Variable interval
> It counts pulls, and the number needed changes every time.
</Question>

<Question>
Why did the rat pause after each pellet in Step 1, but not in Step 2?
- [ ] It was full
- [x] In Step 1 the next pellet was always 5 presses away
- [ ] Step 2 gave fewer pellets
> A predictable wait gives the rat no reason to hurry right after a reward. In Step 2, any press might pay off.
</Question>

## Wrap up

You turned continuous reinforcement into a fixed-ratio schedule with `pressNumber % 5`, then into a variable-ratio schedule with <JavaScript>`Math.random()`</JavaScript><Python>`random.random()`</Python>. The variable ratio of about 1 in 10 gave the fewest pellets, yet the most steady, persistent pressing.

In code, your `if` decided which presses returned <JavaScript>`true`</JavaScript><Python>`True`</Python>, `%` picked every 5th press, and a random number made the pattern unpredictable. Look for these schedules in everyday life: games, apps, and jobs all use them.
