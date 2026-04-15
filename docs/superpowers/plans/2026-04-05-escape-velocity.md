# Escape Velocity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive plugin that teaches escape velocity by having students fill in one formula and tune a starting speed to see how an orbit changes from bound to escaping.

**Architecture:** Student code calls `runSimulation(v0, isEscaping)` → `implementation.ts` runs a 2D Euler gravity integrator and tests the student's formula against the true escape threshold → sends one `SimulationResult` message → MobX state updates → `Component.tsx` re-renders the orbit canvas, data panel, and hint card.

**Tech Stack:** React, MobX (`mobx` + `mobx-react-lite`), TypeScript, SVG canvas, existing JSWorker sandbox.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/plugins/escape-velocity/Plugin.tsx` | Create | Boilerplate plugin wiring |
| `src/plugins/escape-velocity/messages.ts` | Create | `SimulationResult` type |
| `src/plugins/escape-velocity/state.ts` | Create | MobX state + hint card advancement |
| `src/plugins/escape-velocity/languages/BasicJS/implementation.ts` | Create | Physics integrator + student formula evaluation |
| `src/plugins/escape-velocity/languages/BasicJS/starter-code/main.js` | Create | Student-facing code |
| `src/plugins/escape-velocity/Component.tsx` | Create | SVG visualization + data panel + hints |
| `public/plugins-manifest.json` | Modify | Register new plugin |

---

## Task 1: Scaffold — Plugin.tsx, messages.ts, state.ts

**Files:**
- Create: `src/plugins/escape-velocity/Plugin.tsx`
- Create: `src/plugins/escape-velocity/messages.ts`
- Create: `src/plugins/escape-velocity/state.ts`

- [ ] **Step 1: Create `messages.ts`**

```ts
export type SimulationResult = {
  v0: number;
  mu: number;
  r0: number;
  trueEscapeVelocity: number;
  studentFormulaCorrect: boolean;
  studentFormulaError: boolean;
  trajectory: { x: number; y: number }[];
  escapes: boolean;
};
```

- [ ] **Step 2: Create `state.ts`**

```ts
import { action, observable } from "mobx";
import { SimulationResult } from "./messages";

export class State {
    @observable
    accessor result: SimulationResult | null = null;

    @observable
    accessor hintCard: 1 | 2 | 3 | 4 = 1;

    @observable
    accessor runCount: number = 0;

    public init = () => {};

    @action
    public onMessage = (msg: SimulationResult) => {
        this.result = msg;
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

export default State;
```

- [ ] **Step 3: Create `Plugin.tsx`**

```tsx
import { plugin } from "../../common/plugin";
import Component from "./Component";
import State from "./state";

export const Plugin = plugin(Component, State);

export default Plugin;
```

---

## Task 2: Physics engine — `implementation.ts`

**Files:**
- Create: `src/plugins/escape-velocity/languages/BasicJS/implementation.ts`

Physics constants chosen so `v0 = 10` (the starter default) produces a clearly visible bound orbit:
- `MU = 15000` (gravitational parameter, pixel-scale)
- `R0 = 100` (initial distance from center, pixels)
- `v_escape = sqrt(2 * 15000 / 100) ≈ 17.32`
- `v_circular = sqrt(15000 / 100) ≈ 12.25`
- `v0 = 10` → sub-circular, elliptical bound orbit looping near the center
- `v0 ≈ 17.5` → escape

The object starts at `(R0, 0)` relative to center with velocity `(0, v0)` (tangential).

- [ ] **Step 1: Create `implementation.ts`**

```ts
import { SimulationResult } from "../../messages";

const MU = 15000;
const R0 = 100;
const DT = 0.05;
const MAX_STEPS = 1400;
const CANVAS_HALF = 250; // stop if object exits this radius from center

const createExports = (sendMessage: (message: SimulationResult) => void) => {
    return Promise.resolve({
        runSimulation: (
            rawV0: unknown,
            isEscapingFn: unknown
        ) => {
            // --- Sanitize v0 ---
            const v0 = typeof rawV0 === "number" && isFinite(rawV0) ? rawV0 : 1;

            // --- Euler integration ---
            const trajectory: { x: number; y: number }[] = [];
            let px = R0;
            let py = 0;
            let vx = 0;
            let vy = v0;

            for (let i = 0; i < MAX_STEPS; i++) {
                trajectory.push({ x: px, y: py });
                const dist = Math.sqrt(px * px + py * py);
                if (dist < 4) break; // swallowed by central body
                if (dist > CANVAS_HALF) break; // escaped canvas

                const accel = -MU / (dist * dist * dist);
                vx += accel * px * DT;
                vy += accel * py * DT;
                px += vx * DT;
                py += vy * DT;
            }

            // --- True escape velocity ---
            const trueEscapeVelocity = Math.sqrt((2 * MU) / R0);
            const escapes = v0 >= trueEscapeVelocity;

            // --- Evaluate student formula ---
            let studentFormulaCorrect = false;
            let studentFormulaError = false;

            if (typeof isEscapingFn === "function") {
                try {
                    const testAbove = (isEscapingFn as Function)(trueEscapeVelocity * 1.01, MU, R0) === true;
                    const testBelow = (isEscapingFn as Function)(trueEscapeVelocity * 0.99, MU, R0) === false;
                    studentFormulaCorrect = testAbove && testBelow;
                } catch {
                    studentFormulaError = true;
                }
            } else {
                studentFormulaError = true;
            }

            sendMessage({
                v0,
                mu: MU,
                r0: R0,
                trueEscapeVelocity,
                studentFormulaCorrect,
                studentFormulaError,
                trajectory,
                escapes,
            });
        },
    });
};

export default createExports;
```

---

## Task 3: Starter code — `main.js`

**Files:**
- Create: `src/plugins/escape-velocity/languages/BasicJS/starter-code/main.js`

- [ ] **Step 1: Create `main.js`**

```js
const v0 = 10.0; // starting speed — try changing this!

function isEscaping(v, mu, r) {
  return v > 0; // TODO: replace 0 with the escape velocity formula
}

runSimulation(v0, isEscaping);
```

Note: `return v > 0` is intentionally wrong but syntactically valid. It lets the student run the code immediately and see a result before fixing the formula. If `???` were used instead, the file would fail to parse and nothing would render.

---

## Task 4: Visualization — `Component.tsx`

**Files:**
- Create: `src/plugins/escape-velocity/Component.tsx`

The component renders:
1. An SVG canvas (500×500) with the orbit trajectory
2. A data panel with v₀, true escape velocity, and formula result
3. A hint card (driven by `state.hintCard`)

The SVG coordinate origin is at the SVG center (250, 250). Trajectory points from `implementation.ts` are already center-relative, so they need `+ 250` offset for SVG rendering.

- [ ] **Step 1: Create `Component.tsx`**

```tsx
import { observer } from "mobx-react-lite";
import State from "./state";

const SVG_SIZE = 500;
const CENTER = SVG_SIZE / 2;

const HINTS = [
    null, // index 0 unused
    "You're going to fire an object from a planet and see if it escapes gravity. Set v0 to different values and hit Run. What do you notice about the orbit shape?",
    "The escape velocity depends on two things: the gravitational strength mu and your starting distance r. The formula is: v_escape = sqrt(2 * mu / r). Can you write that as the right-hand side of the comparison in isEscaping?",
    "In JavaScript, square root is Math.sqrt(...). So sqrt(2 * mu / r) becomes Math.sqrt((2 * mu) / r).",
    "That's it! Your formula correctly identifies the escape threshold. Notice how the orbit changes exactly when v0 crosses v_escape. Try setting v0 just above and just below that value.",
];

const Component = observer(({ state }: { state: State | undefined }) => {
    const result = state?.result ?? null;
    const hintCard = state?.hintCard ?? 1;

    const trajectoryPoints = result
        ? result.trajectory
              .map((p) => `${(p.x + CENTER).toFixed(1)},${(p.y + CENTER).toFixed(1)}`)
              .join(" ")
        : "";

    const pathColor = result?.escapes ? "#f97316" : "#3b82f6";
    const statusLabel = result?.escapes ? "ESCAPING" : "BOUND";
    const statusColor = result?.escapes ? "#f97316" : "#3b82f6";

    let formulaStatus: { text: string; color: string };
    if (!result) {
        formulaStatus = { text: "—", color: "#94a3b8" };
    } else if (result.studentFormulaError) {
        formulaStatus = { text: "ERROR", color: "#ef4444" };
    } else if (result.studentFormulaCorrect) {
        formulaStatus = { text: "✓ Correct", color: "#16a34a" };
    } else {
        formulaStatus = { text: "✗ Incorrect", color: "#ef4444" };
    }

    return (
        <div
            style={{
                width: "100%",
                minHeight: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
                fontFamily: "sans-serif",
                padding: "16px",
                boxSizing: "border-box",
                gap: "12px",
            }}
        >
            {/* Canvas */}
            <div style={{ position: "relative" }}>
                <svg
                    width={SVG_SIZE}
                    height={SVG_SIZE}
                    style={{
                        borderRadius: "12px",
                        background: "#020617",
                        border: "1px solid #1e293b",
                        display: "block",
                        maxWidth: "100%",
                    }}
                >
                    {/* Central body */}
                    <circle cx={CENTER} cy={CENTER} r={10} fill="#fde68a" />
                    <circle cx={CENTER} cy={CENTER} r={18} fill="none" stroke="#fde68a" strokeWidth={1} opacity={0.3} />

                    {/* Orbit path */}
                    {result && trajectoryPoints && (
                        <polyline
                            points={trajectoryPoints}
                            fill="none"
                            stroke={pathColor}
                            strokeWidth={2}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            opacity={0.9}
                        />
                    )}

                    {/* Starting position dot */}
                    {result && (
                        <circle
                            cx={result.r0 + CENTER}
                            cy={CENTER}
                            r={5}
                            fill={pathColor}
                        />
                    )}

                    {/* Status label */}
                    {result && (
                        <text
                            x={SVG_SIZE - 12}
                            y={24}
                            textAnchor="end"
                            fontSize={14}
                            fontWeight="bold"
                            fill={statusColor}
                            style={{ letterSpacing: "0.08em" }}
                        >
                            {statusLabel}
                        </text>
                    )}

                    {/* Placeholder */}
                    {!result && (
                        <text
                            x={CENTER}
                            y={CENTER}
                            textAnchor="middle"
                            fontSize={14}
                            fill="#475569"
                        >
                            Click run to launch the simulation.
                        </text>
                    )}
                </svg>
            </div>

            {/* Data panel */}
            <div
                style={{
                    background: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: "10px",
                    padding: "12px 20px",
                    width: "100%",
                    maxWidth: `${SVG_SIZE}px`,
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                }}
            >
                <DataRow label="Starting speed" value={result ? `v₀ = ${result.v0}` : "—"} />
                <DataRow
                    label="True escape velocity"
                    value={result ? `v_escape ≈ ${result.trueEscapeVelocity.toFixed(2)}` : "—"}
                />
                <DataRow
                    label="Your formula"
                    value={formulaStatus.text}
                    valueColor={formulaStatus.color}
                />
            </div>

            {/* Hint card */}
            <div
                style={{
                    background: hintCard === 4 ? "#052e16" : "#1e1b4b",
                    border: `1px solid ${hintCard === 4 ? "#16a34a" : "#3730a3"}`,
                    borderRadius: "10px",
                    padding: "12px 16px",
                    width: "100%",
                    maxWidth: `${SVG_SIZE}px`,
                    boxSizing: "border-box",
                    fontSize: "13px",
                    color: hintCard === 4 ? "#bbf7d0" : "#c7d2fe",
                    lineHeight: "1.6",
                }}
            >
                <span style={{ fontWeight: "bold", marginRight: "6px", fontSize: "11px", textTransform: "uppercase", opacity: 0.7 }}>
                    {hintCard === 4 ? "✓ Nice work" : `Hint ${hintCard}`}
                </span>
                {HINTS[hintCard]}
            </div>
        </div>
    );
});

const DataRow = ({
    label,
    value,
    valueColor = "#e2e8f0",
}: {
    label: string;
    value: string;
    valueColor?: string;
}) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
        <span style={{ color: "#64748b" }}>{label}</span>
        <span style={{ color: valueColor, fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
);

export default Component;
```

---

## Task 5: Register plugin + verify

**Files:**
- Modify: `public/plugins-manifest.json`

- [ ] **Step 1: Add entry to `plugins-manifest.json`**

Add the following key to the JSON object (e.g. after `"force-components"`):

```json
"escape-velocity": {
  "BasicJS": {
    "implUrl": "/plugins-code/escape-velocity/languages/BasicJS/implementation.js"
  }
}
```

The full file should have all existing entries plus this new one. Keep alphabetical order for readability.

- [ ] **Step 2: Start the dev server and verify the plugin loads**

```bash
npm run start
```

Open `http://localhost:5173/escape-velocity` (or whichever route the dev setup uses for plugin preview). Expected: the dark canvas loads with "Click run to launch the simulation." and Hint 1 text is visible.

- [ ] **Step 3: Verify a run with default `v0 = 10`**

Click Run. Expected:
- A blue elliptical arc appears (bound orbit)
- "BOUND" label appears top-right of canvas
- Data panel shows `v₀ = 10`, `v_escape ≈ 17.32`, formula row shows "✗ Incorrect" (default stub `v > 0` is always true, so testBelow fails)
- Hint card advances to Hint 2

- [ ] **Step 4: Verify formula input**

Edit `main.js` starter code to:
```js
function isEscaping(v, mu, r) {
  return v > Math.sqrt((2 * mu) / r);
}
```

Click Run. Expected:
- Formula row shows "✓ Correct" in green
- Hint card shows "✓ Nice work" card

- [ ] **Step 5: Verify escape transition**

Edit `v0 = 18.0`, keep correct formula, click Run. Expected:
- Orange open path that exits the canvas frame
- "ESCAPING" label appears
- `v_escape ≈ 17.32` shown in data panel

- [ ] **Step 6: Verify syntax error handling**

Edit `main.js` to contain a deliberate syntax error, e.g. `return v > Math.sqrt(`. Click Run. Expected: formula row shows "ERROR" in red, orbit still renders correctly (physics is independent).
