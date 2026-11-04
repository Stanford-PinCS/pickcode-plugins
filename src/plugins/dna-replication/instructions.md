# DNA Replication

Before a cell divides, it copies all of its DNA. An enzyme reads one strand base by base and builds a matching strand next to it. You'll write the matching rules with **if statements** and use a **for loop** to apply them to every base.

Click **Next** to continue.

## How DNA copies itself

DNA is two strands of bases zipped together like a ladder. The four bases are A, T, G and C, and they pair by a strict rule:

> A pairs with T, and G pairs with C

To copy DNA, an enzyme called **helicase** unzips the ladder. Then **DNA polymerase** reads one strand, the **template**, one base at a time. For each base, it adds the partner base to a new strand, always building in the 5' to 3' direction.

Each finished copy has one old strand and one new strand. This is called **semi-conservative replication**.

## Pairing bases with a loop

Your code starts with the template strand, one letter per base:

<JavaScript>

```js
let templateStrand = "ATGCGTACCTAG";
```

</JavaScript>
<Python>

```python
templateStrand = "ATGCGTACCTAG"
```

</Python>

`pairBase(base)` returns the partner of `base`. Its **if statement** knows one rule so far: if `base` is `"A"`, it returns `"T"`. Any other base skips the `if` and reaches the last line, which returns `"?"`:

<JavaScript>

```js
function pairBase(base) {
    if (base === "A") {
        return "T";
    }
    return "?";
}
```

</JavaScript>
<Python>

```python
def pairBase(base):
    if base == "A":
        return "T"
    return "?"
```

</Python>

Then the **for loop** plays polymerase. `newStrand` starts empty, and the loop runs once for each index `i`, adding the partner of `templateStrand[i]` to the end:

<JavaScript>

```js
for (let i = 0; i < templateStrand.length; i++) {
    newStrand = newStrand + pairBase(templateStrand[i]);
}
```

</JavaScript>
<Python>

```python
for i in range(len(templateStrand)):
    newStrand = newStrand + pairBase(templateStrand[i])
```

</Python>

The last line, `replicateDNA(templateStrand, newStrand)`, draws both strands at the replication fork on the right.

## Run it

Press the **Run** button.

Helicase (the small circle) unzips the old strand and lifts it away. Polymerase (the dark outline) walks along the template one base per step. The shaded column and the `i =` label show which index your loop is on.

Bases are colored: A pink, T teal, G amber, C purple. Every A gets a teal T, joined by bond lines. Every other base gets a dashed gray "?", a **mismatch** with no bonds.

The bottom row shows **Bases Copied**, **Mismatches** (it ends at 9) and **GC Pairs**.

## Step 1: Add the T rule

T pairs with A. Replace everything inside `pairBase` with these lines, which add a second rule:

<JavaScript>

```js
    if (base === "A") {
        return "T";
    } else if (base === "T") {
        return "A";
    }
    return "?";
```

</JavaScript>
<Python>

```python
    if base == "A":
        return "T"
    elif base == "T":
        return "A"
    return "?"
```

</Python>

Run it again.

**Look for:** every T on the template now gets a pink A. **Mismatches** drops from 9 to 6.

## Step 2: Add the G and C rules

G pairs with C. Replace everything inside `pairBase` again, this time with all four rules:

<JavaScript>

```js
    if (base === "A") {
        return "T";
    } else if (base === "T") {
        return "A";
    } else if (base === "G") {
        return "C";
    } else if (base === "C") {
        return "G";
    }
    return "?";
```

</JavaScript>
<Python>

```python
    if base == "A":
        return "T"
    elif base == "T":
        return "A"
    elif base == "G":
        return "C"
    elif base == "C":
        return "G"
    return "?"
```

</Python>

Run it again.

**Look for:** every base pairs, **Mismatches** is 0, and the new strand reads TACGCATGGATC. Each A–T pair has 2 bond lines and each G–C pair has 3. These are **hydrogen bonds**.

## Step 3: Copy a longer strand

Change the `templateStrand` line to this 20-base strand:

<JavaScript>

```js
let templateStrand = "ATGGCCATTGTAATGGGCCG";
```

</JavaScript>
<Python>

```python
templateStrand = "ATGGCCATTGTAATGGGCCG"
```

</Python>

You don't need to change the loop. It stops after the last base of `templateStrand`, so it always runs once per base. Use only capital A, T, G and C, and up to 40 bases.

Run it again.

**Look for:** polymerase takes 20 steps, and the `i =` label counts from 0 to 19. **Bases Copied** ends at 20 of 20.

## Step 4: Count the G–C pairs

G–C pairs have 3 bonds, so DNA with more of them is harder to unzip. Replace your whole `for` loop with this version, which also counts them and shows the count:

<JavaScript>

```js
let gcCount = 0;
for (let i = 0; i < templateStrand.length; i++) {
    newStrand = newStrand + pairBase(templateStrand[i]);
    if (templateStrand[i] === "G" || templateStrand[i] === "C") {
        gcCount = gcCount + 1;
    }
}
console.log(gcCount);
```

`||` means "or": the `if` runs when either side is true.

</JavaScript>
<Python>

```python
gcCount = 0
for i in range(len(templateStrand)):
    newStrand = newStrand + pairBase(templateStrand[i])
    if templateStrand[i] == "G" or templateStrand[i] == "C":
        gcCount = gcCount + 1
print(gcCount)
```

The `if` runs when either side of `or` is true.

</Python>

Run it again.

**Look for:** the console shows 11, the same number **GC Pairs** shows when the copy finishes.

## Step 5: Add copying mistakes

Real polymerase sometimes adds the wrong base. Right above the `templateStrand` line, add:

<JavaScript>

```js
let mutationRate = 0.2;
```

</JavaScript>
<Python>

```python
import random
mutationRate = 0.2
```

</Python>

Then, inside the loop, replace the line that adds to `newStrand` with:

<JavaScript>

```js
    let newBase = pairBase(templateStrand[i]);
    if (Math.random() < mutationRate) {
        newBase = "A";
    }
    newStrand = newStrand + newBase;
```

</JavaScript>
<Python>

```python
    newBase = pairBase(templateStrand[i])
    if random.random() < mutationRate:
        newBase = "A"
    newStrand = newStrand + newBase
```

</Python>

The random number is below 0.2 about 1 time in 5, so about 1 base in 5 gets an A no matter what. Run it a few times.

**Look for:** dashed gray mismatches in different spots each run, and **Mismatches** changing from run to run. A mistake across from a T doesn't show, because A is already right there.

## Check your understanding

<Question>
`templateStrand` has 12 bases. How many times does the `for` loop call `pairBase`?
- [ ] 11
- [x] 12
- [ ] 13
> The loop runs once for each index from 0 to 11: 12 times.
</Question>

<Question>
The template base is `"C"`. What should `pairBase` return?
- [ ] `"C"`
- [ ] `"T"`
- [x] `"G"`
> G and C always pair.
</Question>

<Question>
Real polymerase makes about 1 mistake per 100,000 bases. What keeps the final error rate much lower?
- [ ] Helicase unzips the DNA more slowly
- [x] Polymerase proofreads each new pair and fixes mismatches
- [ ] The new strand is built from 3' to 5'
> Polymerase checks each new pair and replaces a mismatched base, cutting mistakes to about 1 per 10 million bases. Repair enzymes fix most of the rest, leaving about 1 mistake per billion bases.
</Question>

## Wrap up

You wrote the base-pairing rules as an `if` and <JavaScript>`else if`</JavaScript><Python>`elif`</Python> chain: A to T, T to A, G to C, C to G. Your `for` loop applied them to every base, like DNA polymerase stepping along the template. You counted G–C pairs with an `if` inside the loop, and used <JavaScript>`Math.random()`</JavaScript><Python>`random.random()`</Python> to model copying mistakes.

Each copy keeps one old strand and one new strand: semi-conservative replication. The same pairing idea shows up again in transcription, when a cell copies DNA into RNA to make proteins. RNA uses U in place of T, so an A on the DNA pairs with a U.
