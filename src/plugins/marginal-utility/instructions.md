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

- 🍎 **Apple** — $2 each. Marginal utility starts at 30 and drops by 10 with every apple you buy.
- 🍌 **Banana** — $1 each. Marginal utility starts at 20 and drops by 5 with every banana you buy.

You don't have to track the counts, the budget, or who's affordable — the simulation does that for you and updates the numbers each round. Your only job is to look at the current numbers and decide which fruit is the better buy _right now_.

## Your task

Fill in the `choose` function. Each round it's handed four numbers:

- `mu_a` — the apple's current marginal utility
- `p_a` — the apple's price
- `mu_b` — the banana's current marginal utility
- `p_b` — the banana's price

Compute each fruit's MU-per-price ratio, then **return** the one that's higher.

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

`optimize` calls your `choose` over and over, spending a $7 budget one purchase at a time. Each pick is checked live: a **solid green** card means you returned the higher-ratio fruit, a **dashed red** card means the other one was the better buy.

## Money matters too

The shopper only has **$7**. Once a fruit's price no longer fits what's left, its card dims and reads "Not enough money left" — `choose` shouldn't (and can't) buy it anymore. If your function tries anyway, you'll see a red message explaining why that pick didn't count.

The trip ends the moment _neither_ fruit fits the remaining budget. A green summary then shows exactly how much you spent and the **total utility** you earned across every purchase — the running total of all that "extra satisfaction," added up. Two shoppers who spend the same $7 differently will walk away with different totals; the ratio strategy is what maximizes it.

## Challenges

- Always `return "apple"` no matter what. Watch where the dashed-red picks show up — and watch how quickly you run out of money for apples specifically while banana money sits unspent.
- What should `choose` do when the two ratios are exactly equal? Try `>` vs `>=` and see if the outcome changes.
- Before running, predict the first pick by hand: the apple starts at MU 30 / $2 = 15, the banana at MU 20 / $1 = 20. Which should go in the basket first?
- Once you've run the ratio strategy, note the total utility in the summary banner. Then try a deliberately worse strategy (like always-apple) and compare totals — that gap _is_ the value of shopping by MU-per-price instead of by MU alone.
