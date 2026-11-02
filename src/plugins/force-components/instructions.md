# Force Components

A force that pushes at an angle is really doing two jobs at once: pushing sideways and pushing up. In this activity you'll split a force into those two parts, called its **components**, and you'll practice writing a function that takes inputs and returns a result.

Click **Next** to continue.

## Splitting a force into two parts

Any force at an angle can be split into an **x-component** (how much it pushes left or right) and a **y-component** (how much it pushes up or down). The force and its two components form a right triangle, with the force as the long side.

If a force has size *magnitude* and points at *angle*, measured counterclockwise from the +x axis:

- x-component = magnitude × cos(angle)
- y-component = magnitude × sin(angle)

Cosine gives the share of the force that points along x. Sine gives the share that points along y.

## A function that returns two numbers

Your code sets up one force:

```js
let magnitude = 100; // how strong the force is
let angle = 35;      // degrees, counterclockwise from the +x axis
```

A **function** takes inputs, called **parameters**, and hands back a result with `return`:

```js
function getComponents(magnitude, angle) {
  let xComponent = 0;
  let yComponent = 0;
  return [xComponent, yComponent];
}
```

`getComponents` has two parameters, `magnitude` and `angle`. It returns both parts at once, as `[xComponent, yComponent]`. Right now both are `0`; you'll replace them with the cosine and sine rules.

`drawForceComponents(magnitude, angle, getComponents)` draws the force, then calls `getComponents` and draws the two parts it returns.

## Run it

Press the **Run** button.

A pink arrow grows out of the origin and swings up to 35°, with a thin pink arc marking the angle. The legend in the top left lists **Force**, **x-component** and **y-component**.

No teal or amber arrows appear yet, because `getComponents` returned zero for both parts.

The bottom row shows **Magnitude** 100, **Angle** 35°, **x-component** 0 and **y-component** 0.

## Step 1: Find the x-component

Inside `getComponents`, replace the line `let xComponent = 0;` with these two lines:

```js
  let radians = angle * Math.PI / 180;
  let xComponent = magnitude * Math.cos(radians);
```

The first line converts `angle` from degrees to **radians**, because `Math.cos` measures angles in radians. Multiplying by `Math.PI / 180` does the conversion. The second line uses cosine to find the x part.

Run it again.

**Look for:** a teal arrow along the x-axis that stops right under the tip of the pink arrow. **x-component** reads 81.9.

## Step 2: Find the y-component

Right below that, replace the line `let yComponent = 0;` with:

```js
  let yComponent = magnitude * Math.sin(radians);
```

Run it again.

**Look for:** an amber arrow that starts at the end of the teal arrow and rises to the pink arrow's tip, closing the right triangle. **y-component** reads 57.4.

## Step 3: Point the force straight up

Near the top of your code, change `let angle = 35;` to `let angle = 90;`:

```js
let angle = 90;      // degrees, counterclockwise from the +x axis
```

Run it again.

**Look for:** the teal arrow disappears and **x-component** reads 0. A force pointing straight up has no sideways push, so all 100 goes into **y-component**.

## Step 4: Point the force up and to the left

Change `let angle = 90;` to `let angle = 150;`:

```js
let angle = 150;     // degrees, counterclockwise from the +x axis
```

Run it again.

**Look for:** the teal arrow now points left, and **x-component** is negative: -86.6. A negative component means the push is to the left (or down, for y). **y-component** is 50.

## Check your understanding

<Question>
At `angle = 45`, how do the two components compare?
- [ ] The x-component is twice as big
- [x] They are equal
- [ ] The y-component is zero
> At 45° the force points exactly halfway between the x-axis and the y-axis, so cos(45°) and sin(45°) are equal, about 70.7 each for a force of 100.
</Question>

<Question>
Why does your `getComponents` multiply `angle` by `Math.PI / 180` first?
- [ ] To make the force stronger
- [x] Because `Math.cos` and `Math.sin` expect radians, not degrees
- [ ] To turn a negative angle into a positive one
> 180 degrees equals π radians, so multiplying by `Math.PI / 180` converts degrees into the radians that `Math.cos` and `Math.sin` use.
</Question>

## Wrap up

Your finished `getComponents` converts the angle to radians, then uses cosine and sine to find the two parts:

```js
function getComponents(magnitude, angle) {
  let radians = angle * Math.PI / 180;
  let xComponent = magnitude * Math.cos(radians);
  let yComponent = magnitude * Math.sin(radians);
  return [xComponent, yComponent];
}
```

With `angle` at `150`, it splits the force of 100 into an x-component of -86.6 and a y-component of 50.

You wrote a function with parameters and a return value, and you used it to break a force into its parts. Splitting forces into components is how you add up forces that point in different directions, like the pushes on a ball rolling down a ramp.
