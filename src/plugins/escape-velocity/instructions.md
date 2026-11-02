# Escape Velocity

Why do rockets need to go so fast to reach space? There's one special speed, the **escape velocity**, that decides whether a launched object falls back or breaks free forever. You'll find it by experimenting, then write a **function** that **returns** `true` or `false` to predict it.

Click **Next** to continue.

## Why some launches never come back

A planet's gravity pulls on everything near it. Launch an object too slowly and gravity bends its path into a loop around the planet. That's a **bound orbit**.

Launch it fast enough and gravity can never pull it back. It **escapes**.

The dividing speed is the escape velocity:

**v = √(2 × mu / r)**

Here mu is how strong the planet's gravity is, and r is how far from the planet's center you start. Stronger gravity means you need more speed. Starting farther out means you need less.

Surprisingly, the object's mass isn't in the formula. A pebble and a rocket need the same speed.

## Answering true or false with a function

Your code starts with the launch speed:

```js
let v0 = 10;
```

Next comes your prediction function:

```js
function isEscaping(v, mu, r) {
    return v > 0;
}
```

`isEscaping` gets three parameters: the speed `v`, the planet's gravity strength `mu`, and the starting distance `r`. A comparison like `v > 0` is either `true` or `false`, and `return` sends that answer back. Right now `v > 0` is `true` for every launch, so it always predicts escaping.

The last line puts both to work:

```js
runSimulation(v0, isEscaping);
```

It launches the object at speed `v0`, asks `isEscaping` for a prediction, and shows on the right whether the prediction came true.

## Run it

Press the **Run** button.

A teal planet sits in the middle. The object traces an amber loop around it: a bound orbit.

The box on the right says **Your formula predicts: ESCAPING**. When the loop finishes, it adds **Prediction was wrong**.

The bottom row shows **Starting Speed** (**v₀ = 10**), **True Escape Velocity** (≈ 17.32) and **Outcome** (BOUND). Your `isEscaping` guessed escaping, but the object stayed bound.

## Step 1: Launch faster

Change the first line of your code so `v0` is `20`:

```js
let v0 = 20;
```

Run it again.

**Look for:** a pink path that curves away and flies off the edge. **Outcome** says ESCAPING, and the box says **Prediction confirmed**. Amber always means bound, and pink means escaping.

## Step 2: Find the threshold

Set `v0` to `15` and run it. Then try `17`, then `18`, running each one. Finish with this line:

```js
let v0 = 18;
```

**Look for:** at `15` and `17` the path swings so far out that it leaves the picture, but it stays amber and **Outcome** says BOUND. Given more room, it would come back. At `18` it turns pink and escapes.

The threshold is between 17 and 18, right where **True Escape Velocity** says: about 17.32.

## Step 3: Hardcode your guess

Fix `isEscaping` with the number you found. Inside `isEscaping`, replace `return v > 0;` with:

```js
return v > 17;
```

Typing a fixed number into your code like this is called **hardcoding**.

Run it again with `v0` still at `18`.

**Look for:** **Your formula predicts: ESCAPING** and **Prediction confirmed**. It looks fixed.

## Step 4: Test the edge

Change `v0` to `17.2`, just above your guess but below the true 17.32:

```js
let v0 = 17.2;
```

Run it again.

**Look for:** your function predicts ESCAPING, but the path stays amber (even as it swings out of the picture) and **Outcome** says BOUND. **Prediction was wrong.** A hardcoded guess breaks near the edge, and on any other planet it would be wrong everywhere.

## Step 5: Use the formula

Compute the threshold from `mu` and `r` instead. In code, a square root is written `Math.sqrt(...)`. Inside `isEscaping`, replace `return v > 17;` with:

```js
return v > Math.sqrt((2 * mu) / r);
```

The parentheses make `2 * mu` happen before the division.

Run it again with `v0` still at `17.2`.

**Look for:** **Your formula predicts: BOUND** and **Prediction confirmed**. Now it's right for any speed, on any planet.

## Check your understanding

<Question>
What does `isEscaping` return for a speed below the escape velocity, once it uses the formula?
- [ ] `true`
- [x] `false`
- [ ] The escape velocity itself
> The comparison `v > Math.sqrt((2 * mu) / r)` is false when `v` is smaller than the threshold.
</Question>

<Question>
Why is `return v > 17` a weak prediction?
- [ ] `17` is much too big
- [x] It only roughly fits this one planet and fails near the real threshold
- [ ] Comparisons can't be returned from a function
> The real threshold is 17.32 here, and a different planet has a different one. The formula adjusts to `mu` and `r`.
</Question>

## Wrap up

You wrote `isEscaping`, a function that returns `true` or `false` by comparing `v` to the escape velocity `Math.sqrt((2 * mu) / r)`. You saw why a computed threshold beats a hardcoded one.

You also learned that escape speed depends only on the planet's gravity and your distance from it, not on the object's mass.

Space agencies use this exact formula to plan every launch that leaves Earth.
