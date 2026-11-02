# Electric Field Simulation

Every charged particle creates an invisible **electric field** around it, a push or pull that other charges nearby can feel. In this activity you'll place charges and see their field. You'll practice using a **list** to keep track of several things at once.

Click **Next** to continue.

## How charges push and pull

Charges come in two kinds: **positive** and **negative**. Opposite charges attract, and like charges repel.

The electric field shows which way a small positive charge would be pushed at each spot:

- It points **away** from positive charges.
- It points **toward** negative charges.

**Field lines** start on positive charges and end on negative ones. A bigger charge has more lines, and the field is stronger where the lines bunch together.

## Describing charges with a list

A **list** holds several items in order, inside square brackets and separated by commas. Your list, `charges`, has one item so far:

```js
let charges = [
  {x: 0.35, y: 0.5, charge: 1}
];
```

That item is one charge, written as a group of named values inside curly braces:

- `x` is how far across the canvas the charge sits, from `0` (left edge) to `1` (right edge).
- `y` is how far down it sits, from `0` (top) to `1` (bottom).
- `charge` is how strong it is. A positive number makes a positive charge, and a negative number makes a negative one.

To add a charge, you add an item to the list. `placeCharges(charges)` places every charge in your list and draws the field around them.

## Run it

Press the **Run** button.

A pink circle with a **+** appears a little left of center. Dark field lines grow out of it in every direction, with arrowheads pointing away from it. Purple rings, called **equipotentials**, ripple outward around it, and small faint arrows across the canvas all point away from the charge.

The bottom row shows **Charges** 1, **Positive** 1, **Negative** — and **Net Charge** 1.0.

## Step 1: Add a negative charge

Put a comma after the first item, `{x: 0.35, y: 0.5, charge: 1}`, then add this line right below it, before the `];`:

```js
  {x: 0.65, y: 0.5, charge: -1}
```

Run it again.

**Look for:** a teal circle with a **−** on the right. The field lines now curve from the pink charge over to the teal one. This pair of opposite charges is called a **dipole**. **Net Charge** is 0.0.

## Step 2: Make the positive charge stronger

In the first item, change `charge: 1` to `charge: 2`, so the line reads:

```js
  {x: 0.35, y: 0.5, charge: 2},
```

Run it again.

**Look for:** the pink charge now sends out twice as many field lines. The teal charge can only take in its share, so the rest of the lines run off the edge of the canvas. **Net Charge** is 1.0.

## Step 3: Add a third charge

Put a comma after the second item, `{x: 0.65, y: 0.5, charge: -1}`, then add this line right below it, before the `];`:

```js
  {x: 0.5, y: 0.25, charge: -1}
```

Run it again.

**Look for:** a second teal charge near the top. Many of the lines that ran off the edge now curve into it instead. **Charges** is 3, **Negative** is 2, and **Net Charge** is back to 0.0.

## Check your understanding

<Question>
In your dipole, you change the teal charge from `-1` to `1`. What happens to the field lines between the two charges?
- [ ] They connect the two charges more tightly
- [x] They bend away from each other, leaving an empty gap in the middle
- [ ] They disappear completely
> Field lines can't end on a positive charge, so lines from two positive charges push apart. Halfway between them the field is zero.
</Question>

<Question>
Where in the canvas would `{x: 0.5, y: 0.9, charge: -1}` appear?
- [ ] Near the top, in the middle
- [x] Near the bottom, in the middle
- [ ] Near the right edge, in the middle
> `x: 0.5` is halfway across, and `y` counts down from the top, so `0.9` is near the bottom.
</Question>

## Wrap up

Your finished list has three charges: a `+2` charge on the left and two `-1` charges on the right and near the top. Their charges add up to zero, so the field lines from the positive charge end on the negative ones.

You used a list to describe several charges and saw that the field is the combined push and pull of all of them. The same idea, adding up the push and pull of every charge, explains how magnets, lightning and even the atoms in your body hold together.
