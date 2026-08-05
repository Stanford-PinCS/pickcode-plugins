# Force Components

Any vector can be split into two perpendicular pieces: how far it reaches along the **x-axis** and how far along the **y-axis**. These are its _components_, and together they form a right triangle with the vector as the hypotenuse.

## The trig

If a vector has magnitude `r` and points at angle `θ` (measured counter-clockwise from the positive x-axis), its components are:

```
xComponent = r * cos(θ)
yComponent = r * sin(θ)
```

The x-component runs along the x-axis; the y-component runs straight up (or down) from the tip of the x-component to the tip of the vector.

## Your task

Draw a vector, then compute and draw its components:

```
const r = 20;      // magnitude
const angle = 30;  // degrees

drawVector(r, angle);

const rad = angle * Math.PI / 180;   // JS trig uses radians
const x = r * Math.cos(rad);
const y = r * Math.sin(rad);

drawComponents(x, y);
```

Run it. The **vector** is blue, the **x-component** green (horizontal), and the **y-component** red (vertical). The green and red arrows should meet the blue arrow's tip — that's the right triangle closing up.

## Drawing API

```
drawVector(magnitude, angle)      // angle in degrees, CCW from +x
drawComponents(xComponent, yComponent)
```

## Challenges

- Point the vector straight up (`angle = 90`). What happens to the x-component? (`cos(90°) = 0`, so it vanishes.)
- Use `angle = 45`. The two components come out equal — the triangle is isosceles.
- Try an angle past 90° or a negative angle and watch a component go negative, pointing left or down.
- Given only the components, work backwards: the magnitude is `Math.sqrt(x*x + y*y)` and the angle is `Math.atan2(y, x)`.
