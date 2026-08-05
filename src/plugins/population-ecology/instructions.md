# Population Ecology

Model how a population changes over time. The graph tracks population size by day, while the organism field gives you a live visual sense of growth or decline.

## Exponential growth

Use `addPopulation` to start with an initial population and apply a constant growth rate.

```javascript
addPopulation(20, 0.15, 500, "Rabbits");
```

The arguments are:

1. `initialSize` â€” the population on day 0
2. `growthRate` â€” the decimal growth rate, `r`
3. `dayDuration` â€” milliseconds represented by each simulated day
4. `label` â€” a name for the population

The model follows:

**N(t) = Nâ‚€ Â· e^(r Â· t)**

- A positive `r` makes the population grow.
- A negative `r` makes the population shrink.
- An `r` of `0` keeps the population constant.

Try changing one value at a time. What happens when you double the initial size? What changes when the growth rate moves from `0.05` to `0.2`?

## Custom population data

Use `addCustomPopulation` when you want to provide the population for each day yourself.

```javascript
addCustomPopulation([20, 24, 31, 29, 38, 46], 500);
```

The first argument is an array of daily population values. The second is the number of milliseconds each day should last.

## Reading the simulation

- The line graph shows how population changes across days.
- Each dot represents one organism, up to 10,000 visible organisms.
- Newly added organisms briefly use the secondary series color.
- The statistics below the visualization show the current day, current population, initial size, and model setting.

Run the code again to compare different starting sizes, growth rates, or custom schedules.
