# Price Indices and Inflation

Rosa buys the same basket of goods and services every year, but the prices keep changing. You'll build a **consumer price index (CPI)** from her basket, measure the **inflation rate** from one year to the next, and find her **real wage** to see whether her raises kept up with prices. Along the way you'll store the basket as a **list of records** and write a **for loop** that adds to a **running total**.

Click **Next** to continue.

## The consumer price index

The **consumer price index (CPI)** measures the change in income a consumer would need in order to maintain the same standard of living over time under a new set of prices as under the original set of prices. It measures the cost of a **fixed basket** of goods and services in a given year relative to the **base year**.

Rosa is made up, and so are her prices. Every year she buys the same quantities:

| Good or service | Quantity a year | Base year | Year 1 | Year 2 | Year 3 |
|---|---|---|---|---|---|
| Bus ride | 400 | $2.00 | $2.75 | $3.50 | $3.00 |
| Bread (loaf) | 100 | $3.00 | $3.50 | $4.00 | $3.60 |
| Haircut | 10 | $30 | $30 | $30 | $33 |

The cost of the basket in a year is each good's quantity times its price that year, added up. The CPI compares that cost with the base year's:

> CPI = (cost of the basket in a given year ÷ cost of the basket in the base year) × 100

So the CPI is 100 in the base year, and a CPI of 125 means the basket costs 25% more than it did in the base year.

Because the basket is fixed, the CPI has some shortcomings as a true measure of inflation, such as **substitution bias**, which causes it to overstate the true inflation rate.

## Inflation and real wages

The **inflation rate** is the percentage change in a price index, such as the CPI or the GDP deflator:

> inflation rate = (CPI this year − CPI last year) ÷ CPI last year × 100

- **Inflation**: the price level rises, so the inflation rate is positive.
- **Deflation**: the price level falls, so the inflation rate is negative.
- **Disinflation**: the inflation rate falls but stays positive. Prices still rise, just more slowly.

Rosa's **nominal wage** is the number of dollars she's paid for an hour of work. **Real variables**, such as real wages, are the nominal variables deflated by the price level. With the CPI as the price level:

> real wage = (nominal wage ÷ CPI) × 100

A real wage removes the effect of changes in the overall price level, just as real GDP does by measuring aggregate output using constant prices instead of current prices. In the base year the CPI is 100, so Rosa's real wage equals her nominal wage.

## A list of records

Here is your code:

```js
// Rosa's basket: how much of each good or service she buys a year, and its prices.
// prices[0] is the price in the base year, prices[1] in year 1, and so on.
let basket = [
    { good: "Bus ride", quantity: 400, prices: [2.00, 2.75, 3.50, 3.00] },
    { good: "Bread", quantity: 100, prices: [3.00, 3.50, 4.00, 3.60] },
    { good: "Haircut", quantity: 10, prices: [30, 30, 30, 33] },
];

// Rosa's nominal wage each year, in dollars per hour.
let wages = [20, 24, 30, 30];

// Returns what the whole basket costs at the prices of one year.
function basketCost(basket, year) {
    let total = 0;
    for (let item of basket) {
        total = total + item.prices[year];
    }
    return total;
}

// Returns the CPI in a year: the basket's cost that year relative to the base year.
function cpi(basket, year) {
    return basketCost(basket, year) / basketCost(basket, 0) * 100;
}

// Returns the inflation rate, in percent, from one year's CPI to the next year's.
function inflationRate(oldCPI, newCPI) {
    return newCPI - oldCPI;
}

// Returns the real wage: the nominal wage deflated by the price level.
function realWage(nominalWage, priceIndex) {
    return nominalWage;
}
```

```python
# Rosa's basket: how much of each good or service she buys a year, and its prices.
# prices[0] is the price in the base year, prices[1] in year 1, and so on.
basket = [
    {"good": "Bus ride", "quantity": 400, "prices": [2.00, 2.75, 3.50, 3.00]},
    {"good": "Bread", "quantity": 100, "prices": [3.00, 3.50, 4.00, 3.60]},
    {"good": "Haircut", "quantity": 10, "prices": [30, 30, 30, 33]},
]

# Rosa's nominal wage each year, in dollars per hour.
wages = [20, 24, 30, 30]

# Returns what the whole basket costs at the prices of one year.
def basketCost(basket, year):
    total = 0
    for item in basket:
        total = total + item["prices"][year]
    return total

# Returns the CPI in a year: the basket's cost that year relative to the base year.
def cpi(basket, year):
    return basketCost(basket, year) / basketCost(basket, 0) * 100

# Returns the inflation rate, in percent, from one year's CPI to the next year's.
def inflationRate(oldCPI, newCPI):
    return newCPI - oldCPI

# Returns the real wage: the nominal wage deflated by the price level.
def realWage(nominalWage, priceIndex):
    return nominalWage
```

- `basket` is a **list of records**, one for each good or service. A record keeps several named values together, called its **fields**. Each of these has three: `good`, the name; `quantity`, how much Rosa buys in a year; and `prices`, a list with its price in each year. The index of a price is its year: index 0 is the base year, index 1 is year 1, and so on.
- `wages` holds Rosa's nominal wage in each year.
- `basketCost` should return what the whole basket costs at the prices of `year`. It starts a **running total**, `total`, at 0. The **for loop** then visits the records of `basket` one at a time, calling each one `item`, and each pass adds to `total`. Right now each pass adds only the good's price that year, so `basketCost` returns what one of each good costs: it counts every good as if Rosa bought just one, however much of it she really buys.
- `cpi` divides the basket's cost in `year` by its cost in the base year, year 0, and multiplies by 100. It's already written.
- `inflationRate` should return the inflation rate, in percent, from `oldCPI` to `newCPI`. Right now it returns how much the CPI changed.
- `realWage` should deflate `nominalWage` by `priceIndex`, the CPI that year. Right now it returns the nominal wage unchanged.
- The last line, `measureInflation(basket, wages, basketCost, cpi, inflationRate, realWage)`, calls `basketCost` and `cpi` for every year, `inflationRate` with each year's CPI and the next year's, and `realWage` with each year's wage and CPI. Then it draws what they returned.

## Run it

Press the **Run** button.

The top graph has a pink bar for each year: your CPI, from your `basketCost` and `cpi`, labeled with its value. The dashed amber marks show the correct CPI. Under the graph, each year has three numbers:

- **Basket cost** is what your `basketCost` returned for that year.
- **Your inflation** is what your `inflationRate` returned for that year, from the CPI the year before. It has no % sign: it's just the number your function returned.
- **Inflation rate**, in amber, is the correct inflation rate.

The bottom graph shows Rosa's wages. Each teal bar is her nominal wage, and the pink bar beside it is what your `realWage` returned. The dashed amber marks show the correct real wages.

Right now your `basketCost` says the basket costs $35 in the base year: one bus ride, one loaf of bread and one haircut, $2.00 + $3.00 + $30. The haircut is most of that, even though Rosa buys 10 haircuts and 400 bus rides. Your CPI reaches only 103.57, 107.14 and 113.14 in years 1 to 3, well below the amber marks at 125, 150 and 135. In year 3 your CPI even rises while the correct CPI falls.

The bottom row shows **Base cost**, $35, what your `basketCost` returned for the base year, then four numbers for year 3, the last year:

- **Year 3 CPI**, 113.14, is your CPI.
- **Year 3 inflation**, +6, is what your `inflationRate` returned.
- **Year 3 wage**, $30, is Rosa's nominal wage, from `wages`.
- **Year 3 real wage**, $30, is what your `realWage` returned. It returns the nominal wage, so each pink bar is as tall as the teal bar beside it.

## Step 1: Weight each price by its quantity

The basket's cost counts each good as many times as Rosa buys it: in the base year, 400 bus rides at $2.00 each cost 400 × $2.00 = $800. Replace the line inside the loop with:

```js
        total = total + item.quantity * item.prices[year];
```

```python
        total = total + item["quantity"] * item["prices"][year]
```

Each pass now adds the good's quantity times its price that year.

Run it again.

**Look for:** **Basket cost** reads $1,400, $1,750, $2,100 and $1,890, and the CPI bars in the top graph reach the amber marks: 100, 125, 150 and 135.

- **Base cost** reads $1,400: $800 of bus rides, $300 of bread and $300 of haircuts. Bus rides are more than half of what Rosa spends, so bus fares count the most in her CPI.
- **Year 3 CPI** reads 135, since $1,890 ÷ $1,400 × 100 = 135. So the CPI says Rosa would need 35% more income to keep the same standard of living as in the base year.
- **Your inflation** reads +25, +25 and −15, but the amber row reads +25%, +20% and −10%.

## Step 2: Find the percentage change

Right now `inflationRate` returns the change in the CPI, in index points. The inflation rate is the percentage change: the change divided by the old CPI, times 100. Replace the `return` line inside `inflationRate` with:

```js
    return (newCPI - oldCPI) / oldCPI * 100;
```

```python
    return (newCPI - oldCPI) / oldCPI * 100
```

Run it again.

**Look for:** **Your inflation** matches the amber row: +25, +20 and −10. **Year 3 inflation** reads −10.

- Year 1: the CPI rose from 100 to 125, an inflation rate of 25%. Starting from a CPI of 100, the change in points equals the percentage change, which is why year 1 was already right.
- Year 2: the CPI rose 25 points again, from 125 to 150, but 25 is only 20% of 125. Prices still rose, but more slowly than in year 1: that's **disinflation**.
- Year 3: the CPI fell from 150 to 135, an inflation rate of −10%. The price level fell: that's **deflation**.

## Step 3: Deflate the wage

Did Rosa's raises keep up with prices? Replace the `return` line inside `realWage` with:

```js
    return nominalWage / priceIndex * 100;
```

```python
    return nominalWage / priceIndex * 100
```

Run it again.

**Look for:** the pink bars in the wage graph now sit at the amber marks: real wages of $20, $19.20, $20 and $22.22. **Year 3 real wage** reads $22.22, while **Year 3 wage** still reads $30.

- Year 1: Rosa's raise from $20 to $24 was 20%, less than the 25% inflation rate, so her real wage fell to $19.20.
- Year 2: her raise from $24 to $30 was 25%, more than the 20% inflation rate, so her real wage rose to $20.
- Year 3: she got no raise, but the price level fell 10%, so her real wage rose to $22.22.

From the base year to year 3, Rosa's nominal wage rose 50% and the CPI rose 35%, so her real wage rose about 11.1%.

## Check your understanding

<Question>
From year 1 to year 2, the inflation rate fell from 25% to 20%. What is this called?
- [ ] Deflation, because the inflation rate went down
- [x] Disinflation, because prices still rose, but by a smaller percentage than the year before
- [ ] Neither, because the CPI rose by 25 points both years
> Deflation is a falling price level, a negative inflation rate. From year 1 to year 2 the CPI still rose, from 125 to 150, but by 20% instead of 25%: disinflation. Year 3, when the CPI fell from 150 to 135, was deflation.
</Question>

<Question>
In year 1, bus fares rose 37.5%. Suppose Rosa rode the bus less and bought more of things whose prices rose less, but the CPI's basket still counts 400 bus rides. What does that do to the CPI as a measure of inflation?
- [ ] It understates the true inflation rate
- [x] It overstates the true inflation rate
- [ ] It equals the true inflation rate, since the basket is fixed
> The CPI measures the cost of a fixed basket of goods and services, so it keeps counting 400 bus rides at the higher fare, even though Rosa now buys fewer. This is substitution bias, one of the CPI's shortcomings as a true measure of inflation: it causes the CPI to overstate the true inflation rate.
</Question>

<Question>
Suppose that in year 4, Rosa's nominal wage rises 5% and the inflation rate is 8%. What happens to her real wage?
- [ ] It rises, because her nominal wage rose
- [x] It falls, because the price level rose by a larger percentage than her nominal wage
- [ ] It stays the same, because both rose
> Her nominal wage would be $30 × 1.05 = $31.50 and the CPI would be 135 × 1.08 = 145.8, so her real wage would be $31.50 ÷ 145.8 × 100 = $21.60, less than the $22.22 of year 3.
</Question>

## Wrap up

You stored Rosa's basket as a list of records and wrote `basketCost`, a for loop that adds each good's quantity times its price to a running total: the cost of a fixed basket of goods and services. `cpi` compared each year's cost with the base year's, so the CPI started at 100 and went to 125, 150 and 135. Your `inflationRate` found the percentage change in the CPI from each year to the next: 25%, 20% and −10%. The price level rose in years 1 and 2, so both years had inflation, and the fall in the inflation rate from 25% to 20% was disinflation. In year 3 the price level fell: deflation. And `realWage` deflated Rosa's nominal wage by the price level: her raise in year 1 fell short of inflation, but by year 3 her real wage, $22.22, was above the $20 she earned in the base year.

Next, in **Spending Multiplier**, you'll follow one change in spending through round after round of new spending.
