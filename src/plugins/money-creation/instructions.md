# Money Creation

Rosa deposits $1,000 of cash in a bank. How much new money can the banking system create from it? You'll follow the money from bank to bank as each bank keeps its **required reserves** and lends out its **excess reserves**, and compare the new money with the most the **simple money multiplier** predicts. Along the way you'll write a **while loop** whose condition depends on a value the loop computes on every pass.

Click **Next** to continue.

## How banks create money

Depository institutions, such as commercial banks, organize their assets and liabilities on **balance sheets**. AP draws a bank's balance sheet as a **T-account**, with its assets on the left and its liabilities on the right.

When Rosa deposits $1,000 of cash in Bank 1, her **demand deposit** is a liability of Bank 1: it's money the bank owes her. Bank 1 adds her cash to its **reserves**, an asset.

- Depository institutions operate using **fractional reserve banking**: a bank keeps only part of its deposits as reserves. Its reserves are divided into **required reserves** and **excess reserves**.
- A bank's required reserves are the **required reserve ratio** times its deposits. Here the ratio is 0.2, so Bank 1's required reserves are 0.2 × $1,000 = $200, and its other $800 of reserves are excess reserves.

**Money** is any asset that is accepted as a means of payment, and its most liquid forms are cash and demand deposits. Rosa's deposit turns $1,000 of cash into a $1,000 demand deposit. Her cash is no longer currency in circulation: it's now Bank 1's reserves. So she has the same $1,000 of money as before, and the deposit doesn't create new money.

**Excess reserves are the basis of expansion of the money supply by the banking system.** Say Bank 1 lends out its $800 of excess reserves. The borrower spends the $800, and whoever receives it deposits it in Bank 2. That $800 demand deposit is new money: Rosa still has her $1,000 deposit, too. Bank 2 keeps its required reserves and lends out its excess reserves, which are deposited in Bank 3, and so on.

The **money multiplier** is the ratio of the money supply to the **monetary base**, which includes currency in circulation and bank reserves. The size of the expansion of the money supply depends on the money multiplier. The maximum value of the money multiplier is the reciprocal of the required reserve ratio: 1 ÷ 0.2 = 5. The **simple money multiplier** uses that maximum value, so it predicts that Bank 1's $800 of excess reserves can expand the money supply by at most $800 × 5 = $4,000.

## A loop that follows the deposit

Here is your code:

```js
// Rosa deposits $1,000 of cash in Bank 1. Each loan is deposited in the next bank.
let newDeposit = 1000;    // the new deposit, in dollars
let reserveRatio = 0.2;   // the required reserve ratio

// Follows the new deposit from bank to bank. Each pass of the loop is one bank.
function createMoney(newDeposit, reserveRatio) {
    let deposit = newDeposit;
    while (deposit > 1) {
        let required = deposit * reserveRatio;     // required reserves
        let loan = 0;                              // the bank lends nothing
        addBank(deposit, loan);
        deposit = loan;   // the loan is spent and deposited in the next bank
    }
}
```

```python
# Rosa deposits $1,000 of cash in Bank 1. Each loan is deposited in the next bank.
newDeposit = 1000    # the new deposit, in dollars
reserveRatio = 0.2   # the required reserve ratio

# Follows the new deposit from bank to bank. Each pass of the loop is one bank.
def createMoney(newDeposit, reserveRatio):
    deposit = newDeposit
    while deposit > 1:
        required = deposit * reserveRatio     # required reserves
        loan = 0                              # the bank lends nothing
        addBank(deposit, loan)
        deposit = loan   # the loan is spent and deposited in the next bank
```

- `newDeposit` is Rosa's $1,000, and `reserveRatio` is the required reserve ratio, 0.2.
- `createMoney` follows the deposit from bank to bank. Each pass of its **while loop** is one bank: `deposit` is that bank's new deposit, `required` is its required reserves, and `loan` is what it lends. Right now `loan` is 0, so every bank lends nothing.
- `addBank(deposit, loan)` adds the bank to the plot, with its deposit and its loan.
- The loop's last line passes the loan on: it becomes `deposit`, the next bank's deposit.
- A while loop checks its condition before every pass and repeats as long as the condition is true. Here the condition is `deposit > 1`, so the loop keeps going as long as the deposit is more than $1. The loop doesn't know ahead of time how many banks there will be: each pass computes the next deposit, and the condition checks it before the next pass.
- The last line, `runBanks(newDeposit, reserveRatio, createMoney)`, runs your function and draws the chain of banks.

## Run it

Press the **Run** button.

The box in the top right corner is Bank 1's T-account, counting only Rosa's deposit and what Bank 1 did with it. On the right is its liability, Rosa's $1,000 demand deposit. On the left are its assets: $200 of required reserves, $800 of excess reserves and $0 of loans.

The top panel has a bar for each bank, as tall as its deposit and split the same way: pink for loans at the bottom, gray for excess reserves, and teal for required reserves on top. There's only one bar. Bank 1 lent nothing, so the next deposit was $0, the condition `deposit > 1` was false, and the loop stopped after one pass.

The bottom panel shows the **new money** after each bank: all the loans made so far, with that bank's own loan in solid pink on top. The dashed amber line is the most new money the simple money multiplier predicts, and its label shows where that comes from: Bank 1's $800 of excess reserves × 5 = $4,000. With no loans, there's no new money, so the bottom panel has no bar.

The bottom row shows:

- **Required Reserve Ratio**: your `reserveRatio`, 0.2.
- **Max Multiplier**: the maximum value of the money multiplier, 1 ÷ 0.2 = 5.
- **Banks**: how many banks your loop went through, 1.
- **New Money**: the loans your banks made, added up: $0. Compare it with the dashed line.

## Step 1: Lend out the excess reserves

Each bank's new deposit first adds to its reserves, and its reserves are divided into required reserves and excess reserves. So its excess reserves are its deposit minus its required reserves. Replace the `loan` line inside the loop with these two lines:

```js
        let excess = deposit - required;           // excess reserves
        let loan = excess;                         // lend out all the excess reserves
```

```python
        excess = deposit - required           # excess reserves
        loan = excess                         # lend out all the excess reserves
```

Now each bank lends out all its excess reserves, and the loop's last line makes that loan the next bank's deposit.

Run it again.

**Look for:**

- In Bank 1's T-account, the $800 of excess reserves became $800 of loans.
- Each bank's pink loan is as tall as the next bank's whole bar: $800 in Bank 2, $640 in Bank 3, and so on. Each deposit is 0.8 of the one before.
- The deposits shrink until the condition turns false, and **Banks** reads 31.
- The new money climbs quickly at first, then slowly, to **New Money** $3,996.04, just under the dashed $4,000.

Bank 31's deposit is only about $1.24, too small to see on the plot, and the loan it passes on, $0.99, isn't more than $1, so the loop stops there. The missing $3.96 is what the banks after the 31st would lend: each of their deposits is $1 or less, so the loop never reaches them. If the chain went on forever, the new money would get as close to $4,000 as you like without passing it.

## Step 2: Lower the required reserve ratio

Change the `reserveRatio` line to:

```js
let reserveRatio = 0.1;   // the required reserve ratio
```

```python
reserveRatio = 0.1   # the required reserve ratio
```

Run it again.

**Look for:**

- **Max Multiplier** rises to 1 ÷ 0.1 = 10.
- Bank 1's required reserves fall to $100, so it has $900 of excess reserves to lend. The dashed line rises to $900 × 10 = $9,000.
- Each deposit is now 0.9 of the one before. The deposits shrink more slowly, so the loop goes through 66 banks, and **New Money** reaches $8,991.40.

The size of the expansion of the money supply depends on the money multiplier. A lower required reserve ratio leaves every bank more excess reserves to lend, so the maximum money multiplier and the expansion are both larger.

## Step 3: Hold some excess reserves

Banks don't have to lend out all their excess reserves. Suppose each bank decides to hold 5% of every deposit as excess reserves. Under the `reserveRatio` line, add this line:

```js
let holdRatio = 0.05;     // share of each deposit a bank holds as excess reserves
```

```python
holdRatio = 0.05     # share of each deposit a bank holds as excess reserves
```

Then change the `loan` line inside the loop to:

```js
        let loan = excess - deposit * holdRatio;   // lend out the rest
```

```python
        loan = excess - deposit * holdRatio   # lend out the rest
```

`createMoney` can use `holdRatio` because it's set at the top of your code, outside any function.

Run it again.

**Look for:**

- Bank 1's T-account shows $100 of required reserves, $50 of excess reserves it holds, and $850 of loans. Every bar now has a gray band of excess reserves.
- Each deposit is 0.85 of the one before, so the loop goes through 43 banks, and **New Money** reaches only $5,661.44, far below the dashed $9,000.

The amount predicted by the simple money multiplier may be overstated, because it doesn't take into account a bank's desire to hold excess reserves or the public holding more currency.

## Check your understanding

<Question>
The required reserve ratio is 0.25, and Sam takes $500 of cash he was holding and deposits it in his bank. According to the simple money multiplier, how much can the banking system expand the money supply, at most?
- [ ] $375
- [x] $1,500
- [ ] $2,000
> Required reserves are 0.25 × $500 = $125, so excess reserves are $375. The maximum value of the money multiplier is 1 ÷ 0.25 = 4, so the most is $375 × 4 = $1,500. $2,000 multiplies the whole deposit, but the deposit itself only turned cash into a demand deposit: currency in circulation fell by $500 as demand deposits rose by $500. The new money comes from lending out the excess reserves.
</Question>

<Question>
The required reserve ratio rises from 0.1 to 0.2. What happens to the maximum value of the money multiplier?
- [ ] It doubles, from 10 to 20
- [x] It halves, from 10 to 5
- [ ] It stays at 10
> The maximum value of the money multiplier is the reciprocal of the required reserve ratio, and 1 ÷ 0.2 = 5. Each bank keeps more of every deposit as required reserves, so it has fewer excess reserves to lend.
</Question>

<Question>
Suppose banks lend out all their excess reserves, but each borrower keeps some of the loan as cash and deposits only the rest. How does the expansion of the money supply compare with what the simple money multiplier predicts?
- [ ] It's larger, because the cash is money too
- [ ] It's the same, because the banks still lend out all their excess reserves
- [x] It's smaller
> The cash the borrower keeps is still money, but it's part of a loan that's already counted as new money. It just isn't deposited, so no bank can lend it again. The next bank gets a smaller deposit, so it has fewer excess reserves to lend, and so does every bank after it. The simple money multiplier doesn't take into account the public holding more currency (cash), so its prediction is overstated.
</Question>

## Wrap up

You wrote a while loop whose condition, `deposit > 1`, depends on a value the loop computes: each pass was one bank, which kept its required reserves, lent out its excess reserves, and passed the loan on as the next bank's deposit. Rosa's deposit only turned cash into a demand deposit; the banks created new money by lending out their excess reserves. With a required reserve ratio of 0.2, the new money came to $3,996.04, just under the $4,000 the simple money multiplier predicted, only because the loop stopped once the deposits fell to $1 or less. A ratio of 0.1 raised the maximum money multiplier to 10 and the prediction to $9,000. When the banks held some excess reserves, the new money, $5,661.44, fell far short of that prediction.

Next, in **Quantity Theory of Money**, you'll see how, in the long run, the growth rate of the money supply determines the inflation rate.
