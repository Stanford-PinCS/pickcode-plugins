# Marginal Revenue Product

Wrenfield Orchard grows apples and hires pickers to harvest them. How many pickers should it hire? You'll compare each picker's **marginal revenue product** with the market wage, the way a firm in a perfectly competitive labor market decides. Along the way you'll write a **while loop** whose condition depends on a value the loop computes on every pass.

Click **Next** to continue.

## Marginal revenue product and the wage

Labor, capital and land are **factors of production**. A firm's decision to hire is based on the productivity of the factors, the output price and the cost of the factor.

Wrenfield Orchard sells apples in a perfectly competitive market, so it can sell all its apples at a constant price determined by the market: $5 a crate. It hires pickers in a perfectly competitive labor market, so the wage is set by the market too: $50 a day.

- The **marginal revenue product (MRP)** of labor is the change in total revenue divided by the change in labor. It also equals the marginal product times the marginal revenue: MRP = MP × MR. In a perfectly competitive output market, marginal revenue for each unit equals the price, so MRP = MP × P. That's the **value of the marginal product of labor**, VMPL = MPL × P.
- In a perfectly competitive labor market, the **marginal factor cost (MFC)** of labor, also called the marginal resource cost, is the wage.
- A firm in a perfectly competitive labor market hires labor **as long as the MRP is greater than the market wage**. It hires the quantity of workers where the MFC, the wage, equals the MRP.

The MRP curve is the firm's demand for labor, and the quantity of labor demanded goes down when the wage goes up.

## A loop that hires pickers

Here is your code:

```js
// Total product: crates of apples picked per day by 0 to 8 pickers.
let totalProduct = [0, 20, 38, 53, 65, 74, 80, 83, 83];
let price = 5;   // the market price of apples, in dollars per crate
let wage = 50;   // the market wage, in dollars per picker per day

// Returns how many pickers the orchard hires. The loop hires them one at a time.
function pickersToHire(totalProduct, price, wage) {
    let pickers = 0;
    while (pickers < totalProduct.length - 1) {
        pickers = pickers + 1;
    }
    return pickers;
}
```

```python
# Total product: crates of apples picked per day by 0 to 8 pickers.
totalProduct = [0, 20, 38, 53, 65, 74, 80, 83, 83]
price = 5   # the market price of apples, in dollars per crate
wage = 50   # the market wage, in dollars per picker per day

# Returns how many pickers the orchard hires. The loop hires them one at a time.
def pickersToHire(totalProduct, price, wage):
    pickers = 0
    while pickers < len(totalProduct) - 1:
        pickers = pickers + 1
    return pickers
```

- `totalProduct` is the orchard's **total product**, the crates of apples it picks in a day, for each number of pickers. The index is the number of pickers, so `totalProduct[3]` is 53: 3 pickers pick 53 crates a day.
- A **while loop** checks its condition before every pass and repeats its body as long as the condition is true. Each pass of the loop in `pickersToHire` hires one more picker. Its condition only stops the loop when `pickers` reaches the last picker in the table, 8, so the orchard hires every picker.
- The last line, `runHiring(totalProduct, price, wage, pickersToHire)`, calls your function to find how many pickers to hire, then draws the result.

## Run it

Press the **Run** button.

Each bar is one picker's MRP, from picker 1 on the left to picker 8 on the right, with its value on top and the picker's MP under its number. Together the bars make the orchard's MRP curve. The dashed amber line is the $50 wage, the MFC of each picker. Your loop's hires turn pink one at a time, and pickers it doesn't hire stay gray.

All 8 pickers turn pink. But the bars of pickers 5 to 8, at $45, $30, $15 and $0, stop below the wage line: each of those pickers adds less revenue than the $50 they cost.

The bottom row shows **Hired** 8 and **Wage** $50. **Last MRP** is the MRP of the last picker your loop hired, here picker 8's $0. **Next MRP** is the MRP of the first picker it didn't hire, and it shows a dash because the table has no 9th picker. **Revenue − Wages** is the orchard's revenue from its apples minus what it pays its pickers: $5 × 83 crates = $415, minus 8 × $50 = $400, leaves $15.

## Step 1: Find the next picker's marginal product

A picker's **marginal product (MP)** is the change in total product when the orchard hires that picker. Picker 1's MP is 20 − 0 = 20 crates, and picker 2's is 38 − 20 = 18 crates. Replace the lines inside `pickersToHire` with these:

```js
    let pickers = 0;
    // mp is the next picker's marginal product: how many crates that picker adds.
    let mp = totalProduct[1] - totalProduct[0];
    // Keep hiring while the next picker adds some apples.
    while (mp > 0) {
        pickers = pickers + 1;
        mp = totalProduct[pickers + 1] - totalProduct[pickers];
    }
    return pickers;
```

```python
    pickers = 0
    # mp is the next picker's marginal product: how many crates that picker adds.
    mp = totalProduct[1] - totalProduct[0]
    # Keep hiring while the next picker adds some apples.
    while mp > 0:
        pickers = pickers + 1
        mp = totalProduct[pickers + 1] - totalProduct[pickers]
    return pickers
```

Before the loop, `mp` is picker 1's MP. Each pass hires the next picker, then computes the MP of the picker after that one. The condition `mp > 0` checks the `mp` the last pass computed, so it can turn false and stop the loop. If no pass changed `mp`, the condition would stay true forever.

Run it again.

**Look for:** picker 8 stays gray, so the orchard hires 7 pickers. Picker 8's MP is 83 − 83 = 0, so the loop stopped before hiring them. The MPs shrink from 20 to 0 as the orchard adds pickers to the same trees: that's diminishing marginal returns. But pickers 5, 6 and 7 are still pink with bars below the wage line, and **Revenue − Wages** is only $65.

## Step 2: Compare MRP with the wage

A picker is worth hiring if they add more revenue than they cost. The next picker's MRP is `mp * price`, since MRP = MP × P. Replace the comment and the `while` line with these two lines:

```js
    // Keep hiring while the next picker's MRP, MP × P, is greater than the wage.
    while (mp * price > wage) {
```

```python
    # Keep hiring while the next picker's MRP, MP × P, is greater than the wage.
    while mp * price > wage:
```

The condition uses greater than, `>`, which is how the hiring rule is worded: a firm hires labor as long as the MRP is greater than the market wage.

Run it again.

**Look for:** only pickers 1 to 4 turn pink, and each of their bars reaches above the wage line. Picker 4's MRP, the **Last MRP**, is 12 × $5 = $60, more than the $50 wage. Picker 5's, the **Next MRP**, is 9 × $5 = $45, less than the wage, so the loop stops there: the wage line crosses the MRP curve between pickers 4 and 5.

**Revenue − Wages** climbs to $125, the most for any number of pickers from 0 to 8. The orchard's other inputs are fixed, so their costs don't change as it hires: 4 pickers also gives it the most profit.

## Step 3: Raise the price of apples

Suppose the market price of apples rises to $6 a crate. Change the `price` line to:

```js
let price = 6;   // the market price of apples, in dollars per crate
```

```python
price = 6   # the market price of apples, in dollars per crate
```

Run it again.

**Look for:** the bars of pickers 1 to 7 grow, because MRP = MP × P: picker 1's MRP is now 20 × $6 = $120. Picker 5's MRP rises to $54, above the $50 wage, so the orchard hires 5 pickers. Picker 6's MRP, $36, is still below it. **Revenue − Wages** is $194.

A change in the output price shifts the labor demand curve. At the same wage, the orchard now hires more pickers.

## Check your understanding

<Question>
Another orchard's total product rises from 40 to 52 crates when it hires its 3rd picker, and apples sell for $5 a crate. What is the 3rd picker's MRP?
- [ ] $12
- [x] $60
- [ ] $260
> The 3rd picker's MP is 52 − 40 = 12 crates, so MRP = MP × P = 12 × $5 = $60. $260 is the revenue from all 52 crates, not what the 3rd picker adds.
</Question>

<Question>
Apples still sell for $6 a crate, but the market wage rises from $50 to $80. How many pickers does Wrenfield Orchard hire now?
- [ ] 5, the same as before
- [ ] 4
- [x] 3
> Only pickers 1 to 3 have an MRP greater than $80: $120, $108 and $90. Picker 4's MRP is $72. When the wage goes up, the quantity of labor demanded goes down.
</Question>

<Question>
Which change would shift Wrenfield Orchard's MRP curve, its demand for labor?
- [ ] The market wage rises to $80
- [x] Training helps every picker pick more crates a day
- [ ] The orchard hires one more picker
> Changes in the output price or in the productivity of the worker shift the labor demand curve. A change in the wage moves the wage line instead: the bars stay put, and the orchard hires a different number of pickers.
</Question>

## Wrap up

You wrote a while loop whose condition, `mp * price > wage`, depends on a value the loop computes: each pass hired one picker and found the next picker's marginal product. The loop kept hiring as long as the next picker's MRP was greater than the wage, which is how a firm in a perfectly competitive labor market hires. The bars were the orchard's MRP curve, its demand for labor. A higher wage means fewer pickers along that curve, and a higher apple price shifted the whole curve, so the orchard hired more pickers at the same wage.

Next, in **Externalities**, you'll see why a perfectly competitive market makes more than the socially optimal quantity when it ignores the cost of pollution, and how a tax can fix that.
