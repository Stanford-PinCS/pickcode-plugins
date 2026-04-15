# Escape Velocity Module — Design Spec

**Date:** 2026-04-05  
**Status:** Approved

---

## Overview

An interactive learning module that teaches escape velocity in the context of gravity and orbits. The student edits two things in a single code editor: the starting velocity `v0` and the return expression inside `isEscaping`. The simulation runs a physics integration and compares the student's formula result against the true escape velocity, showing the orbit path and a correctness panel.

---

## Learning Goals

1. There is a specific speed threshold (escape velocity) that determines whether an orbit is closed or open.
2. That threshold is `v_escape = sqrt(2 * mu / r)` — it depends on gravitational strength and distance, not the mass of the escaping object.
3. The student can directly control the transition by changing `v0` and observe the orbit path change.

### Misconceptions addressed via hints
- "Faster always means a bigger orbit" — true up to a point; above escape velocity the orbit opens entirely.
- "Escape velocity depends on the mass of the escaping object" — it doesn't; `mu = G*M` involves only the central body.
- Confusing orbital speed with escape speed.

---

## File Structure

Follows the standard repo plugin pattern:

```
src/plugins/escape-velocity/
  Plugin.tsx                              # boilerplate (same as every plugin)
  Component.tsx                           # visualization + status overlay
  state.ts                                # MobX observable state
  messages.ts                             # SimulationResult message type
  languages/BasicJS/
    implementation.ts                     # physics engine + student code evaluation
    starter-code/main.js                  # student-facing code
```

---

## Starter Code (`main.js`)

```js
const v0 = 10.0; // starting speed (try changing this!)

function isEscaping(v, mu, r) {
  return v > ???; // replace ??? with the escape velocity formula
}

runSimulation(v0, isEscaping);
```

- `v0` and the `return` expression are the only two things the student needs to change.
- `runSimulation` is the only global exposed by `implementation.ts`.
- The `???` placeholder makes the task unambiguous.

---

## `messages.ts`

```ts
export type SimulationResult = {
  v0: number;
  mu: number;
  r0: number;
  trueEscapeVelocity: number;
  studentFormulaCorrect: boolean; // true if isEscaping correctly classifies the boundary
  studentFormulaError: boolean;   // true if isEscaping threw during evaluation
  trajectory: { x: number; y: number }[];
  escapes: boolean; // determined by true physics, not student formula
};
```

---

## `implementation.ts` — Physics + Evaluation

**Constants (fixed, not exposed to student):**
- `mu = 1000` (gravitational parameter, pixel-scale)
- `r0 = 150` (initial distance from center, pixels)
- Default `v0 = 10.0` is clearly sub-escape so the first run shows a bound orbit

**On `runSimulation(v0, isEscapingFn)`:**
1. Clamp `v0` to a number (default 1 if non-numeric) to prevent NaN from corrupting the trajectory.
2. Run Euler integration for up to 500 steps with a fixed timestep, recording `{x, y}` → `trajectory[]`. Stop early if the object exits the canvas bounds.
3. Compute `trueEscapeVelocity = Math.sqrt((2 * mu) / r0)`.
4. Test student formula by calling `isEscapingFn` twice in try/catch:
   ```ts
   let studentFormulaCorrect = false;
   let studentFormulaError = false;
   try {
     const testAbove = isEscapingFn(trueEscapeVelocity * 1.01, mu, r0) === true;
     const testBelow = isEscapingFn(trueEscapeVelocity * 0.99, mu, r0) === false;
     studentFormulaCorrect = testAbove && testBelow;
   } catch {
     studentFormulaError = true;
   }
   ```
5. `escapes = v0 >= trueEscapeVelocity` (true physics, ignoring student formula entirely).
6. Send a single `SimulationResult` message.

The data panel shows `v_escape (true)` and whether the student's function correctly classifies the boundary (✓ / ✗ / ERROR).

---

## `state.ts`

```ts
export class State {
  @observable accessor result: SimulationResult | null = null;
  @observable accessor error: string | null = null;
  @observable accessor hintCard: 1 | 2 | 3 | 4 = 1; // advances based on run history
  @observable accessor runCount: number = 0;

  public init = () => {};

  @action
  public onMessage = (msg: SimulationResult) => {
    this.result = msg;
    this.error = null;
    this.runCount += 1;

    if (msg.studentFormulaCorrect) {
      this.hintCard = 4;
    } else if (this.runCount >= 2) {
      this.hintCard = 3;
    } else {
      this.hintCard = 2;
    }
  };
}
```

---

## `Component.tsx` — Visualization

**Canvas / SVG showing:**
- Central body: glowing yellow/white circle at center
- `trajectory[]` polyline:
  - Blue for bound orbit (loops back or stays close)
  - Orange for escaping path (exits the frame)
- **BOUND** or **ESCAPING** label in the top-right corner of the canvas, color-matched

**Data panel below the canvas (3 rows):**

| Row | Content |
|-----|---------|
| Starting speed | `v₀ = <value>` |
| True escape velocity | `v_escape = <value>` (shown after run) |
| Your formula | ✓ Correct / ✗ Incorrect (green / red) |

**Before first run:** centered placeholder text — "Click run to launch the simulation."

---

## Hint Progression (3 cards)

**Card 1 — Explore (shown before first run)**
> "You're going to fire an object from a planet and see if it escapes gravity. Set `v0` to different values and hit Run. What do you notice about the orbit shape?"

**Card 2 — Formula (shown after first run if formula is wrong or untouched)**
> "The escape velocity depends on two things: the gravitational strength `mu` and your starting distance `r`. The formula is: `v_escape = sqrt(2 * mu / r)`. Can you write that as the right-hand side of the comparison in `isEscaping`?"

**Card 3 — Syntax (shown after a second wrong attempt)**
> "In JavaScript, square root is `Math.sqrt(...)`. So `sqrt(2 * mu / r)` becomes `Math.sqrt((2 * mu) / r)`."

**Card 4 — Success (shown when `studentFormulaCorrect === true`)**
> "That's it! Your formula correctly identifies the escape threshold. Notice how the orbit changes exactly when `v0` crosses `v_escape`. Try setting `v0` just above and just below that value."

Hint advancement logic:
- Card 1 → Card 2: after any run where formula is wrong
- Card 2 → Card 3: after a second run where formula is still wrong
- Any card → Card 4: as soon as `studentFormulaCorrect === true`

---

## Safety & Robustness

- Student code runs inside the existing JSWorker sandbox (unchanged from all other plugins).
- `runSimulation` is the only exported global — student cannot access physics internals.
- `v0` non-numeric: clamped to 1 before physics runs.
- `isEscaping` throws: caught, `studentFormulaCorrect = false`, data panel shows "ERROR".
- Syntax errors in `main.js`: surface as console error + "ERROR" in data panel (same pattern as haber-reaction).
- Physics always runs correctly regardless of student formula — the trajectory is always trustworthy.

---

## Data Flow Summary

```
main.js (student code)
  └── runSimulation(v0, isEscaping)
        └── implementation.ts
              ├── Euler integration → trajectory[]
              ├── trueEscapeVelocity = sqrt(2*mu/r0)
              ├── test isEscaping at boundary → studentFormulaCorrect
              └── sendMessage(SimulationResult)
                    └── state.ts (onMessage)
                          └── Component.tsx (re-renders)
```

---

## Step-by-Step Implementation Plan (high level)

1. Scaffold `src/plugins/escape-velocity/` with Plugin.tsx, messages.ts, state.ts stubs
2. Write `implementation.ts`: Euler integrator + evaluation logic
3. Write `starter-code/main.js`
4. Write `Component.tsx`: canvas rendering + data panel + hint cards
5. Register plugin in `public/plugins-manifest.json`
6. Tune physics constants so default `v0=10` produces a visible bound orbit and `v0≈45` escapes
