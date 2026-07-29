# Projectile Motion

When you throw a ball, it follows a curved path called a _trajectory_. In this module you'll predict where a ball lands, then compare your prediction to what physics actually does.

## Watch the paths

Hit **Run**. You'll see a ball launched across the screen, tracing its _actual_ path under gravity — that's the solid line. The dots are _your_ prediction. The closer your dots follow the actual path, the better your prediction.

## The idea

A projectile's position changes in two ways at once: it moves sideways at a steady speed, and it falls faster and faster because of gravity. Your job is to compute where the ball is at each moment in time.

## Horizontal motion

Sideways, there's nothing slowing the ball down, so it moves at a constant speed:

`x = startX + velocityX * t;`. The ball covers the same horizontal distance each second.

## Vertical motion

Vertically, gravity pulls the ball down harder over time:

`y = startY + velocityY * t - 0.5 * g * t * t;`. The `t * t` is what makes the path curve instead of going straight.

## Compare and adjust

Run your code and watch how close the dotted prediction sits to the actual pink path. If they don't match, check your formulas. A wrong sign or a missing `t` will send the prediction off course.

## You did it!

You predicted a projectile's path by tracking horizontal and vertical motion separately, then combined them into a curved trajectory. You saw how constant sideways speed and accelerating downward fall produce the arc every thrown object follows. Great job!
