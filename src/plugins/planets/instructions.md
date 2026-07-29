# Planets

Build your own solar system. You'll add planets, set how far out they orbit and how fast they travel, and watch them circle the sun.

## Add a planet

Use `addPlanet` to place a planet in orbit. You pass it an object describing the planet:

```js
addPlanet({ name: "earth", radius: 1000, speed: 10, color: "blue", size: 100 });
```

Run the starter code to see your planet begin its orbit.

## Distance and speed

`radius` sets how far the planet orbits from the sun; `speed` sets how fast it travels.

Try changing them and running again — a bigger `radius` means a wider orbit, a higher `speed` means it laps the others.

## Build a system

Call `addPlanet` several times for different planets:

```js
addPlanet({ name: "mercury", radius: 500, speed: 20, color: "gray", size: 60 });
addPlanet({
  name: "jupiter",
  radius: 1800,
  speed: 5,
  color: "orange",
  size: 160,
});
```

Run it and watch them all orbit at once. The stats show which is fastest and which orbits farthest out.

## Think about it

- In our real solar system, do planets farther from the sun move faster or slower?
- What would happen if two planets shared the same `radius`?

## You did it

You built a solar system — adding planets at different distances and speeds and watching them orbit the sun.

You saw how `radius` and `speed` shape each planet's path, the same ideas that describe how real planets move around our own star. On to the next section!
