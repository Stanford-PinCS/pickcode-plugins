# Force Addition

When several forces push on one object, the object moves as if one single force, the **net force**, were pushing it. In this activity you'll find the net force by adding forces together, and you'll practice using a `for` loop to add up every item in a list.

Click **Next** to continue.

## Adding forces tip to tail

A force is a **vector**: it has a size and a direction. Here each force has an `x` part (left or right) and a `y` part (down or up).

To add forces, add their parts separately. The net `x` is every force's `x` added together, and the net `y` is every force's `y` added together.

You can also add forces by drawing them **tip to tail**: start each arrow where the last one ended. The net force is the single arrow from the start of that chain to its end. Both ways give the same answer.

## Adding up a list with a for loop

Your code starts with a list of three forces:

```js
let forces = [
  {x: 10, y: 10},
  {x: -15, y: -5},
  {x: -15, y: 5}
];
```

Each force has an `x` part and a `y` part. To add up a list, you start a total at zero, then add each item to it, one at a time. A `for` loop does that: it runs the same code once for every item in the list.

```js
function sumForces(forces) {
  let netForce = {x: 0, y: 0};
  // Add every force to netForce here.
  return netForce;
}
```

`sumForces` keeps two running totals in `netForce`, one for `x` and one for `y`, both starting at 0. It returns `netForce`, but nothing adds to it yet, so it always returns zero.

`drawForces(forces, sumForces)` draws each force, then calls `sumForces` and draws the net force it returns.

## Run it

Press the **Run** button.

Three teal arrows grow out of the origin, one at a time. Then faded copies of them slide into a tip-to-tail chain that ends at the point (-20, 10).

No pink net-force arrow appears, because `sumForces` returned `{x: 0, y: 0}`, an arrow with no length.

The bottom row shows **Forces** 3, and **Net x**, **Net y** and **Net size** all 0.

## Step 1: Add up the x parts

Inside `sumForces`, replace the comment line `// Add every force to netForce here.` with this loop:

```js
  for (let force of forces) {
    netForce.x = netForce.x + force.x;
  }
```

Each time through the loop, `force` is the next force in the list, and its `x` is added to the total.

Run it again.

**Look for:** a pink arrow pointing left along the x-axis. **Net x** is now -20, because 10 + (-15) + (-15) = -20. **Net y** is still 0.

## Step 2: Add up the y parts

Inside the loop, right after the line `netForce.x = netForce.x + force.x;`, add:

```js
    netForce.y = netForce.y + force.y;
```

Run it again.

**Look for:** the pink arrow now ends exactly where the tip-to-tail chain ends, at (-20, 10). **Net y** is 10 and **Net size** is 22.4. Adding the parts and drawing tip to tail give the same answer.

## Step 3: Balance the forces

Add a fourth force to the end of `forces` that undoes the other three. Put a comma after the last force, `{x: -15, y: 5}`, then add this line right below it, before the `];`:

```js
  {x: 20, y: -10}
```

Run it again.

**Look for:** the chain of four arrows loops back to the origin, and the pink arrow disappears. **Net size** is 0. When the forces cancel out, they are **balanced**, and the object doesn't speed up in any direction.

## Step 4: Unbalance them

Change the fourth force from `{x: 20, y: -10}` to:

```js
  {x: 20, y: 0}
```

Run it again.

**Look for:** the pink arrow points straight up. **Net x** is 0 and **Net y** is 10. The leftover net force is exactly the `y: -10` you took away from the fourth force.

## Check your understanding

<Question>
Two forces act on a box: `{x: 5, y: 0}` and `{x: -5, y: 0}`. What is the net force?
- [ ] `{x: 10, y: 0}`
- [x] `{x: 0, y: 0}`
- [ ] `{x: -10, y: 0}`
> 5 + (-5) = 0, so the two pushes cancel. The forces are balanced.
</Question>

<Question>
Why does `sumForces` start `netForce` at `{x: 0, y: 0}` before the loop?
- [ ] So the arrow starts at the origin
- [x] So the running totals start from nothing before any force is added
- [ ] Because a `for` loop only works with zero
> A running total has to start at zero. If it started at 5, every answer would be 5 too big.
</Question>

## Wrap up

You wrote `sumForces`, which loops over every force in the list and adds up the `x` parts and the `y` parts into one net force. With the fourth force set to `{x: 20, y: 0}`, it finds a net force of `{x: 0, y: 10}`, pointing straight up.

You saw that adding parts and drawing tip to tail agree, and that balanced forces add up to zero. Engineers use this same adding-up to check that every force on a bridge or a building balances out.
