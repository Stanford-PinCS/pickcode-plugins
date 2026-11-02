# Momentum in 2D

When two objects crash, one thing never changes: the total **momentum** of the pair. You'll set up a crash between two bodies with **variables**, pass them to a function, and check that momentum before the crash equals momentum after.

Click **Next** to continue.

## Why momentum survives a crash

Momentum is mass times velocity:

**momentum = mass × velocity**

Velocity has a direction, so momentum has an x-part and a y-part. In a crash, the bodies push on each other equally and oppositely, so whatever momentum one gains, the other loses. The total stays the same in both directions.

**Kinetic energy** (the energy of motion) is different. Some of it can turn into heat and sound. How bouncy the crash is decides how much energy is lost. A bounciness of 1 loses none, and 0 means no bounce at all.

## Setting up the crash with variables

A **variable** is a name that holds a value. Your code starts with body A:

```js
let massA = 1;        // kilograms
let speedA = 210;     // pixels per second (+ is right, - is left)
```

Body A has a mass of `1` kilogram and moves `210` pixels per second to the right. A negative speed would mean left.

Then body B and the bounciness:

```js
let massB = 1;
let speedB = 0;
let bounciness = 0.92; // 1 = perfect bounce, 0 = no bounce
```

Body B also has mass `1`, and `speedB` is `0`, so it starts still. A `bounciness` of `0.92` makes a very bouncy crash.

The last line passes all five variables to `collide` as **arguments**, in this order:

```js
collide(massA, speedA, massB, speedB, bounciness);
```

It crashes the two bodies on the right and measures the momentum before and after.

## Run it

Press the **Run** button.

Body A (pink) slides right and clips body B (teal), which sits a little higher, so the hit is off-center. Arrows show which way each body is moving. After the hit, A heads down-right and B heads up-right. Dashed lines show their paths.

The small dark dot labeled **CM** is the center of mass: the balance point of the pair. Watch it glide in a straight line, right through the crash.

The bottom row shows **Momentum before** and **Momentum after**, both **(210, 0)**. **KE lost** is about **3.9%**. **Collision** says **yes**.

## Step 1: Make a perfect bounce

In the `bounciness` line, change `0.92` to `1`:

```js
let bounciness = 1;    // 1 = perfect bounce, 0 = no bounce
```

Run it again.

**Look for:** **KE lost** drops to **0.0%**. A perfect bounce keeps all the energy of motion. The two momentum stats still match at **(210, 0)**.

## Step 2: Take away the bounce

Change `bounciness` from `1` to `0`:

```js
let bounciness = 0;    // 1 = perfect bounce, 0 = no bounce
```

Run it again.

**Look for:** **KE lost** jumps to about **25%**. The bodies spring apart much more gently, so more energy turns into heat and sound. Momentum before and after still match. Bounciness changes energy, never the total momentum.

## Step 3: Send body B the other way

Change `speedB` from `0` to `-210`, so body B moves left toward A:

```js
let speedB = -210;
```

Run it again.

**Look for:** both momentum stats read **(0, 0)**. The bodies have equal and opposite momentum, so the total is zero. The **CM** dot stays put the whole time, even as the bodies crash and fly apart.

## Step 4: Make body A heavier

Change `massA` from `1` to `4`:

```js
let massA = 4;        // kilograms
```

Run it again.

**Look for:** **Momentum before** is now **(630, 0)**, because 4 × 210 + 1 × (−210) = 630. Heavy body A barely turns and plows ahead, while light body B is knocked upward. The **CM** dot glides right again, and **Momentum after** still equals **Momentum before**.

## Check your understanding

<Question>
Body A has mass `2` and speed `100`. Body B has mass `1` and speed `0`. What will **Momentum before** show?
- [ ] (100, 0)
- [x] (200, 0)
- [ ] (300, 0)
> Momentum is mass times velocity. Body A has 2 × 100 = 200, and body B has 1 × 0 = 0, so the total is 200.
</Question>

<Question>
You change `bounciness` from `1` to `0`. What happens to the total momentum after the crash?
- [ ] It gets smaller, because energy is lost
- [x] It stays the same as before the crash
- [ ] It drops to zero, because nothing bounces
> Bounciness only changes how much kinetic energy is lost. The pushes between the bodies are still equal and opposite, so total momentum is conserved.
</Question>

## Wrap up

You set up a crash with five variables and passed them to `collide` as arguments, in order. In your last setup, body A had `massA` of `4` and body B came the other way at `-210`, with `bounciness` at `0`. The total momentum stayed **(630, 0)** through the crash, even though about a third of the kinetic energy was lost.

Momentum is conserved in every crash, but energy is not. Engineers use this same idea to study car crashes, pool shots, and rocket launches.
