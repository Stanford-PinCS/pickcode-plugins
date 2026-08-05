# The Haber Process

Ammonia (NH₃) is made industrially by combining nitrogen and hydrogen gas:

```
N₂ + 3H₂ → 2NH₃
```

The numbers in front are a recipe. Every **1** mol of N₂ needs exactly **3** mol of H₂, and together they make **2** mol of NH₃. That 1 : 3 ratio drives everything below.

## Limiting reactant

If your gases aren't in that exact 1 : 3 ratio, one runs out first. That one is the **limiting reactant** — it caps how much NH₃ you can make. The other is left over in excess.

Compare what you have to the recipe. Each mol of H₂ needs one-third of a mol of N₂, so the N₂ needed to use up **all** your H₂ is:

```
needed_n2 = h2 / 3
```

- If you have **more** N₂ than `needed_n2`, hydrogen runs out first → limiting is `"h2"`.
- If you have **less** N₂ than `needed_n2`, nitrogen runs out first → limiting is `"n2"`.
- If they're **equal**, neither runs out → limiting is `"None"`.

## How much ammonia

Use the limiting reactant and the recipe ratios:

- 1 mol N₂ produces **2** mol NH₃ → if N₂ limits, `nh3_made = 2 * n2`
- 3 mol H₂ produce **2** mol NH₃ → if H₂ limits, `nh3_made = (2 / 3) * h2`

If neither limits (exact ratio), either formula gives the same answer.

## Your task

Fill in the `resulting_nh3` function. It already gives you `h2` and `n2`, an empty `nh3_made`, and an empty `limiting`. Your job is the three TODOs:

```
function resulting_nh3() {
  let h2 = 5;
  let n2 = 3;

  let needed_n2 = h2 / 3;   // TODO 3

  let nh3_made = 0;
  let limiting = "";        // "n2", "h2", or "None"

  // TODO 2 — decide the limiting reactant and the ammonia made:
  if (n2 > needed_n2) {
    limiting = "h2";
    nh3_made = (2 / 3) * h2;
  } else if (n2 < needed_n2) {
    limiting = "n2";
    nh3_made = 2 * n2;
  } else {
    limiting = "None";
    nh3_made = 2 * n2;
  }

  return {
    "h2_reactant_amount": h2,
    "n2_reactant_amount": n2,
    "nh3_product_made": nh3_made,
    "limiting_reactant": limiting,
  };
}

proceed(resulting_nh3);
```

Run it. The display fills in the true answer, animates each reactant being consumed, highlights the limiting one, and marks your returned values ✓ or ✗.

## Challenges

- Feed an exact 3 : 1 ratio (like `h2 = 6`, `n2 = 2`). Neither reactant limits, and nothing is left over.
- Give a big excess of H₂ (`h2 = 20`, `n2 = 2`). N₂ limits — predict the leftover H₂ before running.
- Reverse it: lots of N₂, little H₂, and confirm H₂ becomes limiting.
