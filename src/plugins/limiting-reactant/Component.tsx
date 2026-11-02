import { observer } from "mobx-react-lite";
import { color, font, type } from "../../common/tokens";
import {
  easeInOut,
  progressBetween,
  useRunAnimation,
} from "../../common/useRunAnimation";
import {
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import instructions from "./instructions.md?raw";
import State, { COEF, type ReactionRun } from "./state";

/*
 * Particle picture of 2 H2 + O2 -> 2 H2O. Each molecule drawn is 1 mole.
 * The run replays reaction by reaction: one set of 2 H2 + 1 O2 slides to the
 * middle, combines, and 2 H2O slide into the product box. Reactants the
 * student's code used but that were never there are drawn as dashed
 * "missing" outlines; dashed amber circles mark the most H2O possible.
 */

const W = 640;
const H = 400;

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
const H2_BOX: Box = { x: 16, y: 30, w: 236, h: 150 };
const O2_BOX: Box = { x: 16, y: 216, w: 236, h: 150 };
const H2O_BOX: Box = { x: 388, y: 30, w: 236, h: 336 };
/** Where each set of reactants meets and turns into products. */
const MEET = { x: 320, y: 168 };
const BOX_PAD = 8;

// A short pause on the starting picture, then one reaction per STEP_MS.
const LEAD_MS = 700;
const STEP_TOTAL_MS = 5000;
const STEP_MIN_MS = 450;
const STEP_MAX_MS = 1200;
// Within one reaction: reactants travel in, combine, products travel out.
const IN_END = 0.42;
const OUT_START = 0.58;

type Kind = "h2" | "o2" | "h2o";

interface Point {
  x: number;
  y: number;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Trims a mole amount for display: 3, 2.5, 0.33, with a real minus sign. */
function fmt(v: number): string {
  if (Math.abs(v) < 1e-9) return "0";
  if (v < 0) return `−${fmt(-v)}`;
  const rounded = Math.round(v);
  if (Math.abs(v - rounded) < 1e-9) return String(rounded);
  return String(Number(v.toFixed(2)));
}

/** Largest cell size at which `n` molecule slots fit in the box. */
function fitCell(box: Box, n: number): number {
  for (let s = 54; s >= 6; s -= 0.5) {
    const cols = Math.floor((box.w - BOX_PAD * 2) / s);
    const rows = Math.floor((box.h - BOX_PAD * 2) / s);
    if (cols * rows >= n) return s;
  }
  return 6;
}

function slotPoint(box: Box, cell: number, i: number): Point {
  const cols = Math.max(1, Math.floor((box.w - BOX_PAD * 2) / cell));
  const col = i % cols;
  const row = Math.floor(i / cols);
  const left = box.x + (box.w - cols * cell) / 2;
  return {
    x: left + (col + 0.5) * cell,
    y: box.y + BOX_PAD + (row + 0.5) * cell,
  };
}

/** One molecule. Solid atoms, or a dashed outline when `ghost`. */
const Molecule = ({
  kind,
  at,
  cell,
  opacity = 1,
  ghost = false,
}: {
  kind: Kind;
  at: Point;
  cell: number;
  opacity?: number;
  ghost?: boolean;
}) => {
  const rH = 0.15 * cell;
  const rO = 0.22 * cell;
  const atoms: { dx: number; dy: number; r: number; fill: string }[] =
    kind === "h2"
      ? [
          { dx: -0.12 * cell, dy: 0, r: rH, fill: color.series[1] },
          { dx: 0.12 * cell, dy: 0, r: rH, fill: color.series[1] },
        ]
      : kind === "o2"
        ? [
            { dx: -0.16 * cell, dy: 0, r: rO, fill: color.series[0] },
            { dx: 0.16 * cell, dy: 0, r: rO, fill: color.series[0] },
          ]
        : [
            // Bent water molecule: H atoms ~104.5 degrees apart, O in front.
            { dx: -0.21 * cell, dy: 0.11 * cell, r: rH, fill: color.series[1] },
            { dx: 0.21 * cell, dy: 0.11 * cell, r: rH, fill: color.series[1] },
            { dx: 0, dy: -0.06 * cell, r: rO, fill: color.series[0] },
          ];
  return (
    <g opacity={opacity}>
      {atoms.map((a, i) => (
        <circle
          key={i}
          cx={at.x + a.dx}
          cy={at.y + a.dy}
          r={a.r}
          fill={ghost ? "none" : a.fill}
          stroke={ghost ? color.inkMuted : color.surfaceRaised}
          strokeWidth={ghost ? 1.2 : 1}
          strokeDasharray={ghost ? "2 2" : undefined}
        />
      ))}
    </g>
  );
};

interface Unit {
  kind: Kind;
  slot: number;
  /** How much of a whole molecule this is (partial moles draw faded). */
  portion: number;
  ghost: boolean;
}

/** Molecules standing still in a reactant box holding `amount` moles. */
function reactantUnits(kind: Kind, amount: number): Unit[] {
  const units: Unit[] = [];
  const ghost = amount < 0;
  const n = Math.abs(amount);
  for (let i = 0; i < Math.ceil(n - 1e-9); i++) {
    units.push({ kind, slot: i, portion: clamp01(n - i), ghost });
  }
  return units;
}

/** Molecules that leave a reactant box when its amount drops from b to a. */
function departingUnits(kind: Kind, b: number, a: number): Unit[] {
  const units: Unit[] = [];
  if (b > 0) {
    for (let i = Math.max(0, Math.floor(a)); i < Math.ceil(b - 1e-9); i++) {
      const portion = clamp01(b - i) - clamp01(a - i);
      if (portion > 1e-9) units.push({ kind, slot: i, portion, ghost: false });
    }
  }
  const gb = Math.max(0, -b);
  const ga = Math.max(0, -a);
  for (let i = Math.floor(gb); i < Math.ceil(ga - 1e-9); i++) {
    const portion = clamp01(ga - i) - clamp01(gb - i);
    if (portion > 1e-9) units.push({ kind, slot: i, portion, ghost: true });
  }
  return units;
}

/** Product molecules in slots [from, to); past `realLimit` they can't exist. */
function productUnits(from: number, to: number, realLimit: number): Unit[] {
  const units: Unit[] = [];
  for (let i = Math.max(0, Math.floor(from)); i < Math.ceil(to - 1e-9); i++) {
    const portion = clamp01(to - i) - clamp01(from - i);
    if (portion > 1e-9) {
      units.push({
        kind: "h2o",
        slot: i,
        portion,
        ghost: i >= realLimit - 1e-9,
      });
    }
  }
  return units;
}

/** Spreads the molecules of one reaction around the meeting point. */
function clusterPoint(k: number, n: number, cell: number): Point {
  if (n <= 1) return MEET;
  const angle = (2 * Math.PI * k) / n - Math.PI / 2;
  return {
    x: MEET.x + Math.cos(angle) * 0.6 * cell,
    y: MEET.y + Math.sin(angle) * 0.6 * cell,
  };
}

const lerp = (a: Point, b: Point, f: number): Point => ({
  x: a.x + (b.x - a.x) * f,
  y: a.y + (b.y - a.y) * f,
});

function timing(run: ReactionRun) {
  const steps = Math.ceil(run.reactions - 1e-9);
  const stepMs =
    steps > 0
      ? Math.min(STEP_MAX_MS, Math.max(STEP_MIN_MS, STEP_TOTAL_MS / steps))
      : 0;
  return { steps, stepMs, duration: LEAD_MS + steps * stepMs };
}

const BoxLabel = ({
  box,
  name,
  amount,
}: {
  box: Box;
  name: string;
  amount: string;
}) => (
  <g>
    <text
      x={box.x + 2}
      y={box.y - 9}
      style={{ ...type.axisTitle, fill: color.ink }}
    >
      {name}
    </text>
    <text
      x={box.x + box.w - 2}
      y={box.y - 9}
      textAnchor="end"
      style={{ ...type.tick, fill: color.ink, fontVariantNumeric: "tabular-nums" }}
    >
      {amount} mol
    </text>
  </g>
);

const BoxFrame = ({ box }: { box: Box }) => (
  <rect
    x={box.x}
    y={box.y}
    width={box.w}
    height={box.h}
    fill={color.surfaceRaised}
    stroke={color.border}
    rx={4}
  />
);

const Component = observer(({ state }: { state: State }) => {
  const run = state.run;
  const { steps, stepMs, duration } = run
    ? timing(run)
    : { steps: 0, stepMs: 0, duration: 0 };
  const elapsed = useRunAnimation(run, duration);

  if (!run) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Press Run to react hydrogen with oxygen and watch the molecules combine." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const { molesH2, molesO2, reactions, maxReactions } = run;
  const h2At = (xi: number) => molesH2 - COEF.h2 * xi;
  const o2At = (xi: number) => molesO2 - COEF.o2 * xi;
  const h2oAt = (xi: number) => COEF.h2o * xi;
  const maxH2O = COEF.h2o * maxReactions;

  // Which reaction is playing, and how far through it.
  const done = elapsed >= duration;
  const step =
    elapsed < LEAD_MS
      ? 0
      : Math.min(steps, Math.floor((elapsed - LEAD_MS) / stepMs) + 1);
  const phase =
    step === 0 || done
      ? 0
      : clamp01((elapsed - LEAD_MS - (step - 1) * stepMs) / stepMs);
  const xiBefore = done ? reactions : Math.min(Math.max(step - 1, 0), reactions);
  const xiAfter = done ? reactions : Math.min(step, reactions);
  const playing = step > 0 && !done;

  // The numbers switch over halfway through each reaction, when it "happens".
  const xiShown = done ? reactions : playing && phase >= 0.5 ? xiAfter : xiBefore;

  // One cell size for every box, so molecules match across the picture.
  const h2Slots = Math.max(Math.ceil(molesH2), Math.ceil(-h2At(reactions)));
  const o2Slots = Math.max(Math.ceil(molesO2), Math.ceil(-o2At(reactions)));
  const h2oSlots = Math.ceil(Math.max(h2oAt(reactions), maxH2O) - 1e-9);
  const cell = Math.min(
    fitCell(H2_BOX, h2Slots),
    fitCell(O2_BOX, o2Slots),
    fitCell(H2O_BOX, h2oSlots)
  );
  const boxOf = (kind: Kind) =>
    kind === "h2" ? H2_BOX : kind === "o2" ? O2_BOX : H2O_BOX;

  // Standing molecules: reactants already show this reaction's leavers gone,
  // products don't show this reaction's arrivals until they land.
  const standing: Unit[] = [
    ...reactantUnits("h2", h2At(playing ? xiAfter : xiBefore)),
    ...reactantUnits("o2", o2At(playing ? xiAfter : xiBefore)),
    ...productUnits(0, h2oAt(xiBefore), maxH2O),
  ];

  // Molecules in flight for the reaction that is playing.
  const moving: { unit: Unit; at: Point }[] = [];
  let flash = 0;
  if (playing) {
    const leaving = [
      ...departingUnits("h2", h2At(xiBefore), h2At(xiAfter)),
      ...departingUnits("o2", o2At(xiBefore), o2At(xiAfter)),
    ];
    const arriving = productUnits(h2oAt(xiBefore), h2oAt(xiAfter), maxH2O);
    if (phase < OUT_START) {
      const f = easeInOut(progressBetween(phase, 0, IN_END));
      leaving.forEach((unit, k) => {
        const from = slotPoint(boxOf(unit.kind), cell, unit.slot);
        moving.push({ unit, at: lerp(from, clusterPoint(k, leaving.length, cell), f) });
      });
    } else {
      const f = easeInOut(progressBetween(phase, OUT_START, 1 - OUT_START));
      arriving.forEach((unit, k) => {
        const to = slotPoint(H2O_BOX, cell, unit.slot);
        moving.push({ unit, at: lerp(clusterPoint(k, arriving.length, cell), to, f) });
      });
    }
    flash = 1 - Math.abs(phase - 0.5) / 0.12;
  }

  const anyGhost =
    h2At(reactions) < -1e-9 || o2At(reactions) < -1e-9 || reactions > maxReactions + 1e-9;

  const caption = done
    ? steps === 0
      ? "No reactions"
      : `Done: ${fmt(reactions)} reaction${Math.abs(reactions - 1) < 1e-9 ? "" : "s"}`
    : step === 0
      ? "Ready"
      : `Reaction ${step} of ${steps}`;

  const h2Now = h2At(xiShown);
  const o2Now = o2At(xiShown);
  const h2oNow = h2oAt(xiShown);

  // Legend along the bottom edge.
  const legendY = H - 12;
  const legendCell = 26;

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: "100%", height: "100%" }}
          role="img"
          aria-label={`${fmt(molesH2)} mol of hydrogen and ${fmt(molesO2)} mol of oxygen react ${fmt(
            reactions
          )} times, making ${fmt(h2oAt(reactions))} mol of water, with ${fmt(
            h2At(reactions)
          )} mol of hydrogen and ${fmt(o2At(reactions))} mol of oxygen left over. At most ${fmt(
            maxH2O
          )} mol of water is possible.`}
        >
          <BoxFrame box={H2_BOX} />
          <BoxFrame box={O2_BOX} />
          <BoxFrame box={H2O_BOX} />
          <BoxLabel box={H2_BOX} name="H₂" amount={fmt(h2Now)} />
          <BoxLabel box={O2_BOX} name="O₂" amount={fmt(o2Now)} />
          <BoxLabel box={H2O_BOX} name="H₂O" amount={fmt(h2oNow)} />

          {/* The most water these amounts can make. */}
          {Array.from({ length: Math.ceil(maxH2O - 1e-9) }, (_, i) => {
            const p = slotPoint(H2O_BOX, cell, i);
            return (
              <circle
                key={`max-${i}`}
                cx={p.x}
                cy={p.y}
                r={0.44 * cell}
                fill="none"
                stroke={color.reference}
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
            );
          })}

          {standing.map((u) => (
            <Molecule
              key={`${u.kind}-${u.slot}-${u.ghost}`}
              kind={u.kind}
              at={slotPoint(boxOf(u.kind), cell, u.slot)}
              cell={cell}
              opacity={u.ghost ? 1 : u.portion}
              ghost={u.ghost}
            />
          ))}

          {/* Reaction arrow, the equation, and which reaction is playing. */}
          <line
            x1={272}
            y1={214}
            x2={362}
            y2={214}
            stroke={color.inkMuted}
            strokeWidth={2}
          />
          <path
            d="M 362 214 L 352 208 L 352 220 Z"
            fill={color.inkMuted}
          />
          <text
            x={MEET.x}
            y={244}
            textAnchor="middle"
            style={{ ...type.axisTitle, fill: color.ink }}
          >
            {caption}
          </text>
          <text x={MEET.x} y={264} textAnchor="middle" style={type.tick}>
            2 H₂ + O₂ → 2 H₂O
          </text>

          {flash > 0 && (
            <circle
              cx={MEET.x}
              cy={MEET.y}
              r={1.1 * cell}
              fill="none"
              stroke={color.ink}
              strokeWidth={1.5}
              opacity={clamp01(flash) * 0.6}
            />
          )}

          {moving.map(({ unit, at }, k) => (
            <Molecule
              key={`move-${k}`}
              kind={unit.kind}
              at={at}
              cell={cell}
              opacity={unit.ghost ? 1 : unit.portion}
              ghost={unit.ghost}
            />
          ))}

          {/* Legend */}
          <g style={{ fontFamily: font.ui }}>
            <Molecule kind="h2" at={{ x: 30, y: legendY - 4 }} cell={legendCell} />
            <text x={46} y={legendY} style={type.tick}>
              H₂
            </text>
            <Molecule kind="o2" at={{ x: 92, y: legendY - 4 }} cell={legendCell} />
            <text x={110} y={legendY} style={type.tick}>
              O₂
            </text>
            <Molecule kind="h2o" at={{ x: 158, y: legendY - 4 }} cell={legendCell} />
            <text x={174} y={legendY} style={type.tick}>
              H₂O
            </text>
            <circle
              cx={236}
              cy={legendY - 4}
              r={9}
              fill="none"
              stroke={color.reference}
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
            <text x={252} y={legendY} style={type.tick}>
              most H₂O possible
            </text>
            {anyGhost && (
              <>
                <Molecule
                  kind="o2"
                  at={{ x: 404, y: legendY - 4 }}
                  cell={legendCell}
                  ghost
                />
                <text x={422} y={legendY} style={type.tick}>
                  missing: not really there
                </text>
              </>
            )}
          </g>
        </svg>
      </PluginStage>

      <StatRow
        stats={[
          {
            label: "H₂ (mol)",
            value: `${fmt(molesH2)} → ${fmt(h2Now)}`,
            color: color.series[1],
          },
          {
            label: "O₂ (mol)",
            value: `${fmt(molesO2)} → ${fmt(o2Now)}`,
            color: color.series[0],
          },
          { label: "H₂O Made", value: fmt(h2oNow) },
          { label: "Max H₂O", value: fmt(maxH2O), color: color.reference },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
