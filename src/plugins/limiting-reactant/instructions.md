# Limiting Reactant

When hydrogen burns in oxygen, the two gases react in a fixed ratio, so one of them usually runs out first. That one is the **limiting reactant**, and it decides how much water you can make. You'll practice **variables**, **arithmetic**, and an **if statement** that compares two numbers to find it.

Click **Next** to continue.

## Which reactant runs out first

A balanced equation is a recipe:

> 2 H₂ + O₂ → 2 H₂O

Each reaction uses **2 mol of H₂** and **1 mol of O₂**, and makes **2 mol of H₂O**. These numbers are the **mole ratio**.

To find the limiting reactant, ask each reactant how many reactions it could supply on its own:

> reactions from H₂ = mol H₂ ÷ 2
>
> reactions from O₂ = mol O₂ ÷ 1

The **smaller** answer wins. That reactant runs out first. The other one is in **excess**, and some of it is left over. The most product you can make is the **theoretical yield**.

## Counting reactions with variables

Here is your code:

```js
let molesH2 = 6;
let molesO2 = 4;

// Returns how many times the reaction can happen before a reactant runs out.
function reactionsPossible(molesH2, molesO2) {
    let fromH2 = molesH2 / 2;   // each reaction uses 2 mol of H2
    return fromH2;
}
```

```python
molesH2 = 6
molesO2 = 4

# Returns how many times the reaction can happen before a reactant runs out.
def reactionsPossible(molesH2, molesO2):
    fromH2 = molesH2 / 2   # each reaction uses 2 mol of H2
    return fromH2
```

- `molesH2` and `molesO2` are **variables** holding your starting moles of each gas.
- Inside `reactionsPossible`, the variable `fromH2` stores the result of some **arithmetic**: `molesH2 / 2` is how many reactions the hydrogen could supply.
- The function returns `fromH2`. It only checks hydrogen so far.
- The last line, `runReaction(molesH2, molesO2, reactionsPossible)`, runs the reaction on the right as many times as your function returns.

## Run it

Press the **Run** button.

Each molecule stands for 1 mol. Hydrogen atoms are teal and oxygen atoms are pink. One reaction at a time, 2 H₂ and 1 O₂ slide to the middle and become 2 H₂O. The caption says which reaction is playing.

After 3 reactions, the H₂ box is empty and 1 O₂ is left over. The 6 water molecules fill the dashed amber circles, which mark the most water possible.

The bottom row shows **H₂ (mol)** and **O₂ (mol)** as start → now, plus **H₂O Made** and **Max H₂O**. Here the code is right, but only because H₂ happens to run out first.

## Step 1: Give it less oxygen

Change the `4` in `molesO2` to `2`:

```js
let molesO2 = 2;
```

```python
molesO2 = 2
```

Run it again.

**Look for:** the third reaction uses an O₂ drawn as a dashed gray outline, and makes dashed water. That oxygen isn't really there. **O₂ (mol)** ends at −1, which is impossible, and **H₂O Made** is 6 while **Max H₂O** is only 4. Your function never checked the oxygen.

## Step 2: Use the oxygen mole ratio

Inside `reactionsPossible`, add this line right under the `fromH2` line. Each reaction uses 1 mol of O₂:

```js
    let fromO2 = molesO2 / 1;   // each reaction uses 1 mol of O2
```

```python
    fromO2 = molesO2 / 1   # each reaction uses 1 mol of O2
```

Run it again.

**Look for:** nothing changes yet. You worked out `fromO2`, but the function still returns `fromH2`.

## Step 3: Return the smaller answer

Replace the `return fromH2` line with an **if statement** that returns whichever answer is smaller:

```js
    if (fromO2 < fromH2) {
        return fromO2;
    }
    return fromH2;
```

```python
    if fromO2 < fromH2:
        return fromO2
    return fromH2
```

A function stops at the first `return` it reaches. If `fromO2` is smaller, it returns `fromO2` and never gets to the last line. Run it again with `molesO2` still at `2`.

**Look for:** the reaction stops after 2 reactions, when the O₂ box is empty. O₂ is the limiting reactant. 2 mol of H₂ is left over, and **H₂O Made** matches **Max H₂O**: 4.

## Step 4: Try lots of extra oxygen

Change the amounts at the top to 4 mol of H₂ and 10 mol of O₂:

```js
let molesH2 = 4;
let molesO2 = 10;
```

```python
molesH2 = 4
molesO2 = 10
```

Run it again.

**Look for:** now H₂ runs out after 2 reactions, and 8 mol of O₂ is left over. Your function picked the right limiting reactant with no other change, because it always compares both reactants.

## Check your understanding

<Question>
You start with 6 mol of H₂ and 5 mol of O₂. Which reactant is limiting?
- [x] H₂, even though there are more moles of it
- [ ] O₂, because there are fewer moles of it
- [ ] Neither, both run out together
> H₂ can supply 6 ÷ 2 = 3 reactions, and O₂ can supply 5 ÷ 1 = 5. The smaller number wins. Compare reactions, not raw moles.
</Question>

<Question>
With `molesH2 = 8` and `molesO2 = 4`, what is left over after the reaction?
- [ ] 4 mol of O₂
- [ ] 4 mol of H₂
- [x] Nothing: both run out after 4 reactions
> 8 ÷ 2 = 4 and 4 ÷ 1 = 4. The amounts are in exactly the 2 : 1 mole ratio, so neither gas is in excess.
</Question>

## Wrap up

You found the limiting reactant by asking how many reactions each reactant could supply, using the mole ratio from the balanced equation. The smaller answer sets the theoretical yield, and the other reactant is left over.

In code, you stored amounts in variables, did arithmetic with them, and used an if statement to return the smaller of two numbers. Your finished `reactionsPossible` works for any amounts.

Next in chemistry, you'll compare the theoretical yield with what a real experiment makes, called the percent yield.
