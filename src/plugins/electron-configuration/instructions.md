# Electron Configuration

Every atom's electrons sit in subshells, and they fill the lowest-energy subshells first. You'll write a **while loop** with an **if statement** that places an atom's electrons one subshell at a time, then watch the orbital diagram fill up electron by electron.

Click **Next** to continue.

## How electrons fill an atom

Electrons fill subshells from lowest to highest energy. This is the **Aufbau principle**:

> 1s, 2s, 2p, 3s, 3p, 4s, 3d, 4p, 5s, ...

Each subshell holds a fixed number of electrons: **s = 2, p = 6, d = 10, f = 14**. Each box (orbital) holds at most 2 electrons with opposite spins, drawn as one up arrow and one down arrow. That's the **Pauli exclusion principle**.

Inside a subshell, **Hund's rule** says electrons spread out one per box before any of them pair up.

The electrons in the outermost shell (the highest number) are the **valence electrons**. They connect to an element's place in the periodic table and to how it bonds.

## Filling subshells with a while loop

Here is your code:

```js
let atomicNumber = 2;
let electronsLeft = atomicNumber;
let subshell = 0; // 0 is 1s, 1 is 2s, 2 is 2p, 3 is 3s, ...

while (electronsLeft > 0) {
    let capacity = getCapacity(subshell); // how many electrons this subshell holds
    placeElectrons(subshell, electronsLeft);
    electronsLeft = 0;
}
```

```python
atomicNumber = 2
electronsLeft = atomicNumber
subshell = 0  # 0 is 1s, 1 is 2s, 2 is 2p, 3 is 3s, ...

while electronsLeft > 0:
    capacity = getCapacity(subshell)  # how many electrons this subshell holds
    placeElectrons(subshell, electronsLeft)
    electronsLeft = 0
```

- `atomicNumber = 2` is helium. A neutral atom has as many electrons as its atomic number, so `electronsLeft` starts at 2.
- A **while loop** repeats its body as long as its condition, `electronsLeft > 0`, is true.
- `getCapacity(subshell)` gives back how many electrons that subshell holds (2 for 1s). It's saved in `capacity`, but nothing uses it yet.
- `placeElectrons(subshell, electronsLeft)` puts **all** the remaining electrons into the current subshell. Then `electronsLeft = 0` makes the condition false, so the loop stops after one pass.
- `drawOrbitals(atomicNumber)`, the last line, draws everything your loop placed.

## Run it

Press the **Run** button.

The 1s row gets a teal outline and a **loop pass 1** marker. That's the subshell the loop is filling. Two pink arrows drop into the 1s box, one up and one down. The 2s and 2p rows above it stay empty. Below the diagram, the configuration builds: **1s²**.

The bottom row shows **Element** (He), **Loop Pass**, **Electrons Left** (counting down to 0) and **Valence** (2).

Helium works because both of its electrons fit in 1s. Bigger atoms won't.

## Step 1: Try carbon

Change the `2` in `atomicNumber` to `6` (carbon):

```js
let atomicNumber = 6;
```

```python
atomicNumber = 6
```

Run it again.

**Look for:** all six arrows go into the 1s row. Two fit in the box. The other four sit outside it in a dashed amber outline marked **4 extra, max 2**. The configuration reads **1s⁶**, which is impossible: a 1s subshell holds only 2 electrons.

The loop needs to stop filling a subshell once it's full.

## Step 2: Fill a subshell only up to its capacity

Inside the loop, keep the `capacity` line. Delete the two lines below it, `placeElectrons(subshell, electronsLeft)` and `electronsLeft = 0`, and type this **if/else** in their place<JavaScript>, before the loop's closing `}`</JavaScript>:

```js
    if (electronsLeft >= capacity) {
        placeElectrons(subshell, capacity);
        electronsLeft = electronsLeft - capacity;
    } else {
        placeElectrons(subshell, electronsLeft);
        electronsLeft = 0;
    }
```

```python
    if electronsLeft >= capacity:
        placeElectrons(subshell, capacity)
        electronsLeft = electronsLeft - capacity
    else:
        placeElectrons(subshell, electronsLeft)
        electronsLeft = 0
```

If at least a full subshell's worth is left, fill it and subtract. Otherwise, place what's left. Run it again.

**Look for:** **Loop Pass** now counts to 3, with 2 electrons per pass, but every pass lands on 1s, so it still reads **1s⁶**. `subshell` never changes, so the loop keeps filling the same subshell.

## Step 3: Move to the next subshell

Add this line at the end of the loop body, right after the if/else<JavaScript> and before the loop's closing `}`</JavaScript><Python>, lined up with the `if`</Python>:

```js
    subshell = subshell + 1;
```

```python
    subshell = subshell + 1
```

Run it again.

**Look for:** three passes, each on a new row: **1s² 2s² 2p²**. In 2p, the two electrons sit in **separate** boxes, both pointing up. That's Hund's rule. **Valence** is 4: carbon has four valence electrons.

## Step 4: Try oxygen and iron

Change `atomicNumber` to `8` (oxygen) and run it. Then change it to `26` (iron) and run it again.

**Look for:**

- Oxygen: **1s² 2s² 2p⁴**. One 2p box now holds a pair, and two boxes hold one electron each. **Valence** is 6.
- Iron: **1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d⁶**. The loop fills 4s **before** 3d, because 4s is lower in energy. Four of iron's 3d electrons are unpaired.

A few atoms, like chromium (24) and copper (29), are exceptions: their real configurations differ slightly from what this loop predicts.

## Check your understanding

<Question>
Why does the loop need the `if` statement?
- [ ] To pick which element to draw
- [x] To fill a subshell only up to its capacity
- [ ] To make the loop run once
> Without it, every electron went into 1s. With it, each pass places at most `capacity` electrons.
</Question>

<Question>
Nitrogen has 7 electrons. How are its three 2p electrons arranged?
- [ ] Two in one box, one in another
- [x] One in each box, all spin up
- [ ] All three in one box
> Hund's rule: electrons spread out one per box before any pair up.
</Question>

<Question>
What if `electronsLeft` never got smaller inside the loop?
- [ ] The loop would run one fewer time
- [x] The loop would never stop on its own
- [ ] Nothing would change
> `electronsLeft > 0` would stay true, and a while loop stops only when its condition becomes false. You'd get an error saying your loop ran too many times.
</Question>

## Wrap up

You wrote a while loop that fills subshells in Aufbau order. On each pass, an if/else decides whether the subshell fills completely or takes the last few electrons, then `subshell` moves on to the next one. The diagram showed the Pauli exclusion principle (at most 2 electrons per box) and Hund's rule (spread out before pairing). Your loop works for every element up to 118.

Next, you'll see how valence electrons decide the shapes of molecules.
