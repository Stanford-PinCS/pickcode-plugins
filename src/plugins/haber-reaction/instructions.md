# The Haber Process

Factories make ammonia by combining nitrogen gas and hydrogen gas. If the gases aren't mixed in the right amounts, one runs out first and the reaction stops. You'll write **if statements** that decide which gas runs out first.

Click **Next** to continue.

## Which gas runs out first

Here is the recipe for ammonia (NH₃):

**N₂ + 3H₂ → 2NH₃**

Every 1 mole of nitrogen (N₂) needs exactly 3 moles of hydrogen (H₂). Together they make 2 moles of ammonia.

The gas that runs out first is the **limiting reactant**. To use up all your hydrogen, you need one-third as much nitrogen: `h2 / 3`.

- Less nitrogen than `h2 / 3`: nitrogen runs out first.
- More nitrogen than `h2 / 3`: hydrogen runs out first.
- Exactly `h2 / 3`: neither runs out first. Both are used up together.

## Answering with a function

Your code starts with the amount of each gas:

```js
let h2 = 6; // moles of hydrogen
let n2 = 3; // moles of nitrogen
```

Next is your function. It gets both amounts and must `return` the gas that runs out first: `"h2"`, `"n2"`, or `"neither"`. Right now it returns `"h2"` every time, without looking at the amounts:

```js
function findLimiting(h2, n2) {
    return "h2";
}
```

The last line, `reactGases(h2, n2, findLimiting);`, reacts your gases on the right and checks the answer your function gives.

## Run it

Press the **Run** button.

Two cards show the gases: hydrogen with a teal bar and nitrogen with an amber bar. The bars shrink as the gases are used up, and a pink number counts up the ammonia made.

When the reaction ends, the hydrogen card is outlined and marked **Limiting reactant**. Under **Your answer**, "h2" shows in green with the word **correct**, because 6 moles of hydrogen only needs 2 of your 3 moles of nitrogen.

The bottom row shows **H₂ left** 0 mol, **N₂ left** 1 mol, **NH₃ made** 4 mol, and **Limiting** H₂.

## Step 1: Use less nitrogen

Change the `n2` line to:

```js
let n2 = 1; // moles of nitrogen
```

Run it again.

**Look for:** now the nitrogen card is marked **Limiting reactant**, with **N₂ left** 0 mol and **H₂ left** 3 mol. Your answer "h2" turns red with **not quite**. A function that always gives the same answer can't keep up when the amounts change.

## Step 2: Check the nitrogen with an if

Inside `findLimiting`, replace the line `return "h2";` with these lines:

```js
    if (n2 < h2 / 3) {
        return "n2";
    }
    return "h2";
```

Keep `n2` at `1`. Run it again.

**Look for:** your answer "n2" shows in green. `1 < 6 / 3` is true, so the code inside the `if` runs and `return "n2";` ends the function right there.

## Step 3: Test the other case

Change `n2` back to `3`:

```js
let n2 = 3; // moles of nitrogen
```

Run it again.

**Look for:** hydrogen is limiting again, and your answer "h2" is still green. Now `3 < 6 / 3` is false, so the code inside the `if` is skipped and the line after it, `return "h2";`, runs.

## Step 4: Try the exact recipe

Change `n2` to exactly `6 / 3`:

```js
let n2 = 2; // moles of nitrogen
```

Run it again.

**Look for:** **H₂ left** and **N₂ left** are both 0 mol, **Limiting** says Neither, and no card is marked. Your answer "h2" is red, because nothing ran out first.

## Step 5: Add else if and else

Replace everything inside the curly braces of `findLimiting` with:

```js
    if (n2 < h2 / 3) {
        return "n2";
    } else if (n2 > h2 / 3) {
        return "h2";
    } else {
        return "neither";
    }
```

Run it again, with `n2` still at `2`.

**Look for:** your answer "neither" shows in green. Try `n2` at `1` and `3` again. Your function is correct every time.

## Check your understanding

<Question>
You set `h2` to `9` and `n2` to `5`. What should `findLimiting` return?
- [ ] `"n2"`
- [x] `"h2"`
- [ ] `"neither"`
> To use up 9 moles of hydrogen you need `9 / 3`, which is 3 moles of nitrogen. You have 5, more than 3, so hydrogen runs out first.
</Question>

<Question>
In your final `findLimiting`, when does the `else` block run?
- [ ] When `n2` is less than `h2 / 3`
- [ ] When `n2` is greater than `h2 / 3`
- [x] When both conditions above are false, so `n2` equals `h2 / 3`
> `else` only runs if every condition before it was false. If `n2` is neither less than nor greater than `h2 / 3`, it must be equal.
</Question>

## Wrap up

You learned that the limiting reactant is the gas that runs out first, found by comparing `n2` to `h2 / 3`. You used `if`, `else if`, and `else` so `findLimiting` picks one of three answers, and it now returns `"neither"` for the exact recipe of 6 and 2 moles.

Chemists use the limiting reactant to plan how much of each ingredient to buy, and the same `if` / `else if` / `else` pattern shows up any time a program picks between choices.
