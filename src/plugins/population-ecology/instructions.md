# Making a Simulation

### Getting started

Let's try to use what we know to visualize this exponential population growth model we've been talking about!

The code on the left already has everything our simulation needs. Over the next few steps, we'll walk through what each part of it does.

Click the "Next" button to continue.

## getPopulationParameters

`getPopulationParameters` is an example of what we call a function. A function in programming is a block of code that performs a specific task.

In this case, the specific task that `getPopulationParameters` accomplishes is to create the values that define our population.

## Defining our population

Although there are many factors that can define a population, two of the factors that we should definitely tell our simulation are how big the population is initially and how fast the population grows!

To do this, our code stores these values as variables. A variable is a piece of data that has a name and a value that gets stored along with it that we can use later in our code.

For example, `age = 17` would make a variable named `age` that stores the value `17`.

## Our variables

Our function makes two variables:

```python
def getPopulationParameters():
    initialPopSize = 30
    growthRate = 0.5
```

`initialPopSize` stores the value `30`, which represents an initial population of 30 organisms.

`growthRate` stores the value `0.5`, which represents a population that has a per capita growth rate r of 0.5.

## Packaging our variables

Because these variables are contained within our function, we need to ship them out to give to our simulation. That's what the last line does:

```python
    return initialPopSize, growthRate
```

A `return` statement is how a function sends its result back to whoever used the function. You can think of it like the function handing you back an answer after doing a problem.

Here we return both variables together, separated by a comma. The initial population size comes first, because the order does matter when returning values this way.

## Running the simulation

Now that you know what our function does, let's see it in action!

Press the play button and watch what happens on the right side of your screen. You should see a population simulation of organisms in a sandbox along with a graph to show how the population grows across time.

Take a moment to look at the graph. Does the shape remind you of anything we talked about earlier?

## Reading the graph

The curve you're seeing is called an exponential growth curve. Notice how the population starts growing slowly, but then gets faster and faster over time.

This happens because the growth rate r continuously applies to the population size of the previous day. The bigger the population gets, the more new organisms are being added each day.

## Experimenting

Now let's explore! Once the simulation has run fully, try changing the value of `growthRate` to something larger, like `1.2`, and let the simulation run fully again. What do you notice about the graph?

Now try a smaller value, like `0.1` and let the simulation run fully. How does the population grow differently?

Finally, try a negative value like `-0.2` and let the simulation run fully. What do you think will happen before you run it?

## What did you find?

A larger `growthRate` makes the population explode upward much more steeply, representing a population where the organisms are reproducing much faster than they're dying.

A smaller `growthRate` means slower, more gradual growth in a population. It is still exponential growth, but simply less dramatic.

A negative `growthRate` means the population is actually shrinking over time because deaths are outpacing births. This could represent a species under threat of extinction.

## Wrapping up

In the next section, we'll look at what happens when we add one more variable to our model: a limit on how large the population can actually get. That's where things get really interesting!
