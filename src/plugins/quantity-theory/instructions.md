# Quantity Theory of Money

Selvaro, a made-up country, has a central bank that grows the money supply by the same percentage every year. What does that do to prices, and to how much Selvaro produces? You'll use the **quantity theory of money** to find Selvaro's price level from its money supply, then follow its money supply, price level and real output for 10 years. Along the way you'll write a **function that rearranges an equation** and a **loop that compounds a growth rate**.

Click **Next** to continue.

## Money growth and inflation

Inflation is a **monetary phenomenon**: **inflation** results from increasing the money supply at too rapid of a rate for a sustained period of time, and **deflation** results from decreasing the money supply at too rapid of a rate for a sustained period of time.

The **quantity theory of money** uses the **equation of exchange**, M × V = P × Y:

- **M** is the money supply.
- **V** is the **velocity** of money: how many times, on average, a dollar is spent on output in a year.
- **P** is the **price level**.
- **Y** is **real output**, like real GDP: aggregate output measured using constant prices, which removes the effect of changes in the overall price level.

A dollar is spent V times a year on average, so M × V is the spending on output in a year, which is **nominal GDP**: a measure of how much is spent on output. P × Y is the same spending: real output valued at the price level.

This lesson follows Selvaro in the long run, when all prices and wages are fully flexible. Selvaro's economy is at **full employment**, its velocity stays at 4, and its full-employment level of output doesn't change in these 10 years. When the economy is at full employment, changes in the money supply have no effect on real output in the long run, so Selvaro's real output stays at its full-employment level, $1,000 billion. With V and Y fixed, the price level can change only when the money supply does. In the long run, the growth rate of the money supply determines the growth rate of the price level, the **inflation rate**, according to the quantity theory of money.

The inflation rate is the percentage change in the price level from one year to the next: (this year's P − last year's P) ÷ last year's P × 100. The **money growth rate** is the same percentage change for the money supply.

## A function and a loop

Here is your code:

```js
// Selvaro's economy, at full employment. Amounts are in billions of dollars.
let money = 500;        // the money supply in year 0, M
let velocity = 4;       // times a dollar is spent on output in a year, V
let realOutput = 1000;  // real output, Y
let moneyGrowth = 5;    // the money supply's growth rate, in % a year
let years = 10;         // how many years to follow

// Returns the price level, P, from the equation of exchange M × V = P × Y.
function priceLevel(money, velocity, realOutput) {
    return money;
}

// Returns a list of the money supply in each year, from year 0 to the last year.
function moneySupplyByYear(money, moneyGrowth, years) {
    let supply = [money];
    for (let year = 1; year <= years; year++) {
        supply.push(money);
    }
    return supply;
}
```

```python
# Selvaro's economy, at full employment. Amounts are in billions of dollars.
money = 500        # the money supply in year 0, M
velocity = 4       # times a dollar is spent on output in a year, V
realOutput = 1000  # real output, Y
moneyGrowth = 5    # the money supply's growth rate, in % a year
years = 10         # how many years to follow

# Returns the price level, P, from the equation of exchange M × V = P × Y.
def priceLevel(money, velocity, realOutput):
    return money

# Returns a list of the money supply in each year, from year 0 to the last year.
def moneySupplyByYear(money, moneyGrowth, years):
    supply = [money]
    for year in range(1, years + 1):
        supply.append(money)
    return supply
```

- `money` and `realOutput` are M and Y in year 0, in billions of dollars, and `velocity` is V. Velocity and real output stay the same every year.
- `moneyGrowth` is how fast Selvaro's central bank grows the money supply: 5% a year.
- `priceLevel` should return the price level, P, for one year's money supply. Right now it returns the money supply itself.
- `moneySupplyByYear` should return a list of the money supply in each year, from year 0 to year 10. The list starts with year 0's money supply, and each pass of the loop adds the next year's to the end. Right now each pass adds the same `money`, so the money supply never grows and `moneyGrowth` goes unused.
- The last two lines find the money supply in each year with `moneySupplyByYear`. Then `drawEconomy(supply, velocity, realOutput, priceLevel)` calls your `priceLevel` for each year, works out each year's money growth and inflation rates, and draws them.

## Run it

Press the **Run** button.

The top row draws three line graphs, one point per year from year 0 to year 10: the **money supply**, M, in teal; the **price level**, P, with your price level in pink and the correct price level for each year's money supply as a dashed amber line; and **real output**, Y, in purple. **$B** means billions of dollars.

Your price level is 500, the money supply itself. That's far above the top of its graph, so pink arrowheads mark it along the top edge, while the amber line sits at 2.

Under them, each year from 1 to 10 gets a pair of bars: the **money growth rate**, the percentage change in your loop's money supply from the year before, in teal, and the **inflation rate**, the percentage change in your price level from the year before, in pink. There are no bars yet: the money supply stays at $500 billion, so both rates are 0% every year.

The bottom row follows the lines from year to year and stops at the last year. **Year** is the year it shows. **Money supply** is that year's money supply from your loop, and **Price level** is what your `priceLevel` returned for it. **Money growth** and **Inflation** are that year's two rates, from the year before to that year, so they show a dash in year 0. When the run ends, the row reads year 10, a money supply of $500B, a price level of 500.00, and 0% for both rates.

## Step 1: Rearrange the equation

`priceLevel` needs P by itself. Divide both sides of M × V = P × Y by Y:

P = M × V ÷ Y

Replace the `return` line inside `priceLevel` with this one:

```js
    return money * velocity / realOutput;
```

```python
    return money * velocity / realOutput
```

Multiplying and dividing go from left to right, so this multiplies `money` by `velocity` first, then divides by `realOutput`: M × V ÷ Y.

Run it again.

**Look for:** your pink line drops onto the amber line, and **Price level** reads 2.00: 500 × 4 ÷ 1,000 = 2.

- Both sides of the equation of exchange match: M × V = 500 × 4 = 2,000, and P × Y = 2 × 1,000 = 2,000.
- The money supply still stays at $500 billion, so the price level stays at 2.00 every year, and **Money growth** and **Inflation** read 0%.

## Step 2: Grow the money supply every year

To grow the money supply by 5% a year, multiply it by 1 + 5 ÷ 100 = 1.05 every year. Replace the loop in `moneySupplyByYear` with this one:

```js
    for (let year = 1; year <= years; year++) {
        money = money * (1 + moneyGrowth / 100);
        supply.push(money);
    }
```

```python
    for year in range(1, years + 1):
        money = money * (1 + moneyGrowth / 100)
        supply.append(money)
```

`moneyGrowth / 100` turns 5 percent into 0.05. Each pass multiplies `money` by 1.05 and adds the result to the list: 500 × 1.05 = 525 for year 1, then 525 × 1.05 = 551.25 for year 2. Each pass starts from the money supply the pass before left in `money`, so the growth **compounds**: year 2's 5% is 5% of 525, not 5% of 500.

Run it again.

**Look for:** the money supply climbs from $500 billion to $814.45 billion in year 10, and your price level climbs with it along the amber line, from 2.00 to 3.26. Each pair of bars is the same height: **Money growth** and **Inflation** read 5% in every year. Real output stays at $1,000 billion.

- Over the 10 years, the money supply grew 62.9%. That's more than 10 × 5% = 50%, because each year's 5% is 5% of a bigger money supply.
- The price level grew by the same 62.9%: 3.26 is about 1.63 times 2.00. With V and Y fixed, P = M × V ÷ Y grows at the same rate as M.

## Step 3: Grow the money supply faster

Suppose Selvaro's central bank grows the money supply 10% a year instead, for all 10 years. Change the `moneyGrowth` line to:

```js
let moneyGrowth = 10;   // the money supply's growth rate, in % a year
```

```python
moneyGrowth = 10   # the money supply's growth rate, in % a year
```

Run it again.

**Look for:** the money supply climbs faster, to $1,296.87 billion in year 10, and the price level climbs faster too, to 5.19, about 2.59 times its year 0 level. Each pair of bars now reads 10%: doubling the money growth rate doubled the inflation rate.

Real output still stays at $1,000 billion. In the long run, at full employment, faster money growth raised the price level, not real output.

## Check your understanding

<Question>
In Corvessa, another made-up country, the money supply is $300 billion, the price level is 2 and real output is $1,200 billion. What is the velocity of money?
- [ ] 0.125
- [ ] 4
- [x] 8
> Rearrange M × V = P × Y for V: V = P × Y ÷ M = 2 × 1,200 ÷ 300 = 8. 4 is real output ÷ the money supply, which leaves out the price level, and 0.125 is M ÷ (P × Y), the equation turned upside down.
</Question>

<Question>
Suppose Selvaro's central bank grew the money supply 3% a year instead, with velocity still 4 and nothing else changing Selvaro's full-employment level of output. What would happen in the long run?
- [ ] Real output would grow 3% a year, and the price level would stay at 2.00
- [x] The price level would grow 3% a year, and real output would stay at $1,000 billion
- [ ] Real output and the price level would each grow 1.5% a year
> According to the quantity theory of money, in the long run the growth rate of the money supply determines the inflation rate. When the economy is at full employment, changes in the money supply have no effect on real output in the long run, so real output stays at $1,000 billion. With V and Y fixed, P = M × V ÷ Y grows 3% a year along with M, to 2.69 in year 10.
</Question>

<Question>
Now suppose the central bank decreased the money supply 2% a year for 10 years, with velocity and real output the same as before. What would happen to Selvaro's price level?
- [ ] It would stay at 2.00, because real output doesn't change
- [ ] It would rise 2% a year
- [x] It would fall 2% a year, which is deflation
> Deflation results from decreasing the money supply at too rapid of a rate for a sustained period of time. With V and Y fixed, P = M × V ÷ Y falls 2% a year along with M, from 2.00 to 1.63 in year 10.
</Question>

## Wrap up

You wrote `priceLevel`, a function that rearranges the equation of exchange, M × V = P × Y, into P = M × V ÷ Y. You also wrote a loop that compounds a growth rate: each pass multiplied the money supply by 1 + `moneyGrowth` ÷ 100, so each year grew from the year before. With velocity fixed at 4 and real output fixed at its full-employment level of $1,000 billion, the price level grew at the same rate as the money supply: 5% money growth gave 5% inflation, and 10% gave 10%. According to the quantity theory of money, in the long run the growth rate of the money supply determines the inflation rate, and that's how inflation is a monetary phenomenon.

Next, in **Exchange Rates**, you'll see how a change in a currency's value changes what a country's exports cost abroad.
