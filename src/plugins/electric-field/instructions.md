# Electric Field Simulation

Every charged particle creates an invisible **electric field** around it — a push or pull felt by other charges nearby. Let's make that field visible.

## Place your first charge

Use `createParticle(x, y, q)` to add a charge. `x` and `y` are positions from 0 to 1, and `q` is the charge — positive or negative.

```js
createParticle(0.5, 0.5, 1);
```

Run it. A positive charge appears, with arrows showing the field pushing outward.

## Positive vs negative

Positive charges push the field **outward**; negative charges pull it **inward**. Try a negative one:

```js
createParticle(0.5, 0.5, -1);
```

Watch the arrows flip direction.

## Make a dipole

Place one positive and one negative charge side by side:

```js
createParticle(0.35, 0.5, 1);
createParticle(0.65, 0.5, -1);
```

Run it. See how the field lines curve from the positive charge to the negative one? That pattern is called a **dipole**.

## Experiment

Try your own arrangements:

- Two positive charges — how do their fields interact?
- Charges of different strengths, like `q = 2` vs `q = 1`
- Three or more charges in a row

Watch how the arrows change as you add each one.

## You did it

You placed charges and saw the electric field they create — arrows pointing away from positive charges and toward negative ones.

You built a dipole and watched fields combine when charges are near each other. The field is just the sum of every charge's push and pull at each point. On to the next section!
