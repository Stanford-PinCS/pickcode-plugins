# Dice Roll Simulation

Roll a die many times and watch how the distribution of results changes as you add more rolls. This shows the **Law of Large Numbers** — the more trials you run, the closer the results match what you'd expect from probability.

## Understand the starter code

Look at lines 12–13. `totalRolls` controls how many times to roll, and `numSides` sets how many sides the die has. The code counts each face and converts to percentages.

## Run the experiment

Set `totalRolls` to `100` and run it. Watch the bars — do they look fairly even?

## Experiment more

Now try `totalRolls = 10000` with the same `numSides = 6`. Run it again. What changed?

## Try a different die

Change `numSides` to `12` and run with `totalRolls = 10000`. Does the distribution spread out or stay the same shape?

## You did it!

You rolled a die thousands of times and watched every face even out toward the same frequency — the **Law of Large Numbers** at work. With only a few rolls the bars looked jagged and uneven, but with thousands they flattened toward the expected `1 / numSides` for each face.
