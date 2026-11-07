# Price Elasticity of Demand

A small theater wants to know: if it raises its ticket price, will it take in more money or less? That depends on the **price elasticity of demand**, which measures how much the quantity of tickets demanded responds to a change in price. You'll write a **function** that does arithmetic with **percentage changes**, then an **if / else if / else** chain that uses each elasticity to describe demand as elastic, inelastic or unit elastic.

Click **Next** to continue.

## How much buyers respond to a price change

By the **law of demand**, a change in a good's own price causes a change in the quantity demanded in the opposite direction: a movement along the demand curve. The theater's **demand schedule** lists the quantity of tickets demanded at each price.

Economists use **elasticity** to measure the magnitude of percentage changes in quantity owing to a given change, such as a change in the good's own price. The **price elasticity of demand** is the percentage change in quantity demanded divided by the percentage change in price:

> price elasticity of demand = percentage change in quantity demanded ÷ percentage change in price

In this lesson, each percentage change is measured from where the change starts: the change divided by the old value, times 100. Measured this way, a price increase and the price cut that undoes it can give different elasticities.

Demand is described by the **magnitude** of its elasticity, its size without the minus sign, with 1 as the benchmark. In the range of a given price change, demand is:

- **elastic** when the magnitude is greater than 1,
- **inelastic** when it's less than 1,
- **unit elastic** when it equals 1. Then the change in price and the change in quantity demanded are proportional.

Elasticity varies along a linear (straight-line) demand curve, so slope is not elasticity. And the effect of a price change on **total revenue**, or **total expenditure** (here, the price times the number of tickets demanded: what the theater takes in, and what buyers spend), depends on whether demand is elastic, inelastic or unit elastic.

## Two functions: elasticity and describe

Here is your code:

```js
// The theater's demand schedule: the quantity of tickets demanded at each price.
let prices = [5, 10, 15, 20, 25, 30, 35];
let quantities = [210, 180, 150, 120, 90, 60, 30];

// Price increases to test: each is a price the theater might raise to the next one.
let raises = [];

// Returns the magnitude of the price elasticity of demand for a change from old to new.
function elasticity(oldPrice, oldQuantity, newPrice, newQuantity) {
    return (newQuantity - oldQuantity) / (newPrice - oldPrice);
}

// Describes demand with elasticity e: "elastic", "inelastic" or "unit elastic".
function describe(e) {
    return "elastic";
}
```

```python
# The theater's demand schedule: the quantity of tickets demanded at each price.
prices = [5, 10, 15, 20, 25, 30, 35]
quantities = [210, 180, 150, 120, 90, 60, 30]

# Price increases to test: each is a price the theater might raise to the next one.
raises = []

# Returns the magnitude of the price elasticity of demand for a change from old to new.
def elasticity(oldPrice, oldQuantity, newPrice, newQuantity):
    return (newQuantity - oldQuantity) / (newPrice - oldPrice)

# Describes demand with elasticity e: "elastic", "inelastic" or "unit elastic".
def describe(e):
    return "elastic"
```

- `prices` and `quantities` are the demand schedule: at $5, 210 tickets per show are demanded, and at $35, only 30.
- `elasticity` gets the old price and quantity and the new price and quantity, and should return the magnitude of the price elasticity of demand for that price change. Right now it divides the change in quantity by the change in price.
- `describe` gets an elasticity, `e`, and should return how demand is described: `"elastic"`, `"inelastic"` or `"unit elastic"`. Right now it always returns `"elastic"`.
- `raises` is an empty list for now. You'll fill it in Step 3.
- The last line, `walkDemand(prices, quantities, elasticity, describe, raises)`, walks up the demand curve one price increase at a time: $5 to $10, $10 to $15, and so on up to $35. For each of these 6 stretches it calls `elasticity`, then hands the result to `describe`.

## Run it

Press the **Run** button.

The top graph is the theater's demand curve, labeled D, with price up the side and quantity across the bottom. Each stretch between two neighboring prices is labeled with the number your `elasticity` returned for it and colored by what `describe` returned: pink for elastic, purple for unit elastic and teal for inelastic.

The bottom graph shows the total revenue at each price, on the same quantity scale. The highest, $2,400 at a price of $20, has a dashed amber outline, and dashed amber lines connect it to its point on the demand curve.

Every stretch reads −6. Each $5 increase cuts the quantity demanded by 30 tickets, and −30 ÷ 5 = −6: the change in quantity divided by the change in price. On a straight line that ratio is the same everywhere, just like the slope. The AP course description warns about exactly this mistake: elasticity divides percentage changes, not the changes themselves. Every stretch is pink, too, because `describe` calls everything elastic.

The bottom row shows **Elasticity** −6, **Elastic** 6, **Unit Elastic** 0, **Inelastic** 0 and **Top Revenue** $2,400. **Elasticity** runs from the lowest to the highest number your `elasticity` returned, and **Elastic**, **Unit Elastic** and **Inelastic** count how many of the 6 stretches `describe` put in each range.

## Step 1: Divide percentage changes

From $20 to $25, the price rises by 5 ÷ 20 × 100 = 25%, and the quantity demanded goes from 120 to 90 tickets, a change of −30 ÷ 120 × 100 = −25%.

Replace the `return` line inside `elasticity` with these three lines:

```js
    let percentChangeQuantity = (newQuantity - oldQuantity) / oldQuantity * 100;
    let percentChangePrice = (newPrice - oldPrice) / oldPrice * 100;
    return Math.abs(percentChangeQuantity / percentChangePrice);
```

```python
    percentChangeQuantity = (newQuantity - oldQuantity) / oldQuantity * 100
    percentChangePrice = (newPrice - oldPrice) / oldPrice * 100
    return abs(percentChangeQuantity / percentChangePrice)
```

The first two lines measure each change from its old value. The price and the quantity demanded move in opposite directions, so one percentage change is negative, and so is their quotient. The last line returns its absolute value: the magnitude, which is what describes demand.

Run it again.

**Look for:** the labels now change along the line. From the lowest price to the highest they read 0.14, 0.33, 0.6, 1, 1.67 and 3, and **Elasticity** reads 0.14 to 3. The slope of the line never changes, but its elasticity does. From $5 to $10, the price doubles (+100%) while the quantity demanded falls only 14.3%. From $30 to $35, the same $5 is a 16.7% increase, and the quantity demanded falls 50%.

Every stretch is still pink, though: `describe` calls even 0.14 elastic.

## Step 2: Describe each stretch

Replace the `return` line inside `describe` with this chain:

```js
    if (e > 1) {
        return "elastic";
    } else if (e < 1) {
        return "inelastic";
    } else {
        return "unit elastic";
    }
```

```python
    if e > 1:
        return "elastic"
    elif e < 1:
        return "inelastic"
    else:
        return "unit elastic"
```

An if / else if / else chain checks its conditions in order and runs the first one that's true. A number that's neither greater than 1 nor less than 1 must equal 1, so the last case needs no condition.

Run it again.

**Look for:** the three lowest stretches turn teal: demand is inelastic for the price increases from $5 up to $20 (0.14, 0.33 and 0.6). The stretch from $20 to $25 turns purple: demand is unit elastic for that price increase, with a 25% rise in price and a 25% drop in quantity demanded. The top two stretches stay pink: demand is elastic for the increases above $25 (1.67 and 3). The bottom row reads **Elastic** 2, **Unit Elastic** 1 and **Inelastic** 3.

The purple stretch starts right where the dashed amber lines meet the curve. Total revenue is highest, $2,400, at $20, where the teal stretches end and the purple one begins.

## Step 3: Raise the price in each range

Would a $5 price increase bring the theater more total revenue or less? Test one where demand is inelastic, from $10, and one where it's elastic, from $25. In the `raises` line, change `[]` to `[10, 25]`:

```js
let raises = [10, 25];
```

```python
raises = [10, 25]
```

Run it again.

**Look for:** both stretches are highlighted. Brackets on the axes show their percentage changes in price and in quantity demanded, and arrows in the bottom graph show how total revenue changes.

- From $10 to $15, demand is inelastic (0.33). The price rises 50% and the quantity demanded falls only 16.7%, so total revenue rises from $1,800 to $2,250, a change of +$450.
- From $25 to $30, demand is elastic (1.67). The price rises 20%, but the quantity demanded falls 33.3%, so total revenue falls from $2,250 to $1,800, a change of −$450.

The same $5 price increase moves total revenue in opposite directions. Where demand is inelastic, the percentage increase in price outweighs the percentage decrease in quantity demanded, so total revenue rises. Where demand is elastic, the percentage decrease in quantity demanded outweighs the percentage increase in price, so total revenue falls.

On the unit-elastic increase from $20 to $25, total revenue still falls, from $2,400 to $2,250. A 25% rise in price and a 25% drop in quantity demanded don't cancel exactly: the new total revenue is 1.25 × 0.75 = 0.9375 times the old one.

## Check your understanding

<Question>
The starter's `elasticity` returned −6 on every stretch. Why isn't that the price elasticity of demand?
- [ ] Elasticity can't be a negative number
- [x] It divides the change in quantity by the change in price instead of the percentage changes, so it's the same along the whole straight line
- [ ] It should divide the change in price by the change in quantity
> Price elasticity of demand is the percentage change in quantity demanded divided by the percentage change in price. Along a straight-line demand curve the slope stays the same, but the elasticity varies, so slope is not elasticity.
</Question>

<Question>
A bakery raises the price of a loaf of bread from $4 to $5, and the quantity demanded falls from 100 loaves to 70. Measuring each change from the old value, what is the magnitude of the price elasticity of demand, and how is demand described?
- [ ] 0.83, inelastic
- [x] 1.2, elastic
- [ ] 30, elastic
> The price rises 1 ÷ 4 × 100 = 25%, and the quantity demanded falls 30 ÷ 100 × 100 = 30%. The magnitude is 30 ÷ 25 = 1.2, greater than 1, so demand is elastic for this price increase. 0.83 divides the other way, and 30 is the change in quantity divided by the change in price.
</Question>

<Question>
Demand for a good is inelastic in the range of a price increase. What happens to the seller's total revenue?
- [x] It rises, because the percentage increase in price outweighs the percentage decrease in quantity demanded
- [ ] It falls, because buyers buy fewer units
- [ ] It stays the same, because price and quantity demanded change in opposite directions
> When demand is inelastic, the quantity demanded responds less than the price does. In Step 3, a 50% price increase from $10 cut the quantity demanded by only 16.7%, and total revenue rose from $1,800 to $2,250.
</Question>

## Wrap up

You wrote `elasticity`, a function that turns changes in price and quantity into percentage changes and divides them, and `describe`, an if / else if / else chain that compares the magnitude with the benchmark of 1. Along the theater's straight-line demand curve, the slope never changed, but the magnitude of the elasticity rose from 0.14 to 3. For each $5 price increase, demand was inelastic from $5 up to $20, unit elastic for the increase from $20 to $25 and elastic for the increases above $25, and total revenue was highest at $20. Raising the price raised total revenue where demand was inelastic and lowered it where demand was elastic. On the unit-elastic increase, it fell from $2,400 to $2,250, because a 25% rise in price and a 25% drop in quantity demanded don't cancel exactly.

Next, in **Profit Maximization**, you'll choose how much a competitive firm should produce by comparing marginal revenue and marginal cost.
