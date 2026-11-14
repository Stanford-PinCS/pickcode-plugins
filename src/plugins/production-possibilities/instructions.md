# Production Possibilities Curve

Dovania, a made-up country, can use its resources to make capital goods, such as machines and tools, or consumption goods, such as food and clothing. You'll calculate the **opportunity cost** of each extra unit of consumption goods from Dovania's **production possibilities curve (PPC)** and watch it increase, decide which combinations of the two goods are **efficient**, **inefficient** or **unattainable**, and see what **economic growth** does to the PPC. Along the way you'll write a **loop over neighboring rows** of a table, to find the decrease from one row to the next, and an **if / else if / else** chain.

Click **Next** to continue.

## Scarcity and the PPC

Individuals and societies are forced to make choices because most resources are **scarce**. Dovania can't make as much of both goods as it wants, so it has to choose how to use its resources.

The **production possibilities curve (PPC)** is a model used to show the tradeoffs associated with allocating resources. It shows the **full employment** level of output: the combinations of the two goods Dovania can make at full employment. Dovania's PPC table lists, for each amount of consumption goods, the most capital goods it can make along with it:

| Consumption goods | Capital goods |
|---|---|
| 0 | 30 |
| 1 | 28 |
| 2 | 25 |
| 3 | 20 |
| 4 | 12 |
| 5 | 0 |

Each row is a combination on the PPC. In this lesson, the PPC runs in a straight line from each row to the next. Compared with the PPC, a combination is:

- **on** the PPC: **efficient**.
- **inside** the PPC: **inefficient**, because some resources are **underutilized**.
- **beyond** the PPC: **unattainable** given Dovania's available resources.

## Opportunity cost

Along the PPC, Dovania can make another unit of consumption goods only by making fewer capital goods: that's the tradeoff. The capital goods it gives up to make one more unit of consumption goods are the **opportunity cost** of that unit. To make its 1st unit, Dovania goes from 30 capital goods to 28, so the 1st unit's opportunity cost is 30 − 28 = 2 capital goods.

The shape of the PPC depends on whether opportunity costs are **constant**, **increasing** or **decreasing**.

## Two functions to fix

Here is your code:

```js
// The most capital goods Dovania can make with 0, 1, 2, ... 5 consumption goods.
let capitalGoods = [30, 28, 25, 20, 12, 0];

// Economic growth: how many percent more of each good Dovania can make.
let growth = 0;

// Combinations to test, each [consumption goods, capital goods].
let points = [[3, 20], [1, 15], [4, 25], [5, 15]];

// Returns the opportunity cost of each additional unit of consumption goods.
function opportunityCosts(table) {
    let costs = [];
    for (let i = 1; i < table.length; i++) {
        // Spread the capital goods evenly over the units of consumption goods.
        costs.push(table[0] / (table.length - 1));
    }
    return costs;
}

// Describes a combination: "efficient", "inefficient" or "unattainable".
// mostCapital is the PPC's height at the combination's consumption goods.
function describePoint(capital, mostCapital) {
    return "efficient";
}
```

```python
# The most capital goods Dovania can make with 0, 1, 2, ... 5 consumption goods.
capitalGoods = [30, 28, 25, 20, 12, 0]

# Economic growth: how many percent more of each good Dovania can make.
growth = 0

# Combinations to test, each [consumption goods, capital goods].
points = [[3, 20], [1, 15], [4, 25], [5, 15]]

# Returns the opportunity cost of each additional unit of consumption goods.
def opportunityCosts(table):
    costs = []
    for i in range(1, len(table)):
        # Spread the capital goods evenly over the units of consumption goods.
        costs.append(table[0] / (len(table) - 1))
    return costs

# Describes a combination: "efficient", "inefficient" or "unattainable".
# mostCapital is the PPC's height at the combination's consumption goods.
def describePoint(capital, mostCapital):
    return "efficient"
```

- `capitalGoods` is Dovania's PPC table. The index is the number of units of consumption goods, so `capitalGoods[2]` is 25: with 2 units of consumption goods, Dovania can make at most 25 capital goods.
- `growth` is how many percent more of each good Dovania can make after **economic growth**. It's 0 for now, and you'll change it in Step 3.
- `points` holds four combinations to test, each written as [consumption goods, capital goods]. `[4, 25]` is 4 units of consumption goods and 25 capital goods.
- `opportunityCosts` gets the PPC table, `table`, and should return a list with the opportunity cost of each additional unit of consumption goods, from the 1st unit to the 5th. Its loop runs `i` from 1 to 5, and each pass adds one number to the end of the list `costs`. Right now every pass adds 30 ÷ 5 = 6: all the capital goods spread evenly over the 5 units, as if every unit cost the same.
- `describePoint` gets a combination's capital goods, `capital`, and `mostCapital`, the height of the PPC at the combination's consumption goods: the most capital goods Dovania can make along with that many units of consumption goods. For `[4, 25]`, `mostCapital` is 12, from the table's row for 4 units. The function should return `"efficient"`, `"inefficient"` or `"unattainable"`, but right now it always returns `"efficient"`.
- The last line, `drawPPC(capitalGoods, growth, points, opportunityCosts, describePoint)`, calls `opportunityCosts` with the table and shifts the PPC by the growth. Then it calls `describePoint` once for each combination in `points` and draws it all.

## Run it

Press the **Run** button.

The graph has consumption goods across the bottom and capital goods up the side. The dark line is Dovania's PPC, with a dot on each row of the table. It runs from 30 capital goods and no consumption goods down to 5 units of consumption goods and no capital goods.

For each additional unit of consumption goods, a dotted line steps 1 unit to the right, then a pink line drops by the opportunity cost your loop found for that unit, labeled with its number. A right opportunity cost drops exactly onto the next dot of the PPC.

Right now every drop is 6, and they miss. The 1st unit's drop falls from 30 to 24, past the PPC's 28: from 0 to 1 unit of consumption goods, the PPC drops only 2. The 5th unit's drop stops at 6, above the PPC's 0: from 4 to 5 units, the PPC drops 12.

Each of the four combinations is marked with what your `describePoint` called it: a filled dot for efficient, a ring for inefficient and a cross for unattainable. All four say **efficient**, even (1, 15), which is inside the PPC, and (4, 25) and (5, 15), which are beyond it.

The bottom row shows **Your opp. costs**, the opportunity costs your loop found for the 1st unit and the last unit, or one number when they're the same: 6. **Efficient**, **Inefficient** and **Unattainable** count how many of the 4 combinations your `describePoint` called efficient, inefficient and unattainable: 4, 0 and 0. **Growth** is the growth from your code: 0%.

## Step 1: Subtract neighboring rows

The opportunity cost of a unit is the decrease in capital goods from one row of the table to the next: the difference between two neighboring items of `table`. Inside the loop in `opportunityCosts`, replace the comment and the line under it with these two lines:

```js
        // The capital goods given up to make unit i of consumption goods.
        costs.push(table[i - 1] - table[i]);
```

```python
        # The capital goods given up to make unit i of consumption goods.
        costs.append(table[i - 1] - table[i])
```

`table[i - 1]` is the row just before `table[i]`: one unit of consumption goods fewer. That's why the loop starts at `i = 1`: the 1st unit's opportunity cost needs the row before it, `table[0]`. Subtracting the later row from the earlier one gives the capital goods given up, a positive number.

Run it again.

**Look for:** each pink drop now lands right on the next dot of the PPC. The labels read 2, 3, 5, 8 and 12, and **Your opp. costs** reads 2 to 12.

- Each additional unit of consumption goods costs more capital goods than the one before: Dovania's opportunity costs are **increasing**. So the PPC gets steeper as Dovania makes more consumption goods, and it bows outward, away from the origin.
- The opportunity costs add up to 2 + 3 + 5 + 8 + 12 = 30, all of Dovania's capital goods, the same total as the starter's five 6s. But Dovania doesn't give up its capital goods evenly. If every unit really cost 6, the PPC would be a straight line from 30 capital goods to 5 units of consumption goods.

## Step 2: Describe each combination

To see where a combination sits, compare its capital goods with `mostCapital`, the PPC's height at the same consumption goods. For (1, 15), the table says Dovania can make up to 28 capital goods along with 1 unit of consumption goods. 15 is less than 28, so (1, 15) is inside the PPC.

Replace the `return` line inside `describePoint` with this chain:

```js
    if (capital === mostCapital) {
        return "efficient";
    } else if (capital < mostCapital) {
        return "inefficient";
    } else {
        return "unattainable";
    }
```

```python
    if capital == mostCapital:
        return "efficient"
    elif capital < mostCapital:
        return "inefficient"
    else:
        return "unattainable"
```

An if / else if / else chain checks its conditions in order and runs the first one that's true. A combination with exactly `mostCapital` capital goods is on the PPC, and one with fewer is inside it. One that's neither must have more, so it's beyond the PPC, and the last case needs no condition.

Run it again.

**Look for:** the combinations get different answers now. **Efficient** reads 1, **Inefficient** 1 and **Unattainable** 2.

- (3, 20) is a row of the table, so it's on the PPC: efficient.
- (1, 15) is inside the PPC: inefficient, with underutilized resources. At full employment, Dovania could make 28 capital goods along with 1 unit of consumption goods, 13 more.
- (4, 25) is beyond the PPC, which reaches only 12 capital goods at 4 units of consumption goods: unattainable.
- (5, 15) is beyond it too. To make 5 units of consumption goods, Dovania has to give up all its capital goods, so the PPC is at 0 there: unattainable.

## Step 3: Grow the economy

The PPC can shift because of changes in factors of production as well as changes in productivity/technology. Economic growth results in an outward shift of the PPC.

Suppose Dovania gains more factors of production, or better technology, so it can make 25% more of each good at full employment. Change the `growth` line to:

```js
let growth = 25;
```

```python
growth = 25
```

`drawPPC` makes every row of the table 25% bigger in both goods, so the row (4, 12) becomes (5, 15). Then it hands `describePoint` the height of this new PPC.

Run it again.

**Look for:** a dashed teal curve, PPC₂, outside the first PPC, which the legend now calls PPC₁. PPC₂ runs from 37.5 capital goods down to 6.25 units of consumption goods. **Growth** reads 25%.

- (5, 15) was unattainable, and now it sits right on PPC₂: efficient. Growth made it attainable.
- (4, 25) is still unattainable: PPC₂ reaches only 23 capital goods at 4 units of consumption goods. Even after growth, Dovania's resources are scarce.
- (3, 20) was efficient on PPC₁, but PPC₂ reaches 28.75 capital goods at 3 units of consumption goods, so (3, 20) is now inside it: inefficient. After the growth, making the same combination as before would leave some resources underutilized.
- **Efficient** reads 1, **Inefficient** 2 and **Unattainable** 1.

Your pink drops stay on PPC₁, because `opportunityCosts` still reads the table from before the growth.

## Check your understanding

<Question>
Another country's PPC table shows it can make 44 capital goods along with 2 units of consumption goods, and 35 capital goods along with 3 units. What is the opportunity cost of its 3rd unit of consumption goods?
- [ ] 35 capital goods
- [x] 9 capital goods
- [ ] 1 unit of consumption goods
> The opportunity cost of the 3rd unit is the capital goods given up to make it: 44 − 35 = 9. The country still makes 35 capital goods. The opportunity cost of more consumption goods is counted in capital goods given up, not in consumption goods.
</Question>

<Question>
Suppose every additional unit of consumption goods cost Dovania the same 6 capital goods. What would its PPC look like?
- [ ] It would bow outward, like the PPC from Dovania's table
- [x] It would be a straight line from 30 capital goods to 5 units of consumption goods
- [ ] It would bow inward, toward the origin
> The shape of the PPC depends on whether opportunity costs are constant, increasing or decreasing. With a constant opportunity cost, the PPC drops the same 6 capital goods for every unit, so it's a straight line. Dovania's increasing opportunity costs, from 2 up to 12, make its PPC steeper and steeper, so it bows outward.
</Question>

<Question>
Which of these would shift Dovania's PPC outward?
- [ ] Putting Dovania's underutilized resources to work
- [ ] Making more consumption goods and fewer capital goods
- [x] Better technology that lets Dovania make more of each good with the same resources
> The PPC can shift because of changes in factors of production as well as changes in productivity/technology, and economic growth results in an outward shift of the PPC. Putting underutilized resources to work moves a combination from inside the PPC toward it, and making more consumption goods and fewer capital goods is a tradeoff that moves along the PPC. Neither one shifts it.
</Question>

## Wrap up

You wrote `opportunityCosts`, a loop over neighboring rows of Dovania's PPC table that subtracts each row's capital goods from the row before it to find the opportunity cost of each additional unit of consumption goods. The opportunity costs increased from 2 to 12 capital goods, so Dovania's PPC bows outward. Your if / else if / else chain in `describePoint` compared each combination with the PPC's height at its consumption goods: a combination on the PPC is efficient, one inside it is inefficient, with underutilized resources, and one beyond it is unattainable. Then 25% economic growth shifted the PPC outward. (5, 15), unattainable before, landed on the new PPC, while (4, 25) stayed beyond it.

Next, in **Price Indices and Inflation**, you'll build a consumer price index from a fixed basket of goods and services and use it to calculate the inflation rate.
