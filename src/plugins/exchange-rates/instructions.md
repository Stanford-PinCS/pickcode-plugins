# Exchange Rates

Pellia and Quorvia are two made-up countries. Pellia's currency is the pell, and Quorvia's is the quor. You'll graph the **foreign exchange market** for the pell and see its equilibrium **exchange rate**. Then you'll shift the demand for pells to see the pell **appreciate** and **depreciate**, and see what each change does to the prices that people in Quorvia pay for Pellia's exports and to Pellia's **net exports**. Along the way you'll write a **function** that **multiplies** an amount by a rate, and use a **loop** that applies it to every price in a list.

Click **Next** to continue.

## The price of a currency

In the **foreign exchange market**, one currency is exchanged for another; the price of one currency in terms of the other is the **exchange rate**. Here the exchange rate is the price of one pell in quors: at 2 quors per pell, one pell costs 2 quors. On a graph of the market for pells, the exchange rate is expressed in terms of one unit of the domestic currency, so the vertical axis reads quors per pell.

- If one currency becomes more valuable in terms of the other, it is said to **appreciate**. When the exchange rate rises, each pell costs more quors, so the pell appreciates.
- If one currency becomes less valuable in terms of the other, it is said to **depreciate**. When the exchange rate falls, each pell costs fewer quors, so the pell depreciates.

## The foreign exchange market

The **demand** for a currency in a foreign exchange market arises from the demand for the country's goods, services, and financial assets and shows the inverse relationship between the exchange rate and the quantity demanded of a currency. Here, people in Quorvia demand pells to buy Pellia's goods, services, and financial assets.

The **supply** of a currency in a foreign exchange market arises from making payments in other currencies and shows the positive relationship between the exchange rate and the quantity supplied of a currency. Here, people in Pellia supply pells when they make payments in quors.

In the foreign exchange market, **equilibrium** is achieved when the exchange rate is such that the quantities demanded and supplied of the currency are equal. Disequilibrium exchange rates create **surpluses** and **shortages** in the foreign exchange market, and market forces drive exchange rates toward equilibrium.

Factors that shift the demand for a currency (such as the demand for that country's goods, services, or assets) and the supply of a currency (such as tariffs or quotas on the other country's goods and services) change the equilibrium exchange rate.

## A function and a loop

Here is your code:

```js
// What four of Pellia's exports sell for in Pellia, in pells.
let prices = [20, 30, 50, 80];

// How far the demand for pells shifts, in millions of pells a day. 0 means no shift.
let demandShift = 0;

// Returns amount pells in quors, when one pell costs rate quors.
function convert(amount, rate) {
    return amount / rate;
}

// Returns the price of each export in quors, when one pell costs rate quors.
function pricesInQuors(prices, rate) {
    let result = [];
    for (let price of prices) {
        result.push(convert(price, rate));
    }
    return result;
}
```

```python
# What four of Pellia's exports sell for in Pellia, in pells.
prices = [20, 30, 50, 80]

# How far the demand for pells shifts, in millions of pells a day. 0 means no shift.
demandShift = 0

# Returns amount pells in quors, when one pell costs rate quors.
def convert(amount, rate):
    return amount / rate

# Returns the price of each export in quors, when one pell costs rate quors.
def pricesInQuors(prices, rate):
    result = []
    for price in prices:
        result.append(convert(price, rate))
    return result
```

- `prices` holds what four of Pellia's exports sell for in Pellia, in pells.
- `demandShift` is how far the demand for pells shifts at every exchange rate, in millions of pells a day. It's 0, so nothing shifts yet.
- `convert` should return what `amount` pells cost in quors when one pell costs `rate` quors. Right now it divides `amount` by `rate`.
- `pricesInQuors` uses a **loop** to apply `convert` to every price in a list. It starts `result` as an empty list. The loop runs once for each price in `prices`, and each time it adds `convert(price, rate)` to the end of `result`. Then the function returns `result`: one price in quors for each price in pells.
- The last line, `drawExchangeMarket(prices, demandShift, pricesInQuors)`, finds the **equilibrium exchange rate**, where the quantity of pells demanded equals the quantity supplied, before and after the demand for pells shifts by `demandShift`. It gets `pricesInQuors` by name, with no parentheses, so it can call your function itself: once at each of those two exchange rates. Then it graphs it all.

## Run it

Press the **Run** button.

The top graph is the foreign exchange market for the pell. The **quantity of pells**, in millions a day, runs along the bottom, and the **exchange rate**, in quors per pell, runs up the side. The teal line D₁ is the demand for pells, and it slopes down. The purple line S is the supply of pells, and it slopes up. The dark dot where they cross is the equilibrium: the exchange rate is e₁ = 2 quors per pell, where the quantity demanded and the quantity supplied are both 400 million pells a day.

Below it there's one row for each export. The number on the left is its price in pells. The pink ring is the price in quors that your `convert` gave for it at e₁, and the pink number on the right is that price. The dashed amber mark is the correct price in quors at e₁.

Your rings sit far to the left of the amber marks. Your prices are 10, 15, 25 and 40 quors, but the amber marks are at 40, 60, 100 and 160.

The bottom row shows:

- **Rate Before** and **Rate After**: the equilibrium exchange rate, in quors per pell, before and after the demand for pells shifts. `drawExchangeMarket` finds them, so they don't depend on your `convert`. Nothing has shifted, so both read 2.
- **Prices Right**: how many of the exports your `convert` priced right in quors, at the exchange rate before the shift and after it. It reads 0 of 4.
- **Net Exports**: what the change in the exchange rate does to Pellia's net exports. It depends only on which way the exchange rate moves, not on your `convert`. The exchange rate didn't change, so it reads No change.

## Step 1: Multiply by the exchange rate

One pell costs 2 quors, so an export that sells for 20 pells costs 20 × 2 = 40 quors: multiply the amount in pells by the exchange rate. Your `convert` divides instead: 20 ÷ 2 = 10. Dividing by this exchange rate turns quors into pells, so 40 quors buy 40 ÷ 2 = 20 pells.

Replace the `return` line inside `convert` with:

```js
    return amount * rate;
```

```python
    return amount * rate
```

Run it again.

**Look for:** each ring lands on its amber mark, at 40, 60, 100 and 160 quors, and **Prices Right** reads 4 of 4. You changed one line in `convert`, and the loop in `pricesInQuors` used it on all four prices.

## Step 2: Raise the demand for pells

Suppose people in Quorvia want to buy more of Pellia's financial assets, such as its bonds and stocks. The demand for pells arises from the demand for Pellia's goods, services, and financial assets, so the demand for pells increases: at every exchange rate, the quantity of pells demanded rises by 100 million a day. Change the `demandShift` line to:

```js
let demandShift = 100;
```

```python
demandShift = 100
```

Run it again.

**Look for:** a second demand curve, D₂, slides out 100 million pells to the right of D₁.

- At the old exchange rate, e₁ = 2 quors per pell, the quantity of pells demanded is now greater than the quantity supplied. The bracket marks the **shortage**: 100 million pells a day. Market forces drive the exchange rate up along S to e₂ = 2.5 quors per pell, where the quantities demanded and supplied are equal again. **Rate After** reads 2.5.
- One pell now costs 2.5 quors instead of 2. The pell is more valuable in terms of the quor: it **appreciated**.
- The exports' prices in pells didn't change, but a pink dot slides out from each ring to its price at e₂: 50, 75, 125 and 200 quors. Each dot lands on a solid amber mark, the correct price at e₂. The appreciation of the pell makes Pellia's goods and services relatively more expensive than other countries' goods and services.
- **Net Exports** reads Decrease. Factors that cause a currency to appreciate cause that country's exports to decrease and its imports to increase. As a result, net exports will decrease.

## Step 3: Lower the demand for pells

Now suppose people in Quorvia want fewer of Pellia's financial assets instead, so at every exchange rate the quantity of pells demanded falls by 100 million a day. Change the `demandShift` line again:

```js
let demandShift = -100;
```

```python
demandShift = -100
```

Run it again.

**Look for:** D₂ now sits 100 million pells to the left of D₁.

- At e₁ = 2 quors per pell, the quantity of pells supplied is now greater than the quantity demanded: the bracket marks a **surplus** of 100 million pells a day. The exchange rate falls along S to e₂ = 1.5 quors per pell, and **Rate After** reads 1.5. The pell is less valuable in terms of the quor: it **depreciated**.
- Each dot slides left from its ring to its solid amber mark, at 30, 45, 75 and 120 quors: every export costs fewer quors than before.
- **Net Exports** reads Increase. Factors that cause a currency to depreciate cause that country's exports to increase and its imports to decrease. As a result, net exports will increase.

## Check your understanding

<Question>
After Step 3, one pell costs 1.5 quors. A jacket made in Quorvia sells there for 30 quors. What does it cost a buyer in Pellia?
- [ ] 45 pells
- [x] 20 pells
- [ ] 30 pells
> One pell costs 1.5 quors, so 30 quors buy 30 ÷ 1.5 = 20 pells. To turn pells into quors, as `convert` does, multiply by the exchange rate; to turn quors into pells, divide by it. Multiplying here, 30 × 1.5 = 45, mixes them up the other way round.
</Question>

<Question>
In Step 2, why did the exchange rate rise from 2 to 2.5 quors per pell?
- [ ] Pellia's exports cost more in Quorvia, so the pell was worth more
- [x] At 2 quors per pell, the quantity of pells demanded was greater than the quantity supplied, and market forces drove the exchange rate up
- [ ] The supply of pells decreased
> Disequilibrium exchange rates create surpluses and shortages in the foreign exchange market, and market forces drive exchange rates toward equilibrium. Once the demand for pells increased, there was a shortage of 100 million pells a day at 2 quors per pell, so the exchange rate rose until the quantities demanded and supplied were equal again, at 2.5. The supply curve didn't move, and the exports cost more in Quorvia because the exchange rate rose, not the other way round.
</Question>

<Question>
Which of these shifts the demand for pells to the right?
- [ ] A rise in the exchange rate of the pell
- [x] People in Quorvia want to buy more of Pellia's goods and services
- [ ] People in Pellia want to buy more of Quorvia's goods and services
> The demand for a currency arises from the demand for the country's goods, services, and financial assets. A rise in the exchange rate decreases the quantity of pells demanded, along the demand curve; it doesn't shift the curve. People in Pellia who buy Quorvia's goods make payments in quors, and the supply of pells, not the demand, arises from those payments.
</Question>

## Wrap up

You wrote `convert`, a function that multiplies an amount in pells by the exchange rate, the price of one pell in quors, to find the amount in quors. The loop in `pricesInQuors` used it on every price in the list, so one fix corrected all four. When the demand for pells increased, there was a shortage at the old exchange rate, and market forces drove the exchange rate up from 2 to 2.5 quors per pell: the pell appreciated, every export cost more quors, and Pellia's net exports decrease as its exports decrease and its imports increase. When the demand for pells decreased instead, there was a surplus, and the exchange rate fell to 1.5: the pell depreciated, every export cost fewer quors, and Pellia's net exports increase.
