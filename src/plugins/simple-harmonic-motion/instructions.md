# Simple Harmonic Motion

Hang a mass on a spring, pull it down, and let go: it bounces up and down in a steady rhythm. You'll write a **function** that returns the mass's weight, and see how weight and mass each change the way the spring moves.

Click **Next** to continue.

## How a spring sets the rhythm

A spring pulls back harder the more you stretch it. This is **Hooke's law**:

**weight = k × stretch**

Here k is the spring's stiffness. A heavier weight stretches the spring further before the spring pulls back just as hard. That resting spot is called **equilibrium**.

Pull the mass past equilibrium and it bounces around that spot. The time for one full bounce is the **period**. The period depends on the mass and the spring, not on gravity:

**period = 2π × √(mass / k)**

## A weight function with a parameter

Your code starts with a **function** that has one **parameter**, `mass`:

```js
function weight(mass) {
    return mass * 9.81;
}
```

`weight` sends back the force of gravity on `mass`, in newtons, using `return`. On Earth, gravity pulls each kilogram down with `9.81` newtons.

Next, a variable sets how heavy the mass is:

```js
let mass = 0.2; // kilograms
```

That's 0.2 kilograms, or 200 grams.

The last line hangs it on the spring:

```js
hangMass(mass, weight);
```

`hangMass` hangs your `mass` on a spring, uses your `weight` function to find how hard gravity pulls it down, and lets it bounce. Notice that `weight` has no parentheses here. You pass the function itself, so `hangMass` can call it.

## Run it

Press the **Run** button.

On the right, a block bounces on a spring. A dashed amber line marks **equilibrium**, where the mass would rest.

On the left, a curve draws the spring's stretch over 10 seconds. Its label reads **200 g, 1.96 N**, and the block is the same color as its curve.

The bottom row shows **Mass** (200 g), **Weight** (1.96 N), **Stretch** (0.157 m) and **Period** (0.81 s). The weight is `weight(0.2)`, which is 0.2 × 9.81.

## Step 1: Try a lighter mass

Change `mass` from `0.2` to `0.1`:

```js
let mass = 0.1; // kilograms
```

Run it again.

**Look for:** a new curve labeled **100 g, 0.98 N**. Its **Stretch** is 0.078 m, half as much, because the weight is half as much. Its **Period** drops to 0.58 s, so the wiggles are closer together. The **200 g** curve stays on the chart so you can compare.

## Step 2: Try a heavier mass

Change `mass` from `0.1` to `0.3`:

```js
let mass = 0.3; // kilograms
```

Run it again.

**Look for:** a new curve labeled **300 g, 2.94 N**, higher up. **Stretch** is 0.235 m and **Period** is 0.98 s. A heavier mass stretches the spring more and bounces more slowly.

## Step 3: Move the spring to the Moon

Keep `mass` at `0.3`. Gravity on the Moon is much weaker. Inside `weight`, replace `return mass * 9.81;` with:

```js
return mass * 1.62;
```

Run it again.

**Look for:** a new curve labeled **300 g, 0.49 N**, much lower. **Weight** drops to 0.49 N and **Stretch** drops to 0.039 m. But **Period** is still 0.98 s. Its wiggles line up with the **300 g, 2.94 N** curve from Step 2.

## Check your understanding

<Question>
You change `weight` so it returns `mass * 3.71` (gravity on Mars), and keep `mass` at `0.3`. What happens to the period?
- [ ] It gets longer, because the spring stretches more
- [x] It stays at 0.98 s, because the mass and spring haven't changed
- [ ] It gets shorter, because Mars gravity is weaker than Earth's
> Gravity only moves the equilibrium. The period depends on the mass and the spring's stiffness.
</Question>

<Question>
What does your `weight` function return?
- [ ] The mass, in kilograms
- [x] The force of gravity on the mass, in newtons
- [ ] How far the spring stretches, in metres
> `return mass * 1.62` multiplies the mass by the Moon's gravity. That product is a force. A bigger force stretches the spring further.
</Question>

## Wrap up

You wrote a `weight` function that takes `mass` as a parameter and returns a force. Your final version, `return mass * 1.62`, hung a 0.3 kg mass on the Moon. The spring stretched far less than on Earth, but it bounced with the same period.

Heavier masses stretch a spring more and bounce more slowly. Gravity only moves where the bouncing is centered. Clocks and car suspensions rely on this same steady rhythm.
