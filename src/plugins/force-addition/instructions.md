# Force Addition

Forces are **vectors** — they have both a size (magnitude) and a direction. When more than one force acts on an object, the object responds to their **sum**, called the _net force_ or _resultant_.

In this activity you'll add forces together and see the result on the grid.

## The idea

Each force is drawn as an arrow starting at the origin. To add two forces, place them tip-to-tail: the net force is the single arrow from the very start to the very end.

Because forces are vectors, you add them component by component:

```
netX = force1.x + force2.x
netY = force1.y + force2.y
```

The resultant arrow points from the origin to `(netX, netY)`.

## Try it

1. Add a single force pointing right along the x-axis. Watch where the arrow lands.
2. Add a second force pointing straight up. Notice they form two sides of a rectangle.
3. Draw the **net force** — the diagonal from the origin to the opposite corner. This is the resultant.

## Challenges

- Create two forces that **cancel out**. What does the net force look like? (Hint: it has zero length.)
- Make three forces that all point away from the origin but sum to zero — like the tension in three ropes holding up a sign.
- Predict the net force _before_ you draw it, then check your prediction.

## Reference

Add a force to the canvas with:

```
addForce(x, y, color)
```

- `x`, `y` — the components of the force
- `color` — the arrow color (e.g. `"#d6446b"`)

The grid is measured in units, with the origin at the center.
