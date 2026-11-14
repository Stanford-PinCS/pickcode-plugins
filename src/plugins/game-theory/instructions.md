# Game Theory

Two airlines, Gull Air and Heron Air, are the only ones flying to a small island. Each one charges a high or a low ticket price, and what each one earns depends on the price the other one charges. You'll use **game theory** to find each airline's **dominant strategy** and the **Nash equilibrium**, then see why the two airlines have an incentive to collude. Along the way you'll read each airline's profits from a **list of lists** with **two indexes**, and write an **if** that compares two of them.

Click **Next** to continue.

## Oligopoly as a game

Monopoly, oligopoly and monopolistic competition are **imperfectly competitive** product markets. An **oligopoly** is an inefficient market structure with high barriers to entry, where there are few firms acting interdependently. High start-up costs are one barrier to entry: starting an airline costs so much that no third airline has joined this route.

**Game theory** is an approach to studying strategic decision making, like each airline's choice of a price:

- A **game** is a situation in which a number of individuals take actions, and the payoff for each individual depends directly on both the individual's own choice and the choices of others. Here the players are the two airlines, each one's action is its price, and each one's payoff is its monthly profit.
- A **strategy** is a complete plan of actions for playing a game. The **normal form** model of a game shows the payoffs that result from each collection of strategies, one for each player, in a **payoff matrix**:

| | Heron: High price | Heron: Low price |
|---|---|---|
| **Gull: High price** | 60, 60 | 20, 80 |
| **Gull: Low price** | 80, 20 | 40, 40 |

Each cell lists Gull's monthly profit first and Heron's second, in thousands of dollars. Each airline picks its price on its own, and both know every payoff in the matrix.

- A player's **best response** to the other player's action is the action that gives it the higher payoff. If both actions give the same payoff, both are best responses.
- A player has a **dominant strategy** when the payoff to a particular action is always higher, whatever action the other player takes.
- A **Nash equilibrium** is a condition describing the set of actions in which no player can increase its payoff by unilaterally taking another action, given the other player's action. In a Nash equilibrium cell, each player's action is a best response to the other's.

## Two indexes into a list of lists

Here is your code:

```js
// Each airline charges a high or a low price. HIGH and LOW are their list indexes.
let HIGH = 0;
let LOW = 1;

// Monthly profit, in thousands of dollars, as payoffs[myPrice][otherPrice].
// Rows: the airline's own price. Columns: the other airline's price, HIGH then LOW.
let gull = [[60, 20],    // Gull charges HIGH
            [80, 40]];   // Gull charges LOW
let heron = [[60, 20],   // Heron charges HIGH
             [80, 40]];  // Heron charges LOW

// Returns HIGH or LOW: whichever earns more when the other airline charges otherPrice.
function bestResponse(payoffs, otherPrice) {
    return HIGH;
}
```

```python
# Each airline charges a high or a low price. HIGH and LOW are their list indexes.
HIGH = 0
LOW = 1

# Monthly profit, in thousands of dollars, as payoffs[myPrice][otherPrice].
# Rows: the airline's own price. Columns: the other airline's price, HIGH then LOW.
gull = [[60, 20],    # Gull charges HIGH
        [80, 40]]    # Gull charges LOW
heron = [[60, 20],   # Heron charges HIGH
         [80, 40]]   # Heron charges LOW

# Returns HIGH or LOW: whichever earns more when the other airline charges otherPrice.
def bestResponse(payoffs, otherPrice):
    return HIGH
```

- `gull` is a **list of lists**: a list of 2 rows, and each row is a list of 2 profits. The first index picks a row, Gull's own price, and the second picks a column, Heron's price. So `gull[LOW][HIGH]` is row 1, column 0: Gull's profit when Gull charges LOW and Heron charges HIGH, 80.
- `heron` works the same way from Heron's side: its own price first, then Gull's. The game is symmetric, so the two tables are the same. When Gull charges LOW and Heron charges HIGH, Heron's profit is `heron[HIGH][LOW]`, 20.
- `bestResponse` gets one airline's table as `payoffs` and the other airline's price as `otherPrice`, and should return that airline's best response. Right now it always returns `HIGH`.
- The last line, `drawGame(gull, heron, bestResponse)`, calls your function four times: for Gull when Heron charges HIGH and when Heron charges LOW, then for Heron when Gull charges each price. Then it draws the payoff matrix from your answers.

## Run it

Press the **Run** button.

The payoff matrix appears, with Gull's prices as the rows and Heron's as the columns. A pink ring circles each payoff your function picked as a best response, and a dashed amber ring circles each correct one. When an airline's two payoffs for one price of the other airline are equal, both prices are best responses, so both payoffs get rings. A pink **dominant** tag marks each airline's dominant strategy by your function's answers, and the cell where your best responses meet, your Nash equilibrium, fills with pink. Dashed amber tags and outlines mark the correct ones.

Your function always returns HIGH, so every pink ring sits on a High price, both pink tags sit on High, and your Nash equilibrium is the High, High cell, where each airline earns 60. The amber rings disagree. When Heron charges a high price, Gull earns 80 by charging a low price, more than 60.

The readouts under the matrix list Gull's value first and Heron's second. **Dominant** reads High, High, and **Nash profits**, the payoffs in your Nash equilibrium cell, reads 60, 60. **Deal profits** and **Gain from switching** stay empty until Step 2.

## Step 1: Compare two payoffs

A best response compares two numbers in the same column of `payoffs`: the profit from charging LOW and the profit from charging HIGH, both when the other airline charges `otherPrice`. Replace the `return` line inside `bestResponse` with these lines:

```js
    if (payoffs[LOW][otherPrice] > payoffs[HIGH][otherPrice]) {
        return LOW;
    } else {
        return HIGH;
    }
```

```python
    if payoffs[LOW][otherPrice] > payoffs[HIGH][otherPrice]:
        return LOW
    else:
        return HIGH
```

`payoffs[LOW][otherPrice]` picks the LOW row, then the column for the other airline's price. The `if` returns LOW only when it earns more than HIGH.

Run it again.

**Look for:** every pink ring now sits inside an amber one.

- When Heron charges a high price, Gull earns 80 with a low price and 60 with a high one. When Heron charges a low price, Gull earns 40 with a low price and 20 with a high one. The payoff to LOW is always higher, so LOW is Gull's dominant strategy. Heron's payoffs are the same, so both pink **dominant** tags move to Low, and **Dominant** reads Low, Low.
- Your Nash equilibrium moves to the Low, Low cell, and **Nash profits** reads 40, 40. From there, an airline that switches to HIGH alone earns 20 instead of 40, so neither one can increase its payoff by unilaterally changing its price.

## Step 2: Make a deal

At the Nash equilibrium each airline earns 40, but if both charged HIGH, each would earn 60. Firms in an oligopoly have an incentive to collude. Add these lines at the end of your code, after `drawGame(gull, heron, bestResponse)`:

```js
// The airlines collude: they make a deal to both charge HIGH.
drawDeal(HIGH, HIGH);
```

```python
# The airlines collude: they make a deal to both charge HIGH.
drawDeal(HIGH, HIGH)
```

`drawDeal` labels the cell the airlines agree on. For each airline that would earn more by switching its own price while the other keeps the deal, it draws a teal arrow from that airline's payoff in the deal cell to its payoff after switching.

Run it again.

**Look for:** a teal **Deal** label on the High, High cell, and **Deal profits** 60, 60. Cooperating would earn each airline 20 more than the Nash equilibrium.

- But each airline has an incentive to break the deal. If Heron keeps charging HIGH, Gull earns 80 by switching to LOW instead of 60, so Gull's arrow runs from its 60 down to its 80 and is labeled +20. Heron's arrow is labeled +20 too, and **Gain from switching** reads 20, 20.
- So the deal isn't a Nash equilibrium: each airline can increase its payoff by unilaterally changing its price. Both airlines would earn more by cooperating, but each one's dominant strategy is still LOW.

## Step 3: Make HIGH Gull's dominant strategy

How big an incentive would it take to make HIGH Gull's dominant strategy? Suppose Gull had to pay a fee every month it charged LOW. Without a fee, LOW earns Gull 20 more whatever Heron does: 80 − 60 = 20 when Heron charges HIGH, and 40 − 20 = 20 when Heron charges LOW. For HIGH to earn more in both cases, the fee has to be more than 20, so the smallest whole-number fee that works is 21.

Add these lines right after the two tables, above `bestResponse`:

```js
// A fee Gull pays, in thousands of dollars, each month it charges LOW.
let fee = 21;
gull[LOW][HIGH] -= fee;
gull[LOW][LOW] -= fee;
```

```python
# A fee Gull pays, in thousands of dollars, each month it charges LOW.
fee = 21
gull[LOW][HIGH] -= fee
gull[LOW][LOW] -= fee
```

`gull[LOW][HIGH] -= fee` subtracts the fee from the profit in row 1, column 0. Together, the two lines take the fee off both profits in Gull's LOW row.

Run it again.

**Look for:** Gull's profits in the Low price row drop to 59 and 19.

- HIGH now earns Gull more whatever Heron does, 60 > 59 and 20 > 19, so **Dominant** reads High, Low: Gull's dominant strategy is HIGH. The fee didn't change Heron's payoffs, so Heron's dominant strategy is still LOW.
- The Nash equilibrium moves to the High, Low cell, and **Nash profits** reads 20, 80. Gull now charges HIGH, but Heron still charges LOW, so Gull earns 20 and Heron earns 80.
- At the deal, **Gain from switching** reads −1, 20. Gull would lose 1 by switching, so its arrow is gone, but Heron would still gain 20.

## Check your understanding

<Question>
Suppose the fee in Step 3 were exactly 20 instead of 21. What would Gull's dominant strategy be?
- [ ] HIGH, because the fee takes away everything LOW gained
- [ ] LOW, because LOW still earns at least as much as HIGH
- [x] Gull would have no dominant strategy
> With a fee of 20, both prices earn Gull 60 when Heron charges HIGH and 20 when Heron charges LOW. A dominant strategy's payoff has to be always higher, and neither price's is. Both prices are then best responses for Gull whatever Heron does, so the matrix shows two Nash equilibria: High, Low and Low, Low.
</Question>

<Question>
Without a fee, why isn't the deal, where both airlines charge HIGH, a Nash equilibrium?
- [ ] Both airlines would earn more if they both charged LOW
- [x] Either airline can raise its profit from 60 to 80 by switching to LOW while the other keeps HIGH
- [ ] HIGH is each airline's dominant strategy
> In a Nash equilibrium, no player can increase its payoff by unilaterally taking another action. At the deal, each airline can.
</Question>

<Question>
What's the smallest whole-number fee on Heron's LOW price that would make HIGH Heron's dominant strategy?
- [ ] 20
- [x] 21
- [ ] 40
> LOW earns Heron 20 more whatever Gull does: 80 − 60 and 40 − 20. The fee has to be more than 20. With a fee of 21 on each airline, the deal becomes the Nash equilibrium.
</Question>

## Wrap up

Each airline's profits sat in a list of lists, `payoffs[myPrice][otherPrice]`, and you read them with two indexes. Your `bestResponse` used an `if` to compare two of them, and `drawGame` used it to find each airline's dominant strategy, LOW, and the Nash equilibrium, where both charge LOW and each earns 40. A deal to both charge HIGH would pay each airline 60, but each one could gain 20 by switching alone, so the deal isn't a Nash equilibrium. A fee of more than 20 on charging LOW was the incentive sufficient to change Gull's dominant strategy to HIGH. Oligopolists have difficulty achieving the monopoly outcome for reasons similar to those that prevent players from achieving a cooperative outcome in the Prisoner's Dilemma. Nevertheless, prices are generally higher and quantities lower with oligopoly than with perfect competition.

Next, in **Marginal Revenue Product**, you'll decide how many workers a firm should hire.
