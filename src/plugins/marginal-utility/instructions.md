# Marginal Utility

You have $7 to spend on apples and bananas, and you want the most satisfaction for your money. Economists solve this by comparing **marginal utility per dollar**. You'll write a **function** that takes in numbers, makes a decision with an **if statement**, and **returns** an answer.

Click **Next** to continue.

## Getting the most for your money

**Utility** measures satisfaction. **Marginal utility (MU)** is the extra satisfaction from one more unit.

Marginal utility **diminishes**: your first apple is great, your third much less so. Here:

- **Apple**: costs $2. Its MU starts at 30 and drops by 10 each time you buy one.
- **Banana**: costs $1. Its MU starts at 20 and drops by 5 each time.

The smart rule is to buy whichever fruit gives the most utility per dollar right now:

> MU per dollar = marginal utility ÷ price

## Making a choice with a function

Your code is one **function**, `choose`. A function takes in values called **parameters** and sends back an answer with `return`:

```js
function choose(mu_a, p_a, mu_b, p_b) {
    // mu = marginal utility, p = price; _a = apple, _b = banana
    return "apple";
}
```

Each round, `choose` gets four numbers: the apple's marginal utility and price (`mu_a`, `p_a`), then the banana's (`mu_b`, `p_b`). Right now `return "apple";` ignores them and always buys an apple.

The last line, `optimize(choose)`, goes shopping with your $7. It calls `choose` once for every fruit you buy, until the money runs out or a fruit's MU reaches 0.

## Run it

Press the **Run** button.

Two cards show the **Apple** (pink) and **Banana** (amber), with each one's **Price**, **Marginal Utility**, **MU / Price**, and **Bought** count. Each purchase drops into the basket below. A solid green outline means it was the better buy. A dashed red outline means the other fruit was the better buy.

You buy three apples, and all three are dashed red. The bottom row shows **Spent** `$6 / $7`, **Total Utility** `60`, and **Best Picks** `0 / 3`.

## Step 1: Buy bananas instead

Inside `choose`, change `return "apple";` to:

```js
    return "banana";
```

Run it again.

**Look for:** the first two bananas are green, but the last two are dashed red. Once the banana's **MU / Price** falls below the apple's 15.0, the apple becomes the better buy. **Total Utility** is only 50.

## Step 2: Compute each ratio

Inside `choose`, right after the `// mu = marginal utility` comment and above `return "banana";`, add two variables that hold each fruit's MU per dollar:

```js
    let appleRatio = mu_a / p_a;
    let bananaRatio = mu_b / p_b;
```

Run it again.

**Look for:** nothing changes yet. Your function computes the ratios but doesn't use them.

## Step 3: Return the better buy

Replace the line `return "banana";` with an `if` statement that returns the fruit with the higher ratio:

```js
    if (appleRatio >= bananaRatio) {
        return "apple";
    } else {
        return "banana";
    }
```

Run it again.

**Look for:** every pick is green. You buy banana, apple, banana, apple, banana. **Spent** is $7 / $7, **Total Utility** jumps to 95, and **Best Picks** is 5 / 5.

## Step 4: Break ties the other way

In the second round, both ratios are 15. In your `if` line, change `>=` to `>` so ties go to the banana:

```js
    if (appleRatio > bananaRatio) {
```

Run it again.

**Look for:** the order changes to banana, banana, apple, banana, apple, but every pick is still green and **Total Utility** is still 95. When the ratios are equal, either fruit is an equally good buy.

## Check your understanding

<Question>
The apple starts with a higher MU (30) than the banana (20). Why is the banana the better first buy?
- [ ] Bananas always give more satisfaction
- [x] The banana gives 20 utility per dollar, the apple only 15
- [ ] The apple's marginal utility is about to drop
> Compare utility **per dollar**: 30 ÷ 2 = 15 for the apple, 20 ÷ 1 = 20 for the banana.
</Question>

<Question>
Why does always buying apples end with a lower total utility?
- [x] Each extra apple adds less, and the same money buys bananas worth more
- [ ] Apples cost too little
- [ ] The money ran out after one apple
> The second and third apples are worth only 20 and 10, while bananas worth 20 and 15 go unbought.
</Question>

## Wrap up

You wrote a `choose` function that takes four parameters, stores two ratios in variables, and uses an `if` statement to return the better buy. That spent all $7 for the highest possible total utility, `95`.

Comparing marginal benefit per dollar is how economists explain everything from shopping lists to how businesses spend their budgets.
