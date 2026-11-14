import { observer } from "mobx-react-lite";
import { useId } from "react";
import { VIEW, makeScales, niceStep, ticks } from "../../common/chart";
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
import State, { quantityAt, type Direction, type Line, type Market } from "./state";

// Timeline of one run, in ms: supply and the first demand curve draw in from left to right, and their equilibrium appears. Then the loop in pricesInQuors prices the exports at that exchange rate, one row at a time. When the demand for pells shifted, the new demand curve slides out from the first, the shortage or surplus at the old exchange rate appears, the equilibrium moves along the supply curve to the new exchange rate, and each export's price slides to its price at the new rate.
const DRAW_MS = 700;
const POINT_AT = 750;
const POINT_MS = 350;
const ROWS_AT = 1150;
const ROW_GAP = 130;
const ROW_MS = 280;
const SHIFT_MS = 550;
const GAP_MS = 250;
const MOVE_MS = 450;
const AFTER_GAP = 90;
const AFTER_MS = 320;

interface Timing {
  rowAt: (i: number) => number;
  shiftAt: number;
  gapAt: number;
  moveAt: number;
  /** When the exchange rate after the shift shows: when the equilibrium lands on it, or as soon as the first equilibrium appears when nothing shifted. */
  settledAt: number;
  afterAt: (i: number) => number;
  total: number;
}

function timingFor(market: Market): Timing {
  const last = market.prices.length - 1;
  const rowAt = (i: number) => ROWS_AT + i * ROW_GAP;
  const rowsEnd = rowAt(last) + ROW_MS;
  if (!market.shifted) {
    return { rowAt, shiftAt: Infinity, gapAt: Infinity, moveAt: Infinity, settledAt: POINT_AT + POINT_MS, afterAt: () => Infinity, total: rowsEnd };
  }
  const shiftAt = rowsEnd + 100;
  const gapAt = shiftAt + SHIFT_MS + 50;
  const moveAt = gapAt + GAP_MS + 50;
  const settledAt = moveAt + MOVE_MS;
  const afterAt = (i: number) => settledAt + 50 + i * AFTER_GAP;
  return { rowAt, shiftAt, gapAt, moveAt, settledAt, afterAt, total: afterAt(last) + AFTER_MS };
}

// Layout, in the shared VIEW width. The foreign exchange market for the pell sits on top. Under it, one row per export: its price in pells on the left, its prices in quors as marks along one axis, and the student's prices in quors written out on the right.
const LEFT = 70;
const RIGHT = VIEW.width - 98;
const M_TOP = 14;
const M_BOTTOM = 176;
const KEY_Y = 240;
const P_TOP = 250;
const P_BOTTOM = 352;
const HEIGHT = P_BOTTOM + 46;
const ROW_MAX = 26;
const VALUE_X = RIGHT + 10;
const LABEL_GAP = 14;
const LINE_HEIGHT = 13;
const SUB_DY = 3;
const MARK_HALF = 10;
const DOT_R = 5;

/** A number with at most `digits` decimals, no trailing zeros, thousands separators and a true minus sign, like 1,250, 62.5 or −100. */
function fmt(v: number, digits = 2): string {
  const rounded = Number(v.toFixed(digits)) || 0;
  return rounded.toLocaleString("en-US", { maximumFractionDigits: digits }).replace("-", "−");
}

/** An exchange rate in quors per pell, with up to three decimals so that a small move in it still shows. */
const fmtRate = (v: number) => fmt(v, 3);

/** A price in quors: as fmt writes it, with two significant digits below 0.01 so that a small price doesn't read as 0, like 0.0033, or in short form from 10,000 up, like 12.5K or 1.25M, so it fits beside the graph. */
function fmtQuors(v: number): string {
  if (v !== 0 && Math.abs(v) < 0.01) return String(Number(v.toPrecision(2)));
  if (Math.abs(v) < 10000) return fmt(v);
  return v.toLocaleString("en-US", { notation: "compact", maximumSignificantDigits: 3 });
}

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** The smallest multiple of a round tick step that is at least `v`. */
function roundUp(v: number, divisions: number): number {
  const step = niceStep(v, divisions);
  return Math.ceil(v / step - 1e-9) * step;
}

/** One piece of a label's text. A subscript piece is smaller and lower, so a label can read e with a small 1 after it, as AP graphs write e₁. `dx` adds space before a piece. */
interface Piece {
  text: string;
  sub?: boolean;
  fill?: string;
  dx?: number;
}

/** A label's pieces as tspans. A piece after a subscript moves back up to the baseline, so text that follows a subscript, like the rest of the key line, stays level. */
function Pieces({ pieces }: { pieces: readonly Piece[] }) {
  let lowered = false;
  return (
    <>
      {pieces.map((piece, i) => {
        const dy = piece.sub && !lowered ? SUB_DY : !piece.sub && lowered ? -SUB_DY : 0;
        lowered = !!piece.sub;
        return (
          <tspan key={i} dx={piece.dx} dy={dy || undefined} fill={piece.fill} fontSize={piece.sub ? 9 : undefined}>
            {piece.text}
          </tspan>
        );
      })}
    </>
  );
}

const symbol = (base: string, index: string, fill?: string, rest = ""): Piece[] => [
  { text: base, fill },
  { text: index, sub: true, fill },
  ...(rest ? [{ text: rest, fill }] : []),
];

/** A point on the market graph: a quantity in millions of pells a day and an exchange rate in quors per pell. */
interface Point {
  q: number;
  e: number;
}

/** The market graph's axes, from 0. The exchange rate axis reaches past 1.6 times the higher equilibrium rate. The curves are drawn from 10% to 90% of its height, as on an AP graph, where they don't touch the axes, and the quantity axis reaches past every curve. */
function marketAxes(market: Market) {
  const rateTop = roundUp(Math.max(market.rateBefore, market.rateAfter) * 1.6, 4);
  const low = rateTop * 0.1;
  const high = rateTop * 0.9;
  const widest = Math.max(quantityAt(market.demand, low), quantityAt(market.demandAfter, low), quantityAt(market.supply, high), 1);
  const quantityTop = roundUp(widest * 1.1, 4);
  return { rateTop, low, high, quantityTop, rateTicks: ticks(rateTop, 4), quantityTicks: ticks(quantityTop, 4) };
}

/** The part of a line the graph draws: from exchange rate `low` to `high`, cut short where its quantity would leave the axis. The first point has the lower exchange rate. */
function segment(line: Line, low: number, high: number, quantityTop: number): [Point, Point] | null {
  const rateFor = (q: number) => (q - line.atZero) / line.slope;
  const from = Math.max(low, Math.min(rateFor(0), rateFor(quantityTop)));
  const to = Math.min(high, Math.max(rateFor(0), rateFor(quantityTop)));
  if (to <= from) return null;
  return [
    { q: quantityAt(line, from), e: from },
    { q: quantityAt(line, to), e: to },
  ];
}

/** The axis for the prices in quors: from 0 past every price the rows show. */
function priceAxis(market: Market) {
  const shown = [...market.pricesBefore, ...market.correctBefore, ...(market.shifted ? [...market.pricesAfter, ...market.correctAfter] : [])];
  const top = roundUp(Math.max(...shown, 1), 4);
  return { top, ticks: ticks(top, 4) };
}

const MOVE_WORD: Record<Direction, string> = { up: "appreciation", down: "depreciation", none: "" };
const NET_EXPORTS: Record<Direction, string> = { up: "Increase", down: "Decrease", none: "No change" };

/** The svg's aria-label: the data in words, for screen readers. */
function ariaLabelFor(market: Market): string {
  const list = (values: readonly number[]) => values.map(fmtQuors).join(", ");
  let text = `Foreign exchange market for the pell. Demand D1 and supply S cross at an exchange rate e1 of ${fmtRate(market.rateBefore)} quors per pell, where ${fmt(market.quantityBefore)} million pells a day are demanded and supplied.`;
  if (market.shifted) {
    const gap = market.gapAtOldRate;
    text += ` Demand shifts ${market.shift > 0 ? "right" : "left"} by ${fmt(Math.abs(market.shift))} million pells a day to D2, which leaves a ${gap > 0 ? "shortage" : "surplus"} of ${fmt(Math.abs(gap))} million pells a day at ${fmtRate(market.rateBefore)} quors per pell. The new equilibrium e2 is ${fmtRate(market.rateAfter)} quors per pell, ${market.rateMove === "up" ? "an appreciation" : "a depreciation"} of the pell.`;
  }
  text += ` Exports that sell for ${market.prices.map((p) => fmt(p)).join(", ")} pells: your prices in quors at e1 are ${list(market.pricesBefore)}, and the correct ones are ${list(market.correctBefore)}.`;
  if (market.shifted) text += ` At e2 your prices are ${list(market.pricesAfter)}, and the correct ones are ${list(market.correctAfter)}.`;
  return `${text} ${market.rightCount} of ${market.prices.length} exports priced right.`;
}

function Plot({ market, t, timing }: { market: Market; t: number; timing: Timing }) {
  const clipId = `fx-${useId().replace(/:/g, "")}`;
  const axes = marketAxes(market);
  // The svg is taller than the shared VIEW, but the scales only need each graph's edges, so each bottom padding is measured from VIEW's height.
  const { sx, sy } = makeScales(axes.quantityTop, axes.rateTop, VIEW, { top: M_TOP, right: VIEW.width - RIGHT, bottom: VIEW.height - M_BOTTOM, left: LEFT });
  const prices = priceAxis(market);
  const px = makeScales(prices.top, 1, VIEW, { top: P_TOP, right: VIEW.width - RIGHT, bottom: VIEW.height - P_BOTTOM, left: LEFT }).sx;
  const { rateBefore, rateAfter, supply, demand } = market;
  const teal = color.series[1];
  const purple = color.series[3];
  const pink = color.series[0];
  const ink = color.ink;

  const reveal = easeInOut(progressBetween(t, 0, DRAW_MS));
  const pointP = progressBetween(t, POINT_AT, POINT_MS);
  const shiftP = easeInOut(progressBetween(t, timing.shiftAt, SHIFT_MS));
  const gapP = progressBetween(t, timing.gapAt, GAP_MS);
  const moveP = easeInOut(progressBetween(t, timing.moveAt, MOVE_MS));
  const settled = market.shifted && t >= timing.settledAt;

  // This frame's second demand curve, sliding out from the first by the shift.
  const sliding: Line = { atZero: demand.atZero + market.shift * shiftP, slope: demand.slope };
  const supplyLine = segment(supply, axes.low, axes.high, axes.quantityTop);
  const demandLine = segment(demand, axes.low, axes.high, axes.quantityTop);
  const slidingLine = market.shifted && t >= timing.shiftAt ? segment(sliding, axes.low, axes.high, axes.quantityTop) : null;
  const ends = (points: [Point, Point]) => ({ x1: sx(points[0].q), y1: sy(points[0].e), x2: sx(points[1].q), y2: sy(points[1].e) });

  const first: Point = { q: market.quantityBefore, e: rateBefore };
  const movingRate = lerp(rateBefore, rateAfter, moveP);
  const moving: Point = { q: quantityAt(supply, movingRate), e: movingRate };
  const second: Point = { q: market.quantityAfter, e: rateAfter };

  const guides = (point: Point, p: number) => {
    const reach = easeInOut(Math.min(p / 0.7, 1));
    const x = sx(point.q);
    const y = sy(point.e);
    return (
      <g stroke={color.inkMuted} strokeWidth={1.5} strokeDasharray="4 4">
        <line x1={LEFT} y1={y} x2={LEFT + (x - LEFT) * reach} y2={y} />
        <line x1={x} y1={M_BOTTOM} x2={x} y2={M_BOTTOM + (y - M_BOTTOM) * reach} />
      </g>
    );
  };

  // The e labels sit just inside the exchange rate axis, next to their guide lines. Each goes on the side of its guide away from the other guide, so neither sits between the two, unless the graph has no room on that side. The e₂ label has a second line that says whether the pell appreciated or depreciated.
  const eLabels: { lines: Piece[][]; y: number; step: number; show: number }[] = [];
  const place = (e: number, lines: number, up: boolean) => {
    const nearAbove = sy(e) - 5;
    const nearBelow = sy(e) + 13;
    const fitsAbove = nearAbove - (lines - 1) * LINE_HEIGHT - 10 >= M_TOP;
    const fitsBelow = nearBelow + (lines - 1) * LINE_HEIGHT + 3 <= M_BOTTOM - 2;
    return (up ? fitsAbove || !fitsBelow : fitsAbove && !fitsBelow) ? { y: nearAbove, step: -LINE_HEIGHT } : { y: nearBelow, step: LINE_HEIGHT };
  };
  if (pointP > 0) eLabels.push({ lines: [symbol("e", "1", ink, ` = ${fmtRate(rateBefore)}`)], ...place(rateBefore, 1, market.rateMove !== "up"), show: pointP });
  if (settled) {
    const lines = [symbol("e", "2", ink, ` = ${fmtRate(rateAfter)}`), [{ text: `(${MOVE_WORD[market.rateMove]})`, fill: ink }]];
    eLabels.push({ lines, ...place(rateAfter, 2, market.rateMove === "up"), show: 1 });
  }

  // The Q labels sit under the quantity axis. Two that would overlap are pushed apart from their midpoint.
  const qLabels: { x: number; anchor: "middle" | "start" | "end"; pieces: Piece[] }[] = [];
  if (pointP > 0) qLabels.push({ x: sx(first.q), anchor: "middle", pieces: symbol("Q", "1", ink) });
  if (settled) {
    const x1 = sx(first.q);
    const x2 = sx(second.q);
    if (Math.abs(x1 - x2) < 24) {
      const mid = (x1 + x2) / 2;
      qLabels[0] = { x: x1 < x2 ? Math.min(x1, mid - 3) : Math.max(x1, mid + 3), anchor: x1 < x2 ? "end" : "start", pieces: qLabels[0].pieces };
      qLabels.push({ x: x2 < x1 ? Math.min(x2, mid - 3) : Math.max(x2, mid + 3), anchor: x2 < x1 ? "end" : "start", pieces: symbol("Q", "2", ink) });
    } else {
      qLabels.push({ x: x2, anchor: "middle", pieces: symbol("Q", "2", ink) });
    }
  }

  // Each curve's label, just past its end, as on an AP graph: S at its upper end, each D at its lower end. Two D labels closer than a label's width stack one above the other.
  const curveLabels: { x: number; y: number; pieces: Piece[] }[] = [];
  if (reveal >= 1 && supplyLine) curveLabels.push({ x: sx(supplyLine[1].q) + 6, y: sy(supplyLine[1].e) + 4, pieces: [{ text: "S", fill: purple }] });
  if (reveal >= 1 && demandLine) curveLabels.push({ x: sx(demandLine[0].q) + 6, y: sy(demandLine[0].e) + 4, pieces: symbol("D", "1", teal) });
  if (slidingLine && shiftP >= 1) {
    const x = sx(slidingLine[0].q) + 6;
    let y = sy(slidingLine[0].e) + 4;
    if (demandLine && Math.abs(x - (sx(demandLine[0].q) + 6)) < 22) y -= LABEL_GAP;
    curveLabels.push({ x, y, pieces: symbol("D", "2", teal) });
  }

  // An arrow from the first demand curve to the second, above both equilibria, where the supply curve isn't between them.
  const arrowRate = (Math.max(rateBefore, rateAfter) + axes.high) / 2;
  const arrowFrom = sx(quantityAt(demand, arrowRate));
  const arrowTo = sx(quantityAt(market.demandAfter, arrowRate));
  const arrowDir = Math.sign(arrowTo - arrowFrom);
  const showArrow = market.shifted && shiftP >= 1 && Math.abs(arrowTo - arrowFrom) >= 16;

  // The shortage or surplus at the old exchange rate once demand has shifted: the gap between the quantity supplied and the new quantity demanded.
  const gapFrom = sx(quantityAt(supply, rateBefore));
  const gapTo = sx(quantityAt(market.demandAfter, rateBefore));
  const gapWord = market.gapAtOldRate > 0 ? "Shortage" : "Surplus";

  const rows = market.prices.length;
  const rowHeight = Math.min(ROW_MAX, (P_BOTTOM - P_TOP) / rows);
  const rowY = (i: number) => P_TOP + (i + 0.5) * rowHeight;
  const anyAfter = market.shifted && t >= timing.afterAt(0);
  // The student's prices in quors, written out on the right. Long ones, like 199.98 → 249.97, get a smaller font so they fit beside the graph; each character of the monospace tick font is 0.6 em wide. The size comes from the finished texts, so it doesn't change partway through a run.
  const valueText = (i: number, withAfter: boolean) => (withAfter ? `${fmtQuors(market.pricesBefore[i])} → ${fmtQuors(market.pricesAfter[i])}` : fmtQuors(market.pricesBefore[i]));
  const longest = Math.max(...market.prices.map((_, i) => valueText(i, market.shifted).length));
  const valueFont = Math.min(type.tick.fontSize, (VIEW.width - VALUE_X - 2) / (0.6 * longest));

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
      role="img"
      aria-label={ariaLabelFor(market)}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={LEFT} y={M_TOP - 4} width={(RIGHT - LEFT) * reveal} height={M_BOTTOM - M_TOP + 4} />
        </clipPath>
      </defs>

      {/* The foreign exchange market for the pell. */}
      {axes.rateTicks.map((e) => (
        <line key={`rgrid-${e}`} x1={LEFT} y1={sy(e)} x2={RIGHT} y2={sy(e)} stroke={color.grid} />
      ))}
      {axes.quantityTicks.map((q) => (
        <line key={`qgrid-${q}`} x1={sx(q)} y1={M_TOP} x2={sx(q)} y2={M_BOTTOM} stroke={color.grid} />
      ))}

      <g clipPath={`url(#${clipId})`} strokeWidth={2.5} strokeLinecap="round">
        {supplyLine && <line {...ends(supplyLine)} stroke={purple} />}
        {demandLine && <line {...ends(demandLine)} stroke={teal} opacity={slidingLine ? 0.55 : 1} />}
      </g>
      {slidingLine && <line {...ends(slidingLine)} stroke={teal} strokeWidth={2.5} strokeLinecap="round" />}
      {showArrow && (
        <g stroke={teal} fill={teal}>
          <line x1={arrowFrom + 5 * arrowDir} y1={sy(arrowRate)} x2={arrowTo - 10 * arrowDir} y2={sy(arrowRate)} strokeWidth={1.5} />
          <path d={`M ${arrowTo - 4 * arrowDir} ${sy(arrowRate)} l ${-7 * arrowDir} -4 l 0 8 Z`} stroke="none" />
        </g>
      )}

      {pointP > 0 && guides(first, pointP)}
      {settled && guides(second, 1)}
      {gapP > 0 && (
        <g stroke={ink} strokeWidth={2} opacity={gapP}>
          <line x1={gapFrom} y1={sy(rateBefore)} x2={gapTo} y2={sy(rateBefore)} />
          <line x1={gapFrom} y1={sy(rateBefore) - 5} x2={gapFrom} y2={sy(rateBefore) + 5} />
          <line x1={gapTo} y1={sy(rateBefore) - 5} x2={gapTo} y2={sy(rateBefore) + 5} />
        </g>
      )}
      {pointP > 0 && <circle cx={sx(first.q)} cy={sy(first.e)} r={4.5 * progressBetween(pointP, 0.6, 0.4)} fill={ink} stroke={color.surface} strokeWidth={1.5} />}
      {market.shifted && t >= timing.moveAt && <circle cx={sx(moving.q)} cy={sy(moving.e)} r={4.5} fill={ink} stroke={color.surface} strokeWidth={1.5} />}

      {/* A stroke in the background color behind each letter keeps a label readable where a line passes under it. */}
      <g stroke={color.surface} strokeWidth={3} strokeLinejoin="round" paintOrder="stroke">
        {curveLabels.map((label, i) => (
          <text key={`curve-${i}`} x={label.x} y={label.y} style={type.axisTitle}>
            <Pieces pieces={label.pieces} />
          </text>
        ))}
      </g>
      <g stroke={color.surface} strokeWidth={3} strokeLinejoin="round" paintOrder="stroke" style={{ ...type.tick, fontWeight: 600 }}>
        {eLabels.flatMap((label, i) =>
          label.lines.map((pieces, k) => (
            <text key={`e-${i}-${k}`} x={LEFT + 6} y={label.y + k * label.step} opacity={label.show}>
              <Pieces pieces={pieces} />
            </text>
          ))
        )}
        {gapP > 0 && (
          <text x={Math.max(gapFrom, gapTo) + 8} y={sy(rateBefore) + 4} opacity={gapP} fill={ink}>
            {gapWord} = {fmt(Math.abs(market.gapAtOldRate))}
          </text>
        )}
      </g>

      <line x1={LEFT} y1={M_BOTTOM} x2={RIGHT} y2={M_BOTTOM} stroke={color.axis} />
      <line x1={LEFT} y1={M_TOP} x2={LEFT} y2={M_BOTTOM} stroke={color.axis} />
      {axes.rateTicks.map((e) => (
        <text key={`rtick-${e}`} x={LEFT - 8} y={sy(e) + 4} textAnchor="end" style={type.tick}>
          {fmt(e)}
        </text>
      ))}
      {axes.quantityTicks.map((q) => (
        <text key={`qtick-${q}`} x={sx(q)} y={M_BOTTOM + 15} textAnchor="middle" style={type.tick}>
          {fmt(q)}
        </text>
      ))}
      {qLabels.map((label, i) => (
        <text key={`q-${i}`} x={label.x} y={M_BOTTOM + 29} textAnchor={label.anchor} style={{ ...type.tick, fontWeight: 600 }}>
          <Pieces pieces={label.pieces} />
        </text>
      ))}
      <text x={(LEFT + RIGHT) / 2} y={M_BOTTOM + 45} textAnchor="middle" style={type.axisTitle}>
        Quantity of pells (millions a day)
      </text>
      <text transform={`translate(18, ${(M_TOP + M_BOTTOM) / 2}) rotate(-90)`} textAnchor="middle" style={type.axisTitle}>
        <tspan x={0}>Exchange rate</tspan>
        <tspan x={0} dy={13}>
          (quors per pell)
        </tspan>
      </text>

      {/* The exports: one row each, priced in quors at the exchange rate before the shift and after it. The key pairs each mark with its exchange rate: the student's price is a ring at e₁ and a dot at e₂, and the correct price a dashed mark at e₁ and a solid one at e₂. */}
      <text x={LEFT - 10} y={KEY_Y} textAnchor="end" style={{ ...type.tick, fontWeight: 600 }}>
        Pells
      </text>
      <text x={(LEFT + RIGHT) / 2} y={KEY_Y} textAnchor="middle" style={type.tick}>
        <Pieces
          pieces={[
            { text: "Your price: " },
            { text: "○", fill: pink },
            { text: " at " },
            ...symbol("e", "1"),
            ...(anyAfter ? [{ text: "●", fill: pink, dx: 10 }, { text: " at " }, ...symbol("e", "2")] : []),
            { text: "Correct: ", dx: 18 },
            { text: "¦", fill: color.reference },
            { text: " at " },
            ...symbol("e", "1"),
            ...(anyAfter ? [{ text: "|", fill: color.reference, dx: 10 }, { text: " at " }, ...symbol("e", "2")] : []),
          ]}
        />
      </text>
      <text x={VALUE_X} y={KEY_Y} textAnchor="start" style={{ ...type.tick, fontWeight: 600, fill: pink }}>
        Quors
      </text>

      {prices.ticks.map((v) => (
        <line key={`pgrid-${v}`} x1={px(v)} y1={P_TOP} x2={px(v)} y2={P_BOTTOM} stroke={color.grid} />
      ))}
      {market.prices.map((price, i) => {
        const p = progressBetween(t, timing.rowAt(i), ROW_MS);
        if (p <= 0) return null;
        const y = rowY(i);
        const before = px(market.pricesBefore[i]);
        const afterP = easeInOut(progressBetween(t, timing.afterAt(i), AFTER_MS));
        const after = lerp(before, px(market.pricesAfter[i]), afterP);
        const hasAfter = market.shifted && t >= timing.afterAt(i);
        const mark = (v: number, dashed: boolean) => <line x1={px(v)} y1={y - MARK_HALF} x2={px(v)} y2={y + MARK_HALF} stroke={color.reference} strokeWidth={2} strokeDasharray={dashed ? "3 2" : undefined} />;
        return (
          <g key={`row-${i}`} opacity={Math.min(p * 2, 1)}>
            <text x={LEFT - 10} y={y + 4} textAnchor="end" style={type.tick}>
              {fmt(price)}
            </text>
            <line x1={LEFT} y1={y} x2={RIGHT} y2={y} stroke={color.grid} />
            {hasAfter && Math.abs(after - before) > DOT_R && <line x1={before} y1={y} x2={after} y2={y} stroke={pink} strokeWidth={1.5} />}
            <circle cx={before} cy={y} r={DOT_R * (0.4 + 0.6 * p)} fill={color.surface} stroke={pink} strokeWidth={2} />
            {hasAfter && <circle cx={after} cy={y} r={DOT_R} fill={pink} stroke={color.surface} strokeWidth={1} />}
            {/* The correct prices go on top and stand taller than the dots, so they show even when a dot sits right on them. The one at e₁ is dashed and the one at e₂ solid, so a dot that lands on the e₁ mark doesn't look right. */}
            {mark(market.correctBefore[i], true)}
            {hasAfter && mark(market.correctAfter[i], false)}
            {p >= 1 && (
              <text x={VALUE_X} y={y + 4} textAnchor="start" style={{ ...type.tick, fontSize: valueFont, fontWeight: 600, fill: pink }}>
                {valueText(i, hasAfter && afterP >= 1)}
              </text>
            )}
          </g>
        );
      })}

      <line x1={LEFT} y1={P_BOTTOM} x2={RIGHT} y2={P_BOTTOM} stroke={color.axis} />
      {prices.ticks.map((v) => (
        <g key={`ptick-${v}`}>
          <line x1={px(v)} y1={P_BOTTOM} x2={px(v)} y2={P_BOTTOM + 4} stroke={color.axis} />
          <text x={px(v)} y={P_BOTTOM + 16} textAnchor="middle" style={type.tick}>
            {fmtQuors(v)}
          </text>
        </g>
      ))}
      <text x={(LEFT + RIGHT) / 2} y={P_BOTTOM + 36} textAnchor="middle" style={type.axisTitle}>
        Price in Quorvia (quors)
      </text>
    </svg>
  );
}

const Component = observer(({ state }: { state: State }) => {
  const market = state.market;
  const timing = market ? timingFor(market) : null;
  const t = useRunAnimation(market, timing?.total ?? 0);

  if (!market || !timing) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Press Run to graph the foreign exchange market for the pell and price Pellia's exports in quors." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const firstShown = t >= POINT_AT + POINT_MS;
  const settled = t >= timing.settledAt;

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <Plot market={market} t={t} timing={timing} />
      </PluginStage>
      <StatRow
        stats={[
          { label: "Rate Before", value: firstShown ? fmtRate(market.rateBefore) : EMPTY },
          { label: "Rate After", value: settled ? fmtRate(market.rateAfter) : EMPTY },
          { label: "Prices Right", value: t >= timing.total ? `${market.rightCount} of ${market.prices.length}` : EMPTY, color: color.series[0] },
          { label: "Net Exports", value: settled ? NET_EXPORTS[market.netExports] : EMPTY },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
