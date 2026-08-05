# Momentum in 2D

When two objects collide, something surprising stays constant: the total **momentum** of the system. Momentum is mass times velocity, and because velocity has direction, momentum is a _vector_ — it has an x-part and a y-part, and both are conserved.

```
momentum = mass × velocity
```

No matter how the two bodies bounce, squish, or stick, the total momentum right _before_ the collision equals the total momentum right _after_. The readout below the simulation shows both — watch that they match.

## Energy is different

Momentum is always conserved in a collision. **Kinetic energy** is not. In a perfectly **elastic** collision (a restitution of 1), the objects bounce apart with no energy lost. In an **inelastic** one, some kinetic energy turns into heat, sound, and deformation — so the "KE lost" readout climbs above 0%. If the bodies stick together completely, the collision is perfectly inelastic and the energy loss is largest.

**Restitution** is the knob that sets this: `1` is a perfect bounce, `0` means they stick.

## Center of mass

There's one more thing that doesn't care about the collision at all: the **center of mass**. Track the yellow _CM_ marker — because total momentum is conserved, the center of mass keeps gliding in a straight line at a constant speed straight through the collision, as if nothing happened.

## Your task

Set up a collision — give each body a mass, a starting position, and a velocity, choose how bouncy the impact is (restitution) — then run it and check what's conserved.

> **I need your starter code to finish this section.** This plugin configures the simulation through a `configureSimulation` message built by `momentumCore`, and I haven't seen the student-facing API (the function names and the shape of the inputs you expose). Paste what's in the editor pane and I'll write exact, correct steps — I don't want to invent an API and send you a wrong lesson, like happened earlier.

## Challenges

- Give the two bodies equal and opposite momentum. Where does the center of mass go? (It shouldn't move at all.)
- Set restitution to 1, then to 0, and compare the "KE lost" readout for the same setup.
- Make one body much heavier than the other and predict which one changes direction more in the collision.
