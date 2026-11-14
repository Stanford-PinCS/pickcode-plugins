# Spending Multiplier

Vellmark, a made-up country, spends $100 million on a new bridge. By how much does that change its real GDP? The people paid to build the bridge spend part of their new income, the people they buy from spend part of theirs, and so on. You'll follow these rounds of spending to see where the **expenditure multiplier** comes from, how the **marginal propensity to consume** sets its size, and why a **tax cut** of the same size changes real GDP less. Along the way you'll write a **for loop** that keeps a **running total** and **updates a value** each round.

Click **Next** to continue.

## Rounds of spending

The **aggregate demand (AD)** curve describes the relationship between the price level and the quantity of goods and services demanded by households (consumption), firms (investment), government (government spending), and the rest of the world (net exports). Any change in one of those components that is not due to a change in the price level shifts the AD curve. The bridge is a change in government spending.

And the change doesn't stop at $100 million. A $1 change to autonomous expenditures leads to further changes in total expenditures and total output. Here the bridge sets off those further changes, round after round:

- **Round 1:** the government spends $100 million on the bridge. That's $100 million of new income for the people who build it.
- **Round 2:** they spend part of that new income at Vellmark's shops and businesses, and that's new income for the people there.
- **Round 3, 4, …:** each round's new spending is new income for someone else, who spends part of it in the next round.

Round 1 is government spending, and every later round is consumer spending: consumption.

How big a part do people spend? The **marginal propensity to consume (MPC)** is the change in consumer spending divided by the change in disposable income. In Vellmark, the MPC is 0.8: when people's disposable income rises by $1, their consumer spending rises by 80 cents. The sum of the MPC and the **marginal propensity to save (MPS)** is equal to one, so MPS = 1 − 0.8 = 0.2. In this lesson, all new income is disposable income. The price level stays the same too, so all of each round's new spending is new real output.

So each round's new spending is the MPC times the round before: $100 million, then 0.8 × 100 = $80 million, then 0.8 × 80 = $64 million, and so on. Adding up every round gives the total change in real GDP.

## The expenditure multiplier

The **expenditure multiplier** quantifies the size of the change in aggregate demand as a result of a change in any of the components of aggregate demand. It depends on the marginal propensity to consume:

> expenditure multiplier = 1 ÷ (1 − MPC) = 1 ÷ MPS
>
> maximum change in real GDP = expenditure multiplier × change in spending

The multiplier gives the size of the change in aggregate demand. When aggregate demand increases, the price level can rise along with output, and then real GDP rises by less, so the multiplier gives the most real GDP can change. In this lesson the price level stays the same, so real GDP changes by the full amount.

With an MPC of 0.8, the expenditure multiplier is 1 ÷ 0.2 = 5. Once every round is counted, the $100 million bridge changes real GDP by 5 × $100 million = $500 million. Your loop will add up the rounds one at a time to show where that number comes from.

## A loop with a running total

Here is your code:

```js
let mpc = 0.8;     // the marginal propensity to consume
let rounds = 20;   // how many rounds of spending to follow

// Returns the total change in real GDP after the given number of rounds.
// firstRound is the new spending in round 1, in millions of dollars.
function changeInGDP(firstRound, mpc, rounds) {
    let spending = firstRound;   // this round's new spending
    let total = 0;               // the running total of new spending so far
    for (let r = 1; r <= rounds; r++) {
        total = total + spending;
    }
    return total;
}
```

```python
mpc = 0.8     # the marginal propensity to consume
rounds = 20   # how many rounds of spending to follow

# Returns the total change in real GDP after the given number of rounds.
# firstRound is the new spending in round 1, in millions of dollars.
def changeInGDP(firstRound, mpc, rounds):
    spending = firstRound   # this round's new spending
    total = 0               # the running total of new spending so far
    for r in range(1, rounds + 1):
        total = total + spending
    return total
```

- `mpc` is Vellmark's MPC, 0.8, and `rounds` is how many rounds of spending to follow, 20.
- `changeInGDP` should return the total change in real GDP, in millions of dollars, after `rounds` rounds, when round 1's new spending is `firstRound`. Its **for loop** runs once for each round, with `r` counting 1, 2, 3 and so on up to `rounds`.
- `spending` holds this round's new spending. It starts at `firstRound`.
- `total` is a **running total**. It starts at 0, and each pass of the loop adds this round's new spending to it, so when the loop ends it holds every round's new spending added together. Right now nothing changes `spending`, so every pass adds the same amount.
- The last line, `spendMore(100, mpc, rounds, changeInGDP)`, has the government spend $100 million more, so `firstRound` is 100. To draw the total after every round, it calls your `changeInGDP` 20 times: for 1 round, 2 rounds, and so on up to 20.

## Run it

Press the **Run** button.

The graph shows the round across the bottom and the change in real GDP, in millions of dollars, up the side. Each pink block is what your loop added to the total in one round, stacked on top of the rounds before it, so the top of the staircase after each round is your running total. The line above the graph lists what your loop added in the first four rounds. The dashed amber line is the multiplier's prediction, 5 × $100 million = $500 million, with its value at the right end.

Right now every round adds $100 million, so the staircase climbs in a straight line. It reaches the dashed line at round 5 and keeps climbing, to $2,000 million after 20 rounds. Your loop never uses `mpc`: it adds the whole $100 million in every round, as if people spent all of their new income, round after round.

The bottom row shows the following, with dollar amounts in millions ($100M is $100 million):

- **New Spending**, $100 million: the government's new spending on the bridge.
- **MPC**, 0.8, from your code, and **MPS**, worked out from it: 1 − 0.8 = 0.2.
- **Multiplier**, 5: the expenditure multiplier for that MPC, 1 ÷ 0.2. It comes from the MPC, not from your loop.
- **Total**, $2,000 million: what your `changeInGDP` returned for all 20 rounds.

## Step 1: Spend the MPC share each round

Each round, the people who just got new income spend the MPC share of it, so the next round's new spending is the MPC times this round's. Add one line at the end of the loop, so the loop reads:

```js
    for (let r = 1; r <= rounds; r++) {
        total = total + spending;
        spending = spending * mpc;
    }
```

```python
    for r in range(1, rounds + 1):
        total = total + spending
        spending = spending * mpc
```

The new line **updates** `spending`: it replaces this round's new spending with the next round's. It comes after the line that adds to `total`, so round 1 adds the whole $100 million and round 2 adds 0.8 × 100 = $80 million.

Run it again.

**Look for:** the blocks shrink. The line above the graph reads +$100M, +$80M, +$64M, +$51.2M: each round adds 0.8 times the round before. The staircase levels off just under the dashed line, and **Total** reads $494.24 million after 20 rounds, close to the multiplier's $500 million. The last few blocks are barely thicker than a line.

Why 1 ÷ MPS? In each round, the MPS share of the new income isn't spent, so it starts no new round: $20 million of round 1's $100 million, $16 million of round 2's $80 million, and so on. These unspent shares add up toward the whole $100 million, so in the end MPS × total = $100 million, and the total is $100 million ÷ 0.2 = $500 million.

## Step 2: Lower the MPC

Suppose people in Vellmark spend a smaller share of their new income, and the MPC falls to 0.75. Change the `mpc` line to:

```js
let mpc = 0.75;    // the marginal propensity to consume
```

```python
mpc = 0.75    # the marginal propensity to consume
```

Run it again.

**Look for:** **MPS** reads 0.25, and **Multiplier** falls from 5 to 4, since 1 ÷ 0.25 = 4. The rounds now read +$100M, +$75M, +$56.25M, +$42.19M, shrinking faster than before. The dashed line drops to 4 × $100 million = $400 million, and **Total** reads $398.73 million after 20 rounds.

The expenditure multiplier depends on the marginal propensity to consume. With a smaller MPC, people pass on less of each round's new income, so the rounds add up to less. A larger MPC would make the multiplier larger.

## Step 3: Cut taxes instead

Now suppose that instead of building the bridge, Vellmark's government cuts taxes by $100 million. The tax cut raises disposable income by $100 million, but that isn't new spending yet. People spend the MPC share of it, so round 1's new spending is only 0.75 × 100 = $75 million. After that, the rounds shrink the same way as before.

The **tax multiplier** quantifies the size of the change in aggregate demand as a result of a change in taxes. It depends on the marginal propensity to consume too:

> tax multiplier = −MPC ÷ (1 − MPC) = −MPC ÷ MPS

With an MPC of 0.75, it's −0.75 ÷ 0.25 = −3. It's negative because real GDP moves the opposite way from taxes. A tax cut of $100 million is a change in taxes of −$100 million, so real GDP changes by −3 × −$100 million = +$300 million.

Replace the last two lines of your code with:

```js
// Instead, the government cuts taxes by $100 million. Follow each round and draw it.
cutTaxes(100, mpc, rounds, changeInGDP);
```

```python
# Instead, the government cuts taxes by $100 million. Follow each round and draw it.
cutTaxes(100, mpc, rounds, changeInGDP)
```

`cutTaxes` calls your `changeInGDP` with `firstRound` = 0.75 × 100 = 75. Your loop stays the same: only round 1 changes.

Run it again.

**Look for:** the bottom row reads **Tax Cut** $100 million and **Tax Multiplier** −3. The rounds read +$75M, +$56.25M, +$42.19M, +$31.64M: Step 2's rounds without its $100 million round 1. The dashed line drops to $300 million, and **Total** reads $299.05 million after 20 rounds, about $100 million less than the $398.73 million from new spending.

Changes in government spending affect aggregate demand directly, and changes in taxes/transfers affect aggregate demand indirectly: here, only through the consumer spending that the tax cut leads to. The government spending multiplier is greater than the tax multiplier. Here the expenditure multiplier for government spending is 4, and the tax multiplier's size is only 3, because in round 1 people spent only the MPC share of the tax cut, 0.75 × $100 million.

## Check your understanding

<Question>
When their disposable income rises by $200 million, people in Vellmark raise their consumer spending by $150 million. What are the MPC and the MPS?
- [ ] MPC = 1.33 and MPS = −0.33
- [x] MPC = 0.75 and MPS = 0.25
- [ ] MPC = 0.25 and MPS = 0.75
> The MPC is the change in consumer spending divided by the change in disposable income: 150 ÷ 200 = 0.75. The sum of the MPC and the MPS is equal to one, so MPS = 1 − 0.75 = 0.25. 1.33 divides the other way round.
</Question>

<Question>
In another made-up country, the MPC is 0.9, and the government spends $50 million more on new schools. Once every round is counted, what's the most real GDP can increase, according to the expenditure multiplier?
- [ ] $45 million
- [ ] $450 million
- [x] $500 million
> The expenditure multiplier is 1 ÷ (1 − 0.9) = 1 ÷ 0.1 = 10, so real GDP can increase by at most 10 × $50 million = $500 million. $45 million is only round 2, 0.9 × $50 million. $450 million is the most a $50 million tax cut could add there, with a tax multiplier of −0.9 ÷ 0.1 = −9.
</Question>

<Question>
Why did the $100 million tax cut in Step 3 change real GDP less than $100 million of new government spending?
- [ ] People save all of a tax cut, so it doesn't change aggregate demand
- [x] People spend only the MPC share of a tax cut in round 1, while the government spends all $100 million of its new spending
- [ ] A tax cut's rounds shrink faster than government spending's rounds
> A tax cut adds to disposable income, and people spend only the MPC share of it, so round 1 was $75 million instead of $100 million. After that, both sets of rounds shrink by the same MPC, 0.75. So the expenditure multiplier, 1 ÷ MPS = 4, is bigger than the tax multiplier, −MPC ÷ MPS = −3, whose size is 3.
</Question>

## Wrap up

You wrote a for loop with a running total: each pass added this round's new spending to `total`, then updated `spending` to the MPC share of it for the next round. The rounds shrank by the MPC each time, so the total leveled off at the multiplier's prediction. With an MPC of 0.8, Vellmark's $100 million bridge added up to almost $500 million of real GDP, because the expenditure multiplier is 1 ÷ MPS = 1 ÷ 0.2 = 5. When the MPC fell to 0.75, the multiplier fell to 4. A $100 million tax cut added up to only about $300 million: people spend only the MPC share of a tax cut, so the tax multiplier, −MPC ÷ MPS = −3, is smaller in size than the expenditure multiplier.

Next, in **Money Creation**, you'll follow how banks lend out their excess reserves and expand the money supply.
