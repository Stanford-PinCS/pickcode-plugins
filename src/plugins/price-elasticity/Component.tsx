import { observer } from "mobx-react-lite";
import { PAD, VIEW, niceStep } from "../../common/chart";
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
import type { Range } from "./messages";
import State, { type Walk } from "./state";

// Timeline of one run, in ms: the walk draws the demand curve one price increase at a time, each stretch in the color of the range describe gave it, while the total revenue bar at its new price rises. Then the top revenue is marked, and last each tested price increase gets its percentage changes and its revenue arrow.
const WALK_MS = 2400;
const STEP_MAX_MS = 420;
const TOP_DELAY_MS = 150;
const TOP_MS = 300;
const RAISE_DELAY_MS = 350;
const RAISE_MS = 500;

// Layout, in the shared VIEW width. The demand curve sits on top and the total revenue bars below it, on the same quantity scale. The left edge leaves room for dollar ticks of up to six characters, like $3,000, or $48K on an axis that reaches $10,000, whose graph writes every amount in short form.
const LEFT = PAD.left + 16;
const RIGHT = VIEW.width - PAD.right;
const LEGEND_Y = 14;
const DEMAND_TOP = 34;
const DEMAND_BOTTOM = 206;
const REVENUE_TOP = 250;
const REVENUE_BOTTOM = 372;
const HEIGHT = REVENUE_BOTTOM + 48;
const POINT_R = 3.5;
const LABEL_GAP = 14;
const BRACKET_INSET = 6;
const ARROW_LIFT = 24;
/** The least room between two revenue labels side by side, and how far apart two labels one above the other must be: the tick font's digits stand about 8 px tall. */
const BAR_LABEL_SPACE = 4;
const BAR_LABEL_HEIGHT = 10;

const RANGE_COLOR: Record<Range, string> = {
  elastic: color.series[0],
  "unit elastic": color.series[3],
  inelastic: color.series[1],
};

/** A number with at most two decimals and no trailing zeros, written with a true minus sign. A number that isn't 0 but would round to 0 that way keeps two significant digits instead, like 0.0014. */
const fmt = (v: number) => String(Number(v !== 0 && Math.abs(v) < 0.005 ? v.toPrecision(2) : v.toFixed(2))).replace(/-/g, "−");

/** Dollars with thousands separators, like $2,400 or −$450, with cents only when the amount isn't a whole number of dollars, like $12.50. */
function money(v: number): string {
  const cents = Math.round(Math.abs(v) * 100);
  if (cents === 0) return "$0";
  const digits = (cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 });
  return `${v < 0 ? "−" : ""}$${digits}`;
}

/** Dollars in short form, like $5K, $48K or $2.25M, for a graph whose axis reaches $10,000. An amount under $1,000 has no short form, so it's written as money writes it, like $450 or $12.50. */
function moneyShort(v: number): string {
  if (Math.round(Math.abs(v) * 100) < 100000) return money(v);
  const digits = Math.abs(v).toLocaleString("en-US", { notation: "compact", maximumSignificantDigits: 3 });
  return `${v < 0 ? "−" : ""}$${digits}`;
}

/** A change in dollars with its sign, like +$450 or −$450, written by `write`. */
const moneyChange = (v: number, write: (v: number) => string = money) => (v > 0 && write(v) !== "$0" ? `+${write(v)}` : write(v));

/** A quantity with thousands separators, like 20,000. */
const count = (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 2 });

/** A quantity in short form, like 500K or 1.5M. */
const countShort = (v: number) => v.toLocaleString("en-US", { notation: "compact", maximumSignificantDigits: 3 });

/** About how wide a label in the tick font is: each character of its monospace font is 0.6 em wide. */
const tickWidth = (text: string) => text.length * type.tick.fontSize * 0.6;

/** A label for a bar: the middle of its baseline, and its text. */
interface BarLabel {
  x: number;
  y: number;
  text: string;
}

/** Which bars get their total revenue written above them. Bars are tried in `order`, and each gets its label only where it clears every label already placed, side by side or one above the other; the first always gets its label. So labels on crowded bars never run together. */
function labeledBars(labels: readonly BarLabel[], order: readonly number[]): Set<number> {
  const placed = new Set<number>();
  const clear = (a: BarLabel, b: BarLabel) =>
    Math.abs(a.x - b.x) >= (tickWidth(a.text) + tickWidth(b.text)) / 2 + BAR_LABEL_SPACE || Math.abs(a.y - b.y) >= BAR_LABEL_HEIGHT;
  for (const j of order) {
    if (placed.has(j)) continue;
    if (placed.size === 0 || [...placed].every((k) => clear(labels[j], labels[k]))) placed.add(j);
  }
  return placed;
}

/** A percentage change with its sign and at most one decimal, like +50% or −16.7%. */
function percent(v: number): string {
  const digits = String(Number(Math.abs(v).toFixed(1)));
  if (digits === "0") return "0%";
  return `${v < 0 ? "−" : "+"}${digits}%`;
}

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

interface Axis {
  end: number;
  ticks: number[];
}

/** A scale from 0 to past the largest value, on round tick steps, leaving `room` (a fraction of the largest value) above it. */
function axisTo(max: number, divisions: number, room: number): Axis {
  const top = max * (1 + room);
  const step = niceStep(top, divisions);
  const end = Math.ceil(top / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= end + step * 1e-9; v += step) ticks.push(Number(v.toFixed(10)));
  return { end, ticks };
}

/** The total revenue graph's scale, with room above the top bar for its label. */
const revenueAxis = (walk: Walk) => axisTo(walk.topRevenue, 3, 0.2);

/** How a graph writes its dollar amounts, chosen once from its axis so that no tick or label is in full next to one in short form: in short form when the axis reaches $10,000, where a full tick like $10,000 gets too wide, and in full below that. */
const moneyFor = (axis: Axis) => (axis.end >= 10000 ? moneyShort : money);

/** How the quantity axis writes its ticks, chosen once for the whole axis in the same way: in short form when it reaches a million, and in full below that. */
const countFor = (axis: Axis) => (axis.end >= 1e6 ? countShort : count);

/** A filled arrowhead with its tip at (x, y), pointing along the unit vector (ux, uy). */
function arrowHead(x: number, y: number, ux: number, uy: number, size: number): string {
  const bx = x - ux * size;
  const by = y - uy * size;
  const wx = -uy * size * 0.5;
  const wy = ux * size * 0.5;
  return `M ${x} ${y} L ${bx + wx} ${by + wy} L ${bx - wx} ${by - wy} Z`;
}

interface Timing {
  /** How long each stretch of the walk takes. */
  step: number;
  walkEnd: number;
  topAt: number;
  raiseAt: number;
  total: number;
}

function timingFor(walk: Walk): Timing {
  const step = Math.min(STEP_MAX_MS, WALK_MS / walk.stretches.length);
  const walkEnd = step * walk.stretches.length;
  const topAt = walkEnd + TOP_DELAY_MS;
  const raiseAt = topAt + TOP_MS + RAISE_DELAY_MS;
  const total = walk.stretches.some((s) => s.tested) ? raiseAt + RAISE_MS : topAt + TOP_MS;
  return { step, walkEnd, topAt, raiseAt, total };
}

/** The data in words, for screen readers. */
function describeWalk(walk: Walk): string {
  const { prices, revenues, stretches } = walk;
  const between = (i: number) => `${money(prices[i])} to ${money(prices[i + 1])}`;
  const each = stretches.map((s) => `${between(s.index)}, ${fmt(s.elasticity)}, ${s.range}`);
  const tops = walk.topPoints.map((j) => money(prices[j])).join(" and ");
  const tested = stretches
    .filter((s) => s.tested)
    .map((s) => `${between(s.index)}: price ${percent(s.percentPrice)}, quantity ${percent(s.percentQuantity)}, total revenue ${moneyChange(s.revenueChange)}`);
  return (
    `Demand curve through ${prices.length} prices. Your elasticity and range for each price increase: ${each.join("; ")}. ` +
    `Total revenue at each price: ${revenues.map(money).join(", ")}; the highest is ${money(walk.topRevenue)}, at ${tops}.` +
    (tested.length > 0 ? ` Tested price increases: ${tested.join("; ")}.` : "")
  );
}

function Plot({ walk, t, timing }: { walk: Walk; t: number; timing: Timing }) {
  const { prices, quantities, revenues, stretches } = walk;
  const qAxis = axisTo(Math.max(...quantities), 5, 0.08);
  const pAxis = axisTo(Math.max(...prices), 4, 0.05);
  const rAxis = revenueAxis(walk);
  const writePrice = moneyFor(pAxis);
  const writeRevenue = moneyFor(rAxis);
  const writeCount = countFor(qAxis);
  const sx = (q: number) => LEFT + (q / qAxis.end) * (RIGHT - LEFT);
  const sy = (p: number) => DEMAND_BOTTOM - (p / pAxis.end) * (DEMAND_BOTTOM - DEMAND_TOP);
  const sr = (r: number) => REVENUE_BOTTOM - (r / rAxis.end) * (REVENUE_BOTTOM - REVENUE_TOP);

  const points = prices.map((p, i) => ({ x: sx(quantities[i]), y: sy(p) }));
  let gap = Infinity;
  for (let i = 0; i + 1 < points.length; i++) gap = Math.min(gap, Math.abs(points[i + 1].x - points[i].x));
  const barWidth = Math.max(4, Math.min(34, gap * 0.55));

  // Stretch i draws during step i of the walk, and the bar at its new price rises with it. The first bar rises with the first stretch.
  const drawP = (i: number) => easeInOut(progressBetween(t, i * timing.step, timing.step * 0.75));
  const settleP = (i: number) => progressBetween(t, (i + 0.75) * timing.step, timing.step * 0.25);
  const barP = (j: number) => drawP(Math.max(j - 1, 0));
  const topP = progressBetween(t, timing.topAt, TOP_MS);
  const raiseP = easeInOut(progressBetween(t, timing.raiseAt, RAISE_MS * 0.7));
  const raiseLabelP = progressBetween(t, timing.raiseAt + RAISE_MS * 0.6, RAISE_MS * 0.4);
  const tops = new Set(walk.topPoints);
  const tested = stretches.filter((s) => s.tested);
  // Each bar's total revenue is written above it where there's room: the top revenue first, then both ends of each tested price increase, then the other bars from the lowest price up.
  const barLabels = revenues.map((r, j) => ({ x: points[j].x, y: sr(r) - 5, text: writeRevenue(r) }));
  const labeled = labeledBars(barLabels, [...walk.topPoints, ...tested.flatMap((s) => [s.index, s.index + 1]), ...revenues.keys()]);

  // Each stretch's direction, and the side of it that faces up (or right, for a vertical stretch), where its elasticity goes.
  const geometry = stretches.map((s) => {
    const a = points[s.index];
    const b = points[s.index + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    let nx = -(b.y - a.y) / len;
    let ny = (b.x - a.x) / len;
    if (ny > 0 || (ny === 0 && nx < 0)) {
      nx = -nx;
      ny = -ny;
    }
    return { a, b, nx, ny, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
  });

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
      role="img"
      aria-label={describeWalk(walk)}
    >
      <text x={VIEW.width / 2} y={LEGEND_Y} textAnchor="middle" style={type.tick}>
        <tspan fill={RANGE_COLOR.elastic}>■</tspan>
        <tspan> Elastic</tspan>
        <tspan dx={14} fill={RANGE_COLOR["unit elastic"]}>■</tspan>
        <tspan> Unit elastic</tspan>
        <tspan dx={14} fill={RANGE_COLOR.inelastic}>■</tspan>
        <tspan> Inelastic</tspan>
        <tspan dx={14} fill={color.reference}>¦</tspan>
        <tspan> Top revenue</tspan>
      </text>

      {qAxis.ticks.map((q) => (
        <g key={`qgrid-${q}`} stroke={color.grid}>
          <line x1={sx(q)} y1={DEMAND_TOP} x2={sx(q)} y2={DEMAND_BOTTOM} />
          <line x1={sx(q)} y1={REVENUE_TOP} x2={sx(q)} y2={REVENUE_BOTTOM} />
        </g>
      ))}
      {pAxis.ticks.map((p) => (
        <line key={`pgrid-${p}`} x1={LEFT} y1={sy(p)} x2={RIGHT} y2={sy(p)} stroke={color.grid} />
      ))}
      {rAxis.ticks.map((r) => (
        <line key={`rgrid-${r}`} x1={LEFT} y1={sr(r)} x2={RIGHT} y2={sr(r)} stroke={color.grid} />
      ))}

      <text x={RIGHT - 4} y={DEMAND_TOP + 12} textAnchor="end" style={type.tick}>
        Number: your elasticity · Color: your describe
      </text>

      {/* Total revenue at each price, rising as the walk reaches it. */}
      {revenues.map((r, j) => {
        const p = barP(j);
        if (p <= 0) return null;
        const top = sr(r * p);
        const marked = tops.has(j) && topP > 0;
        return (
          <g key={`bar-${j}`}>
            <rect x={points[j].x - barWidth / 2} y={top} width={barWidth} height={REVENUE_BOTTOM - top} fill={color.inkMuted} fillOpacity={0.16} stroke={color.inkMuted} strokeWidth={1} />
            {marked && (
              <rect x={points[j].x - barWidth / 2} y={top} width={barWidth} height={REVENUE_BOTTOM - top} fill="none" stroke={color.reference} strokeWidth={2} strokeDasharray="5 3" opacity={topP} />
            )}
            {p >= 1 && labeled.has(j) && (
              <text x={points[j].x} y={top - 5} textAnchor="middle" style={{ ...type.tick, fill: marked ? color.reference : color.inkMuted, fontWeight: marked ? 600 : 400 }}>
                {barLabels[j].text}
              </text>
            )}
          </g>
        );
      })}

      {/* Where the top revenue is on the demand curve: a dashed line up from its bar, and across to its price. */}
      {topP > 0 &&
        walk.topPoints.map((j) => (
          <g key={`top-${j}`} stroke={color.reference} strokeWidth={1.5} strokeDasharray="5 4" opacity={topP}>
            <line x1={points[j].x} y1={sr(revenues[j]) - 18} x2={points[j].x} y2={points[j].y + POINT_R} />
            <line x1={LEFT} y1={points[j].y} x2={points[j].x - POINT_R} y2={points[j].y} />
          </g>
        ))}

      {/* Each tested price increase: guides from its two points to the axes, and brackets on the axes with the percentage changes in price and in quantity demanded. */}
      {raiseP > 0 &&
        tested.map((s) => {
          const { a, b } = geometry[s.index];
          const stroke = RANGE_COLOR[s.range];
          const bracketX = LEFT + BRACKET_INSET;
          const bracketY = DEMAND_BOTTOM - BRACKET_INSET;
          const priceEnd = lerp(a.y, b.y, raiseP);
          const quantityEnd = lerp(a.x, b.x, raiseP);
          const up = Math.sign(b.y - a.y) || 1;
          const across = Math.sign(b.x - a.x) || 1;
          return (
            <g key={`guides-${s.index}`}>
              <g stroke={stroke} strokeWidth={1} strokeDasharray="3 4" opacity={0.6 * raiseP}>
                <line x1={LEFT} y1={a.y} x2={a.x} y2={a.y} />
                <line x1={LEFT} y1={b.y} x2={b.x} y2={b.y} />
                <line x1={a.x} y1={a.y} x2={a.x} y2={DEMAND_BOTTOM} />
                <line x1={b.x} y1={b.y} x2={b.x} y2={DEMAND_BOTTOM} />
              </g>
              <g stroke={stroke} strokeWidth={2}>
                <line x1={bracketX} y1={a.y} x2={bracketX} y2={priceEnd - up * 4 * raiseP} />
                <line x1={a.x} y1={bracketY} x2={quantityEnd - across * 4 * raiseP} y2={bracketY} />
              </g>
              {raiseP >= 1 && (
                <g fill={stroke}>
                  <path d={arrowHead(bracketX, b.y, 0, up, 7)} />
                  <path d={arrowHead(b.x, bracketY, across, 0, 7)} />
                </g>
              )}
              {/* A stroke in the background color behind each letter keeps a percentage readable where a guide line runs under it. */}
              <g opacity={raiseLabelP} stroke={color.surface} strokeWidth={3} strokeLinejoin="round" paintOrder="stroke" style={{ ...type.tick, fill: stroke, fontWeight: 600 }}>
                <text x={bracketX + 6} y={(a.y + b.y) / 2 + 4} textAnchor="start">
                  {percent(s.percentPrice)}
                </text>
                <text x={(a.x + b.x) / 2} y={bracketY - 6} textAnchor="middle">
                  {percent(s.percentQuantity)}
                </text>
              </g>
            </g>
          );
        })}

      {/* The demand curve, one stretch at a time, each in the color of the range describe gave it. A tested stretch gets a wide pale band behind it. */}
      {stretches.map((s, i) => {
        const p = drawP(i);
        if (p <= 0) return null;
        const { a, b } = geometry[i];
        const stroke = RANGE_COLOR[s.range];
        return (
          <g key={`stretch-${i}`}>
            {s.tested && raiseP > 0 && <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={stroke} strokeOpacity={0.22 * raiseP} strokeWidth={12} strokeLinecap="round" />}
            <line x1={a.x} y1={a.y} x2={lerp(a.x, b.x, p)} y2={lerp(a.y, b.y, p)} stroke={stroke} strokeWidth={3.5} strokeLinecap="round" />
          </g>
        );
      })}
      {points.map((pt, j) =>
        j === 0 || settleP(j - 1) > 0 ? <circle key={`point-${j}`} cx={pt.x} cy={pt.y} r={POINT_R} fill={color.surface} stroke={color.ink} strokeWidth={1.5} /> : null,
      )}
      {/* The demand curve's label, just past its lower right end at the lowest price, as on an AP graph. The walk starts there, so it shows from the first frame. */}
      <text x={points[0].x + 8} y={points[0].y + 4} textAnchor="start" style={type.axisTitle}>
        D
      </text>
      {stretches.map((s, i) => {
        const p = settleP(i);
        if (p <= 0) return null;
        const g = geometry[i];
        return (
          <text key={`elasticity-${i}`} x={g.mx + g.nx * LABEL_GAP} y={g.my + g.ny * LABEL_GAP + 4} textAnchor="middle" opacity={p} style={{ ...type.tick, fill: RANGE_COLOR[s.range], fontWeight: 600 }}>
            {fmt(s.elasticity)}
          </text>
        );
      })}

      {/* Each tested price increase moves total revenue from one bar to the next. */}
      {raiseP > 0 &&
        tested.map((s) => {
          const x1 = points[s.index].x;
          const x2 = points[s.index + 1].x;
          const y1 = sr(revenues[s.index]) - ARROW_LIFT;
          const y2 = sr(revenues[s.index + 1]) - ARROW_LIFT;
          const len = Math.hypot(x2 - x1, y2 - y1) || 1;
          const ux = (x2 - x1) / len;
          const uy = (y2 - y1) / len;
          const stroke = RANGE_COLOR[s.range];
          return (
            <g key={`revenue-${s.index}`}>
              <line x1={x1} y1={y1} x2={lerp(x1, x2, raiseP) - ux * 5 * raiseP} y2={lerp(y1, y2, raiseP) - uy * 5 * raiseP} stroke={stroke} strokeWidth={2} />
              {raiseP >= 1 && <path d={arrowHead(x2, y2, ux, uy, 8)} fill={stroke} />}
              <text x={(x1 + x2) / 2} y={Math.min(y1, y2) - 6} textAnchor="middle" opacity={raiseLabelP} style={{ ...type.tick, fill: stroke, fontWeight: 600 }}>
                {moneyChange(s.revenueChange, writeRevenue)}
              </text>
            </g>
          );
        })}

      <g stroke={color.axis}>
        <line x1={LEFT} y1={DEMAND_TOP} x2={LEFT} y2={DEMAND_BOTTOM} />
        <line x1={LEFT} y1={DEMAND_BOTTOM} x2={RIGHT} y2={DEMAND_BOTTOM} />
        <line x1={LEFT} y1={REVENUE_TOP} x2={LEFT} y2={REVENUE_BOTTOM} />
        <line x1={LEFT} y1={REVENUE_BOTTOM} x2={RIGHT} y2={REVENUE_BOTTOM} />
      </g>
      {pAxis.ticks.map((p) => (
        <text key={`price-${p}`} x={LEFT - 7} y={sy(p) + 4} textAnchor="end" style={type.tick}>
          {writePrice(p)}
        </text>
      ))}
      {rAxis.ticks.map((r) => (
        <text key={`revenue-tick-${r}`} x={LEFT - 7} y={sr(r) + 4} textAnchor="end" style={type.tick}>
          {writeRevenue(r)}
        </text>
      ))}
      {qAxis.ticks.map((q) => (
        <g key={`quantity-${q}`}>
          <line x1={sx(q)} y1={DEMAND_BOTTOM} x2={sx(q)} y2={DEMAND_BOTTOM + 4} stroke={color.axis} />
          <line x1={sx(q)} y1={REVENUE_BOTTOM} x2={sx(q)} y2={REVENUE_BOTTOM + 5} stroke={color.axis} />
          <text x={sx(q)} y={REVENUE_BOTTOM + 19} textAnchor="middle" style={type.tick}>
            {writeCount(q)}
          </text>
        </g>
      ))}
      <text x={(LEFT + RIGHT) / 2} y={REVENUE_BOTTOM + 42} textAnchor="middle" style={type.axisTitle}>
        Quantity (tickets per show)
      </text>
      <text x={14} y={(DEMAND_TOP + DEMAND_BOTTOM) / 2} textAnchor="middle" transform={`rotate(-90, 14, ${(DEMAND_TOP + DEMAND_BOTTOM) / 2})`} style={type.axisTitle}>
        Price ($ per ticket)
      </text>
      <text x={14} y={(REVENUE_TOP + REVENUE_BOTTOM) / 2} textAnchor="middle" transform={`rotate(-90, 14, ${(REVENUE_TOP + REVENUE_BOTTOM) / 2})`} style={type.axisTitle}>
        Total revenue ($)
      </text>
    </svg>
  );
}

const Component = observer(({ state }: { state: State }) => {
  const walk = state.walk;
  const timing = walk ? timingFor(walk) : null;
  const t = useRunAnimation(walk, timing?.total ?? 0);

  if (!walk || !timing) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Press Run to walk up a theater's demand curve and see the price elasticity of demand and the total revenue at each price." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const walked = t >= timing.walkEnd;
  const topShown = t >= timing.topAt;
  const span = fmt(walk.lowest) === fmt(walk.highest) ? fmt(walk.lowest) : `${fmt(walk.lowest)} to ${fmt(walk.highest)}`;
  // Written as the revenue graph writes it, so it matches the top bar's label.
  const topRevenue = moneyFor(revenueAxis(walk))(walk.topRevenue);

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <Plot walk={walk} t={t} timing={timing} />
      </PluginStage>
      <StatRow
        stats={[
          { label: "Elasticity", value: walked ? span : EMPTY },
          { label: "Elastic", value: walked ? String(walk.counts.elastic) : EMPTY, color: RANGE_COLOR.elastic },
          { label: "Unit Elastic", value: walked ? String(walk.counts["unit elastic"]) : EMPTY, color: RANGE_COLOR["unit elastic"] },
          { label: "Inelastic", value: walked ? String(walk.counts.inelastic) : EMPTY, color: RANGE_COLOR.inelastic },
          { label: "Top Revenue", value: topShown ? topRevenue : EMPTY, color: color.reference },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
