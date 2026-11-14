import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { PAD, VIEW, makeScales, niceStep, ticks } from "../../common/chart";
import {
  EMPTY,
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import { easeInOut, progressBetween, useRunAnimation } from "../../common/useRunAnimation";
import { color, type } from "../../common/tokens";
import instructions from "./instructions.md?raw";
import State, { type Category, type Combination, type Possibilities, type TestedPoint } from "./state";

// Timeline of one run, in ms: the PPC draws from all capital goods to all consumption goods; then, one additional unit of consumption goods at a time, a dotted step reaches 1 unit to the right and the student's opportunity cost drops from its end in pink, with its number; then, if there's growth, the PPC after growth draws outside the first one; and last, the tested combinations pop in one by one, each marked with what describePoint called it.
const PPC_MS = 700;
const STEPS_AT = 800;
const STEPS_MS = 1300;
const GROWTH_AT = STEPS_AT + STEPS_MS + 100;
const GROWTH_MS = 700;
const POINT_MS = 250;
const POINT_GAP = 120;

/** When the tested combinations start to appear, when the last one starts, and when the whole run is done. */
function timeline(hasGrowth: boolean, pointCount: number) {
  const pointsAt = hasGrowth ? GROWTH_AT + GROWTH_MS + 100 : GROWTH_AT;
  const lastPointAt = pointsAt + Math.max(pointCount - 1, 0) * POINT_GAP;
  return { pointsAt, lastPointAt, total: lastPointAt + POINT_MS };
}

// Layout, in the shared VIEW: the shared padding, with more room on top for the legend.
const PLOT_PAD = { ...PAD, top: 40 };
const LEGEND_Y = 18;
const X_DIVISIONS = 8;
const Y_DIVISIONS = 9;
const ROW_R = 3.5;
const POINT_R = 5.5;
const CAP_HALF = 5;
// type.tick is an 11px monospace font, about 0.6 em per character, so a label's width can be worked out from its length. Its digits and lowercase letters rise about 8 px above the baseline and none of the labels' letters drop much below it.
const CHAR_W = 6.6;
const ASCENT = 9;
const DESCENT = 3;
// How far a subscript, the 1 in PPC₁, sits below the line.
const SUB_DY = 3;

// The student's results, their opportunity costs and what describePoint called each combination, are the first series. The PPC after growth is the second. The PPC from the table is the data the lesson starts from, in ink.
const YOURS = color.series[0];
const GROWN = color.series[1];

/** Shows a number with at most two decimals and no trailing zeros. */
const fmt = (v: number) => String(Number(v.toFixed(2)));

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** "a", "a and b", "a, b and c". */
function joinAnd(items: readonly string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** The student's opportunity costs in the bottom row: the 1st unit's and the last unit's, or one number when those are the same. */
function costRange(costs: readonly number[]): string {
  const first = fmt(costs[0]);
  const last = fmt(costs[costs.length - 1]);
  return first === last ? first : `${first} to ${last}`;
}

/** The end of an axis that starts at 0: a little past the largest value, so the curve and its labels have room, rounded up to a round tick step. */
function axisEnd(max: number, divisions: number): number {
  const target = Math.max(max * 1.08, 1);
  const step = niceStep(target, divisions);
  return Math.ceil(target / step - 1e-9) * step;
}

type Scale = (v: number) => number;

/** The part of a PPC from its first row to `p` of the way along its consumption goods, as polyline points. */
function revealed(rows: readonly Combination[], p: number, sx: Scale, sy: Scale): string {
  const cut = rows[rows.length - 1].consumption * p;
  const out: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].consumption <= cut) {
      out.push(`${sx(rows[i].consumption)},${sy(rows[i].capital)}`);
      continue;
    }
    const a = rows[i - 1];
    const b = rows[i];
    const f = (cut - a.consumption) / (b.consumption - a.consumption);
    out.push(`${sx(cut)},${sy(lerp(a.capital, b.capital, f))}`);
    break;
  }
  return out.join(" ");
}

/** A line of text on the plot: where its anchor is, and which end of the text that is. */
interface Spot {
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
}

interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** A point a label has to keep `r` away from. */
interface Mark {
  x: number;
  y: number;
  r: number;
}

interface Placed extends Spot {
  text: string;
}

function boxOf(spot: Spot, text: string): Box {
  const width = text.length * CHAR_W;
  const x0 = spot.anchor === "start" ? spot.x : spot.anchor === "middle" ? spot.x - width / 2 : spot.x - width;
  return { x0, y0: spot.y - ASCENT, x1: x0 + width, y1: spot.y + DESCENT };
}

/** Points along a line, a few pixels apart, each to be kept `r` away from. */
function along(x1: number, y1: number, x2: number, y2: number, r: number): Mark[] {
  const n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 3));
  return Array.from({ length: n + 1 }, (_, i) => ({ x: lerp(x1, x2, i / n), y: lerp(y1, y2, i / n), r }));
}

/**
 * Picks the spot for a label that covers the fewest marks.
 *
 * Each spot is scored by how many marks its text would cover, plus a large penalty for each label already placed that it would overlap and a larger one for running off the plot. The lowest score wins, the earlier spot on a tie. The winner's box joins `boxes`, so later labels keep clear of it.
 */
function place(text: string, spots: readonly Spot[], marks: readonly Mark[], boxes: Box[], bounds: Box): Placed {
  let best: { score: number; spot: Spot; box: Box } | undefined;
  for (const spot of spots) {
    const box = boxOf(spot, text);
    let score = 0;
    for (const m of marks) {
      if (m.x > box.x0 - m.r && m.x < box.x1 + m.r && m.y > box.y0 - m.r && m.y < box.y1 + m.r) score += 1;
    }
    for (const b of boxes) {
      if (box.x0 < b.x1 + 2 && box.x1 > b.x0 - 2 && box.y0 < b.y1 + 2 && box.y1 > b.y0 - 2) score += 100;
    }
    if (box.x0 < bounds.x0 || box.x1 > bounds.x1 || box.y0 < bounds.y0 || box.y1 > bounds.y1) score += 1000;
    if (!best || score < best.score) best = { score, spot, box };
  }
  boxes.push(best!.box);
  return { ...best!.spot, text };
}

/** One additional unit of consumption goods: a dotted step 1 unit to the right at the previous row's capital goods, then the student's opportunity cost as a drop from its end. */
interface Leg {
  x0: number;
  x1: number;
  yTop: number;
  /** Where the drop ends. The helpers allow no opportunity cost bigger than the capital goods in the row it starts from, so a drop never goes below 0. */
  yEnd: number;
  label: Placed;
}

interface Layout {
  xEnd: number;
  yEnd: number;
  sx: Scale;
  sy: Scale;
  left: number;
  right: number;
  top: number;
  bottom: number;
  legs: Leg[];
  pointLabels: Placed[];
}

/** Scales, the steps for the opportunity costs, and where every label goes, worked out once per run for the finished picture. */
function layout(result: Possibilities): Layout {
  const { ppc, shifted, costs, points } = result;
  const outer = shifted ?? ppc;
  const xEnd = axisEnd(Math.max(outer[outer.length - 1].consumption, ...points.map((p) => p.consumption)), X_DIVISIONS);
  const yEnd = axisEnd(Math.max(outer[0].capital, ...points.map((p) => p.capital)), Y_DIVISIONS);
  const { sx, sy, plotWidth, plotHeight } = makeScales(xEnd, yEnd, VIEW, PLOT_PAD);
  const left = PLOT_PAD.left;
  const right = left + plotWidth;
  const top = PLOT_PAD.top;
  const bottom = top + plotHeight;

  // Every mark the finished run draws, to keep the labels clear of: both PPCs, the rows of the table, the steps and drops, and the tested combinations.
  const marks: Mark[] = [];
  for (const rows of shifted ? [ppc, shifted] : [ppc]) {
    for (let i = 1; i < rows.length; i++) {
      marks.push(...along(sx(rows[i - 1].consumption), sy(rows[i - 1].capital), sx(rows[i].consumption), sy(rows[i].capital), 1.5));
    }
  }
  for (const row of ppc) marks.push({ x: sx(row.consumption), y: sy(row.capital), r: ROW_R + 1 });
  const steps = costs.map((cost, k) => {
    const from = ppc[k].capital;
    return { x0: sx(k), x1: sx(k + 1), yTop: sy(from), yEnd: sy(from - cost) };
  });
  for (const s of steps) {
    marks.push(...along(s.x0, s.yTop, s.x1, s.yTop, 1.5));
    marks.push(...along(s.x1, s.yTop, s.x1, s.yEnd, 1.5));
  }
  for (const p of points) marks.push({ x: sx(p.consumption), y: sy(p.capital), r: POINT_R + 2 });

  const bounds: Box = { x0: left + 2, y0: LEGEND_Y + 8, x1: VIEW.width - 2, y1: bottom - 2 };
  const boxes: Box[] = [];

  // Each opportunity cost's number goes beside its drop, at the middle of it if it fits there, or by its top or bottom end.
  const legs = steps.map((s, k) => {
    const centered = (y: number) => y + (ASCENT - DESCENT) / 2;
    const mid = centered((s.yTop + s.yEnd) / 2);
    const spots: Spot[] = [
      { x: s.x1 + 5, y: mid, anchor: "start" },
      { x: s.x1 - 5, y: mid, anchor: "end" },
      { x: s.x1 + 5, y: centered(s.yEnd) + 7, anchor: "start" },
      { x: s.x1 - 5, y: centered(s.yEnd) + 7, anchor: "end" },
      { x: s.x1 + 5, y: centered(s.yTop) - 7, anchor: "start" },
      { x: s.x1, y: s.yTop - 5, anchor: "middle" },
    ];
    return { ...s, label: place(fmt(costs[k]), spots, marks, boxes, bounds) };
  });

  // Each combination's answer goes to its right if that's clear, otherwise to its left, above, below or on a diagonal.
  const gap = POINT_R + 4;
  const pointLabels = points.map((p) => {
    const x = sx(p.consumption);
    const y = sy(p.capital);
    const spots: Spot[] = [
      { x: x + gap, y: y + 4, anchor: "start" },
      { x: x - gap, y: y + 4, anchor: "end" },
      { x, y: y - gap - 2, anchor: "middle" },
      { x, y: y + gap + ASCENT, anchor: "middle" },
      { x: x + gap - 2, y: y - gap, anchor: "start" },
      { x: x + gap - 2, y: y + gap + 6, anchor: "start" },
      { x: x - gap + 2, y: y - gap, anchor: "end" },
      { x: x - gap + 2, y: y + gap + 6, anchor: "end" },
    ];
    return place(p.answer, spots, marks, boxes, bounds);
  });

  return { xEnd, yEnd, sx, sy, left, right, top, bottom, legs, pointLabels };
}

/** One piece of a line of text. A subscript piece is smaller and lower, so a label can read PPC with a small 1 after it, as AP graphs write PPC₁. */
interface Piece {
  text: string;
  fill: string;
  sub?: boolean;
  bold?: boolean;
  dx?: number;
}

function Pieces({ pieces }: { pieces: readonly Piece[] }) {
  let lowered = false;
  return (
    <>
      {pieces.map((piece, i) => {
        const dy = piece.sub && !lowered ? SUB_DY : !piece.sub && lowered ? -SUB_DY : 0;
        lowered = !!piece.sub;
        return (
          <tspan key={i} dx={piece.dx} dy={dy || undefined} fill={piece.fill} fontSize={piece.sub ? 9 : undefined} fontWeight={piece.bold ? 700 : undefined}>
            {piece.text}
          </tspan>
        );
      })}
    </>
  );
}

/** A tested combination, shaped by what describePoint called it: a filled dot for efficient, a ring for inefficient and a cross for unattainable. */
function Marker({ x, y, answer, scale }: { x: number; y: number; answer: Category; scale: number }) {
  const r = POINT_R * scale;
  if (answer === "efficient") return <circle cx={x} cy={y} r={r} fill={YOURS} />;
  if (answer === "inefficient") return <circle cx={x} cy={y} r={r} fill={color.surface} stroke={YOURS} strokeWidth={2.5} />;
  const s = r * 0.9;
  return (
    <g stroke={YOURS} strokeWidth={2.5} strokeLinecap="round">
      <line x1={x - s} y1={y - s} x2={x + s} y2={y + s} />
      <line x1={x - s} y1={y + s} x2={x + s} y2={y - s} />
    </g>
  );
}

/** The aria-label: the data and the student's answers, each true whatever the student's code returned. */
function describe(result: Possibilities): string {
  const { ppc, shifted, costs, trueCosts, growth, points } = result;
  const last = ppc[ppc.length - 1];
  let text = `Dovania's production possibilities curve, from ${fmt(ppc[0].capital)} capital goods and 0 consumption goods to ${fmt(last.capital)} capital goods and ${fmt(last.consumption)} consumption goods. The opportunity costs your loop found for each additional unit of consumption goods: ${joinAnd(costs.map(fmt))} capital goods. From one row of the table to the next, the PPC drops by ${joinAnd(trueCosts.map(fmt))} capital goods.`;
  if (shifted) {
    const end = shifted[shifted.length - 1];
    text += ` After ${fmt(growth)}% growth, the PPC shifts outward, from ${fmt(shifted[0].capital)} capital goods and 0 consumption goods to ${fmt(end.capital)} capital goods and ${fmt(end.consumption)} consumption goods.`;
  }
  if (points.length > 0) {
    const curve = shifted ? "the PPC after growth" : "the PPC";
    text += ` Your describePoint called ${joinAnd(points.map((p) => `(${fmt(p.consumption)}, ${fmt(p.capital)}) ${p.answer} (it is ${p.position} ${curve})`))}.`;
  }
  return text;
}

function Plot({ result, t }: { result: Possibilities; t: number }) {
  const { ppc, shifted, points } = result;
  const { xEnd, yEnd, sx, sy, left, right, top, bottom, legs, pointLabels } = useMemo(() => layout(result), [result]);
  const { pointsAt } = timeline(!!shifted, points.length);
  const units = ppc.length - 1;
  const perUnit = STEPS_MS / units;

  const ppcP = easeInOut(progressBetween(t, 0, PPC_MS));
  const growthP = easeInOut(progressBetween(t, GROWTH_AT, GROWTH_MS));
  const xTicks = ticks(xEnd, X_DIVISIONS);
  const yTicks = ticks(yEnd, Y_DIVISIONS);

  const legend: Piece[] = [
    { text: "—", fill: color.ink, bold: true },
    { text: " PPC", fill: color.inkMuted },
    ...(shifted
      ? [
          { text: "1", fill: color.inkMuted, sub: true },
          { text: "- -", fill: GROWN, bold: true, dx: 14 },
          { text: " PPC", fill: color.inkMuted },
          { text: "2", fill: color.inkMuted, sub: true },
          { text: " after growth", fill: color.inkMuted },
        ]
      : []),
    { text: "↓", fill: YOURS, bold: true, dx: 14 },
    { text: " Your opp. costs", fill: color.inkMuted },
  ];

  // A surface-colored outline under the letters keeps a label readable where it crosses a line.
  const outline = { stroke: color.surface, strokeWidth: 3, strokeLinejoin: "round" as const, paintOrder: "stroke" };

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
      role="img"
      aria-label={describe(result)}
    >
      <text x={VIEW.width / 2} y={LEGEND_Y} textAnchor="middle" style={type.tick}>
        <Pieces pieces={legend} />
      </text>

      {xTicks.map((v) => (
        <line key={`xgrid-${v}`} x1={sx(v)} y1={top} x2={sx(v)} y2={bottom} stroke={color.grid} />
      ))}
      {yTicks.map((v) => (
        <line key={`ygrid-${v}`} x1={left} y1={sy(v)} x2={right} y2={sy(v)} stroke={color.grid} />
      ))}

      {/* The PPC after growth: every row of the table with growth percent more of each good, drawn outside the first PPC. */}
      {shifted && growthP > 0 && (
        <polyline points={revealed(shifted, growthP, sx, sy)} fill="none" stroke={GROWN} strokeWidth={2.5} strokeDasharray="7 5" strokeLinejoin="round" />
      )}

      {/* The step for each additional unit of consumption goods: a dotted line 1 unit to the right, then the student's opportunity cost as a pink drop. A right opportunity cost drops exactly onto the next row of the table. */}
      {legs.map((leg, k) => {
        const p = progressBetween(t, STEPS_AT + k * perUnit, perUnit);
        if (p <= 0) return null;
        const stepP = easeInOut(Math.min(p / 0.4, 1));
        const dropP = easeInOut(Math.max((p - 0.4) / 0.6, 0));
        const yNow = lerp(leg.yTop, leg.yEnd, dropP);
        return (
          <g key={`leg-${k}`}>
            <line x1={leg.x0} y1={leg.yTop} x2={lerp(leg.x0, leg.x1, stepP)} y2={leg.yTop} stroke={color.inkMuted} strokeWidth={1.25} strokeDasharray="2 3" />
            {dropP > 0 && <line x1={leg.x1} y1={leg.yTop} x2={leg.x1} y2={yNow} stroke={YOURS} strokeWidth={2.5} />}
            {dropP >= 1 && <line x1={leg.x1 - CAP_HALF} y1={leg.yEnd} x2={leg.x1 + CAP_HALF} y2={leg.yEnd} stroke={YOURS} strokeWidth={2} />}
          </g>
        );
      })}

      {/* The PPC from the table, drawn from all capital goods to all consumption goods, with a dot on each row. */}
      <polyline points={revealed(ppc, ppcP, sx, sy)} fill="none" stroke={color.ink} strokeWidth={2.5} strokeLinejoin="round" />
      {ppc.map((row, i) =>
        row.consumption <= ppc[units].consumption * ppcP ? <circle key={`row-${i}`} cx={sx(row.consumption)} cy={sy(row.capital)} r={ROW_R} fill={color.ink} /> : null
      )}

      {/* Each drop's number: what the student's opportunityCosts returned for that unit. */}
      {legs.map((leg, k) => {
        const p = progressBetween(t, STEPS_AT + k * perUnit, perUnit);
        const labelP = Math.max((p - 0.4) / 0.6, 0);
        if (labelP <= 0) return null;
        return (
          <text key={`cost-${k}`} x={leg.label.x} y={leg.label.y} textAnchor={leg.label.anchor} opacity={labelP} {...outline} style={{ ...type.tick, fill: YOURS, fontWeight: 600 }}>
            {leg.label.text}
          </text>
        );
      })}

      {/* The tested combinations, each marked and labeled with what describePoint called it. */}
      {points.map((p: TestedPoint, i) => {
        const pointP = progressBetween(t, pointsAt + i * POINT_GAP, POINT_MS);
        if (pointP <= 0) return null;
        const label = pointLabels[i];
        return (
          <g key={`point-${i}`}>
            <Marker x={sx(p.consumption)} y={sy(p.capital)} answer={p.answer} scale={0.4 + 0.6 * easeInOut(pointP)} />
            <text x={label.x} y={label.y} textAnchor={label.anchor} opacity={pointP} {...outline} style={{ ...type.tick, fill: YOURS, fontWeight: 600 }}>
              {label.text}
            </text>
          </g>
        );
      })}

      <line x1={left} y1={bottom} x2={right} y2={bottom} stroke={color.axis} />
      <line x1={left} y1={top} x2={left} y2={bottom} stroke={color.axis} />
      {xTicks.map((v) => (
        <g key={`xtick-${v}`}>
          <line x1={sx(v)} y1={bottom} x2={sx(v)} y2={bottom + 5} stroke={color.axis} />
          <text x={sx(v)} y={bottom + 18} textAnchor="middle" style={type.tick}>
            {fmt(v)}
          </text>
        </g>
      ))}
      {yTicks.map((v) => (
        <text key={`ytick-${v}`} x={left - 8} y={sy(v) + 4} textAnchor="end" style={type.tick}>
          {fmt(v)}
        </text>
      ))}
      <text x={(left + right) / 2} y={bottom + 38} textAnchor="middle" style={type.axisTitle}>
        Consumption Goods
      </text>
      <text x={14} y={(top + bottom) / 2} textAnchor="middle" transform={`rotate(-90, 14, ${(top + bottom) / 2})`} style={type.axisTitle}>
        Capital Goods
      </text>
    </svg>
  );
}

const Component = observer(({ state }: { state: State }) => {
  const result = state.possibilities;
  const { lastPointAt, total } = timeline(!!result?.shifted, result?.points.length ?? 0);
  const t = useRunAnimation(result, total);

  if (!result) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Press Run to draw Dovania's production possibilities curve, the opportunity cost of each extra unit of consumption goods, and the combinations you test." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const costsShown = t >= STEPS_AT + STEPS_MS;
  const growthShown = t >= GROWTH_AT;
  const countsShown = t >= lastPointAt;

  // Your opp. costs is what the student's opportunityCosts returned, and Efficient, Inefficient and Unattainable count how many combinations their describePoint called efficient, inefficient or unattainable, right or wrong. All four are the student's, so they're pink like the drops and the markers. Growth is the percentage from their code, and it's teal once the PPC after growth is drawn.
  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <Plot result={result} t={t} />
      </PluginStage>
      <StatRow
        stats={[
          { label: "Your opp. costs", value: costsShown ? costRange(result.costs) : EMPTY, color: YOURS },
          { label: "Efficient", value: countsShown ? String(result.counts.efficient) : EMPTY, color: YOURS },
          { label: "Inefficient", value: countsShown ? String(result.counts.inefficient) : EMPTY, color: YOURS },
          { label: "Unattainable", value: countsShown ? String(result.counts.unattainable) : EMPTY, color: YOURS },
          { label: "Growth", value: growthShown ? `${fmt(result.growth)}%` : EMPTY, color: result.shifted ? GROWN : undefined },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
