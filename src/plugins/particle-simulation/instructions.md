# Particle Simulation

Temperature is really about motion: the hotter a gas is, the faster its tiny particles move. You'll fill a box with cold and hot particles and watch what happens when they mix. Along the way you'll practice storing values in **variables** and passing them to a function as **arguments**.

Click **Next** to continue.

## Why hot and cold gas even out

Everything is made of particles that are always moving. **Temperature** measures how much motion energy those particles have on average. Hot particles move fast. Cold particles move slowly.

When hot and cold particles share a space, they bump into each other and trade energy. The fast ones slow down and the slow ones speed up, until everything sits at one in-between temperature. This is called **thermal equilibrium**.

This idea is the **kinetic theory of matter**.

## Describing the gas with variables

A **variable** is a name that holds a value. Your code starts with two variables for the cold group:

```js
let numCold = 200;
let coldTemperature = 10;
```

`numCold` is how many cold particles go in the box, and `coldTemperature` is how cold they are.

Two more describe the hot group:

```js
let numHot = 0;
let hotTemperature = 200;
```

`numHot` is `0`, so there are no hot particles yet. `hotTemperature` is how hot they would be.

The last line passes all four variables to `mixParticles` as **arguments**, in this order:

```js
mixParticles(numCold, coldTemperature, numHot, hotTemperature);
```

It drops every particle into the box on the right at a random spot, moving in a random direction. Change a variable, and the next run uses its new value.

## Run it

Press the **Run** button.

The box fills with 200 teal dots. They drift slowly and bounce off the walls, because they are cold.

The bottom row shows **Particles** (200), **Avg Temp** (10.0), **Coldest** (10.0) and **Hottest** (10.0). Those numbers come straight from `numCold` and `coldTemperature`.

## Step 1: Add a hot group

Change `numHot` from `0` to `200`, so the line reads:

```js
let numHot = 200;
```

Run it again, and keep watching the box for about 30 seconds.

**Look for:** 200 pink particles zipping around between the slow teal ones. **Particles** is now 400, **Hottest** is 200.0, and **Avg Temp** is 105.0, halfway between.

As you watch, the pink particles slowly calm down while the teal ones speed up. Soon you can't tell the groups apart by speed. The colors never change. They only show which group each particle started in.

## Step 2: Change the mix

Use fewer hot particles. Change `numHot` to `50`:

```js
let numHot = 50;
```

Run it again and watch for 30 seconds.

**Look for:** **Particles** is 250 and **Avg Temp** drops to 48.0, much closer to cold than to hot. The few pink particles slow way down as they share their energy with the big teal crowd. A little hot gas can't warm a lot of cold gas very much.

## Check your understanding

<Question>
The first time you ran your code, why did no pink particles appear?
- [ ] `hotTemperature` was too low
- [x] `numHot` was `0`, so no hot particles were added
- [ ] `mixParticles` only adds cold particles
> `mixParticles` reads the value stored in `numHot`. With `0`, there are no hot particles to draw.
</Question>

<Question>
In Step 2, why was **Avg Temp** 48.0 and not 105.0?
- [ ] The hot particles cooled down first
- [x] There were four times as many cold particles, so they pulled the average down
- [ ] `mixParticles` ignores `hotTemperature` when `numHot` is small
> The average counts every particle. 200 cold ones outweigh 50 hot ones.
</Question>

## Wrap up

You stored a box of gas in four variables and passed them to `mixParticles` as arguments. Changing one value, `numHot`, changed the whole box.

You saw that temperature is motion, and that hot and cold particles share energy until they settle at one temperature, the average.

This same mixing explains why a hot drink cools down in a cold room.
