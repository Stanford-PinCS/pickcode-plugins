# Gas Laws

A gas pushes on its container because its particles keep hitting the walls. You'll write a **function with parameters and a return value** that calculates a gas's pressure with the ideal gas law. Then you'll squeeze the gas with a piston and watch the pressure respond.

Click **Next** to continue.

## What makes a gas push

The **ideal gas law** connects pressure, volume, amount of gas and temperature:

> PV = nRT, so P = nRT / V

- **P** is pressure in atm, **V** is volume in L, and **n** is the amount of gas in mol.
- **R** = 0.08206 L·atm/(mol·K).
- **T** must be in **kelvins**: K = °C + 273.15.

**Kinetic molecular theory** explains why. Pressure comes from particles hitting the walls. Squeeze the gas and the hits come more often (**Boyle's law**, P ∝ 1/V). Heat it and the particles move faster and hit harder (**Gay-Lussac's law**, P ∝ T).

## A function that calculates pressure

Here is your code:

```js
let moles = 1;    // n, the amount of gas in mol
let celsius = 0;  // the gas temperature in °C

// Returns the pressure in atm of n mol of gas in volume L at temperature °C.
function calculatePressure(n, volume, temperature) {
    return 1;
}
```

```python
moles = 1    # n, the amount of gas in mol
celsius = 0  # the gas temperature in °C

# Returns the pressure in atm of n mol of gas in volume L at temperature °C.
def calculatePressure(n, volume, temperature):
    return 1
```

- `moles` and `celsius` describe your gas: 1 mol at 0 °C.
- `calculatePressure` has three **parameters**: `n`, `volume` and `temperature`. Each time it's called, the values in the parentheses fill them in order, and `return` hands back the answer. Right now it ignores its inputs and always returns `1`.
- The last line, `runPiston(moles, celsius, calculatePressure)`, pushes the piston from 44.8 L down to 2.8 L. At each volume it calls your function with `moles`, that volume and `celsius`, and shows the number you return as the pressure.

## Run it

Press the **Run** button.

On the left, teal gas particles bounce inside a cylinder, flashing where they hit the walls. The piston slides in and squeezes them. The gauge's pink needle shows what your function returned. The dashed amber mark shows what the ideal gas law predicts.

On the right, the graph plots pressure against volume. Your pink line stays flat at 1 while the dashed amber curve climbs.

The bottom row shows **Volume**, **Pressure** (yours), **Ideal Gas Law** and **Temperature** in kelvins.

The particles hit the walls more and more often, but your function always says 1 atm.

## Step 1: Write P = nRT / V

Inside `calculatePressure`, replace the `return 1` line with the ideal gas law, written with the parameters:

```js
    return (n * 0.08206 * temperature) / volume;
```

```python
    return (n * 0.08206 * temperature) / volume
```

Run it again.

**Look for:** the pink line drops flat onto 0, and the needle points at 0. `temperature` is `0`, so the formula multiplies by zero. But the particles are still moving and hitting the walls: 0 °C is cold, not motionless.

## Step 2: Convert to kelvins

The gas law needs kelvins. Replace the `return` line you just wrote with these two lines:

```js
    let kelvin = temperature + 273.15;
    return (n * 0.08206 * kelvin) / volume;
```

```python
    kelvin = temperature + 273.15
    return (n * 0.08206 * kelvin) / volume
```

Run it again.

**Look for:** the pink line lies on the dashed amber curve, and **Pressure** matches **Ideal Gas Law**. Watch the readings:

- 44.8 L gives 0.50 atm, and 22.4 L gives 1.00 atm (1 mol at 0 °C and 1 atm fills 22.4 L).
- 11.2 L gives 2.00 atm, and 2.8 L gives about 8 atm.

Each time the volume halves, the pressure doubles. That's **Boyle's law**.

## Step 3: Double the temperature

0 °C is 273.15 K. Twice that is about 546 K, which is about 273 °C. Change `celsius` to `273`:

```js
let celsius = 273;  // the gas temperature in °C
```

```python
celsius = 273  # the gas temperature in °C
```

Run it again.

**Look for:** the particles move about 1.4 times as fast, and **Temperature** reads 546 K. Every pressure doubles: 1.00 atm at 44.8 L instead of 0.50, and about 16 atm at 2.8 L. That's **Gay-Lussac's law**.

## Check your understanding

<Question>
Why did the gauge read 0 in Step 1?
- [ ] A gas at 0 °C has no particles
- [x] The formula used °C, and 0 °C made nRT equal zero
- [ ] The volume was too large
> Particles would stop only at 0 K (−273.15 °C), so gas law temperatures must be in kelvins.
</Question>

<Question>
You squeeze a gas from 10 L to 5 L at constant temperature. What happens to its pressure?
- [ ] It halves
- [ ] It stays the same
- [x] It doubles
> Boyle's law: in half the volume, the particles hit the walls twice as often.
</Question>

<Question>
Does warming a gas from 10 °C to 20 °C double its pressure?
- [ ] Yes, because the temperature doubled
- [x] No, because 283 K to 293 K is only about 3.5% warmer
- [ ] No, because pressure doesn't depend on temperature
> Pressure is proportional to the kelvin temperature, and 293 ÷ 283 ≈ 1.035.
</Question>

## Wrap up

You wrote `calculatePressure`, a function that takes `n`, `volume` and `temperature` as parameters, converts the temperature to kelvins, and returns P = nRT / V. Every reading on the gauge was a value your function returned. You saw Boyle's law (halve V, double P) and Gay-Lussac's law (double T in kelvins, double P), both explained by particles hitting the walls.

Next, you'll see when real gases stop acting ideally: at high pressure and low temperature.
