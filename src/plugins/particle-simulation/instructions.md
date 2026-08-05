# Particle Simulation

Temperature is really about motion — the hotter something is, the faster its particles jiggle around. This simulation lets you see that directly.

## Add particles

Use `addParticles` to fill the box. You give it how many particles, their temperature, and a color:

```js
addParticles(500, 10, "blue");
```

Run the starter code and watch them bounce around.

## Turn up the heat

Temperature controls speed — hotter particles move faster. Try a much higher temperature:

```js
addParticles(500, 200, "red");
```

Run it and compare. See how the hotter particles zip around while cooler ones drift?

## Mix temperatures

Call `addParticles` more than once to mix hot and cold particles in the same box:

```js
addParticles(250, 10, "blue");
addParticles(250, 200, "red");
```

Watch the fast red particles and slow blue ones share the space. The stats show the average, coldest, and hottest temperatures.

## Think about it

- What does raising the temperature do to how fast the particles move?
- In a real gas, why might hotter air take up more space than cold air?

## You did it

You filled a box with particles and watched temperature turn into motion — hotter particles moving faster, cooler ones slower.

That's the core idea of the **kinetic theory of matter**: temperature is the average energy of motion of all those tiny particles. On to the next section!
