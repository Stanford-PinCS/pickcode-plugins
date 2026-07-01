<Slide>
# Escape Velocity
### Can you break free from gravity?

<Step>
Have you ever wondered why rockets need to go so fast to reach space? It turns out there's a specific speed — called the **escape velocity** — that determines whether something stays in orbit or breaks free entirely.
</Step>
<Step>
In this module, you'll figure out what that speed is — first by experimenting, then by writing the formula yourself in code.
</Step>
<Step>
Click "Next" to get started.
</Step>
</Slide>

<Slide>
## Launch It

<Step>
Hit **Run**. You'll see an object launched from a planet at speed `v0 = 10`. Watch the animation — does it escape?
</Step>
<Step>
The object curves back around and stays in orbit. That's a **bound orbit** — it doesn't have enough speed to break free from the planet's gravity.
</Step>
<Step>
Notice the banner above the simulation: it says **"Your formula predicts: BOUND"**. That's what your `isEscaping` function returned for `v0 = 10`. After the animation, it tells you whether the prediction was confirmed.
</Step>
</Slide>

<Slide>
## Find the Escape Velocity

<Step>
Your first task: find the exact speed where the orbit switches from **bound** to **escaping**.

Change `v0` to a larger number and hit Run. Keep trying different values until the object flies off the screen instead of looping back.
</Step>
<Step>
Once you've found a value that escapes, try to narrow it down. Can you find the smallest whole number that escapes? What about one decimal place?
</Step>
<Step>
When you find the threshold, check the data panel — it shows the true escape velocity. How close did you get?
</Step>
</Slide>

<Slide>
## Your First Escape Check

<Step>
Now look at the `isEscaping` function in the code. Right now it says `return v > 0`, which means it always predicts ESCAPING — clearly wrong.

Since you just found the escape velocity experimentally, replace `0` with the number you found. For example, if you found that escape happens around 17, write:

```js
return v > 17;
```

Hit **Run**. Watch the prediction banner — does it predict the right outcome? Does "✓ Prediction confirmed!" appear after the animation?
</Step>
<Step>
Try it with a few different values of `v0` — one below your threshold, one above. The banner should correctly predict BOUND or ESCAPING each time.
</Step>
<Step>
But notice the data panel shows the *exact* escape velocity is around 17.32. A hardcoded number only works for this one specific planet setup.
</Step>
</Slide>

<Slide>
## A Different Planet

<Step>
What if we changed the planet? Imagine the planet had twice the gravity. The escape velocity would be different — your hardcoded `17` would predict the wrong outcome.
</Step>
<Step>
The `isEscaping` function already receives the planet's gravity as `mu` and the launch distance as `r`. We need to use those to compute the threshold instead of guessing — so the prediction is always right, for any planet.
</Step>
<Step>
Let's figure out the formula.
</Step>
</Slide>

<Slide>
## The Formula

<Step>
The escape velocity formula is:

**v_escape = √(2 × mu / r)**

This makes intuitive sense: stronger gravity (`mu`) means higher escape velocity. Being farther away (`r`) means lower escape velocity — you're already partly "out."
</Step>
<Step>
One surprising thing: the mass of the launched object doesn't appear anywhere. A pebble and a rocket need the exact same escape speed. Only the planet matters.
</Step>
</Slide>

<Slide>
## Square Roots in JavaScript

<Step>
In math we write √x. In JavaScript, we use `Math.sqrt(x)`.

Try it: `Math.sqrt(9)` gives `3`, and `Math.sqrt(25)` gives `5`.
</Step>
<Step>
So **√(2 × mu / r)** becomes:

```js
Math.sqrt((2 * mu) / r)
```

The parentheses around `2 * mu` make sure the multiplication happens before the division.
</Step>
</Slide>

<Slide>
## Write the Formula

<Step>
Replace your hardcoded number in `isEscaping` with the formula:

```js
function isEscaping(v, mu, r) {
  return v > Math.sqrt((2 * mu) / r);
}
```

Hit **Run**. Watch the prediction banner — does it still correctly predict the outcome?
</Step>
<Step>
Now try several different values of `v0`. The formula should correctly predict BOUND or ESCAPING every time, because it computes the exact threshold from `mu` and `r` rather than relying on a hardcoded guess.
</Step>
</Slide>

<Slide>
## Explore the Boundary

<Step>
Set `v0` to values just below and just above the escape velocity shown in the data panel (~17.32).

Try `v0 = 17`, then `v0 = 17.5`, then `v0 = 17.32`. Watch the prediction banner flip from BOUND to ESCAPING right at the threshold.
</Step>
<Step>
Notice the transition: a fraction of a unit of speed is the difference between an orbit that loops forever and one that escapes forever. Your `isEscaping` function is the exact condition that separates them.
</Step>
</Slide>

<Slide>
# Nice Work!

<Step>
You found the escape velocity experimentally, hardcoded it, tested its predictions, discovered why it's fragile, then replaced it with a formula that predicts correctly for any planet.
</Step>
<Step>
You also learned:
- How to use `Math.sqrt()` in JavaScript
- How to translate a physics formula into a function
- Why a computed threshold makes better predictions than a hardcoded number
</Step>
<Step>
You can move on to the next section now!
</Step>
</Slide>
