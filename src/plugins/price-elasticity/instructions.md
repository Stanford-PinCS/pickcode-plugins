# Price Elasticity of Demand

A small theater wants to know: if it raises its ticket price, will it take in more money or less? That depends on the **price elasticity of demand**, which measures how much the quantity of tickets demanded responds to a change in price. You'll write a **function** that does arithmetic with **percentage changes**, then an **if / else if / else** chain that uses each elasticity to describe demand as elastic, inelastic or unit elastic.

Click **Next** to continue.

## How much buyers respond to a price change

By the **law of demand**, a change in a good's own price causes a change in the quantity demanded in the opposite direction: a movement along the demand curve. The theater's **demand schedule** lists the quantity of tickets demanded at each price.

Economists use **elasticity** to measure the magnitude of percentage changes in quantity owing to a given change, such as a change in the good's own price. The **price elasticity of demand** is the percentage change in quantity demanded divided by the percentage change in price:

> price elasticity of demand = percentage change in quantity demanded ÷ percentage change in price

This lesson finds each percentage change with the **midpoint method**: the change divided by the average of the old and new values, times 100.

> percentage change by the midpoint method = (new value − old value) ÷ ((new value + old value) ÷ 2) × 100

The midpoint method is used because the average is the same whichever way a change goes. From $35 to $45, the price changes by $10 on an average of $40, a 25% increase, and from $45 back to $35 it's a 25% decrease. Divided by the old value instead, the increase would be 28.6% and the decrease 22.2%. So with the midpoint method, each stretch of a demand curve has one elasticity, whether the price rises or falls along it.

Demand is described by the **magnitude** of its elasticity, its size without the minus sign, with 1 as the benchmark. In the range of a given price change, demand is:

- **elastic** when the magnitude is greater than 1,
- **inelastic** when it's less than 1,
- **unit elastic** when it equals 1. Then the change in price and the change in quantity demanded are proportional.

Elasticity varies along a linear (straight-line) demand curve, so slope is not elasticity. And the effect of a price change on **total revenue**, or **total expenditure** (here, the price times the number of tickets demanded: what the theater takes in, and what buyers spend), depends on whether demand is elastic, inelastic or unit elastic.

## Two functions: elasticity and describe

Here is your code:

```js
// The theater's demand schedule: the quantity of tickets demanded at each price.
let prices = [15, 25, 35, 45, 55, 65];
let quantities = [130, 110, 90, 70, 50, 30];

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
prices = [15, 25, 35, 45, 55, 65]
quantities = [130, 110, 90, 70, 50, 30]

# Price increases to test: each is a price the theater might raise to the next one.
raises = []

# Returns the magnitude of the price elasticity of demand for a change from old to new.
def elasticity(oldPrice, oldQuantity, newPrice, newQuantity):
    return (newQuantity - oldQuantity) / (newPrice - oldPrice)

# Describes demand with elasticity e: "elastic", "inelastic" or "unit elastic".
def describe(e):
    return "elastic"
```

- `prices` and `quantities` are the demand schedule: at $15, 130 tickets per show are demanded, and at $65, only 30.
- `elasticity` gets the old price and quantity and the new price and quantity, and should return the magnitude of the price elasticity of demand for that price change. Right now it divides the change in quantity by the change in price.
- `describe` gets an elasticity, `e`, and should return how demand is described: `"elastic"`, `"inelastic"` or `"unit elastic"`. Right now it always returns `"elastic"`.
- `raises` is an empty list for now. You'll fill it in Step 3.
- The last line, `walkDemand(prices, quantities, elasticity, describe, raises)`, walks up the demand curve one price increase at a time: $15 to $25, $25 to $35, and so on up to $65. For each of these 5 stretches it calls `elasticity`, then hands the result to `describe`.

## Run it

Press the **Run** button.

The top graph is the theater's demand curve, labeled D, with price up the side and quantity across the bottom. Each stretch between two neighboring prices is labeled with the number your `elasticity` returned for it and colored by what `describe` returned: pink for elastic, purple for unit elastic and teal for inelastic.

The bottom graph shows the total revenue at each price, on the same quantity scale. The highest, $3,150, comes at two prices, $35 and $45: both bars have a dashed amber outline, and dashed amber lines connect them to their points on the demand curve.

Every stretch reads −2. Each $10 increase cuts the quantity demanded by 20 tickets, and −20 ÷ 10 = −2: the change in quantity divided by the change in price. On a straight line that ratio is the same everywhere, just like the slope. The AP course description warns about exactly this mistake: elasticity divides percentage changes, not the changes themselves. Every stretch is pink, too, because `describe` calls everything elastic.

The bottom row shows **Elasticity** −2, **Elastic** 5, **Unit Elastic** 0, **Inelastic** 0 and **Top Revenue** $3,150. **Elasticity** runs from the lowest to the highest number your `elasticity` returned, and **Elastic**, **Unit Elastic** and **Inelastic** count how many of the 5 stretches `describe` put in each range. **Top Revenue** is the highest total revenue in the bottom graph, which comes from the demand schedule alone, not from your functions.

## Step 1: Divide percentage changes

With the midpoint method, each change is divided by the average of its old and new values. From $35 to $45, the average price is (35 + 45) ÷ 2 = $40, so the price rises 10 ÷ 40 × 100 = 25%. The quantity demanded goes from 90 to 70 tickets, an average of (90 + 70) ÷ 2 = 80, so it changes by −20 ÷ 80 × 100 = −25%.

Replace the `return` line inside `elasticity` with these five lines:

```js
    let averageQuantity = (oldQuantity + newQuantity) / 2;
    let averagePrice = (oldPrice + newPrice) / 2;
    let percentChangeQuantity = (newQuantity - oldQuantity) / averageQuantity * 100;
    let percentChangePrice = (newPrice - oldPrice) / averagePrice * 100;
    return Math.abs(percentChangeQuantity / percentChangePrice);
```

```python
    averageQuantity = (oldQuantity + newQuantity) / 2
    averagePrice = (oldPrice + newPrice) / 2
    percentChangeQuantity = (newQuantity - oldQuantity) / averageQuantity * 100
    percentChangePrice = (newPrice - oldPrice) / averagePrice * 100
    return abs(percentChangeQuantity / percentChangePrice)
```

The first two lines find the average quantity and the average price. The next two divide each change by its average: the midpoint method. The price and the quantity demanded move in opposite directions, so one percentage change is negative, and so is their quotient. The last line returns its absolute value: the magnitude, which is what describes demand.

Run it again.

**Look for:** the labels now change along the line. From the lowest price to the highest they read 0.33, 0.6, 1, 1.67 and 3, and **Elasticity** reads 0.33 to 3. The slope of the line never changes, but its elasticity does. By the midpoint method, from $15 to $25 the price rises 50% while the quantity demanded falls only 16.7%, and from $55 to $65 the same $10 increase is a 16.7% rise in price while the quantity demanded falls 50%.

Every stretch is still pink, though: `describe` calls even 0.33 elastic.

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

**Look for:** the two lowest stretches turn teal: demand is inelastic for the price increases from $15 up to $35 (0.33 and 0.6). The stretch from $35 to $45 turns purple: demand is unit elastic for that price increase, with a 25% rise in price and a 25% drop in quantity demanded, both by the midpoint method. The top two stretches stay pink: demand is elastic for the increases above $45 (1.67 and 3). The bottom row reads **Elastic** 2, **Unit Elastic** 1 and **Inelastic** 2.

The purple stretch runs between the two points the dashed amber lines meet: of the six prices in the schedule, total revenue is highest, $3,150, at both ends of the unit-elastic stretch.

## Step 3: Raise the price in each range

Would a $10 price increase bring the theater more total revenue or less? Test one in each range: the increase from $15 to $25, where demand is inelastic, from $35 to $45, where it's unit elastic, and from $55 to $65, where it's elastic. In the `raises` line, change `[]` to `[15, 35, 55]`, the price each increase starts from:

```js
let raises = [15, 35, 55];
```

```python
raises = [15, 35, 55]
```

Run it again.

**Look for:** the three stretches are highlighted. Brackets on the axes show their percentage changes in price and in quantity demanded, by the midpoint method, and arrows in the bottom graph show how total revenue changes.

- From $15 to $25, demand is inelastic (0.33). The price rises 50% and the quantity demanded falls only 16.7%, so total revenue rises from $1,950 to $2,750, a change of +$800.
- From $35 to $45, demand is unit elastic (1). The price rises 25% and the quantity demanded falls 25%, so total revenue stays at $3,150, a change of $0.
- From $55 to $65, demand is elastic (3). The price rises 16.7%, but the quantity demanded falls 50%, so total revenue falls from $2,750 to $1,950, a change of −$800.

The same $10 price increase raises total revenue, leaves it unchanged or lowers it, depending on whether demand is inelastic, unit elastic or elastic. Where demand is inelastic, the percentage increase in price is larger than the percentage decrease in quantity demanded, so total revenue rises. Where it's elastic, the percentage decrease in quantity demanded is larger, so total revenue falls. Where it's unit elastic, the two are the same size, so total revenue doesn't change.

## Check your understanding

<Question>
The starter's `elasticity` returned −2 on every stretch. Why isn't that the price elasticity of demand?
- [ ] Elasticity can't be a negative number
- [x] It divides the change in quantity by the change in price instead of the percentage changes, so it's the same along the whole straight line
- [ ] It should divide the change in price by the change in quantity
> Price elasticity of demand is the percentage change in quantity demanded divided by the percentage change in price. Along a straight-line demand curve the slope stays the same, but the elasticity varies, so slope is not elasticity. A negative number isn't the problem: price and quantity demanded change in opposite directions, so the price elasticity of demand is negative, and demand is described by its magnitude. The magnitude of −2 would still be 2 on every stretch.
</Question>

<Question>
A bakery raises the price of a cake from $14 to $18, and the quantity demanded falls from 100 cakes a week to 60. Using the midpoint method, what is the magnitude of the price elasticity of demand, and how is demand described?
- [ ] 0.5, inelastic
- [x] 2, elastic
- [ ] 10, elastic
> The average price is (14 + 18) ÷ 2 = $16, so the price rises 4 ÷ 16 × 100 = 25%. The average quantity is (100 + 60) ÷ 2 = 80 cakes, so the quantity demanded falls 40 ÷ 80 × 100 = 50%. The magnitude is 50 ÷ 25 = 2, greater than 1, so demand is elastic for this price increase. 0.5 divides the other way, and 10 is the magnitude of the change in quantity divided by the change in price, −40 ÷ 4 = −10.
</Question>

<Question>
Demand for a good is inelastic in the range of a price increase. What happens to the seller's total revenue?
- [x] It rises, because the percentage increase in price outweighs the percentage decrease in quantity demanded
- [ ] It falls, because buyers buy fewer units
- [ ] It stays the same, because price and quantity demanded change in opposite directions
> When demand is inelastic, the percentage change in quantity demanded is smaller in size than the percentage change in price. In Step 3, from $15 to $25, the price rose 50% and the quantity demanded fell only 16.7%, both by the midpoint method, so total revenue rose from $1,950 to $2,750.
</Question>

## Wrap up

You wrote `elasticity`, a function that turns changes in price and quantity into percentage changes with the midpoint method and divides them, and `describe`, an if / else if / else chain that compares the magnitude with the benchmark of 1. Along the theater's straight-line demand curve, the slope never changed, but the magnitude of the elasticity rose from 0.33 to 3. For each $10 price increase, demand was inelastic from $15 up to $35, unit elastic from $35 to $45 and elastic above $45, and of the six prices, total revenue was highest, $3,150, at both ends of the unit-elastic stretch. Raising the price raised total revenue where demand was inelastic, left it unchanged where demand was unit elastic and lowered it where demand was elastic.

Next, in **Profit Maximization**, you'll choose how much a firm in a perfectly competitive market should produce by comparing marginal revenue and marginal cost.
