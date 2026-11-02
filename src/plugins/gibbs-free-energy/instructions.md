# Gibbs Free Energy

Whether a reaction happens on its own depends on temperature. You'll calculate the Gibbs free energy, ΔG, at many temperatures and sort each one into "spontaneous" or "nonspontaneous." Along the way you'll use a **for loop** that repeats over a range of temperatures and an **if statement** that labels each one.

Click **Next** to continue.

## When a reaction runs on its own

**ΔG = ΔH − TΔS**

ΔH is in **kJ/mol**, but ΔS is in **J/(mol·K)**, so divide ΔS by 1000 before you subtract. T is in kelvin.

If **ΔG < 0**, the reaction is **spontaneous** (AP Chemistry says *thermodynamically favored*). If ΔG > 0, it is **nonspontaneous**.

| ΔH | ΔS | Spontaneous when? |
| --- | --- | --- |
| − | + | always |
| + | − | never |
| − | − | at low T |
| + | + | at high T |

When ΔH and ΔS share a sign, ΔG = 0 at the **crossover temperature**, T = ΔH ÷ ΔS. ΔG° is also tied to equilibrium: ΔG° = −RT ln K, so a negative ΔG° means K > 1.

## Sweeping temperatures with a for loop

`deltaH = -92.2` and `deltaS = -198.3` are for making ammonia, N₂ + 3H₂ → 2NH₃. Then the loop:

```js
for (let temperature = 200; temperature <= 1000; temperature += 50) {
    let deltaG = deltaH - temperature * deltaS / 1000;   // ÷ 1000 turns J into kJ
    let label = "spontaneous";

    // Send this temperature's point to the chart.
    plotPoint(temperature, deltaG, label);
}
```

```python
for temperature in range(200, 1001, 50):
    deltaG = deltaH - temperature * deltaS / 1000   # ÷ 1000 turns J into kJ
    label = "spontaneous"

    # Send this temperature's point to the chart.
    plotPoint(temperature, deltaG, label)
```

<JavaScript>The loop starts `temperature` at 200, keeps going while `temperature <= 1000`, and adds 50 each pass.</JavaScript><Python>`range(200, 1001, 50)` starts `temperature` at 200 and adds 50 each pass. It stops just before 1001, so 1000 is included.</Python> That's 17 temperatures. Each pass computes `deltaG`, sets `label` to `"spontaneous"` no matter what, and `plotPoint(temperature, deltaG, label)` sends the point to the chart.

After the loop, `drawGibbsChart()` plays every point back on the right, one temperature at a time.

## Run it

Press the **Run** button.

In the chart, points appear one temperature at a time. A ring and a dotted line mark the current temperature. The dashed amber line is ΔG = 0. Every point is teal (**Spontaneous**), even the ones above the dashed line. An amber diamond marks the crossover, where ΔG crosses 0.

Beside the chart, the purple thermometer shows the current temperature, and the flask bubbles and says **Proceeds** at every temperature.

The bottom row shows **Temperature**, **ΔG**, **Crossover** (465 K), and **Correct Labels**, which ends at only 6/17.

## Step 1: Write the if statement

ΔG < 0 means spontaneous. Inside the loop, replace the line <JavaScript>`let label = "spontaneous";`</JavaScript><Python>`label = "spontaneous"`</Python> with these lines, indented the same way:

```js
    let label = "nonspontaneous";
    if (deltaG < 0) {
        label = "spontaneous";
    }
```

```python
    label = "nonspontaneous"
    if deltaG < 0:
        label = "spontaneous"
```

Run it again.

**Look for:** points below the dashed line stay teal, and points above it turn pink (**Nonspontaneous**). Above 465 K the flask stops bubbling and says **Does not proceed**. **Correct Labels** reaches 17/17.

## Step 2: Try a reaction that always runs

Change the `deltaH` and `deltaS` lines to these values for hydrogen peroxide breaking down, 2H₂O₂ → 2H₂O + O₂:

```js
let deltaH = -196.0;  // kJ/mol
let deltaS = 125.6;   // J/(mol·K)
```

```python
deltaH = -196.0  # kJ/mol
deltaS = 125.6   # J/(mol·K)
```

Run it again.

**Look for:** every point is teal and below the dashed line, and there's no diamond. **Crossover** says **None**: with ΔH negative and ΔS positive, ΔG is negative at every temperature.

## Step 3: Melt some ice

Change the `deltaH` and `deltaS` lines to these values for ice melting, H₂O(s) → H₂O(l):

```js
let deltaH = 6.01;    // kJ/mol
let deltaS = 22.0;    // J/(mol·K)
```

```python
deltaH = 6.01    # kJ/mol
deltaS = 22.0    # J/(mol·K)
```

Before you run it, predict the crossover: T = ΔH ÷ ΔS = 6010 J/mol ÷ 22.0 J/(mol·K) ≈ 273 K.

Run it again.

**Look for:** the points at 200 K and 250 K are pink, and every point from 300 K up is teal. The diamond and **Crossover** both say **273 K**. That's 0 °C: ice melts on its own above its melting point and not below it.

## Step 4: Zoom in with the loop

The flip happens between 250 K and 300 K. Change the first line of the loop so it starts at 250, ends at 300, and steps by 5:

```js
for (let temperature = 250; temperature <= 300; temperature += 5) {
```

```python
for temperature in range(250, 301, 5):
```

Run it again.

**Look for:** 11 points now, and the temperature axis runs only from 250 to 300 K. The color flips from pink to teal between 270 K and 275 K, right where the diamond sits at 273 K.

## Check your understanding

<Question>
A reaction has a negative ΔH and a negative ΔS. When is it spontaneous?
- [ ] At every temperature
- [x] Only at low temperatures, below the crossover
- [ ] Only at high temperatures, above the crossover
> −TΔS is positive and grows with T, so at high T, ΔG turns positive.
</Question>

<Question>
For ice, what would happen if you deleted `/ 1000` from the `deltaG` line?
- [ ] Nothing, because the units cancel
- [x] The crossover would be about 0.27 K instead of 273 K
> TΔS would be 1000 times too big: 6.01 ÷ 22.0 ≈ 0.27.
</Question>

<Question>
How many points does <JavaScript>`for (let temperature = 250; temperature <= 300; temperature += 5)`</JavaScript><Python>`for temperature in range(250, 301, 5)`</Python> send?
- [ ] 10
- [x] 11
> 250, 255, … 300: both ends count.
</Question>

## Wrap up

You used a `for` loop to sweep temperatures and an `if` statement to label each one by the sign of ΔG. With ice, ΔH = 6.01 kJ/mol and ΔS = 22.0 J/(mol·K), and your zoomed-in loop showed the flip at the crossover, T = ΔH ÷ ΔS ≈ 273 K. Here ΔH and ΔS are treated as constant at every temperature, the same approximation AP Chemistry uses.

Next, ΔG shows up in electrochemistry: ΔG° = −nFE°, so a battery with a positive cell voltage runs spontaneously.
