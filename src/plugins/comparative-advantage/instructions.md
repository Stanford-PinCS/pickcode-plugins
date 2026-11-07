# Comparative Advantage

Arvia can make more corn and more fish than Bovia. Can trading with Bovia still help Arvia? You'll draw both countries' **production possibilities curves**, compare their **opportunity costs** to find each one's **comparative advantage**, and see what **specialization** and **trade** do for both. Along the way you'll write a **function** that **returns** a ratio, and an **if / else** that compares two values.

Click **Next** to continue.

## Trade-offs and opportunity cost

Economic **trade-offs** arise from **scarcity**: the lack of sufficient resources to meet society's wants and needs. A **production possibilities curve (PPC)** is a model used to show the trade-offs associated with allocating resources.

Two made-up countries, Arvia and Bovia, each make corn and fish, and they have the same quantity of resources. In a year, each can make at most:

| Country | Corn, if it makes no fish | Fish, if it makes no corn |
|---|---|---|
| Arvia | 30 tons | 120 tons |
| Bovia | 20 tons | 40 tons |

On its PPC, where no resources are underutilized, a country can make more corn only by moving resources away from fish. The fish it gives up to make one more ton of corn is its **opportunity cost** of corn.

The shape of a PPC depends on whether opportunity costs are constant, increasing or decreasing. Here each country's PPC is a straight line from all fish to all corn, so its opportunity cost is **constant**: every ton of corn costs the same amount of fish. On a straight-line PPC:

> opportunity cost of one more unit of a good = most of the other good ÷ most of this good

## Absolute and comparative advantage

- **Absolute advantage** describes a situation in which an individual, business, or country can produce more of a good or service than any other producer with the same quantity of resources.
- **Comparative advantage** describes a situation in which an individual, business, or country can produce a good or service at a lower opportunity cost than another producer.

Here the producers are two countries.

The consequences of scarcity can be mitigated through **specialization** in production and by exchange. Specialization according to comparative advantage, not absolute advantage, results in exchange opportunities that lead to consumption possibilities beyond the PPC.

The **terms of trade** say how much of one good trades for one unit of the other. Comparative advantage and opportunity costs determine the terms of trade under which **mutually beneficial** trade can occur.

## Two functions

Here is your code:

```js
// The most each country can make in a year, in tons, if it makes only that good.
let arvia = { corn: 30, fish: 120 };
let bovia = { corn: 20, fish: 40 };

// The terms of trade: how many tons of fish trade for 1 ton of corn.
let fishPerCorn = 3;

// Returns how much of the other good is given up to make one more unit of this good.
function opportunityCost(maxOfThisGood, maxOfOtherGood) {
    return maxOfThisGood / maxOfOtherGood;
}

// Returns the country that should make corn: "Arvia" or "Bovia".
function whoMakesCorn(arviaCornCost, boviaCornCost) {
    // Arvia can make more corn than Bovia, so Arvia makes corn.
    return "Arvia";
}
```

```python
# The most each country can make in a year, in tons, if it makes only that good.
arvia = {"corn": 30, "fish": 120}
bovia = {"corn": 20, "fish": 40}

# The terms of trade: how many tons of fish trade for 1 ton of corn.
fishPerCorn = 3

# Returns how much of the other good is given up to make one more unit of this good.
def opportunityCost(maxOfThisGood, maxOfOtherGood):
    return maxOfThisGood / maxOfOtherGood

# Returns the country that should make corn: "Arvia" or "Bovia".
def whoMakesCorn(arviaCornCost, boviaCornCost):
    # Arvia can make more corn than Bovia, so Arvia makes corn.
    return "Arvia"
```

- `arvia` and `bovia` hold the two ends of each country's PPC: the most corn it can make, and the most fish.
- `fishPerCorn` is the terms of trade: 3 tons of fish for each ton of corn.
- `opportunityCost` should return the opportunity cost of one more unit of "this good", counted in units of the other good. It **divides** one amount by the other, and a division gives a **ratio**. Right now it divides the wrong way round.
- `whoMakesCorn` gets what your `opportunityCost` returns for each country's corn and should return the country that makes corn. Right now it always returns `"Arvia"`, because Arvia can make more corn: it goes by absolute advantage.
- The last line, `tradeAndCompare(arvia, bovia, fishPerCorn, opportunityCost, whoMakesCorn)`, calls `opportunityCost` with each country's most corn and most fish to find what 1 ton of corn costs it, then asks `whoMakesCorn` which country makes corn. Each country specializes: one makes only corn and the other only fish. Then the corn maker ships 10 tons of corn to the other country and gets `fishPerCorn` tons of fish for each ton.

## Run it

Press the **Run** button.

The graph has corn across the bottom and fish up the side. The pink line is Arvia's PPC and the teal line is Bovia's. Arvia's PPC lies outside Bovia's: Arvia can make more corn (30 tons to 20) and more fish (120 tons to 40), so it has the absolute advantage in both goods. The amber tag along each PPC is that country's opportunity cost of corn, its most fish ÷ its most corn: **1 corn = 4 fish** on Arvia's PPC and **1 corn = 2 fish** on Bovia's. Each ton of corn costs Arvia 4 tons of fish and costs Bovia 2.

A filled dot marks what each country makes. The dashed line is its trade, and the ring at its end marks what the country **consumes** after trading. A bracket shows how far the ring sits from the country's own PPC, in tons of fish: a ring beyond the PPC is a gain from trade, and a ring inside it is a loss. The ring is what a country consumes, not what it makes, so a ring inside the PPC here comes from the trade, not from underutilized resources.

Right now Arvia makes all 30 tons of corn and Bovia makes all 40 tons of fish. Arvia ships 10 tons of corn to Bovia for 30 tons of fish.

- Arvia consumes 20 tons of corn and 30 tons of fish. Making 20 tons of corn on its own, Arvia could still have made 40 tons of fish, so its ring sits 10 tons of fish inside its PPC.
- Bovia consumes 10 tons of corn and 10 tons of fish. Making 10 tons of corn on its own, Bovia could still have made 20 tons of fish, so its ring sits 10 tons inside its PPC too.

The bottom row shows **Your Arvia opp. cost**, 0.25, and **Your Bovia opp. cost**, 0.5. Those are what your `opportunityCost` returned for each country's corn, not their opportunity costs of corn: the amber tags say 4 and 2. **Arvia's gain** and **Bovia's gain** both read −10 fish. This trade leaves both countries worse off than making their own corn and fish.

## Step 1: Divide the right way round

Arvia gives up 120 tons of fish to make 30 tons of corn, so each ton of corn costs it 120 ÷ 30 = 4 tons of fish: the most of the other good divided by the most of this good. Your function divides 30 ÷ 120 = 0.25 instead, which is how much corn 1 ton of fish costs.

Replace the `return` line inside `opportunityCost` with:

```js
    return maxOfOtherGood / maxOfThisGood;
```

```python
    return maxOfOtherGood / maxOfThisGood
```

Run it again.

**Look for:** **Your Arvia opp. cost** reads 4 and **Your Bovia opp. cost** reads 2 (40 ÷ 20), the same as the amber tags. Bovia gives up less fish for each ton of corn, so Bovia has the **comparative advantage** in corn, even though Arvia can make more corn. The graph hasn't changed: `whoMakesCorn` still picks Arvia, so both gains are still −10 fish.

## Step 2: Specialize by comparative advantage

The country with the lower opportunity cost of corn should make the corn. Replace the two lines inside `whoMakesCorn` with an if / else that compares the two costs:

```js
    if (arviaCornCost < boviaCornCost) {
        return "Arvia";
    } else {
        return "Bovia";
    }
```

```python
    if arviaCornCost < boviaCornCost:
        return "Arvia"
    else:
        return "Bovia"
```

The `if` line checks whether 1 ton of corn costs Arvia less fish than it costs Bovia. If it does, the function returns `"Arvia"`. If not, the `else` part runs and returns `"Bovia"`.

Run it again.

**Look for:** Bovia now makes all 20 tons of corn and Arvia all 120 tons of fish. Bovia ships 10 tons of corn to Arvia for 30 tons of fish, and both rings land beyond their PPCs: **Arvia's gain** and **Bovia's gain** both read +10 fish.

- Bovia consumes 10 tons of corn and 30 tons of fish. Making 10 tons of corn on its own, it could have made only 20 tons of fish.
- Arvia consumes 10 tons of corn and 90 tons of fish. Making 10 tons of corn on its own, it could have made only 80 tons of fish.
- Each country has the comparative advantage in a different good. A ton of fish costs Arvia 30 ÷ 120 = 0.25 tons of corn but costs Bovia 20 ÷ 40 = 0.5 tons, so Arvia has the comparative advantage in fish.

## Step 3: Change the terms of trade

Suppose Arvia offers to trade one for one: 1 ton of fish for each ton of corn. Change the `fishPerCorn` line to:

```js
let fishPerCorn = 1;
```

```python
fishPerCorn = 1
```

Run it again.

**Look for:** Bovia gets only 10 tons of fish for its 10 tons of corn, so it consumes 10 tons of corn and 10 tons of fish. Its ring drops inside its PPC: **Bovia's gain** reads −10 fish, while **Arvia's gain** jumps to +30 fish.

Bovia gives up 2 tons of fish to make each ton of corn, so selling it for 1 is a bad deal. Arvia gives up 4 tons of fish to make a ton of corn, so it gains only if it pays less than 4. Trade is mutually beneficial only when the terms of trade fall between the two opportunity costs: more than 2 and less than 4 tons of fish per ton of corn, like the 3 you used in Step 2, once each country specialized according to its comparative advantage.

## Check your understanding

<Question>
Which country has the comparative advantage in fish?
- [ ] Arvia, because it can make 120 tons of fish and Bovia only 40
- [x] Arvia, because 1 ton of fish costs it 0.25 tons of corn and costs Bovia 0.5
- [ ] Bovia, because Arvia already has the absolute advantage in fish
> Comparative advantage compares opportunity costs, not amounts. Each ton of fish costs Arvia 30 ÷ 120 = 0.25 tons of corn and Bovia 20 ÷ 40 = 0.5 tons. Making more fish is Arvia's absolute advantage.
</Question>

<Question>
Which terms of trade make trade mutually beneficial for Arvia and Bovia?
- [ ] 1.5 tons of fish per ton of corn
- [x] 2.5 tons of fish per ton of corn
- [ ] 4.5 tons of fish per ton of corn
> Bovia gives up 2 tons of fish to make a ton of corn and Arvia gives up 4. At 2.5, Bovia gets more fish for its corn than making it cost, and Arvia pays less than making the corn itself would cost. At 1.5, Bovia's gain would be −5 fish, and at 4.5, Arvia's would be.
</Question>

<Question>
Arvia has the absolute advantage in both goods. Why did it still gain from trade in Step 2?
- [ ] A country with the absolute advantage in both goods always gains from trade
- [x] It specialized in fish, its comparative advantage, and paid 3 tons of fish for each ton of corn instead of the 4 it gives up to make one
- [ ] It traded at terms of trade higher than its opportunity cost of corn
> Specialization according to comparative advantage, not absolute advantage, results in exchange opportunities that lead to consumption possibilities beyond the PPC when the terms of trade fall between the two opportunity costs. Each of Arvia's 10 tons of corn cost it 1 ton of fish less than making it, so Arvia ended up with 10 more tons of fish.
</Question>

## Wrap up

You wrote `opportunityCost`, a function that returns a ratio: on a straight-line PPC, the most of the other good divided by the most of this good is the constant opportunity cost. Your if / else in `whoMakesCorn` compared the two countries' opportunity costs of corn, so each country specialized according to comparative advantage, not absolute advantage. Arvia can make more of both goods, yet at terms of trade of 3 tons of fish per ton of corn, between the two opportunity costs, both countries consumed beyond their PPCs. At 1, below that range, Bovia ended up inside its PPC.

Next, in **Price Elasticity of Demand**, you'll measure how much buyers respond to a price change and what that does to total revenue.
