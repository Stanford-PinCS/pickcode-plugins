# Cell Classification

Each cell is unique in its features. They can vary in size and roundness.
Here, you'll identify if a cell is cancerous based on its size and roundness.

## Try it

- Use summonCell() to bring some cells in the tray.
- Use checkCell() to find the size and roundness of some cells.
- Use revealCancer() to reveal if a cell is cancerous.
- Try checking some of the cells in the left pane.

## Some more functions you can use

| Function                               | What it does                        |
| -------------------------------------- | ------------------------------------|
|`addExample(n, size, roundness, cancer?)`| Plots a cell on the graph, you'll have to know its info|
| `predictCase(n)`                       | Predicts the cancer status of a cell based on your data, needs data on cancer and no-cancer to work|
| `showModel()`                          | Reveals how your predictions are made|


## Track the data

1. Find the measurements of some cells.
2. Use addExample() to save their measurements and cancer.
3. Repeat this for many cells, do you see a pattern in which cells are cancerous?

## Time to predict!

1. Once you have saved a bunch of data, try predictCase(n)!
2. Summon a new cell, use predictCase(n) on it, look on the graph for the prediction.
3. Use showModel() to reveal the prediction line.

## Think about it

- Try out predictCase() and showModel() with different amounts of data.
- How does the prediction line change based on how much data you have?
- How do you think the prediction could be even more accurate?

## Machine Learning

- You just trained a Machine Learning model!
- The model took the data that you found to draw a line.
- The model refines this line with each new data point.
- Finally, it makes predictions based on this line.
- This is called Classification! It's used everywhere, from spam mail to image detection!


