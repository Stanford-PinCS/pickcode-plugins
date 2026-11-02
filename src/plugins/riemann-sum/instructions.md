# Riemann Sums

How do you measure the area under a curve? You fill it with rectangles, add up their areas, and use thinner and thinner rectangles until the total stops changing. That's a **Riemann sum**. You'll practice storing values in **variables** and passing them to a function.

Click **Next** to continue.

## Measuring area with rectangles

You're finding the area under the curve `f(x) = x²` from `x = 0` to `x = 4`.

Split that stretch into `n` equal slices. Each slice becomes a rectangle:

- its **width** is `4 / n`
- its **height** is the curve's value, `x²`, at one chosen spot in the slice

> area ≈ (height₁ × width) + (height₂ × width) + ... + (heightₙ × width)

The exact area is `64/3`, about `21.3333`. Your rectangles get closer to it as they get thinner.

## Controlling the sum with variables

A **variable** is a name that stores a value. Your code has two:

```js
let n = 4;
let samplePoint = "left";
```

`n` holds a number: how many rectangles to draw. `samplePoint` holds a **string**, a piece of text written in quotes. It picks where each rectangle touches the curve: `"left"`, `"right"`, or `"middle"` of its slice.

The last line hands both variables to a function as **arguments**:

```js
drawRiemannSum(n, samplePoint);
```

`drawRiemannSum` draws `n` rectangles under the curve on the right and adds up their areas. It uses whatever values the variables hold, so changing one variable changes the picture.

## Run it

Press the **Run** button.

You'll see the teal curve `f(x) = x²` and pink rectangles rising one at a time beneath it. A pink dot marks where each rectangle touches the curve. The first rectangle is flat, because `0²` is `0`, so you only see its dot.

The bottom row shows **Rectangles** (`4`), **Approx. Area** (`14.0000`), **Exact Area** (`21.3333`), and **Error** (`7.3333`), which is how far off your estimate is.

## Step 1: Use more rectangles

Change the value of `n` from `4` to `10`:

```js
let n = 10;
```

Run it again.

**Look for:** the rectangles get thinner and fill more of the space under the curve. **Approx. Area** climbs to `18.2400`, and **Error** drops to `3.0933`. It's still *below* the exact area, because each left edge is the lowest point of its slice.

## Step 2: Sample from the right edge

Keep `n` at `10`. Change the value of `samplePoint` from `"left"` to `"right"`:

```js
let samplePoint = "right";
```

Run it again.

**Look for:** each pink dot moves to the rectangle's top-right corner, and the rectangles poke *above* the curve. **Approx. Area** is now `24.6400`, which is too big.

## Step 3: Sample from the middle

Change `samplePoint` again, this time to `"middle"`:

```js
let samplePoint = "middle";
```

Run it again.

**Look for:** the dots sit in the middle of each rectangle's top. Each rectangle sticks out a little on one side and falls short on the other, so the gaps mostly cancel. **Approx. Area** is `21.2800` and **Error** drops to `0.0533`, far better than the left edge's `3.0933` with the same 10 rectangles.

## Step 4: Use a lot more rectangles

Keep `samplePoint` at `"middle"`. Change `n` from `10` to `100`:

```js
let n = 100;
```

Run it again.

**Look for:** the rectangles are so thin they look like a solid shape that matches the curve. **Approx. Area** reads `21.3328`, and **Error** shrinks to `0.0005`.

## Check your understanding

<Question>
With `samplePoint` set to `"left"`, why is the estimate always too small for `f(x) = x²`?
- [ ] The rectangles are too wide to fit under the curve
- [x] The curve rises from left to right, so each left edge is the lowest point of its slice
- [ ] The first rectangle has a height of zero
> Because `x²` keeps rising from `0` to `4`, a rectangle using its left edge's height sits below the curve across its slice.
</Question>

<Question>
What happens to **Error** as you make `n` bigger?
- [x] It gets closer and closer to zero
- [ ] It stays the same
- [ ] It grows, because there are more rectangles
> Thinner rectangles leave smaller gaps under the curve, so the total closes in on `64/3`.
</Question>

## Wrap up

You used two variables, the number `n` and the string `samplePoint`, to control a Riemann sum. Moving the sample point to the middle cut the error from `3.0933` to `0.0533`, and 100 middle rectangles landed within `0.0005` of the exact area.

Making rectangles thinner and thinner until the total stops changing is the idea behind the **integral** in calculus.
