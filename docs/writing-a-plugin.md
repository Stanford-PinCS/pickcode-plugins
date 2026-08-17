# Writing a Plugin

A start-to-finish guide to building your first plugin. We'll build one called
`draw-vector`: the student calls `drawVector(6, 8)` and an arrow appears on a
grid, with its magnitude and angle read out underneath.

By the end you'll have every file a modern plugin ships with — JavaScript and
Python starter code, worked solutions, instructions, and the four TypeScript
files that make it run.

If you want the conceptual model first, read `plugin-walkthrough.md`. If you're
adding Python to a plugin that already exists, read `multi-language-plugins.md`.
The rules your PR will be reviewed against are in `AGENTS.md` and
`STYLE_GUIDE.md` — read both before you open one.

---

## 1. Setup

You need `node` installed. From the root of this repo:

```bash
npm i
npm start
```

Vite prints a URL, usually `http://localhost:5173/`. There are two routes:

| Route                   | What it is                                                 |
| ----------------------- | ---------------------------------------------------------- |
| `/sandbox/<plugin-name>` | Code editor on the left, your plugin on the right. This is where you develop. It has a **BasicJS / Python** toggle. |
| `/embed/<plugin-name>`   | Just the plugin pane, no editor. This is what the PinCS site loads in an iframe. |

So once our plugin exists, we'll develop it at
`http://localhost:5173/sandbox/draw-vector`.

Saving a file hot-reloads the page, as long as `npm start` keeps running.

> The `src/Sandbox/` folder is deprecated as a *product* surface, but it is
> still how you test locally. If you plan to change the sandbox itself, check
> with Preston (@pseay) or Trip (@tmaster628) first.

---

## 2. The two sides of a plugin

A running program has two halves, and you write code for both:

1. **The runtime** — the student's code, on the left. When they hit Run it
   executes in a Web Worker (JavaScript) or a Pyodide worker (Python).
2. **The output** — your React UI, on the right, inside an iframe.

They can't call each other directly; they're in different execution contexts.
They communicate by passing **messages**, and messages flow **one way**: from
the student's code into your UI.

```
 student's code            your plugin
┌────────────────┐        ┌──────────────────┐
│ drawVector(6,8)│        │                  │
│                │        │   Component.tsx  │  ← re-renders
│ implementation │        │        ↑         │
│      .ts       │        │     state.ts     │
│       │        │        │        ↑         │
│  sendMessage() ├───────►│   onMessage()    │
└────────────────┘        └──────────────────┘
    Web Worker                  iframe
         (message shape defined in messages.ts)
```

That single constraint explains the whole file layout. `implementation.ts` is
the only file the student's code can reach. `messages.ts` is the contract
between the halves. `state.ts` receives and stores. `Component.tsx` draws.

---

## 3. Scaffold it

```bash
npm run init-plugin
```

It asks for a kebab-case name. Enter `draw-vector`. It copies `template/` into
`src/plugins/draw-vector/`:

```text
src/plugins/draw-vector/
├── Component.tsx                        # the UI
├── state.ts                             # the data
├── messages.ts                          # the contract
├── Plugin.tsx                            # wiring (don't edit)
├── instructions.md                       # what the student reads
└── languages/
    └── BasicJS/
        ├── implementation.ts             # what the student can call
        └── starter-code/
            └── main.js                   # the code they start with
```

**Never start from a blank file.** The template encodes decisions (exhaustive
message handling, design tokens, empty states) that reviewers will ask for
anyway. Starting from a *different plugin* is also discouraged unless it does
something genuinely similar — that's how visual drift crept in last time.

`init-plugin` does **not** create the Python folder or the solution files. We
add those by hand in step 10. It also doesn't register your plugin anywhere —
see the note on the manifest in step 11.

The template files have `TODO` comments and their imports resolve relative to
`src/plugins/<name>/`. Inside `template/` those imports show as unresolved.
That's expected — don't "fix" them.

---

## 4. `messages.ts` — the contract

Start here, always. Deciding what the student's code can say to your UI forces
you to decide what your plugin actually does.

```ts
/**
 * Every message the student's code can send to this plugin.
 */

export type Message =
  | { type: "drawVector"; x: number; y: number; label: string }
  | { type: "setGridSize"; units: number };
```

Rules that matter here:

- **Discriminated union on `type`.** Not a bag of optional fields. If two
  messages carry different data, they're two variants.
- **`type` names something the student does** (`drawVector`), not an internal
  event (`vectorStateChanged`).
- **Payloads are plain JSON-safe values.** These cross a `postMessage`
  boundary — no functions, no class instances, no `Map`.
- **Arrays arrive `readonly`** and get copied in `state.ts`.

Keeping this file small is a feature. Two variants is a complete plugin.

---

## 5. `state.ts` — the data

```ts
import { action, observable } from "mobx";
import { Message } from "./messages";

export interface Vector {
  x: number;
  y: number;
  label: string;
}

/**
 * All plugin state. No JSX, no colors, no formatting in this file.
 */
export class State {
  @observable accessor vectors: Vector[] = [];
  @observable accessor gridSize: number = 10;

  /** Runs before the student's code, on every Run. Reset here. */
  public init = () => {
    this.vectors = [];
    this.gridSize = 10;
  };

  @action
  public onMessage = (m: Message) => {
    switch (m.type) {
      case "drawVector":
        this.vectors = [...this.vectors, { x: m.x, y: m.y, label: m.label }];
        break;
      case "setGridSize":
        this.gridSize = m.units;
        break;
      default:
        assertNever(m);
    }
  };
}

/** Compile-time proof the switch above handles every Message variant. */
function assertNever(x: never): never {
  throw new Error(`Unhandled message: ${JSON.stringify(x)}`);
}

export default State;
```

Four things to notice:

**Every field is `@observable accessor` with an initial value that is valid
before the student runs anything.** `Component.tsx` renders against this state
immediately, so `undefined` here becomes a crash there.

**You don't need `makeObservable(this)`.** This repo compiles standard
(2023-05) decorators via Babel, and `@observable accessor` wires itself up.
Some older plugins call `makeObservable` in a constructor; that's legacy, and
copying it into a new plugin is harmless but unnecessary.

**`init` runs on every Run, not just once.** `Plugin.tsx` rebuilds the state
object when the runtime sends `start`, so anything stateful must be reset here
or results accumulate across runs.

**`assertNever` in the default case is the point of the discriminated union.**
Add a variant to `messages.ts` and this file stops compiling until you handle
it. Don't replace it with a silent `break`.

---

## 6. The house style

Every plugin sits in the same pane of the same site, so they all draw from one
design system. Three shared modules hold it, and nothing in a plugin folder
should reinvent any of it:

| Module                        | Gives you                                                     |
| ----------------------------- | ------------------------------------------------------------- |
| `src/common/tokens.ts`        | `color`, `space`, `radius`, `font`, `type`                     |
| `src/common/PluginSurface.tsx` | `PluginSurface`, `PluginStage`, `StatRow`, `EmptyState`, `EMPTY` |
| `src/common/chart.ts`         | `VIEW`, `PAD`, `makeScales`, `ticks`, `niceStep`, `polylinePoints` |

Read `src/plugins/coin-flip/Component.tsx` alongside this section. It's the
designated reference plugin — the first one migrated to this system, and the one
to copy patterns from when you're unsure.

### Color

`color` is the only source of color. **No raw hex in a plugin, ever.** If you
need a shade that isn't there, add it to `tokens.ts` first and justify it in the
PR.

- `surface` / `surfaceRaised` / `border` — the pane and panels within it
- `ink` / `inkMuted` — primary and secondary text
- `accent` / `accentSoft` — emphasis and interaction
- `series[]` — categorical data, **in order**
- `reference` — reference lines, targets, predicted values
- `grid` / `axis` — chart furniture

Two ordering rules do real work. **The primary data series is always
`series[0]`**, so a student comparing two plugins sees "the thing I made" in the
same color in both. And **reference lines use `color.reference`, never a series
color** — a predicted value and a measured value must never look alike. The
palette is contrast-checked on `surface` and stays distinguishable in grayscale,
which matters more for the colorblind students in any given class than it does
for aesthetics.

### Spacing, radius, font

`space` is a 4px scale (`xs` 4 → `xl` 32) and `radius` is `sm`/`md`/`lg`. Use
them for any CSS layout you add — gaps, padding, border radii. Most plugins
barely touch them, because `PluginSurface` and `StatRow` already own the pane's
layout; you'll reach for them when you add something like a legend.
`standing-wave-studio` is the example to copy.

SVG geometry is different: tick offsets, stroke widths, and arrowhead sizes are
plain numbers in the `viewBox` coordinate space, not layout spacing. The
template and `coin-flip` both use bare numbers there, and so does this guide.

`font` has exactly two faces for two jobs — `font.ui` (Outfit, matching the
site) for labels and prose, `font.data` (monospace) for **every number**.

### Type

Don't write `fontSize` or `fontFamily` by hand; use a `type` entry:

| Entry            | For                                        |
| ---------------- | ------------------------------------------ |
| `type.label`     | small uppercase caption above a value      |
| `type.value`     | large numeric readout                      |
| `type.tick`      | axis tick text                             |
| `type.axisTitle` | axis name, e.g. "Number of Flips"          |
| `type.body`      | body copy (rare — prose belongs in `instructions.md`) |

`type.value` sets `fontVariantNumeric: "tabular-nums"`, which is why you should
use it rather than rolling your own readout: these plugins update numbers
continuously, and proportional digits make a value jitter sideways as it
changes. `StatRow` applies `type.label` and `type.value` for you, so a stat row
gets this for free.

### Structure

The pane is always the same three-part stack:

```tsx
<PluginSurface instructions={instructions}>   {/* frame + instructions */}
  <PluginStage>{/* the visual */}</PluginStage>
  <StatRow stats={[...]} />                    {/* the numbers */}
</PluginSurface>
```

Stats go at the bottom because the visual is the point and the numbers are the
confirmation. Beyond that: **the plugin draws no title** (the site renders the
name above the pane) and **no fixed pixel dimensions on the outer element** —
plugins fill whatever the site gives them, so size charts with a `viewBox`.

**Every plugin needs an `EmptyState`.** A blank pane before the student runs
anything reads as broken. Write it as an instruction, not an apology: "Run your
code to see the results" tells them what to do; "No data available" doesn't. For
a stat that exists but has no value yet, use the shared `EMPTY` sentinel so the
dash looks the same everywhere:

```tsx
{ label: "Reference", value: reference === null ? EMPTY : reference.toFixed(2) }
```

### Charts

Reuse `src/common/chart.ts` rather than hand-rolling scales, ticks, or padding —
`niceStep` was written once for `coin-flip` and lives there now so the next chart
doesn't get a subtly different version. Axes start at zero unless you have a
reason; students read magnitude off these, and a truncated axis exaggerates
differences. A non-zero minimum is a conversation in review, not a default.

Charts also carry an `aria-label` that describes **the data, not the chart
type**.

### Motion

Animate only if the concept needs it, and honor the OS setting when you do.
The pattern, from `standing-wave-studio`:

```tsx
function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
```

When it returns true, render the final frame instead of animating toward it.

### What reviewers keep sending back

Dark gradient backgrounds with neon accents (the site is cream and plum, and
your pane sits right beside it). Emoji in headings. SVG glow filters and drop
shadows — they cost performance and read as noise on a light surface. Hardcoded
font stacks, `Segoe UI` above all, which isn't the site's typeface. And
copy-pasting a whole chart implementation into a new plugin.

---

## 7. `Component.tsx` — the drawing

Presentation only. No simulation logic, no message handling. If you're
computing something a student could ask a question about, it belongs in
`state.ts`.

This is where the house style from step 6 gets applied, so every color, font,
and radius below comes from a token.

```tsx
import { observer } from "mobx-react-lite";
import { color, radius, type } from "../../common/tokens";
import { niceStep } from "../../common/chart";
import {
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import instructions from "./instructions.md?raw";
import State, { Vector } from "./state";

const VIEW = { width: 540, height: 380 } as const;

/** Ordered series colors, so the student's first vector is always series[0]. */
const colorFor = (i: number) => color.series[i % color.series.length];

/** The three points of a filled arrowhead sitting at (x2, y2). */
function arrowHead(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  const HEAD = 12;
  const HALF = 6;
  const bx = x2 - HEAD * ux;
  const by = y2 - HEAD * uy;
  return [
    `${x2},${y2}`,
    `${bx + HALF * px},${by + HALF * py}`,
    `${bx - HALF * px},${by - HALF * py}`,
  ].join(" ");
}

const Component = observer(({ state }: { state: State }) => {
  const vectors: Vector[] = state.vectors;

  // Rule 5: every plugin has an empty state. A blank pane reads as broken.
  if (vectors.length === 0) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Run your code to draw a vector on the grid." />
        </PluginStage>
      </PluginSurface>
    );
  }

  // Equal scale on both axes — an unequal one would misreport angles.
  const cx = VIEW.width / 2;
  const cy = VIEW.height / 2;
  const half = Math.min(VIEW.width, VIEW.height) / 2;
  const scale = (half * 0.85) / state.gridSize;
  const sx = (u: number) => cx + u * scale;
  const sy = (u: number) => cy - u * scale;

  const step = niceStep(state.gridSize, 5);
  const gridLines: number[] = [];
  for (let u = step; u <= state.gridSize + 1e-9; u += step) gridLines.push(u);

  const last = vectors[vectors.length - 1];
  const magnitude = Math.hypot(last.x, last.y);
  const degrees = (Math.atan2(last.y, last.x) * 180) / Math.PI;

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <svg
          viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: "100%", height: "100%" }}
          role="img"
          aria-label={`Grid with ${vectors.length} vector${
            vectors.length === 1 ? "" : "s"
          } drawn from the origin. The most recent ends at ${last.x} across and ${
            last.y
          } up.`}
        >
          <rect
            x={0}
            y={0}
            width={VIEW.width}
            height={VIEW.height}
            fill={color.surfaceRaised}
            stroke={color.border}
            rx={radius.sm}
          />

          {/* Grid, mirrored either side of the origin */}
          {gridLines.flatMap((u) =>
            [u, -u].map((v) => (
              <line
                key={`gx-${v}`}
                x1={sx(v)}
                y1={0}
                x2={sx(v)}
                y2={VIEW.height}
                stroke={color.grid}
              />
            ))
          )}
          {gridLines.flatMap((u) =>
            [u, -u].map((v) => (
              <line
                key={`gy-${v}`}
                x1={0}
                y1={sy(v)}
                x2={VIEW.width}
                y2={sy(v)}
                stroke={color.grid}
              />
            ))
          )}

          {/* Axes */}
          <line x1={0} y1={cy} x2={VIEW.width} y2={cy} stroke={color.axis} />
          <line x1={cx} y1={0} x2={cx} y2={VIEW.height} stroke={color.axis} />

          {/* Tick labels, skipping zero to keep the origin readable */}
          {gridLines.flatMap((u) =>
            [u, -u].map((v) => (
              <text
                key={`tx-${v}`}
                x={sx(v)}
                y={cy + 16}
                textAnchor="middle"
                style={type.tick}
              >
                {v}
              </text>
            ))
          )}

          {/* Axis names */}
          <text
            x={VIEW.width - 10}
            y={cy - 8}
            textAnchor="end"
            style={type.axisTitle}
          >
            Across
          </text>
          <text
            x={cx + 8}
            y={14}
            style={type.axisTitle}
          >
            Up
          </text>

          {/* The vectors */}
          {vectors.map((v, i) => (
            <g key={i}>
              <line
                x1={cx}
                y1={cy}
                x2={sx(v.x)}
                y2={sy(v.y)}
                stroke={colorFor(i)}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
              <polygon
                points={arrowHead(cx, cy, sx(v.x), sy(v.y))}
                fill={colorFor(i)}
              />
              {v.label && (
                <text
                  x={sx(v.x) + 10}
                  y={sy(v.y) - 6}
                  style={{ ...type.tick, fill: colorFor(i) }}
                >
                  {v.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      </PluginStage>

      <StatRow
        stats={[
          { label: "Vectors", value: String(vectors.length) },
          {
            label: "Magnitude",
            value: magnitude.toFixed(2),
            color: colorFor(vectors.length - 1),
          },
          { label: "Angle", value: `${degrees.toFixed(1)}°` },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
```

### Where the style shows up here

Trace step 6 through the file above:

| Style rule            | In this component                                              |
| --------------------- | -------------------------------------------------------------- |
| Structure             | `PluginSurface` > `PluginStage` > `StatRow`                     |
| Empty state           | early return with `EmptyState` before any vector arrives        |
| No raw hex            | `color.surfaceRaised`, `color.border`, `color.grid`, `color.axis` |
| Ordered series        | `colorFor(i)` → `color.series[i % 4]`, so the first vector is `series[0]` |
| Type scale            | `type.tick` on numbers, `type.axisTitle` on "Across" / "Up"     |
| Radius token          | `rx={radius.sm}` on the plot background                        |
| No fixed pixels       | `VIEW` is a `viewBox`; the SVG scales to the pane              |
| Tabular numbers       | free, via `StatRow`'s `type.value`                              |
| Accessible label      | `aria-label` names the data, not the chart type                 |

Three choices in there are worth spelling out.

**The student never picks a color.** `drawVector` takes a *label*, and the plugin
assigns `color.series[i]`. Letting students pass `"green"` — as the older
`force-addition` plugin does — smuggles raw colors back into the system through
student code, and means the same vector is a different color in every lesson.

**No motion, so no reduced-motion handling.** Vectors appear as they're drawn and
nothing animates, which is the simplest way to satisfy that rule. Add the
`prefersReducedMotion` guard from step 6 the moment you animate anything.

**One deviation, named on purpose.** `AGENTS.md` rule 6 says charts use
`src/common/chart.ts`. We use its `niceStep` but not `makeScales`, which builds
`[0, max]` scales with the origin at the bottom-left — a vector grid needs the
origin centered with all four quadrants. Reusing the helper that fits and
explaining the one that doesn't is the intent of the rule; quietly hand-rolling
`niceStep` beside it would not be. Say this kind of thing in the PR description
rather than leaving a reviewer to find it.

---

## 8. `Plugin.tsx` — wiring

```tsx
import { plugin } from "../../common/plugin";
import Component from "./Component";
import State from "./state";

export default plugin(Component, State);
```

That's the whole file, in every plugin. `plugin()` constructs your `State`,
calls `init`, subscribes to the window's `message` events, forwards them to
`onMessage`, and re-creates the state when a new run starts.

If you're tempted to add something here, it belongs in `state.ts` (logic) or
`Component.tsx` (presentation).

---

## 9. `implementation.ts` — the student-facing API

This is the boundary. Everything the student can call is a key in the returned
object.

```ts
import { Message } from "../../messages";

/**
 * The names exported here are literally what students type.
 */

function toNumber(input: unknown, fn: string, arg: string): number {
  const n = Number(input);
  if (!Number.isFinite(n)) {
    throw new Error(`${fn} expects a number for ${arg}.`);
  }
  return n;
}

const createExports = (sendMessage: (message: Message) => void) => {
  return Promise.resolve({
    drawVector: (x: unknown, y: unknown, label: unknown = "") => {
      sendMessage({
        type: "drawVector",
        x: toNumber(x, "drawVector", "x"),
        y: toNumber(y, "drawVector", "y"),
        label: String(label ?? ""),
      });
    },

    setGridSize: (units: unknown) => {
      const n = toNumber(units, "setGridSize", "units");
      if (n <= 0) {
        throw new Error("setGridSize expects a number bigger than 0.");
      }
      sendMessage({ type: "setGridSize", units: n });
    },
  });
};

export default createExports;
```

**Never use `any` here.** Take `unknown` and validate. This is the one place
untyped values genuinely enter the system, which makes it the one place typing
pays for itself. A student who passes the wrong thing should get a sentence they
can act on, not a blank pane.

**Error messages are read by a student who just made a mistake.** Say what's
wrong and what to do. `"setGridSize expects a number bigger than 0."` beats
`"Invalid argument"`.

### The one non-obvious constraint

`implementation.ts` is **transpiled on its own**, file by file, straight to
`implementation.js` — it is never bundled. So it may only import **types**.
Type-only imports get erased during transpilation; a runtime import would
survive into the output as a bare `import "../../messages"` and fail in the
worker.

Confirm it for yourself — `import { Message }` above is gone from the build:

```js
// dist/site/plugins-code/draw-vector/languages/BasicJS/implementation.js
const createExports = (sendMessage) => { /* ... */ };
export default createExports;
```

If you need a shared helper, either duplicate the few lines into
`implementation.ts` or keep the logic in `state.ts`, on the other side of the
message.

---

## 10. Starter code, solutions, and Python

`init-plugin` gives you `languages/BasicJS/starter-code/main.js`. Add the rest
by hand until the scaffolder catches up:

```text
languages/
├── BasicJS/
│   ├── implementation.ts
│   └── starter-code/
│       ├── main.js          # what the student opens
│       └── solution.js      # the worked answer
└── Python/
    └── starter-code/
        ├── main.py
        └── solution.py
```

### `BasicJS/starter-code/main.js`

Starter code is a lesson, not a demo. Leave numbered `TODO`s at the exact spot
where the student types.

```js
// A vector has a size and a direction. Draw one and watch where it lands.

setGridSize(10);

// This vector goes 6 across and 0 up.
drawVector(6, 0, "a");

// TODO 1: draw a second vector, 0 across and 8 up. Call it "b".

// TODO 2: draw the sum of a and b. Add the across parts, then the up parts.
//         Predict where it will point before you run this.
```

### `BasicJS/starter-code/solution.js`

The worked answer, plus what the student should expect to see. Reviewers and
teachers read this; the sandbox does not load it.

```js
// Draw Vector — worked solution.
// Expect three arrows and a magnitude of 10.00 at 53.1°.

setGridSize(10);

drawVector(6, 0, "a");
drawVector(0, 8, "b"); // TODO 1

// TODO 2 — the sum, component by component.
const sum = { x: 6 + 0, y: 0 + 8 };
drawVector(sum.x, sum.y, "a + b");

// 6-8-10 is a right triangle, so the sum has magnitude 10 exactly.
// Try making b negative and predict which quadrant the sum lands in.
```

### `Python/starter-code/main.py`

Python gets its own starter file, and **you don't write a second
implementation**. The runtime bridge reuses `BasicJS/implementation.ts` and
converts names between `camelCase` and `snake_case` automatically, so
`drawVector` is `draw_vector` for free.

```python
# A vector has a size and a direction. Draw one and watch where it lands.

set_grid_size(10)

# This vector goes 6 across and 0 up.
draw_vector(6, 0, "a")

# TODO 1: draw a second vector, 0 across and 8 up. Call it "b".

# TODO 2: draw the sum of a and b. Add the across parts, then the up parts.
#         Predict where it will point before you run this.
```

### `Python/starter-code/solution.py`

```python
# Draw Vector — worked solution.
# Expect three arrows and a magnitude of 10.00 at 53.1°.

set_grid_size(10)

draw_vector(6, 0, "a")
draw_vector(0, 8, "b")  # TODO 1

# TODO 2 — the sum, component by component.
sum_x = 6 + 0
sum_y = 0 + 8
draw_vector(sum_x, sum_y, "a + b")

# 6-8-10 is a right triangle, so the sum has magnitude 10 exactly.
# Try making b negative and predict which quadrant the sum lands in.
```

Keep both languages semantically identical. Same concepts, same numbers, same
`TODO`s, same message payloads — only the syntax and the naming convention
differ. Add `Python/implementation.js` **only** if Python genuinely needs
different behavior; a duplicate implementation that merely repeats the JS one is
the most common mistake in this repo.

---

## 11. `instructions.md` — what the student reads

Rendered above your pane by `PluginInstructions`. The four headings are fixed,
in this order, so every plugin reads the same way. Plain markdown only — no
HTML, no colors, no emoji.

```markdown
# Draw Vector

A vector has two parts: how big it is, and which way it points. Here you'll
draw them on a grid and add them together.

## What you'll do

- Draw a vector by giving its across and up amounts
- Draw a second vector pointing a different way
- Add them and watch where the total points

## Try it

1. Run the starter code and find the arrow labeled `a`.
2. Add vector `b`, going 0 across and 8 up. Run it again.
3. Predict where `a + b` will point before you draw it.

## Think about it

- Two vectors have the same length but point differently. Can their sum ever
  be longer than either one? Can it be zero?
- When you walk 3 blocks east and 4 blocks north, you end up 5 blocks from
  where you started, not 7. Why?

## Functions you can use

| JavaScript              | Python                     | What it does                        |
| ----------------------- | -------------------------- | ----------------------------------- |
| `drawVector(x, y, label)` | `draw_vector(x, y, label)` | Draws an arrow from the center      |
| `setGridSize(units)`      | `set_grid_size(units)`     | Sets how far the grid reaches       |
```

Voice rules, from `STYLE_GUIDE.md`:

- **Second person, active.** "Change `total` and run it again," not "The
  `total` variable may be modified."
- **One idea per step.** A step with an "and" in it is two steps.
- **Name things by what the student does.** They draw vectors; they don't
  dispatch a `drawVector` message.
- **Aim for a 6th-grade reading level** on middle-school plugins.

One file serves every language, which is why the table above lists both names.
Whether instructions should become per-language is an open question in
`STYLE_GUIDE.md`.

---

## 12. Run it

```
http://localhost:5173/sandbox/draw-vector
```

Write code on the left, hit play, watch the right. Use the **BasicJS / Python**
toggle to check both, and confirm the pane shows your `EmptyState` before the
first run rather than a blank box.

**You don't register your plugin anywhere.** `manifestPlugin()` in
`vite.config.ts` generates `plugins-manifest.json` by scanning `src/plugins/`,
and the dev server watches that directory and regenerates on every change. A
plugin appears because its folder exists. (An older note in `STYLE_GUIDE.md`
describes the manifest as hand-edited — that's out of date.)

What the generator picks up:

- `instructions.md` → `instructionsUrl`, if the file exists
- each directory under `languages/` → a language entry with `implUrl`
- `starter-code/main.js` (or `.py`) → `starterUrl`, if it exists

`solution.js` and `solution.py` are copied into `dist/` but deliberately get no
manifest entry, so the editor never loads them as starter code.

If the editor shows HTML instead of your code, a starter file is missing or
misnamed. Editor contents are cached per plugin *and* language under
`codeText:<plugin>:<language>` in `localStorage` — clear that key if you change
starter code and don't see it.

---

## 13. Before you open a PR

Checked against `AGENTS.md`:

- [ ] No raw hex values. Every color from `src/common/tokens.ts`.
- [ ] No `any` — especially in `implementation.ts`.
- [ ] The plugin renders no title of its own.
- [ ] No fixed pixel dimensions on the outer element.
- [ ] An `EmptyState` shows before the first run.
- [ ] Chart scaffolding reused from `src/common/chart.ts`, and any deviation
      called out in the PR description.
- [ ] `onMessage` is exhaustive, with `assertNever` in the default case.
- [ ] Student-facing strings live in `instructions.md`, not inline in JSX.
- [ ] Animations respect `prefers-reduced-motion`.
- [ ] The chart's `aria-label` describes the data.
- [ ] Nothing in the plugin folder beyond the files listed in step 3.
- [ ] Both languages run.
- [ ] `npm run build` passes.

Then branch, PR, and get review from the plugin's administrator. On merge it
reaches Pickcode's development environment; production needs a release, which
only the Pickcode team can cut.

Things previous AI-assisted plugins got wrong, which reviewers now look for
specifically: dark gradient backgrounds with neon accents, emoji in headings,
SVG glow filters and drop shadows, hardcoded font stacks (`Segoe UI` in
particular), and copy-pasting an entire chart implementation into a new plugin.

---

## Appendix: file responsibilities

| File                              | Owns                                  | Must not contain                   |
| --------------------------------- | ------------------------------------- | ---------------------------------- |
| `messages.ts`                     | The `Message` union                   | Anything else                      |
| `state.ts`                        | Observable state, `init`, `onMessage` | JSX, colors, formatting            |
| `Component.tsx`                   | Rendering only                        | Simulation logic, message handling |
| `Plugin.tsx`                      | Wiring                                | Logic, styling                     |
| `instructions.md`                 | Student-facing explanation            | HTML, styling                      |
| `languages/<lang>/`               | Starter code, solutions, exports      | Rendering                          |

### A note on paths

`AGENTS.md` refers to `_template/`, `plugins/<id>/`, `shared/tokens.ts`, and
`languages/*/exports.ts`. The tree on disk actually uses `template/`,
`src/plugins/<id>/`, `src/common/tokens.ts`, and
`languages/*/implementation.ts`. The rules are current; those paths are not.
Use the ones in this guide.
