# Chemical Equilibrium

Some reactions run both ways at once, and they keep shifting until they settle at **equilibrium**. You'll write a function with **if** and **else** that looks at the mixture and decides which way the reaction shifts, then watch it move pass by pass.

Click **Next** to continue.

## Which way a reaction shifts

Your reaction is N₂O₄ ⇌ 2NO₂. Going **forward**, one N₂O₄ splits into two NO₂. Going in **reverse**, two NO₂ join into one N₂O₄. Both happen all the time. At equilibrium the forward and reverse rates are equal, so the concentrations stop changing. That's **dynamic equilibrium**.

The **reaction quotient** compares the mixture right now:

> Q = [NO₂]² / [N₂O₄]

The **equilibrium constant** K is the value of Q at equilibrium. Here K = 0.36.

- Q < K: the reaction shifts forward, toward products.
- Q > K: it shifts in reverse, toward reactants.
- Q = K: it's at equilibrium.

**Le Chatelier's principle:** disturb an equilibrium and it shifts to bring Q back to K.

## Deciding with if and else

Your code starts with `startN2O4 = 1.0` and `startNO2 = 0.0`, the starting concentrations in mol/L (M), then `K = 0.36`, and `addN2O4 = 0`, extra N₂O₄ to add once the reaction settles.

Your function decides the direction:

```js
function chooseDirection(Q, K) {
    if (Q < K) {
        return "forward";
    } else {
        return "equilibrium";
    }
}
```

```python
def chooseDirection(Q, K):
    if Q < K:
        return "forward"
    else:
        return "equilibrium"
```

If `Q < K` is true, it returns `"forward"`. If not, the `else` returns `"equilibrium"`.

The last line, `runReaction(startN2O4, startNO2, K, addN2O4, chooseDirection)`, asks `chooseDirection` which way to go, reacts a little that way, and asks again with the new Q. It stops when your function returns `"equilibrium"`, or after 50 passes.

## Run it

Press the **Run** button.

On the left, the teal line (N₂O₄) falls from 1.0 and the pink line (NO₂) rises from 0. On the right, teal N₂O₄ pairs split into pink NO₂ particles. Above them you'll see the pass number, **→ forward**, and a line showing what `chooseDirection` returned. The Q marker climbs the **Q vs K** gauge toward the dashed amber K line.

The bottom row shows **Pass**, **Direction**, **Q**, and **K**.

After 20 passes, Q reaches 0.366. Now `Q < K` is false, so your `else` returns `"equilibrium"`: **Stopped after 20 passes**. Particles keep swapping both ways, because equilibrium is dynamic.

## Step 1: Start with lots of product

Change the `startN2O4` and `startNO2` lines to:

```js
let startN2O4 = 0.4;
let startNO2 = 0.8;
```

```python
startN2O4 = 0.4
startNO2 = 0.8
```

Run it again.

**Look for:** Q starts at 1.600, far above the dashed K line. It stops after 0 passes, with **Q > K: not at equilibrium yet**. Your function only checks `Q < K`. When that's false, the `else` says `"equilibrium"`, even though the reaction should shift in reverse.

## Step 2: Add the reverse branch

Replace your whole `chooseDirection` function with this one, which adds <JavaScript>an `else if`</JavaScript><Python>an `elif`</Python> for `Q > K`:

```js
function chooseDirection(Q, K) {
    if (Q < K) {
        return "forward";
    } else if (Q > K) {
        return "reverse";
    } else {
        return "equilibrium";
    }
}
```

```python
def chooseDirection(Q, K):
    if Q < K:
        return "forward"
    elif Q > K:
        return "reverse"
    else:
        return "equilibrium"
```

Run it again.

**Look for:** **← reverse**. Pink NO₂ particles join into teal pairs, and Q falls toward K. Near K, the direction flips between forward and reverse on every pass. It runs all 50 passes and stops at the **50-pass limit**. Q never lands exactly on 0.36.

## Step 3: Check for close enough

Each pass moves Q in a small jump, so Q hops from just above K to just below it, and is almost never exactly equal. Check whether Q is **close enough** to K instead, and put that check first. Replace your whole `chooseDirection` function with:

```js
function chooseDirection(Q, K) {
    if (Math.abs(Q - K) < 0.01) {
        return "equilibrium";
    } else if (Q < K) {
        return "forward";
    } else {
        return "reverse";
    }
}
```

```python
def chooseDirection(Q, K):
    if abs(Q - K) < 0.01:
        return "equilibrium"
    elif Q < K:
        return "forward"
    else:
        return "reverse"
```

<JavaScript>`Math.abs(Q - K)`</JavaScript><Python>`abs(Q - K)`</Python> is the distance between Q and K, whichever is bigger.

Run it again.

**Look for:** it stops after 14 passes with **⇌ equilibrium**. Q is 0.369, within 0.01 of K.

## Step 4: Disturb the equilibrium

Change the `addN2O4` line to:

```js
let addN2O4 = 0.5; // extra N2O4 to add after it settles
```

```python
addN2O4 = 0.5  # extra N2O4 to add after it settles
```

Run it again.

**Look for:** after the first 14 passes, a dashed line on the chart marks **N₂O₄ added**. The teal line jumps up and new teal pairs appear. N₂O₄ is the bottom of Q's fraction, so Q drops to about 0.197, below K. The direction switches to **→ forward** until Q is back near K. That's Le Chatelier's principle. It stops after 24 passes in total, at about 1.002 M N₂O₄ and 0.596 M NO₂.

## Check your understanding

<Question>
Q = 0.10 and K = 0.36. What does your final `chooseDirection` return?
- [x] `"forward"`
- [ ] `"reverse"`
- [ ] `"equilibrium"`
> Q is less than K and more than 0.01 away, so it shifts forward.
</Question>

<Question>
Why does the close-enough check come first?
- [ ] Because `Q < K` is never true
- [x] Otherwise `Q < K` or `Q > K` would almost always win, so it never returns `"equilibrium"`
> The chain stops at the first true condition, and Q is almost never exactly K.
</Question>

<Question>
At equilibrium, you add extra NO₂. Which way does it shift?
- [ ] Forward
- [x] Reverse
> NO₂ is on top of Q's fraction, so adding it raises Q above K, and Q > K shifts in reverse.
</Question>

## Wrap up

You built `chooseDirection` with `if`, <JavaScript>`else if`</JavaScript><Python>`elif`</Python>, and `else`: it returns `"equilibrium"` when Q is within 0.01 of K, `"forward"` when Q is smaller, and `"reverse"` when Q is bigger. The order of the checks mattered.

On the chemistry side, comparing Q to K tells you which way a reaction shifts, and adding a reactant pushes it forward until Q is back at K.

Checking whether a value is close enough, instead of exactly equal, shows up next whenever a program searches for an answer step by step.
