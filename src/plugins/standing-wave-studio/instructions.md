# Standing Wave Studio

Two waves travelling in opposite directions along the same string can add up to a wave that goes nowhere. You'll build one and find out where the still points come from.

## What you'll do

- Read `sample`, which is handed a wave function and calls it at every point
- Finish `add`, which combines two lists point by point
- Watch the still points appear once the two waves are added together

## A function you can pass around

You've been given two wave functions, `rightward` and `leftward`. Each takes a position and a time and returns one height.

Look at `sample(f, t)`. Its first input is not a number, it is a function. Inside the loop, `f(xAt(i), t)` calls whichever function you handed in.

Run the starter code. It passes `rightward`, so you get the rightward wave — the thick line sitting on top of the thin one.

## Task 1: add two lists

Superposition says two waves combine by adding their heights at every single point.

Finish `add` so it walks both lists and pushes each pair's total:

```javascript
total.push(a[i] + b[i]);
```

Run it. Nothing changes yet — you've written `add` but nothing calls it.

## Task 2: put them together

Now finish `stringAt` so it returns the two waves sampled and added:

```javascript
return add(sample(rightward, t), sample(leftward, t));
```

Read it from the inside out. Two calls to `sample` produce two lists; `add` combines them into one. Run it.

## Read the nodes

The thick line now sloshes up and down without going anywhere. The orange dots mark the **nodes** — points that never move at all.

The dashed line is the **envelope**: how far each point ever gets from rest. It pinches to zero at every node.

The waves you were given have a 5 m wavelength, and the plugin measured 5.00 m from the spacing of your nodes alone.

## One more experiment

Change `stringAt` to pass `rightward` twice:

```javascript
return add(sample(rightward, t), sample(rightward, t));
```

The node count drops to 0 and the envelope goes flat. Two waves going the same way never cancel anywhere.

Notice that nothing inside `sample` or `add` changed. Only the function you handed to `sample` did.

## Think about it

- A node never moves, yet energy travels along the string. Where does the energy at a node go?
- `sample` works for any wave function at all. What would you have to write twice if it only worked for `rightward`?

## Functions you can use

| Function            | What it does                                        |
| ------------------- | --------------------------------------------------- |
| `STRING_POINTS`     | How many sample points make up the string            |
| `xAt(i)`            | Position in metres of sample point `i`               |
| `rightward(x, t)`   | Height of the rightward wave at that place and time  |
| `leftward(x, t)`    | Height of the leftward wave at that place and time   |
| `animate(stringAt)` | Plays your string for 4 seconds                      |
