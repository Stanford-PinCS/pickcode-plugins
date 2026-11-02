# Acid-Base Titration

In a titration, you drip a base into an acid a little at a time and measure the pH after each addition. You'll titrate hydrochloric acid (HCl) with sodium hydroxide (NaOH) and watch the pH curve build. Along the way you'll write a **function that uses math** and an **if** chain that picks the right formula.

Click **Next** to continue.

## How pH changes during a titration

**pH = −log[H⁺]**, where [H⁺] is the concentration of H⁺ in mol/L. Every OH⁻ you add uses up one H⁺:

> H⁺ + OH⁻ → H₂O

So the flask is in one of three regions:

- **Before equivalence**, H⁺ is left over: [H⁺] = (moles H⁺ − moles OH⁻) ÷ total liters, and pH = −log[H⁺].
- **At the equivalence point**, the moles are equal. Only water and salt are left, so pH = 7 (at 25 °C).
- **After equivalence**, OH⁻ is left over: pOH = −log[OH⁻], and **pH = 14 − pOH**.

The indicator **phenolphthalein** is colorless below about pH 8.2 and turns pink between 8.2 and 10.

## A function that picks a formula

`acidConcentration` is the HCl in the flask (25.0 mL of it), and `baseConcentration` is the NaOH in the buret, both 0.100 mol/L. Then comes your function:

```js
function calculatePH(molesH, molesOH, totalVolumeL) {
    if (molesH > molesOH) {
        let concentrationH = (molesH - molesOH) / totalVolumeL;
        return -Math.log10(concentrationH);
    }
    return 7;
}
```

```python
def calculatePH(molesH, molesOH, totalVolumeL):
    if molesH > molesOH:
        concentrationH = (molesH - molesOH) / totalVolumeL
        return -math.log10(concentrationH)
    return 7
```

Its parameters are the moles of H⁺, the moles of OH⁻ added so far, and the total liters. If H⁺ is left over, it finds `concentrationH` and returns its negative log with <JavaScript>`Math.log10`</JavaScript><Python>`math.log10` (the `import math` line at the top makes it available)</Python>. Otherwise it returns `7`.

The last line, `runTitration(acidConcentration, baseConcentration, calculatePH)`, adds NaOH 0.5 mL at a time up to 50.0 mL, asks `calculatePH` for the pH after every addition, and draws it on the right.

## Run it

Press the **Run** button.

The buret drips teal NaOH into the flask. Beside it, a pink pH curve builds one point per addition, and a pink ring marks the newest point. The dashed amber line is the equivalence point (25.0 mL). The pale pink band is where phenolphthalein turns pink.

The curve rises slowly from pH 1.00. Near the dashed line the dripping slows down, the curve jumps to 7, and the run pauses on the equivalence point. After that the curve stays flat at 7, and the flask never turns pink. That's wrong: your function returns `7` for every addition after equivalence.

The bottom row shows **Base Added**, **pH**, **Region**, and **Equivalence**.

## Step 1: Add the excess OH⁻ branch

After equivalence, OH⁻ is left over, so you need pOH. Replace your whole `calculatePH` function with this one. It adds <JavaScript>an `else if`</JavaScript><Python>an `elif`</Python> branch for excess OH⁻ and moves `return 7` into an `else`: when the moles are equal, nothing is left over to take the log of, so the pH is 7:

```js
function calculatePH(molesH, molesOH, totalVolumeL) {
    if (molesH > molesOH) {
        let concentrationH = (molesH - molesOH) / totalVolumeL;
        return -Math.log10(concentrationH);
    } else if (molesOH > molesH) {
        let concentrationOH = (molesOH - molesH) / totalVolumeL;
        let pOH = -Math.log10(concentrationOH);
        return 14 - pOH;
    } else {
        return 7;
    }
}
```

```python
def calculatePH(molesH, molesOH, totalVolumeL):
    if molesH > molesOH:
        concentrationH = (molesH - molesOH) / totalVolumeL
        return -math.log10(concentrationH)
    elif molesOH > molesH:
        concentrationOH = (molesOH - molesH) / totalVolumeL
        pOH = -math.log10(concentrationOH)
        return 14 - pOH
    else:
        return 7
```

Run it again.

**Look for:** the run still pauses at 25.0 mL with **Region** **Equivalence** and **pH** **7.00**. One addition later the curve shoots up to about pH 11, then levels off near 12.5. The flask turns pink as the curve crosses the pale pink band, and **Region** says **Excess OH⁻**.

## Step 2: Dilute the acid

Change the `acidConcentration` line to:

```js
let acidConcentration = 0.050;   // mol/L of HCl in the flask
```

```python
acidConcentration = 0.050   # mol/L of HCl in the flask
```

Run it again.

**Look for:** the dashed line moves to 12.5 mL. Half as much acid needs half as much base. The curve also starts higher, at pH 1.30, because the acid is more dilute.

## Step 3: Use a stronger acid

Change the `acidConcentration` line to:

```js
let acidConcentration = 0.150;   // mol/L of HCl in the flask
```

```python
acidConcentration = 0.150   # mol/L of HCl in the flask
```

Run it again.

**Look for:** the equivalence point moves to 37.5 mL, and the curve starts at pH 0.82. Moles of acid = moles of base, so the equivalence volume is `acidConcentration` × 25.0 mL ÷ `baseConcentration`.

## Check your understanding

<Question>
With both concentrations at 0.100 M, which branch of `calculatePH` runs after 30.0 mL of NaOH?
- [ ] `molesH > molesOH`
- [x] `molesOH > molesH`
- [ ] The `else`
> Equivalence is at 25.0 mL. Past it, OH⁻ is left over, so the function returns 14 − pOH.
</Question>

<Question>
Phenolphthalein turns pink between pH 8.2 and 10, not at 7. Why is it still a good indicator here?
- [ ] It changes color before the equivalence point
- [x] The curve is so steep at equivalence that one small addition jumps past 8.2
> One 0.5 mL addition takes the pH from 7 to about 11.
</Question>

## Wrap up

You wrote `calculatePH` with three branches: excess H⁺ (pH = −log[H⁺]), excess OH⁻ (pH = 14 − pOH), and the equivalence point (pH = 7). With 0.150 M HCl, the equivalence point moved to 37.5 mL, because equivalence is where moles of acid equal moles of base.

On the code side, you used <JavaScript>`Math.log10`</JavaScript><Python>`math.log10`</Python> inside a function, and `if`, <JavaScript>`else if`</JavaScript><Python>`elif`</Python>, and `else` to pick one formula for each case.

Next, try a weak acid: its curve has a buffer region, and at the half-equivalence point, pH = pKa.
