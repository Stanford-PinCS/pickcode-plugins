# Air Resistance

A tennis ball hit into the wind doesn't fly the way a math-class parabola says it should. You'll predict a ball's flight, one small time step at a time, and find out how much the air changes it. You'll practice writing a **function** that **returns** an answer, using another function's answer.

Click **Next** to continue.

## Why the air slows a ball down

Two things change a flying ball's velocity:

- **Gravity** pulls it down, speeding up its fall by 9.81 m/s every second.
- **Air resistance**, or **drag**, pushes against its motion through the air. The faster the ball moves through the air, the harder the push.

Here the wind also blows toward the ball at 12 m/s. This **headwind** makes the ball rush through the air even faster than it moves over the ground.

To predict a flight, you chop it into short time steps. Each step moves the ball using its velocity, then changes the velocity using its **acceleration**.

## Functions that return an answer

A function takes inputs and hands back an answer with `return`. Both of your functions get the ball's `velocity` and return an object with an `x` part and a `y` part.

```js
function getDrag(velocity) {
    let airX = velocity.x + 12;
    let airY = velocity.y;
    let airSpeed = Math.sqrt(airX * airX + airY * airY);
    let strength = 0.0211 * airSpeed;
    return { x: -strength * airX, y: -strength * airY };
}
```

`airX` and `airY` are the ball's speed through the air; the `+ 12` is the headwind. `airSpeed` combines them. `strength` grows with `airSpeed` (`0.0211` suits a tennis ball), and the minus signs make the push point against the motion.

```js
function getAcceleration(velocity) {
    let gravity = 9.81;
    return { x: 0, y: -gravity };
}
```

`getAcceleration` returns gravity only: `x` is `0`, and `y` is `-gravity` (negative means down). Nothing calls `getDrag` yet.

`timestep`, set to `0.05`, is how many seconds each step covers. `launchBall(getAcceleration, timestep)` calls your `getAcceleration` at every step to move your predicted ball, then draws the real flight next to it.

## Run it

Press the **Run** button.

Amber dots trace your prediction: a huge arc that runs far off to the right. Then a pink line draws the actual flight: a short, lopsided arc near the start.

The bottom row shows **Predicted Landing** (about 255.8 m), **Actual Landing** (25.1 m) and **Status**, which reads Complete when the ball lands.

Your prediction lands about ten times too far, because nothing in `getAcceleration` slows the ball down.

## Step 1: Add air resistance

Inside `getAcceleration`, replace the line `return { x: 0, y: -gravity };` with these two lines:

```js
    let drag = getDrag(velocity);
    return { x: drag.x, y: drag.y - gravity };
```

Now your function asks `getDrag` for the air's push and adds gravity's pull to it.

Run it again.

**Look for:** the view is much closer now, and the amber dots sit almost on the pink line. **Predicted Landing** is about 24.8 m, close to the **Actual Landing** of 25.1 m.

## Step 2: Take bigger steps

At the top of your code, change `let timestep = 0.05;` to:

```js
let timestep = 0.5;
```

Run it again.

**Look for:** only a few amber dots, spread far apart, that come down before the pink line does. **Predicted Landing** drops to about 18.5 m. Each big step pretends the velocity stays the same for half a second, so the errors pile up.

## Step 3: Take smaller steps

Change `let timestep = 0.5;` to:

```js
let timestep = 0.01;
```

Run it again.

**Look for:** the dots are so close they look like a dotted line on top of the pink one. **Predicted Landing** matches **Actual Landing** at 25.1 m. Smaller steps take more work, but they give a better prediction.

## Check your understanding

<Question>
In `getDrag`, why does `airX` add 12 to `velocity.x`?
- [x] The wind blows toward the ball, so the ball moves through the air 12 m/s faster
- [ ] The ball speeds up by 12 m/s every second
- [ ] It makes gravity stronger
> Drag depends on how fast the ball moves through the air, and a headwind adds to that speed.
</Question>

<Question>
What happens to the prediction when you make `timestep` bigger?
- [ ] It gets more accurate
- [x] It gets less accurate, because each step assumes the velocity doesn't change
- [ ] Nothing changes
> The velocity really changes all the time. Big steps ignore those changes for longer.
</Question>

## Wrap up

You made `getAcceleration` call `getDrag` and return drag plus gravity pulling down. `launchBall` called your function at every time step, and a `timestep` of `0.01` made your prediction match the real flight.

You saw that air resistance can shrink a flight to a tenth of its no-air distance.

Weather forecasts, video games and rocket launches all predict motion with this same step-by-step method.
