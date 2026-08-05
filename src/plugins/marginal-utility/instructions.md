# Marginal Utility

**Utility** is a way of measuring satisfaction. The **marginal utility** (MU) of something is the _extra_ satisfaction you get from one more unit of it.

A key idea in economics: marginal utility **diminishes**. Your first apple is delicious; the fifth one, less so. Each additional unit adds a little less than the one before.

## Getting the most for your money

With a limited budget, the smart move isn't to buy whatever has the highest utility — it's to buy whatever gives the most utility **per dollar spent**. That's the **MU-per-price ratio**:

```
ratio = marginalUtility / price
```

Each round, put your money where that ratio is highest.

## The two fruits

- 🍎 **Apple** — its marginal utility starts high but drops quickly as you buy more.
- 🍌 **Banana** — cheaper, with its own marginal utility that also falls as you buy more.

You don't have to track the counts or the budget yourself — the simulation does that for you and updates the numbers each round. Your only job is to look at the current numbers and decide which fruit is the better buy _right now_.

## Your task

Fill in the `choose` function. Each round it's handed four numbers:

- `mu_a` — the apple's current marginal utility
- `p_a` — the apple's price
- `mu_b` — the banana's current marginal utility
- `p_b` — the banana's price

Compute each fruit's MU-per-price ratio, then **return** the one that's higher.

> **Confirm the return value against your starter code.** Since your plugin's choices are the strings `"apple"` and `"banana"`, I've assumed `choose` returns one of those. If it expects something else, tell me and I'll fix this one line.

```
function choose(mu_a, p_a, mu_b, p_b) {
  const appleRatio = mu_a / p_a;
  const bananaRatio = mu_b / p_b;

  if (appleRatio >= bananaRatio) {
    return "apple";
  } else {
    return "banana";
  }
}

optimize(choose);
```

`optimize` calls your `choose` over and over, spending the budget one purchase at a time. Each pick is checked live: a **solid green** card means you returned the higher-ratio fruit, a **dashed red** card means the other one was the better buy.

## Challenges

- Always `return "apple"` no matter what. Watch where the dashed-red picks show up.
- What should `choose` do when the two ratios are exactly equal? Try `>` vs `>=` and see if the outcome changes.
- Before running, predict the first pick by hand: the apple starts at MU 30 / \$2 = 15, the banana at MU 20 / \$1 = 20. Which should go in the basket first?
