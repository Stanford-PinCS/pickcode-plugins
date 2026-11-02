# Planets

Build your own solar system and find out how a planet's distance from the sun changes how fast it goes around. You'll practice writing a **function** that takes an input and returns an answer, plus an **array** that holds several values.

Click **Next** to continue.

## Why far planets have longer years

Every planet travels around the sun on a path called an **orbit**. The time one trip takes is its **year**.

Planets close to the sun go around quickly. Mercury finishes a lap in 88 days. Planets far away go around slowly. Neptune takes 165 Earth years.

The sun's pull is weaker far away, and the path is longer too. So the farther out a planet is, the longer its year. This rule is part of **Kepler's third law**.

## An array of distances and a speed function

Your code starts with an **array**, a list of values in square brackets:

```js
let planetRadii = [500, 1000, 1500];
```

Each number in `planetRadii` is one planet's distance from the sun.

Next is a **function** with one **parameter**, `radius`:

```js
function orbitSpeed(radius) {
    return 10;
}
```

`orbitSpeed` gets one planet's distance and sends back how fast that planet goes around, using `return`. Right now it ignores `radius` and returns `10` for every planet.

The last line uses both:

```js
buildSolarSystem(planetRadii, orbitSpeed);
```

It puts one planet at each distance in `planetRadii` and asks `orbitSpeed` for each planet's speed. The first distance becomes **Planet 1**, the next **Planet 2**, and so on.

## Run it

Press the **Run** button.

An amber sun sits in the middle. Three planets circle it on thin rings: **Planet 1** (pink) closest in, **Planet 2** (teal), and **Planet 3** (amber) farthest out.

Because `orbitSpeed` gives every planet the same speed, they stay lined up like spokes on a spinning wheel. Real planets never do that.

The bottom row shows **Planets** (3), **Fastest** (**Tie**, since they all match) and **Farthest Out** (**Planet 3**).

## Step 1: Add a fourth planet

Add `2000` to the end of your `planetRadii` array, so the line reads:

```js
let planetRadii = [500, 1000, 1500, 2000];
```

Keep each distance at `2000` or less so it fits on the screen.

Run it again.

**Look for:** a purple **Planet 4** on the outermost ring. **Farthest Out** now says **Planet 4**. The planets are still lined up.

## Step 2: Slow down the far planets

Make `orbitSpeed` use its `radius` parameter. Inside `orbitSpeed`, replace `return 10;` with:

```js
return 10000 / radius;
```

Dividing by `radius` gives a smaller speed for a bigger distance. **Planet 1** at `500` gets `20`. **Planet 4** at `2000` gets only `5`.

Run it again.

**Look for:** the line of planets breaks apart. The inner planets pull ahead, and **Fastest** now says **Planet 1**.

## Step 3: Use Kepler's rule

Real planets slow down even more with distance. Kepler found the rule. Inside `orbitSpeed`, replace `return 10000 / radius;` with:

```js
return 10 * (1000 / radius) ** 1.5;
```

`**` means "to the power of." A planet at `1000` still gets `10`. A planet twice as far gets about `3.5`, almost three times slower.

Run it again.

**Look for:** **Planet 1** races around about eight times while **Planet 4** creeps through one lap.

## Check your understanding

<Question>
Before Step 2, why did all the planets stay lined up?
- [ ] The planets were too close together
- [x] `orbitSpeed` returned `10` for every radius, so they all went around at the same rate
- [ ] `buildSolarSystem` only moves the first planet
> The function ignored its `radius` parameter, so every planet got the same answer back.
</Question>

<Question>
With Kepler's rule, how does a planet's year change as it moves farther from the sun?
- [ ] It gets shorter
- [ ] It stays the same
- [x] It gets longer
> Farther planets have a longer path and a weaker pull from the sun, so each lap takes more time.
</Question>

## Wrap up

You wrote `orbitSpeed`, a function that takes a planet's `radius` and returns its speed. `buildSolarSystem` called it once for every distance in your `planetRadii` array.

You saw Kepler's rule in action: the farther a planet orbits, the longer its year.

The same idea, gravity getting weaker with distance, also decides whether a rocket can escape a planet or falls back.
