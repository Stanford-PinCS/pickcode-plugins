<Slide>
# Making a Simulation
### Getting started
<Step>
Let's try to use what we know to visualize an electric field simulation!
</Step>
<Step>
To do this, you'll code part of our simulation, but don't worry, we'll teach you all the programming concepts you'll need to understand what to do!
</Step>
<Step>
Click the "Next" button to continue.
</Step>
</Slide>

<Slide>
## createParticle
<Step>
`createParticle` is an example of what we call a function. A function in programming is a block of code that performs a specific task.
</Step>
<Step>
In this case, the specific task that we will be accomplishing with `createParticle` is to place a charged particle into our simulation.
</Step>
<Step>
Based on what we've already learned about electric charges, stop and think about what information we need to describe a charged particle?
</Step>
</Slide>

<Slide>
## Defining our particle
<Step>
Although there are many properties a particle could have, three of the things we should definitely tell our simulation are where the particle is located and how much charge it carries.
</Step>
<Step>
To do this, we'll need to pass these values into our function as what we call parameters.
</Step>
<Step>
A parameter is a placeholder for a value that gets passed into a function when we use it, so the function knows what to work with.
</Step>
</Slide>

<Slide>
## Calling a function
<Step>
To show you how to call a function with parameters, let's use an example. Imagine we wanted to place a particle at the center of the screen with a positive charge.
</Step>
<Step>
The way we could write this is `createParticle(0.5, 0.5, 1)`. In this case `0.5` and `0.5` are the x and y position, and `1` is the charge.
</Step>
</Slide>

<Slide>
## Your turn
<Step>
Now, you try! Delete the line of code that says `# TODO` and try calling `createParticle` to place a positive charge of `+1` at position `x = 0.35, y = 0.5`.
</Step>
```
createParticle(0.35, 0.5, 1);
```
<Step>
Now, go to the next line and try calling `createParticle` again to place a negative charge of `-1` at position `x = 0.65, y = 0.5`.
</Step>
</Slide>

<Slide>
<Step>
You should have something that looks like this:
</Step>
```
createParticle(0.35, 0.5, 1);
createParticle(0.65, 0.5, -1);
```
</Slide>

<Slide>
## Understanding position and charge
<Step>
Notice how the x and y values are always between `0` and `1`. Think of the simulation screen like a grid, where `(0, 0)` is the top left corner and `(1, 1)` is the bottom right corner.
</Step>
<Step>
The charge value `q` tells the simulation how strong the particle's electric field is, and whether it's positive or negative. A positive value makes a red particle, and a negative value makes a blue particle.
</Step>
<Step>
The magnitude of `q` also matters. A charge of `+2` creates a stronger field than a charge of `+1`, even though both are positive.
</Step>
</Slide>

<Slide>
## Running the simulation
<Step>
Great work! Now that we've placed our particles, our simulation has everything it needs to model the electric field between them.
</Step>
<Step>
Press the play button and watch what happens on the right side of your screen. You should see two charged particles along with arrows and curved lines showing the shape of the electric field around them.
</Step>
<Step>
Take a moment to look at the field lines. Where do they start, and where do they end?
</Step>
</Slide>

<Slide>
## Reading the field
<Step>
The lines you're seeing are called electric field lines. Notice how they flow outward from the positive charge and curve inward toward the negative charge.
</Step>
<Step>
This happens because electric field lines always point in the direction a positive test charge would move if it were placed at that point. Since opposite charges attract, the lines bend from positive to negative.
</Step>
<Step>
The arrows you see are also a clue: the closer together and longer the arrows, the stronger the electric field is at that point.
</Step>
</Slide>

<Slide>
## Experimenting
<Step>
Now let's explore! Once the simulation has run fully, try calling `clearParticles()` to remove all the particles from the screen.
</Step>
<Step>
Next, try placing four particles at the corners of a square, alternating between positive and negative charges, and let the simulation run fully again. What pattern do you notice in the field lines?
</Step>
<Step>
Finally, try placing two particles with the same sign of charge next to each other, like two positive charges. What do you think will happen to the field lines between them before you run it?
</Step>
</Slide>

<Slide>
## What did you find?
<Step>
When charges have opposite signs, the field lines curve directly from the positive charge to the negative charge, showing the attraction between them.
</Step>
<Step>
When charges have the same sign, the field lines bend away from each other instead of connecting, showing how like charges repel.
</Step>
<Step>
A larger charge magnitude creates a denser, stronger-looking field around that particle, since more field lines radiate outward from it.
</Step>
</Slide>

<Slide>
## Starting over
<Step>
If you ever want to clear the screen and start fresh, you can call `clearParticles()` at any time to remove every particle currently in the simulation.
</Step>
<Step>
If you want to reset the entire simulation back to its original blank state, you can call `reset()` instead.
</Step>
</Slide>

<Slide>
## Wrapping up
<Step>
In the next section, we'll look at what happens when we add more particles at once to build more complex electric fields, like the field created by many charges spread across a surface. That's where things get really interesting!
</Step>
</Slide>