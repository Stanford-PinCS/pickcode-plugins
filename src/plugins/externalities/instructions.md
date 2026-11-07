# Externalities

Paper mills along a river make paper, and the waste from every ton goes into the river, where it costs the people who live downstream. That's a **negative externality**. You'll graph the paper market, compare the quantity the market makes with the **socially optimal quantity**, measure the **deadweight loss**, and try a tax on paper. Along the way you'll write a **function that calls another function** and adds to the result it gets back.

Click **Next** to continue.

## Costs the market leaves out

Buyers and sellers respond to their own **private** benefits and costs:

- The **marginal private benefit (MPB)** is what the last ton of paper is worth to its buyers. The demand curve shows it.
- The **marginal private cost (MPC)** is what the last ton costs the mills to make. The supply curve shows it.

The mills sell paper in a perfectly competitive market. Rational agents make optimal decisions by equating private marginal benefits and private marginal costs, and at a competitive market equilibrium the price equals both the MPB of the last ton consumed and the MPC of producing that last ton. So the market makes the quantity where MPB = MPC: the **market equilibrium quantity**. AP graphs label it Q_M, and its price P_M. We'll call it the market quantity for short.

The **socially optimal quantity**, Q_S, is where the **marginal social benefit (MSB)** of consuming the last unit equals the **marginal social cost (MSC)** of producing that last unit. That quantity maximizes total economic surplus, and producing any other quantity results in **deadweight loss**. The market equilibrium quantity is equal to the socially optimal quantity only when all social benefits and costs are internalized by individuals in the market.

Here they aren't. The waste from each ton costs the people downstream $40, and the mills don't pay it: it's an **external cost**. Externalities are either positive or negative and arise from a lack of well-defined property rights and/or high transaction costs. Here, nobody owns the river. So the MSC of a ton is its MPC plus the $40 external cost. Nobody else gains from the paper, so MSB = MPB.

## A function that calls another function

Here is your code:

```js
// Marginal private benefit (MPB): what the last ton is worth to buyers, in dollars.
function marginalPrivateBenefit(quantity) {
    return 140 - 2 * quantity;
}

// Marginal private cost (MPC): what the last ton costs the mills to make, in dollars.
function marginalPrivateCost(quantity) {
    return 20 + 2 * quantity;
}

// The waste from each ton costs the people downstream $40.
let externalCost = 40;

// The tax the mills pay on each ton they sell, in dollars.
let tax = 0;

// Returns the marginal social cost (MSC) of the last ton, in dollars.
function marginalSocialCost(quantity) {
    return marginalPrivateCost(quantity);
}
```

```python
# Marginal private benefit (MPB): what the last ton is worth to buyers, in dollars.
def marginalPrivateBenefit(quantity):
    return 140 - 2 * quantity

# Marginal private cost (MPC): what the last ton costs the mills to make, in dollars.
def marginalPrivateCost(quantity):
    return 20 + 2 * quantity

# The waste from each ton costs the people downstream $40.
externalCost = 40

# The tax the mills pay on each ton they sell, in dollars.
tax = 0

# Returns the marginal social cost (MSC) of the last ton, in dollars.
def marginalSocialCost(quantity):
    return marginalPrivateCost(quantity)
```

- `quantity` is the number of tons of paper made in a day. `marginalPrivateBenefit(quantity)` returns the MPB at that quantity, 140 − 2 × quantity dollars a ton, and `marginalPrivateCost(quantity)` returns the MPC, 20 + 2 × quantity.
- `externalCost` is what each ton's waste costs the people downstream. `tax` is a per-unit tax: the dollars the mills pay the government on each ton. It's 0 for now.
- `marginalSocialCost` should return the MSC. A function can **call another function** and use the value it returns: `marginalPrivateCost(quantity)` runs that function on the same quantity and gives back the MPC. Right now `marginalSocialCost` returns just that MPC.
- The last line, `drawMarket(marginalPrivateBenefit, marginalPrivateCost, marginalSocialCost, tax)`, hands your three functions to `drawMarket` by name, with no parentheses, so it can call them itself. In a loop, it calls them at every quantity from 0 to 40 tons, finds where MPB = MPC + tax (the market quantity) and where MSB = MSC (the socially optimal quantity), and graphs the market.

## Run it

Press the **Run** button.

**Quantity** runs along the bottom and **Price** up the side. The teal line that slopes down is **MPB = MSB**. The purple line that slopes up is MPC, and the pink line is your MSC. Right now your MSC lies right on MPC, so the two share one label: **MPC = MSC**.

The dark dot is the market quantity, Q_M = 30 tons a day, at P_M = $80 a ton. The pink ring is where MSB meets your MSC, the socially optimal quantity Q_S. It's on the same spot, so the graph says the market is efficient. The bottom row shows **Market Q** 30, **Optimal Q** 30, **MSC − MPC** $0, **Tax** $0 and **Deadweight Loss** $0.

But your MSC leaves out the $40 that each ton's waste costs the people downstream.

## Step 1: Add the external cost

Replace the `return` line inside `marginalSocialCost` with:

```js
    return marginalPrivateCost(quantity) + externalCost;
```

```python
    return marginalPrivateCost(quantity) + externalCost
```

Now `marginalSocialCost` calls `marginalPrivateCost`, then adds `externalCost` to the value it gets back.

Run it again.

**Look for:** the pink MSC line rises $40 above MPC, and **MSC − MPC** reads $40. The pink ring moves up the MSB line to Q_S = 20 tons, at P_S = $100. The dark dot stays at Q_M = 30: rational agents respond to private costs and benefits and not to external costs, so the market makes 10 tons more than the socially optimal quantity.

- The shaded triangle from Q_S to Q_M is the **deadweight loss**. For each of those tons, MSC is above MSB: counting its waste, the ton costs more to make than it's worth to its buyers.
- At 30 tons, MSC is $120 and MSB is $80, so the triangle's area is ½ × (30 − 20) × ($120 − $80) = $200 a day, and **Deadweight Loss** reads $200.

## Step 2: Tax each ton

Policies that address externalities include taxes and subsidies, environmental regulation, public provision, the assignment of property rights, and the reassignment of property rights through private transactions. Try a per-unit tax. With a tax, one more ton costs the mills `marginalPrivateCost(quantity) + tax`, so the market quantity is where MPB = MPC + tax.

Start with a tax of $20 a ton. Change the `tax` line to:

```js
let tax = 20;
```

```python
tax = 20
```

Run it again.

**Look for:** a dashed purple line, **MPC + tax**, rises $20 above MPC, and **Tax** reads $20. The dark dot slides up the MPB line to Q_M = 25 tons, where buyers pay P_M = $90 a ton. The triangle shrinks: at 25 tons, MSC is $110 and MSB is $90, so **Deadweight Loss** reads ½ × (25 − 20) × ($110 − $90) = $50. The market still makes more than Q_S = 20 tons, because the tax covers only half of the $40 external cost.

## Step 3: Match the tax to the external cost

Change the `tax` line again, so the tax equals the external cost:

```js
let tax = externalCost;
```

```python
tax = externalCost
```

Run it again.

**Look for:** the dashed MPC + tax line rises onto your MSC line, and their label reads **MSC = MPC + tax**. The dark dot lands inside the pink ring: Q_M = Q_S = 20 tons, at P_M = P_S = $100. **Deadweight Loss** reads $0.

The mills now pay $40 on each ton, the same as its external cost, so MPC + tax equals MSC. With that cost internalized, the market quantity is the socially optimal quantity. Market inefficiencies can be eliminated by designing policies that equate marginal social benefit with marginal social cost.

## Check your understanding

<Question>
In Step 1, the socially optimal quantity moved to 20 tons, but the market still made 30. Why?
- [ ] At 30 tons, MSB equals MSC
- [x] The mills respond to their private cost, MPC, and not to the external cost
- [ ] Counting the external cost moved the demand curve
> In a competitive market, the market quantity is where MPB = MPC. In the presence of externalities, rational agents respond to private costs and benefits and not to external costs and benefits, so only Q_S moved.
</Question>

<Question>
In a perfectly competitive market, which of these is true when producing a good imposes an external cost?
- [ ] The MPC curve lies above the MSC curve
- [x] A competitive market makes more than the socially optimal quantity
- [ ] A competitive market makes less than the socially optimal quantity
> MSC is MPC plus the external cost, so MSC lies above MPC and meets MSB at a smaller quantity than the one where MPB = MPC, which is the quantity a competitive market makes. Here the market made 30 tons a day, but the socially optimal quantity was 20.
</Question>

<Question>
Suppose the tax were $60 a ton, more than the $40 external cost. Where would the market end up?
- [ ] At the socially optimal quantity, since the external cost is covered
- [x] Below the socially optimal quantity, with a deadweight loss
- [ ] Above the socially optimal quantity, with a deadweight loss
> MPC + tax would meet MPB at 15 tons, below Q_S = 20. Producing any non-efficient quantity results in deadweight loss: at 15 tons, MSB is $110 and MSC is $90, so the loss is ½ × (20 − 15) × ($110 − $90) = $50 a day.
</Question>

## Wrap up

You wrote `marginalSocialCost`, a function that calls `marginalPrivateCost` and adds the external cost to the result. With the external cost counted, the graph showed the market failure: the mills responded only to their private cost, so the market made 30 tons a day instead of the socially optimal 20, with a deadweight loss of $200 a day. A $20 tax cut the deadweight loss to $50, and a tax equal to the $40 external cost made MPC + tax equal MSC, so the market made the socially optimal quantity and the deadweight loss was gone.
