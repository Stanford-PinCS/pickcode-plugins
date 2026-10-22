# Making a Simulation

### Getting started

Let's try to use what we know to visualize this exponential population growth model we've been talking about!

To do this, you'll code part of our simulation, but don't worry, we'll teach you all the programming concepts you'll need to understand what to do!

Click the "Next" button to continue.

## getPopulationParameters

`getPopulationParameters` is an example of what we call a function. A function in programming is a block of code that performs a specific task.

In this case, the specific task that we will be accomplishing with `getPopulationParameters` is to create the values that define our population.

Based on what we've already learned, stop and think about what factors can define our simulation?

## Defining our population

Although there are many factors that can define a population, two of the factors that we should definitely tell our simulation are how big the population is initially and how fast the population grows!

To do this, we'll need to store these values as variables in our code.

A variable is a piece of data that has a name and a value that gets stored along with it that we can use later in our code.

## Making a variable

To show you how to make a variable, let's use an example. Imagine we wanted to store a person's age as a variable in our code.

The way we could write this is `age=17`. In this case `age` is the name of our variable, which stores the value of `17`.

## Your turn

Now, you try! Delete the line of code that says `# TODO` and try making a variable called `initialPopSize` that stores the value of `30` to represent an initial population of 30 organisms. Make sure your line of code is indented like the following:

```python
def functionName():
    age = 17
```

Now, go to the next line and try to create a variable called `growthRate` that stores the value of 0.5 to represent a population that has a per capita growth rate r of 0.5.

## Check your code

You should have something that looks like this:

```python
def getPopulationParameters():
    initialPopSize = 30
    growthRate = 0.5
```

## Packaging our variables

Just one last step left! Because these variables are contained within our function, we need to ship them out to give to our simulation!

To do this, we use a `return` statement. A `return` statement is how a function sends its result back to whoever used the function. You can think of it like the function handing you back an answer after doing a problem.

To write a return statement, we simply write a new line with the word `return` followed by whatever you want to send out of the function. For example, imagine we had a function that calculated someone's age in dog years. We could return the result like this:

```python
def getDogAge():
    humanAge = 17
    dogAge = 7 * humanAge
    return dogAge
```

In our case, we want to return both variables together. We can simply do this by separating what we want to return together with commas. Make sure to return the initial population size first, as the order does matter when returning values this way.

Try to return the two variables you made together!

## Check your code

You should now have something that looks like this:

```python
def getPopulationParameters():
    initialPopSize = 30
    growthRate = 0.5

    return initialPopSize, growthRate
```

## Running the simulation

Great work! Now that our function is complete, our simulation has everything it needs to model exponential population growth.

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
