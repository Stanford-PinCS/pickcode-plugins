# Synapse Transmission

Neurons pass messages to each other with chemicals called **neurotransmitters**. A receiving neuron adds up every signal it gets, then fires only if the total reaches its threshold. You'll model that with a **for loop** that adds up the signals and an **if statement** that checks the total.

Click **Next** to continue.

## How neurons talk

When an action potential reaches a sending neuron's **axon terminal**, tiny sacs called **vesicles** release neurotransmitter into the **synaptic cleft**. The molecules cross the gap and bind **receptors** on the receiving neuron. Then the sending neuron pumps them back in. This is **reuptake**.

An **excitatory** signal raises the receiving neuron's charge. An **inhibitory** signal lowers it. At rest, the neuron sits near -70 mV (millivolts). In this model the signals arrive close together, so they add up.

The neuron follows the **all-or-none principle**:

> if the total reaches the threshold (about -55 mV), it fires a full action potential; if not, it doesn't fire at all

## Adding up signals with a loop

Your code starts with two values you can change:

<JavaScript>

```js
let signals = [4, 4];   // mV from each burst: + excites, - inhibits
let threshold = -55;    // mV the neuron must reach to fire
```

</JavaScript>
<Python>

```python
signals = [4, 4]   # mV from each burst: + excites, - inhibits
threshold = -55    # mV the neuron must reach to fire
```

</Python>

`potential` starts at `-70`, the resting charge. The **for loop** visits each index `i` and adds `signals[i]` to `potential`, so the total builds up one signal at a time:

<JavaScript>

```js
let potential = -70;
for (let i = 0; i < signals.length; i++) {
    potential = potential + signals[i];
}
```

</JavaScript>
<Python>

```python
potential = -70
for i in range(len(signals)):
    potential = potential + signals[i]
```

</Python>

`fires` starts as <JavaScript>`false`</JavaScript><Python>`False`</Python>. The **if statement** sets it to <JavaScript>`true`</JavaScript><Python>`True`</Python> only when `potential >= threshold`:

<JavaScript>

```js
let fires = false;
if (potential >= threshold) {
    fires = true;
}
```

</JavaScript>
<Python>

```python
fires = False
if potential >= threshold:
    fires = True
```

</Python>

The last line, `sendSignals(signals, threshold, potential, fires)`, plays your signals at the synapse on the right and shows your neuron's decision.

## Run it

Press the **Run** button.

At the top, an action potential (pink dot) reaches the excitatory neuron's axon terminal. A vesicle releases teal neurotransmitter, which crosses the cleft and binds receptors. Then reuptake pulls it back.

At the bottom, the pink line is the receiving neuron's charge and the dashed amber line is the threshold. The shaded column and the `i =` text show which signal your loop is on.

The line climbs from -70 to -62 mV, stays below threshold, and falls back to rest. The bottom row shows **Signals**, **Potential**, **Threshold**, and **Fired**: No.

## Step 1: Add signals until it fires

Change the `signals` line to four signals:

<JavaScript>

```js
let signals = [4, 4, 4, 4];   // mV from each burst: + excites, - inhibits
```

</JavaScript>
<Python>

```python
signals = [4, 4, 4, 4]   # mV from each burst: + excites, - inhibits
```

</Python>

Run it again.

**Look for:** the pink line ends at -54 mV, above the dashed line. Then, in the part of the graph labeled `if`, it spikes up toward +40 mV and dips below rest before it settles. A pink pulse travels along the receiving neuron's axon, and **Fired** says Yes.

## Step 2: Add an inhibitory signal

Put a negative signal in the middle:

<JavaScript>

```js
let signals = [4, 4, -3, 4, 4];   // mV from each burst: + excites, - inhibits
```

</JavaScript>
<Python>

```python
signals = [4, 4, -3, 4, 4]   # mV from each burst: + excites, - inhibits
```

</Python>

Run it again.

**Look for:** at `i = 2`, the inhibitory neuron releases purple neurotransmitter and the pink line steps down. The total is -57 mV, just below threshold, so **Fired** is No. One inhibitory signal canceled the push the neuron needed.

## Step 3: Land exactly on threshold

Change `signals` so the total is exactly -55 mV:

<JavaScript>

```js
let signals = [5, 5, 5];   // mV from each burst: + excites, - inhibits
```

</JavaScript>
<Python>

```python
signals = [5, 5, 5]   # mV from each burst: + excites, - inhibits
```

</Python>

Run it again.

**Look for:** the line ends right on the dashed line, and the neuron fires. `>=` means "greater than **or equal to**", so `-55 >= -55` is true.

## Step 4: Test the edge of the if

In your `if` line, change `>=` to `>`:

<JavaScript>

```js
if (potential > threshold) {
```

</JavaScript>
<Python>

```python
if potential > threshold:
```

</Python>

Run it again.

**Look for:** the line touches the dashed line but **Fired** is No, because `-55 > -55` is false. A real neuron fires when it **reaches** threshold, so change `>` back to `>=` before you go on.

## Step 5: Block reuptake

Drugs called **SSRIs**, used to treat depression, block the reuptake of the neurotransmitter serotonin. It stays in the cleft longer and keeps binding receptors, so each burst has a bigger effect.

Pretend your excitatory neuron uses a neurotransmitter the drug acts on. Take Step 2's signals and make each excitatory one stronger, from `4` to `6`:

<JavaScript>

```js
let signals = [6, 6, -3, 6, 6];   // mV from each burst: + excites, - inhibits
```

</JavaScript>
<Python>

```python
signals = [6, 6, -3, 6, 6]   # mV from each burst: + excites, - inhibits
```

</Python>

Run it again.

**Look for:** the same pattern now reaches -49 mV and the neuron fires, even with the inhibitory signal.

## Check your understanding

<Question>
`signals` is `[3, -2, 6]` and `threshold` is `-55`. What happens?
- [ ] It fires, because the total is above -70
- [x] It doesn't fire, because the total is -63 mV
- [ ] It fires a smaller action potential
> -70 + 3 - 2 + 6 = -63, below -55, so the `if` is false.
</Question>

<Question>
`[10, 10, 10]` reaches -40 mV. `[4, 4, 4, 4]` reaches -54 mV. Which action potential is bigger?
- [ ] The first
- [x] Neither: they are the same size
- [ ] Only the second fires
> All-or-none: past threshold, every action potential is full size.
</Question>

## Wrap up

You used a `for` loop to add up `signals`, starting from the resting charge of -70 mV, and an `if` statement to compare the total to the threshold of -55 mV. That's the **all-or-none principle**: excitatory and inhibitory signals add up, and the neuron fires only if the total reaches threshold. You also modeled a reuptake inhibitor by making the excitatory signals stronger.

Adding up values in a loop and then checking the total with an `if` shows up everywhere in code, from game scores to bank balances.
