# Molecular Geometry

The electron pairs around a central atom push each other as far apart as they can, and that decides the molecule's shape. You'll write a function that uses an **if / else if** chain to name the shape, then watch a molecule settle into it.

Click **Next** to continue.

## Why molecules have shapes

**VSEPR theory** (valence shell electron pair repulsion) says the electron domains around a central atom repel each other and spread out as far as possible.

- An **electron domain** is a bond or a lone pair. A double or triple bond counts as **one** domain.
- The **electron geometry** comes from the number of domains: 2 is linear (180°), 3 is trigonal planar (120°), 4 is tetrahedral (109.5°).
- The **molecular shape** names only where the atoms are. Lone pairs still push, but they aren't part of the shape's name.

Lone pairs push harder than bonds, so they squeeze the bond angles: about 107° in NH₃ and 104.5° in H₂O.

## Choosing a shape with an if chain

Here is your code:

```js
let bondingPairs = 2;
let lonePairs = 0;

// Returns the name of the molecule's shape.
function getShape(bondingPairs, lonePairs) {
    let domains = bondingPairs + lonePairs;
    if (domains === 2) {
        return "linear";
    }
    return "unknown";
}
```

```python
bondingPairs = 2
lonePairs = 0

# Returns the name of the molecule's shape.
def getShape(bondingPairs, lonePairs):
    domains = bondingPairs + lonePairs
    if domains == 2:
        return "linear"
    return "unknown"
```

- `bondingPairs = 2` and `lonePairs = 0` describe the central carbon in CO₂: two double bonds (2 domains) and no lone pairs.
- `getShape` adds them into `domains`. If there are 2 domains, it **returns** `"linear"` and stops. Otherwise it reaches the last line and returns `"unknown"`.
- You'll grow the `if` into a chain of <JavaScript>`else if`</JavaScript><Python>`elif`</Python> branches. The chain checks them in order and runs the first one that's true.
- The last line, `buildMolecule(bondingPairs, lonePairs, getShape)`, builds the molecule on the right, lets its domains push apart, then labels it with whatever `getShape` returns.

## Run it

Press the **Run** button.

A dark central atom appears with two teal bonded atoms bunched together. They spring apart until they sit on opposite sides. Then the top line reads **getShape(2, 0) returned "linear"**, and the teal note under it says it matches 2 domains with 0 lone pairs.

The bottom row shows **Domains** (2), **Lone Pairs** (0), **Shape** (linear) and **Bond Angle**, which climbs to 180.0° as the atoms spread out.

## Step 1: Try methane

CH₄ has four bonds on carbon and no lone pairs. Change `bondingPairs` to `4` and keep `lonePairs` at `0`:

```js
let bondingPairs = 4;
let lonePairs = 0;
```

```python
bondingPairs = 4
lonePairs = 0
```

Run it again.

**Look for:** the four atoms still spread out into a tetrahedron, and **Bond Angle** settles at 109.5°. But the label says **"unknown"**, and the note says **getShape doesn't know this shape yet**. Your function has no branch for 4 domains.

## Step 2: Add the tetrahedral family

<JavaScript>
In `getShape`, find the `}` right after `return "linear";`. Replace that `}` with these lines:
</JavaScript>
<Python>
In `getShape`, add these lines right after `return "linear"`, lined up with the `if`:
</Python>

```js
    } else if (domains === 4 && lonePairs === 0) {
        return "tetrahedral";
    } else if (domains === 4 && lonePairs === 1) {
        return "trigonal pyramidal";
    } else if (domains === 4 && lonePairs === 2) {
        return "bent";
    }
```

```python
    elif domains == 4 and lonePairs == 0:
        return "tetrahedral"
    elif domains == 4 and lonePairs == 1:
        return "trigonal pyramidal"
    elif domains == 4 and lonePairs == 2:
        return "bent"
```

<JavaScript>`&&`</JavaScript><Python>`and`</Python> means both conditions must be true. Run it again for CH₄. Then change the two numbers and run each of these:

- NH₃: `bondingPairs` `3`, `lonePairs` `1`
- H₂O: `bondingPairs` `2`, `lonePairs` `2`

**Look for:** purple lone pairs push the bonds closer together. **Bond Angle** settles at 109.5°, then 107.0°, then 104.5°. Each label now matches.

## Step 3: Add the trigonal planar family

<JavaScript>
Find the `}` right after the last `return "bent";` in your chain. Replace that `}` with these lines:
</JavaScript>
<Python>
Add these lines right after the `return "bent"` you just typed, lined up with the other `elif` lines:
</Python>

```js
    } else if (domains === 3 && lonePairs === 0) {
        return "trigonal planar";
    } else if (domains === 3 && lonePairs === 1) {
        return "bent";
    }
```

```python
    elif domains == 3 and lonePairs == 0:
        return "trigonal planar"
    elif domains == 3 and lonePairs == 1:
        return "bent"
```

Run these two:

- BF₃: `bondingPairs` `3`, `lonePairs` `0`
- SO₂: `bondingPairs` `2`, `lonePairs` `1`

**Look for:** BF₃ lies flat with a **Bond Angle** of 120.0°. In SO₂, the lone pair squeezes the angle to 119.0°. It's bent like water, but from 3 domains instead of 4.

## Check your understanding

<Question>
Water has 2 bonds and 2 lone pairs. Why is its electron geometry tetrahedral but its shape bent?
- [ ] Lone pairs don't take up any space
- [x] All 4 domains spread out like a tetrahedron, but the shape names only the 3 atoms
- [ ] Hydrogen atoms always form 104.5° angles
> Molecular shape looks only at the atoms, so the two lone pairs aren't part of the name.
</Question>

<Question>
Before you did Step 3, what did `getShape(3, 0)` return?
- [ ] `"trigonal planar"`
- [ ] `"tetrahedral"`
- [x] `"unknown"`
> No branch matched 3 domains, so the chain fell through to the last line, `return "unknown"`.
</Question>

<Question>
CO₂ and H₂O both have polar bonds. Which one is a polar molecule?
- [ ] CO₂, because it's linear
- [x] H₂O, because its bent shape keeps the bond dipoles from canceling
- [ ] Neither one
> In linear CO₂, the two bond dipoles point in opposite directions and cancel. In bent H₂O they add up.
</Question>

## Wrap up

You wrote `getShape`, an `if` chain that turns bonding pairs and lone pairs into a VSEPR shape: linear, trigonal planar, bent, tetrahedral or trigonal pyramidal. Each branch tests a condition and returns a different value. You also saw that every domain repels the others, that lone pairs repel the most, and that a molecule's shape names only its atoms.

Next, you'll see how shape and polarity decide the forces between molecules.
