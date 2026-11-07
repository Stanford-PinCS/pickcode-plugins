# Profit Maximization

How many crates of tomatoes should a farm grow each day? You'll find the farm's **marginal cost** of each crate from its total costs, then use the **profit-maximizing rule**, which compares marginal revenue with marginal cost, to choose its output. Then the market price falls, and you'll see when the farm keeps growing at a loss and when it **shuts down**. Along the way you'll write a **loop over neighboring items** of a list, to find the change from one item to the next, and an **if inside a loop**, to check every crate.

Click **Next** to continue.

## The costs of growing tomatoes

Nadia's farm grows tomatoes and sells them by the crate.

- **Fixed costs** stay the same at every output, even when the farm grows nothing. **Variable costs** change as output changes. Fixed costs and variable costs determine the farm's **total cost**.
- **Marginal cost (MC)** is the additional cost of growing one more crate: the change in total cost from one output to the next.
- **Average total cost (ATC)** is total cost ÷ output.
- **Average variable cost (AVC)** is total variable cost ÷ output, where total variable cost is total cost minus fixed cost.

## Revenue, profit and the profit-maximizing rule

The farm sells its tomatoes in a **perfectly competitive market**. It has no market power: it can sell all the crates it grows at a constant price determined by the market, so it's a **price taker**.

- **Total revenue** is price × output. Every extra crate adds the price to total revenue, so the farm's **marginal revenue (MR)** equals the price: MR = P.
- **Profit** is total revenue − total cost. The farm's costs include implicit costs, such as the value of Nadia's own time, so this is **economic profit**, the profit firms respond to. A negative profit is a **loss**.

Firms are assumed to produce output to maximize their profits by comparing marginal revenue and marginal cost. This is the **profit-maximizing rule**. A crate whose MR is more than its MC adds more to revenue than to cost, so growing it raises profit, and a crate whose MR is less than its MC lowers profit. A price taker maximizes profit at the output where a rising marginal cost equals marginal revenue, the price.

## Two functions to fill in

Here is your code:

```js
// Total cost, in dollars, of growing 0, 1, 2, ... 10 crates of tomatoes in a day.
let totalCosts = [40, 57, 70, 82, 96, 114, 137, 166, 202, 246, 299];

// The market price of one crate, in dollars.
let price = 36;

// Returns the marginal cost of each crate, from the 1st crate to the last.
function marginalCosts(totalCosts) {
    let mc = [];
    for (let q = 1; q < totalCosts.length; q++) {
        mc.push(totalCosts[q]);
    }
    return mc;
}

// Returns how many crates to grow at this price.
function chooseOutput(price, mc) {
    return mc.length;
}
```

```python
# Total cost, in dollars, of growing 0, 1, 2, ... 10 crates of tomatoes in a day.
totalCosts = [40, 57, 70, 82, 96, 114, 137, 166, 202, 246, 299]

# The market price of one crate, in dollars.
price = 36

# Returns the marginal cost of each crate, from the 1st crate to the last.
def marginalCosts(totalCosts):
    mc = []
    for q in range(1, len(totalCosts)):
        mc.append(totalCosts[q])
    return mc

# Returns how many crates to grow at this price.
def chooseOutput(price, mc):
    return len(mc)
```

- `totalCosts` lists the farm's total cost for each output: `totalCosts[0]` for 0 crates, `totalCosts[1]` for 1 crate, and so on up to 10 crates. `totalCosts[0]`, $40, is what the farm pays when it grows nothing: its fixed cost.
- `price` is the market price of a crate, $36.
- `marginalCosts` should return the marginal cost of each crate. Its loop runs `q` from 1 to 10, and each pass adds one number to the end of the list `mc`. Right now it adds `totalCosts[q]`, the total cost of `q` crates, instead of the change in total cost.
- `chooseOutput` gets the price and your list of marginal costs, and should return how many crates to grow. Right now it returns the length of the list, 10, so the farm grows every crate it can.
- The last line, `runFarm(totalCosts, price, marginalCosts, chooseOutput)`, calls your two functions and draws the farm's costs, the price and the output it grows.

## Run it

Press the **Run** button.

The graph shows **Quantity**, in crates per day, across the bottom and **Price, Cost**, in dollars per crate, up the side. The teal curve is ATC and the purple curve is AVC. The dark line at P = 36 is the price. AP graphs label it **D = MR**: the farm can sell all the crates it grows at that price, so the line is the farm's demand curve, and it's also its marginal revenue.

Your MC is pink. It starts at 57 for the 1st crate and shoots off the top of the graph, because those are total costs, not changes in total cost. The dashed amber line shows where MC should be.

The dashed pink line marks the output, 10 crates. The shaded rectangle is the **profit**: (P − ATC) × output = (36 − 29.90) × 10 = $61. The bottom row shows **Output** 10, your **MC** for the last crate grown, $299, **ATC** $29.90, **AVC** $25.90 and **Profit** $61.

## Step 1: Subtract neighboring items

Each marginal cost is the change in total cost from one output to the next: the difference between two neighboring items of `totalCosts`. Inside `marginalCosts`, replace the line that adds `totalCosts[q]` with this one:

```js
        mc.push(totalCosts[q] - totalCosts[q - 1]);
```

```python
        mc.append(totalCosts[q] - totalCosts[q - 1])
```

`totalCosts[q - 1]` is the item just before `totalCosts[q]`: the total cost of one crate fewer. That's why the loop starts at `q = 1`: the 1st crate's marginal cost needs the item before it, `totalCosts[0]`.

Run it again.

**Look for:** your pink MC line now lies on the dashed amber line.

- MC falls from $17 for the 1st crate to $12 for the 3rd, as specialization and the division of labor reduce marginal cost. Then it rises, up to $53 for the 10th crate: diminishing marginal returns give an upward-sloping marginal cost curve.
- **MC** in the bottom row reads $53: the 10th crate adds $53 to total cost but only $36 to total revenue. Your MC line crosses the price line at 8 crates, yet the farm still grows all 10, so **Profit** is still $61.

## Step 2: Check every crate with an if

The farm should grow up to the last crate whose marginal revenue, the price, is at least its marginal cost. Replace the `return` line inside `chooseOutput` with these lines:

```js
    let output = 0;
    for (let i = 0; i < mc.length; i++) {
        if (price >= mc[i]) {
            output = i + 1;
        }
    }
    return output;
```

```python
    output = 0
    for i in range(len(mc)):
        if price >= mc[i]:
            output = i + 1
    return output
```

The list starts with the 1st crate's marginal cost at index 0, so `mc[i]` belongs to crate number `i + 1`. Each time a crate's MR is at least its MC, `output` moves up to that crate, so when the loop ends, `output` is the last crate whose MR is at least its MC.

Run it again.

**Look for:** the output line moves to 8 crates, where your MC line meets the price line: MR = MC = $36.

- **Profit** rises from $61 to $86. ATC at 8 crates is $25.25, so the rectangle is (36 − 25.25) × 8 = $86.
- The 9th and 10th crates had marginal costs of $44 and $53 but sold for $36 each. Not growing them saves $8 + $17 = $25, and 61 + 25 = 86.
- The 8th crate's MR and MC are both $36, so it adds $0 to profit: 7 crates would also make $86. The profit-maximizing rule picks the output where MR = MC, 8 crates.

## Step 3: Lower the price

In the short run, a firm decides whether to **operate** (produce positive output) or **shut down** (produce zero output) by comparing total revenue with total variable cost, or price with AVC. `runFarm` makes this check at the output your `chooseOutput` returns: if the price is below AVC there, the farm shuts down and grows 0 crates.

Suppose the market price of tomatoes falls to $18. Change the `price` line to:

```js
let price = 18;
```

```python
price = 18
```

Run it again.

**Look for:** the farm grows 5 crates, where MR = MC = $18.

- The price is below ATC, $22.80, so the rectangle now sits above the price line, and it's a **loss**: (22.80 − 18) × 5 = $24. **Profit** reads −$24.
- The price is above AVC, $14.80, so the farm keeps operating. Its total revenue, 18 × 5 = $90, covers its total variable cost, $74, and leaves $16 toward its $40 fixed cost. Shutting down would lose all $40.

That's a short-run decision. In the long run, all costs become variable, and without barriers to exit, firms exit a market when they anticipate economic losses.

## Step 4: Lower the price below AVC

Now suppose the price falls to $13. Change the `price` line to:

```js
let price = 13;
```

```python
price = 13
```

Run it again.

**Look for:** the price line is below the AVC curve at every output.

- Your `chooseOutput` returns 3 crates, marked by a dotted line. The price line meets your MC line at the 2nd crate, but MC is still falling there: the 3rd crate's MC, $12, is below the price, so growing it adds to profit. Then the rising MC passes the price: the 4th crate's MC, $14, is above it.
- Of all the outputs above 0, 3 crates loses the least: $43. But AVC there is $14, more than the price. Total revenue, 13 × 3 = $39, wouldn't cover the total variable cost, $42.
- So the farm shuts down. **Output** is 0 and **Profit** is −$40: a loss equal to the fixed cost, and $3 less than growing 3 crates. MC, ATC and AVC show a dash, because with no crates there's no last crate and no cost per crate.

## Check your understanding

<Question>
Suppose the farm's fixed cost rose from $40 to $60, so every number in `totalCosts` went up by $20. At a price of $36, how many crates should the farm grow?
- [ ] Fewer than 8, because every total cost is higher
- [x] Still 8, because no marginal cost changes
- [ ] 0, because the farm should shut down
> Each marginal cost is the difference between two total costs, and adding $20 to both leaves the difference the same, so MR = MC at the same 8 crates. The optimal quantity doesn't depend on fixed costs. Total variable cost doesn't change either, so the farm still operates. Only its profit changes: it falls by $20, to $66.
</Question>

<Question>
At a price of $18, the farm loses $24 a day. In the short run, why does it keep growing tomatoes instead of shutting down?
- [ ] Because it grows the output where MR = MC, which always earns a profit
- [x] Because its total revenue covers its total variable cost, so it loses less than its $40 fixed cost
- [ ] Because the price is above its average total cost
> In the short run, a firm compares total revenue with total variable cost, or price with AVC. At 5 crates, total revenue is $90 and total variable cost is $74, so growing loses $24, while shutting down would lose the whole $40 fixed cost.
</Question>

<Question>
Why is the farm's marginal revenue equal to the price?
- [ ] Because the farm sets its own price
- [x] Because it can sell all the crates it grows at a constant price determined by the market
- [ ] Because its marginal cost equals the price at every output
> The farm is a price taker, so one more crate always sells for the market price and adds exactly that much to total revenue.
</Question>

## Wrap up

You wrote `marginalCosts`, a loop over neighboring items that subtracts each total cost from the next one to find the marginal cost of every crate, and `chooseOutput`, a loop with an if that finds the last crate whose marginal revenue is at least its marginal cost. At $36 a crate, the farm grew 8 crates, where MR = MC, for a profit of $86. At $18 it lost $24 but kept operating in the short run, because its total revenue covered its total variable cost. At $13 the price was below AVC, so it shut down and lost its $40 fixed cost, less than the $43 it would have lost by growing 3 crates.

Next, in **Game Theory**, you'll find the dominant strategies and the Nash equilibrium in a game between two firms.
