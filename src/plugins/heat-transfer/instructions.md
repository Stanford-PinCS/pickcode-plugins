# Heat Transfer and Calorimetry

Drop a hot metal block into cool water and heat flows from the metal to the water until they reach the same temperature. You'll use a **while loop**, a loop that keeps going as long as its condition is true, to move heat one small amount at a time.

Click **Next** to continue.

## Where the heat goes

The heat q (in joules) it takes to change a substance's temperature is:

> q = m · c · ΔT

m is the mass in grams, ΔT is the temperature change in °C, and c is the **specific heat**: the joules needed to warm 1 g by 1 °C. Water's is 4.18 J/(g·°C). Copper's is only 0.385, and aluminum's is 0.897.

In a calorimeter, energy is conserved. **Heat lost by the metal = heat gained by the water.** The final temperature is:

> T_final = (m₁c₁T₁ + m₂c₂T₂) ÷ (m₁c₁ + m₂c₂)

## Repeating with a while loop

Your code describes 50 g of copper (`metalMass`, `metalC`, `metalTemp`) at 90 °C and 100 g of water (`waterMass`, `waterC`, `waterTemp`) at 20 °C. Then comes the loop:

```js
while (metalTemp - waterTemp > 0.1) {
    recordTemps(metalTemp, waterTemp);   // save this pass for the drawing
    metalTemp = metalTemp - 0.1;
    waterTemp = waterTemp + 0.1;
}
```

```python
while metalTemp - waterTemp > 0.1:
    recordTemps(metalTemp, waterTemp)   # save this pass for the drawing
    metalTemp = metalTemp - 0.1
    waterTemp = waterTemp + 0.1
```

Before every pass, the loop checks its condition: is the metal still more than 0.1 °C hotter than the water? If so, the body runs again. Each pass, `recordTemps(metalTemp, waterTemp)` saves both temperatures, then the metal cools by 0.1 °C and the water warms by 0.1 °C, whatever their mass and specific heat.

When the condition is false, the loop stops, and `drawCalorimeter()` draws every saved pass on the right.

## Run it

Press the **Run** button.

On the left, a pink metal block sits in teal water, and pink arrows show heat leaving the block. The **Metal** and **Water** thermometers show each temperature, and the caption counts the loop passes.

On the right, the pink metal line falls and the teal water line rises. They meet at 55.0 °C, far above the dashed amber **Predicted** line at 23.1 °C.

The bottom row shows **Metal**, **Water**, **Heat Lost**, and **Heat Gained**. The water gained 14630 J, but the metal lost only 674 J. Energy came from nowhere, so this code can't be right.

## Step 1: Use q = mcΔT

Rearranging q = mcΔT gives ΔT = q ÷ (m·c). Inside the loop, replace the two lines `metalTemp = metalTemp - 0.1` and `waterTemp = waterTemp + 0.1` with these three, so each pass moves 2 J of heat. Keep them indented inside the loop, under `recordTemps`:

```js
    let q = 2;   // joules of heat that move this pass
    metalTemp = metalTemp - q / (metalMass * metalC);
    waterTemp = waterTemp + q / (waterMass * waterC);
```

```python
    q = 2   # joules of heat that move this pass
    metalTemp = metalTemp - q / (metalMass * metalC)
    waterTemp = waterTemp + q / (waterMass * waterC)
```

Run it again.

**Look for:** the metal cools fast while the water barely warms. They meet on the dashed line at 23.1 °C, and **Heat Lost** equals **Heat Gained**: 1288 J.

## Step 2: Switch to aluminum

Change the `metalC` line to aluminum's specific heat:

```js
let metalC = 0.897;     // specific heat in J/(g·°C). Aluminum: 0.897
```

```python
metalC = 0.897     # specific heat in J/(g·°C). Aluminum: 0.897
```

Run it again.

**Look for:** the lines now meet at about 26.8 °C. Each gram of aluminum gives off more than twice as much heat as copper for every degree it cools, so the water ends up warmer.

## Step 3: Use more metal

Change the `metalMass` line to:

```js
let metalMass = 200;    // grams
```

```python
metalMass = 200    # grams
```

Run it again.

**Look for:** the lines meet at about 41.0 °C, and the loop runs about 4388 passes, because it keeps going until the job is done. Check with the formula: (200 × 0.897 × 90 + 100 × 4.18 × 20) ÷ (200 × 0.897 + 100 × 4.18) = 24506 ÷ 597.4 = 41.0 °C, right on the dashed **Predicted** line.

## Step 4: Stop the loop early

Change the first line of the loop so it stops when the gap is 10 °C:

```js
while (metalTemp - waterTemp > 10) {
```

```python
while metalTemp - waterTemp > 10:
```

Run it again.

**Look for:** the loop stops after about 3766 passes, while the metal is still 10 °C hotter: **Metal** 48.0 °C and **Water** 38.0 °C, on either side of the dashed line. The condition alone decides when the loop ends.

## Check your understanding

<Question>
Why did the water's temperature change so much less than the copper's?
- [ ] Heat flows more slowly into water
- [x] Water's m·c is much bigger, so the same joules warm it less
- [ ] The water lost some of its heat to the air
> Water: 100 × 4.18 = 418 J per °C. Copper: 50 × 0.385 = 19.25 J per °C.
</Question>

<Question>
With the condition `metalTemp - waterTemp > 10`, the metal is at 45 °C and the water at 38 °C. What does the loop do?
- [ ] Runs one more pass
- [x] Stops, because the gap of 7 °C is not more than 10
> The loop only runs while its condition is true, and 7 > 10 is false.
</Question>

## Wrap up

You modeled a calorimeter. Heat flows from hot to cold until the temperatures match. With q = mcΔT, the substance with the bigger m·c changes temperature less, heat lost equals heat gained, and the result matches T_final = (m₁c₁T₁ + m₂c₂T₂) ÷ (m₁c₁ + m₂c₂).

On the code side, your while loop repeated one small heat transfer for as long as its condition was true, and changing that condition from `0.1` to `10` changed when it stopped.

Next in chemistry, the same q = mcΔT lets you measure the heat a reaction gives off, its enthalpy change.
