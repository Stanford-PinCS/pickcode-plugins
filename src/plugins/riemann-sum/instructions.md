# Riemann Sums

How do you find the area under a curve? One way is to fill it with rectangles, add up their areas, and use more and more rectangles until the estimate gets close. That's a **Riemann sum**.

## The curve

You're finding the area under `f(x) = x²` from `x = 0` to `x = 4`. Run the starter code to see the curve and your first rectangles.

## Add rectangles

Each rectangle's height is the curve's value at that point, and its width is the interval divided by `n`. More rectangles means a better fit.

Try increasing `n` — the number of rectangles — and run again.

## Watch the error shrink

Check the stat panel. The **approximate area** is your rectangles' total; the **exact area** is `64/3 ≈ 21.33`.

As you raise `n`, watch the **error** get smaller. What happens with `n = 4`? `n = 50`? `n = 500`?

## Think about it

- Why does the estimate improve as `n` grows?
- Do the rectangles overshoot or undershoot the curve? Why?

## You did it

You approximated the area under a curve by filling it with rectangles and summing them — a Riemann sum. As you added more, the total closed in on the exact value of `64/3`.

That idea — more, thinner rectangles approaching a perfect answer — is the foundation of the **integral** in calculus. On to the next section!
