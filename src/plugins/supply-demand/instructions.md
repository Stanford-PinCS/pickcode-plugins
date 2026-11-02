# Supply and Demand

Every market has buyers and sellers. Where their wishes meet, the market settles on one price and one quantity, called the **equilibrium**. You'll use **variables** to shift the market, then predict where the new equilibrium lands before you run it.

Click **Next** to continue.

## Where buyers and sellers meet

- The **supply** curve slopes up: sellers offer more when the price is higher.
- The **demand** curve slopes down: buyers want less when the price is higher.
- The **equilibrium** is where the curves cross. There, the quantity sellers offer equals the quantity buyers want.

When something changes the market, a curve **shifts**. Moving right means *more* supply or demand at every price. Moving left means *less*. A drought, for example, shifts supply left, and a rise in buyers' income shifts demand right.

## Setting up a market with variables

A **variable** is a name that stores a value. Your code uses four of them:

```js
let supplyShift = 0;
let demandShift = 0;
let guessPrice = 1.25;
let guessQuantity = 0.9;
```

- `supplyShift` and `demandShift` say how far each curve moves. A positive number shifts it right, and a negative number shifts it left. Both are `0`, so neither curve has moved.
- `guessPrice` and `guessQuantity` are your guess for where the market settles.

```js
showMarket(supplyShift, demandShift, guessPrice, guessQuantity);
```

`showMarket` draws the market from your four variables. Their **order** matters: it reads the first value as the supply shift, the second as the demand shift, and so on.

## Run it

Press the **Run** button.

You'll see a graph with **Quantity** across the bottom and **Price** up the side. The pink line that slopes up is supply, and the teal line that slopes down is demand. An amber dot with dashed amber guide lines marks the equilibrium. A purple ring marks your guess.

The bottom row shows **Supply Shift** None, **Demand Shift** None, **Equilibrium** Q 1.00 · P 1.00 (quantity 1.00, price 1.00), and **Your Guess** Q 0.90 · P 1.25. Your guess is a little off.

## Step 1: Put your guess on the equilibrium

Change `guessPrice` and `guessQuantity` so those two lines read:

```js
let guessPrice = 1;
let guessQuantity = 1;
```

Run it again.

**Look for:** the purple ring now circles the amber dot, and **Your Guess** matches **Equilibrium**.

## Step 2: Raise demand

Change `let demandShift = 0;` to:

```js
let demandShift = 0.4;
```

Leave your guess where it is. Run it again.

**Look for:** a dashed teal line slides to the right of the original demand line. The amber dot follows the crossing up and to the right, to Q 1.20 · P 1.20. More demand raises both the price and the quantity sold.

## Step 3: Lower supply instead

Before you run, predict: if supply drops, which way will the price go? Then change your shift lines so they read:

```js
let supplyShift = -0.4;
let demandShift = 0;
```

Run it again.

**Look for:** a dashed pink line slides left, like after a drought. The equilibrium moves to Q 0.80 · P 1.20. Less supply raises the price but *lowers* the quantity.

## Step 4: Shift both curves

Keep `supplyShift` at `-0.4`, and change `let demandShift = 0;` back to:

```js
let demandShift = 0.4;
```

Run it again.

**Look for:** both dashed lines slide. The equilibrium lands at Q 1.00 · P 1.40, straight above your purple ring. The two shifts push the price up together, but their effects on quantity cancel out.

## Step 5: Move your guess to the new equilibrium

Your guess quantity is already right. Change `let guessPrice = 1;` to:

```js
let guessPrice = 1.4;
```

Run it again.

**Look for:** the purple ring circles the amber dot again, and **Your Guess** reads Q 1.00 · P 1.40.

## Check your understanding

<Question>
In Step 2, demand increased. What happened at the new equilibrium?
- [x] Price and quantity both went up
- [ ] Price went up and quantity went down
- [ ] Nothing changed, because supply stayed the same
> Shifting demand right moves the crossing up the supply curve, so buyers pay more and more is sold.
</Question>

<Question>
Suppose the price is stuck above the equilibrium price. What happens?
- [ ] Buyers want more than sellers offer, so there's a shortage
- [x] Sellers offer more than buyers want, so there's a surplus
- [ ] The curves shift to meet the price
> Above the crossing, the supply line is to the right of the demand line. Sellers bring more than buyers will take.
</Question>

## Wrap up

You used four variables to shift supply and demand and to place your guess. With `supplyShift` at `-0.4` and `demandShift` at `0.4`, the market settled at quantity 1.00 and a higher price of 1.40, and your guess landed right on it.

Economists use these same shifts to explain price changes in the news, from gas after a refinery shuts down to concert tickets when a tour sells out.
