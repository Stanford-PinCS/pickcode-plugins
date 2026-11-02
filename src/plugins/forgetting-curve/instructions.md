# The Forgetting Curve

Learn a list of new words today, and by next week most of them are gone, unless you review. You'll watch your memory fade day by day, then plan review days to keep it strong. Along the way you'll practice **functions that return values** and **lists**.

Click **Next** to continue.

## Why you forget, and how reviews help

Hermann Ebbinghaus memorized lists of nonsense syllables and tested himself over days. He found the **forgetting curve**: you forget fastest right after learning, then more slowly. A simple model of it:

> retention = e^(−days since review ÷ stability)

**Retention** is the share of the words you still remember. **Stability** is how long the memory lasts. Right after you learn the words, it's 2 days.

Each review brings retention back to 100% and makes stability bigger, and a review helps more when you had already forgotten some. So reviews spread out over time beat the same reviews crammed together. That's the **spacing effect**: **distributed practice** beats **massed practice** (cramming).

## A function that returns your memory

Here is your code:

```js
let reviewDays = [];      // days you study the list again
let stabilityBoost = 2;   // how much each review strengthens the memory

// Returns the share of the words you still remember, from 0 to 1.
function retention(daysSinceReview, stability) {
    return Math.exp(-daysSinceReview / stability);
}

// Follow your memory day by day, then draw the forgetting curve.
trackMemory(reviewDays, stabilityBoost, retention);
```

```python
import math  # gives you math.exp, "e to the power of"

reviewDays = []      # days you study the list again
stabilityBoost = 2   # how much each review strengthens the memory

# Returns the share of the words you still remember, from 0 to 1.
def retention(daysSinceReview, stability):
    return math.exp(-daysSinceReview / stability)

# Follow your memory day by day, then draw the forgetting curve.
trackMemory(reviewDays, stabilityBoost, retention)
```

- `reviewDays` is a **list**: values in order, inside square brackets. `[]` is empty, so you never review.
- `stabilityBoost` sets how much each review helps.
- `retention` takes two inputs and **returns** one number: the forgetting-curve equation. <JavaScript>`Math.exp`</JavaScript><Python>`math.exp`</Python> means "e to the power of".
- `trackMemory(reviewDays, stabilityBoost, retention)` uses your `retention` function to find the height of the curve at each moment over 30 days, and draws it on the right.

## Run it

Press the **Run** button.

A pink curve starts at 100% on day 0 and draws itself day by day. The dashed gray line marks today. The dashed amber line at 50% is the **Remembered** line. Under the chart, a calendar strip has one square per day; teal squares are study days (day 0 is when you first learn the words), and the outlined square is today.

The bottom row shows **Day**, **Retention**, **Reviews**, and **Days Remembered** (days that started at or above 50%).

With an empty `reviewDays`, the curve drops below the line on day 2 and ends near 0%. **Days Remembered** ends at `1 / 30`.

## Step 1: Cram your reviews

Change the empty list in `reviewDays` to four days in a row:

```js
let reviewDays = [1, 2, 3, 4];      // days you study the list again
```

```python
reviewDays = [1, 2, 3, 4]      # days you study the list again
```

Run it again.

**Look for:** four teal lines in a row, each jumping the curve back to 100%. After the last review, it slides below the dashed line around day 11 and ends near 6%. **Days Remembered** is only `10 / 30`.

## Step 2: Space out your reviews

Change `reviewDays` again. It's still four reviews, but each gap is twice as long as the one before:

```js
let reviewDays = [1, 3, 7, 15];      // days you study the list again
```

```python
reviewDays = [1, 3, 7, 15]      # days you study the list again
```

Run it again.

**Look for:** the curve never drops below the dashed line. After each review it falls more slowly, because stability keeps growing. Retention ends near 54%, and **Days Remembered** is `30 / 30`. Same number of reviews as Step 1, much better memory: the spacing effect.

## Step 3: Change how much a review helps

Keep `reviewDays` as `[1, 3, 7, 15]`. Change the `2` in `stabilityBoost` to `1`. Run it again. Then change it to `4` and run it again.

**Look for:** with `1`, each review helps less, so the curve dips below the line by day 3 and **Days Remembered** falls to `15 / 30`. With `4`, the curve stays high and ends near 75%. Studying in a way that makes reviews stick better (like quizzing yourself) is like a bigger `stabilityBoost`.

When you're done, change `stabilityBoost` back to `2`.

## Check your understanding

<Question>
According to the forgetting curve, when do you forget the most?
- [x] Soon after you learn something
- [ ] About a week after you learn something
- [ ] Forgetting happens at the same speed the whole time
> The curve is steepest right after learning and flattens out over time.
</Question>

<Question>
Steps 1 and 2 both used four reviews. Why did Step 2 remember so much more?
- [ ] It used a bigger `stabilityBoost`
- [x] Spacing the reviews out let some forgetting happen first, so each review raised stability more
- [ ] Reviews on later days always count double
> Reviews right after studying barely help, because you hadn't forgotten much yet. Spaced reviews come after some forgetting, so each one strengthens the memory more.
</Question>

## Wrap up

You reviewed on days `[1, 3, 7, 15]` and kept your memory above the line all 30 days. Cramming the same four reviews into days 1 to 4 kept it for only 10 days. That's **distributed practice** beating **massed practice**.

In code, you stored your plan in a **list** and wrote it once in square brackets. Your `retention` function **returned** a number every time it was asked, and each answer became a point on the curve.

Next time you study for a test, try spacing out your reviews.
