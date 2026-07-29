# Escape Velocity

Ever wondered why rockets need to go so fast to reach space? There's a specific speed — the **escape velocity** — that decides whether something stays in orbit or breaks free. You'll find it by experimenting, then write the formula yourself.

## Watch it orbit

Hit the **Run** button. An object launches from the planet at `v0 = 10`. Does it escape?
No, it curves back and stays in orbit — a _bound_ orbit. It doesn't have enough speed to break free.

## Find the threshold

Change `v0` to a larger number and hit **Run**. Keep trying until the object flies off instead of looping back.

## Find the threshold

Then narrow it down: what's the smallest whole number that escapes? One decimal place?

## Hardcode your guess

Look at `isEscaping`. It says `return v > 0`, so it always predicts ESCAPING which isn't an accurate predictor.
Replace `0` with the number you found by expirementing on the last step.

## Hardcode your guess

You should have typed: `return v > 17`

Run it. Does the prediction banner match the outcome now?

## Why hardcoding breaks

When we type an exact number like `17` in our code, that's called **hardcoding**. The exact escape velocity is about `17.32`, and it's only right for _this_ planet. A stronger planet would need a different number, and your `17` would be incorrect.

## Why hardcoding breaks

Hardcoding often does not account for all cases, so it's good practice to stay away from hardcoding information.

## The formula

For any planet, escape velocity is: **v = √(2 × mu / r)**. Stronger gravity (`mu`) causes higher escape velocity. Farther out (`r`) causes lower escape velocity. Surprisingly, the object's mass doesn't appear — a pebble and a rocket need the same speed.

## Square roots in code

In math we write √x. In JavaScript code it's `Math.sqrt(x)

So `Math.sqrt(9)` is `3`.

## Formula in code

So, the formula in JavaScript becomes:

```js
Math.sqrt((2 * mu) / r);
```

## Put it together

Replace your hardcoded number with the formula:

`return v > Math.sqrt((2 * mu) / r);`

## Put it together

Run it, then try several values of `v0`. It predicts correctly every time — because it computes the exact threshold from `mu` and `r` instead of guessing.

## You did it!

You found the escape velocity by experiment, saw why hardcoding is fragile, and replaced it with a formula that works for any planet. You turned a physics formula into code and found why a computed threshold beats a hardcoded guess!
