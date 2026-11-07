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
import State, { type Market, type Point } from "./state";

// Timeline of one run, in ms: MPB and MPC draw in from left to right, the student's MSC rises off MPC by whatever its function adds, the dashed MPC + tax rises off MPC by the tax (when there is one), then the market quantity, the socially optimal quantity and the deadweight loss appear in turn.
const CURVES_MS = 700;
const LIFT_AT = 800;
const LIFT_MS = 700;
const TAX_AT = LIFT_AT + LIFT_MS + 100;
const TAX_MS = 600;
const POINT_MS = 350;
const POINT_GAP = 450;
const LOSS_MS = 450;

function timeline(hasTax: boolean) {
  const marketAt = (hasTax ? TAX_AT + TAX_MS : LIFT_AT + LIFT_MS) + 150;
  const optimalAt = marketAt + POINT_GAP;
  const lossAt = optimalAt + POINT_GAP;
  return { marketAt, optimalAt, lossAt, total: lossAt + LOSS_MS };
}

// Layout, in the shared VIEW. The right margin holds the line labels, as on an AP graph, and the bottom one the Q labels under the tick numbers.
const PADDING = { top: 40, right: 122, bottom: 68, left: 54 };
const LEFT = PADDING.left;
const RIGHT = VIEW.width - PADDING.right;
const TOP = PADDING.top;
const BOTTOM = VIEW.height - PADDING.bottom;
const LEGEND_Y = 18;
const LABEL_GAP = 14;
const SUB_DY = 3;

/** Shows a number with at most two decimals and no trailing zeros. */
const fmt = (v: number) => String(Number(v.toFixed(2)));

/** Shows a dollar amount, like $40, −$40 or $56,700. */
function money(v: number): string {
  const rounded = Math.round(v * 100) / 100 || 0;
  return `${rounded < 0 ? "−" : ""}$${Math.abs(rounded).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** The price axis: from 0 to a round number past every line, or past twice the market's own lines when a student's MSC shoots far above them, so they don't flatten against the bottom. */
function priceAxis(market: Market) {
  const own = Math.max(...market.benefit, ...market.privateCost, ...(market.tax !== 0 ? market.taxedCost : []), 1);
  const top = Math.min(Math.max(own, ...market.socialCost), 2 * own);
  const step = niceStep(top, 8);
  return { max: Math.ceil(top / step) * step };
}

/** One piece of a label's text. A subscript piece is smaller and lower, so a label can read Q with a small M after it, as AP graphs write Q_M. */
interface Piece {
  text: string;
  fill: string;
  sub?: boolean;
}

function Pieces({ pieces }: { pieces: readonly Piece[] }) {
  let shifted = false;
  return (
    <>
      {pieces.map((piece, i) => {
        const dy = piece.sub && !shifted ? SUB_DY : !piece.sub && shifted ? -SUB_DY : 0;
        shifted = !!piece.sub;
        return (
          <tspan key={i} dy={dy || undefined} fill={piece.fill} fontSize={piece.sub ? 9 : undefined}>
            {piece.text}
          </tspan>
        );
      })}
    </>
  );
}

const symbol = (base: string, sub: string, fill: string): Piece[] => [
  { text: base, fill },
  { text: sub, fill, sub: true },
];
const equals: Piece = { text: " = ", fill: color.inkMuted };
const MSB_LABEL: Piece = { text: "MPB = MSB", fill: color.series[1] };
const MPC_LABEL: Piece = { text: "MPC", fill: color.series[3] };
const MSC_LABEL: Piece = { text: "MSC", fill: color.series[0] };
const TAXED_LABEL: Piece = { text: "MPC + tax", fill: color.series[3] };

/** Moves labels apart so none is closer than LABEL_GAP to the next, keeping them inside the plot's height. */
function spreadOut<T extends { y: number }>(labels: T[]): T[] {
  const sorted = [...labels].sort((a, b) => a.y - b.y);
  for (let i = 1; i < sorted.length; i++) sorted[i].y = Math.max(sorted[i].y, sorted[i - 1].y + LABEL_GAP);
  const overflow = sorted.length > 0 ? sorted[sorted.length - 1].y - (BOTTOM - 4) : 0;
  if (overflow > 0) sorted.forEach((label) => (label.y -= overflow));
  for (let i = sorted.length - 2; i >= 0; i--) sorted[i].y = Math.min(sorted[i].y, sorted[i + 1].y - LABEL_GAP);
  return sorted;
}

function Graph({ market, t }: { market: Market; t: number }) {
  const clipId = `market-${useId().replace(/:/g, "")}`;
  const { quantities, benefit, privateCost, socialCost, tax } = market;
  const hasTax = tax !== 0;
  const { marketAt, optimalAt, lossAt } = timeline(hasTax);
  const xMax = quantities[quantities.length - 1];
  const xTicks = ticks(xMax, 8);
  const yAxis = priceAxis(market);
  const yTicks = ticks(yAxis.max, 8);
  const { sx, sy } = makeScales(xMax, yAxis.max, VIEW, PADDING);
  const clampY = (p: number) => sy(Math.min(Math.max(p, 0), yAxis.max));

  const reveal = easeInOut(progressBetween(t, 0, CURVES_MS));
  const liftP = easeInOut(progressBetween(t, LIFT_AT, LIFT_MS));
  const taxP = easeInOut(progressBetween(t, TAX_AT, TAX_MS));
  const marketP = progressBetween(t, marketAt, POINT_MS);
  const optimalP = progressBetween(t, optimalAt, POINT_MS);
  const lossP = progressBetween(t, lossAt, LOSS_MS);

  // This frame's MSC and MPC + tax: each rises off MPC to where it belongs.
  const socialNow = privateCost.map((c, i) => lerp(c, socialCost[i], liftP));
  const taxedNow = privateCost.map((c) => c + tax * taxP);
  const path = (values: readonly number[]) => quantities.map((q, i) => `${sx(q)},${sy(values[i])}`).join(" ");
  const last = quantities.length - 1;

  // Labels at the right end of each line. Lines that lie on top of each other share one label, the way an AP graph writes MPC = MSC. MSC and MPC + tax share one only once the dashed line has risen onto MSC.
  const taxedOnSocial = market.socialOnTaxed && taxP >= 1;
  const lineLabels: { y: number; pieces: Piece[] }[] = [{ y: clampY(benefit[last]), pieces: [MSB_LABEL] }];
  if (market.socialOnPrivate) {
    lineLabels.push({ y: clampY(privateCost[last]), pieces: [MPC_LABEL, equals, MSC_LABEL] });
  } else {
    lineLabels.push({ y: clampY(privateCost[last]), pieces: [MPC_LABEL] });
    lineLabels.push({ y: clampY(socialNow[last]), pieces: taxedOnSocial ? [MSC_LABEL, equals, TAXED_LABEL] : [MSC_LABEL] });
  }
  if (hasTax && t >= TAX_AT && !taxedOnSocial) {
    lineLabels.push({ y: clampY(taxedNow[last]), pieces: [TAXED_LABEL] });
  }

  const marketPoint: Point = { q: market.marketQuantity, p: market.marketPrice };
  const optimalPoint: Point = { q: market.optimalQuantity, p: market.optimalPrice };
  const sameQuantity = Math.abs(marketPoint.q - optimalPoint.q) < 1e-9;
  const samePrice = sameQuantity || Math.abs(marketPoint.p - optimalPoint.p) < 1e-9;
  const ink = color.ink;
  const pink = color.series[0];

  // The Q labels sit under the quantity axis. Two that would overlap are pushed apart from their midpoint.
  const qLabels: { x: number; anchor: "middle" | "start" | "end"; pieces: Piece[]; show: number }[] = [];
  if (sameQuantity) {
    qLabels.push({ x: sx(marketPoint.q), anchor: "middle", pieces: [...symbol("Q", "M", ink), equals, ...symbol("Q", "S", pink)], show: optimalP });
  } else {
    const xm = sx(marketPoint.q);
    const xs = sx(optimalPoint.q);
    const close = Math.abs(xm - xs) < 36;
    const mid = (xm + xs) / 2;
    const place = (x: number, isLeft: boolean) =>
      close ? { x: isLeft ? Math.min(x, mid - 3) : Math.max(x, mid + 3), anchor: (isLeft ? "end" : "start") as "end" | "start" } : { x, anchor: "middle" as const };
    qLabels.push({ ...place(xm, xm < xs), pieces: symbol("Q", "M", ink), show: marketP });
    qLabels.push({ ...place(xs, xs < xm), pieces: symbol("Q", "S", pink), show: optimalP });
  }

  // The P labels sit just inside the price axis, above their guide lines. When the two prices are close, the lower one's label goes under its guide line instead. There's no market price when the market makes nothing, and no P_S when MSB and MSC never meet.
  const pLabels: { y: number; pieces: Piece[]; show: number }[] = [];
  const above = (p: number) => clampY(p) - 6;
  const below = (p: number) => clampY(p) + 14;
  if (samePrice && market.marketMeets && market.optimalMeets) {
    pLabels.push({ y: above(marketPoint.p), pieces: [...symbol("P", "M", ink), equals, ...symbol("P", "S", pink), { text: ` = ${money(marketPoint.p)}`, fill: color.inkMuted }], show: optimalP });
  } else {
    const close = market.marketMeets && market.optimalMeets && Math.abs(clampY(marketPoint.p) - clampY(optimalPoint.p)) < 2 * LABEL_GAP;
    const marketLower = marketPoint.p < optimalPoint.p;
    if (market.marketMeets) pLabels.push({ y: close && marketLower ? below(marketPoint.p) : above(marketPoint.p), pieces: [...symbol("P", "M", ink), { text: ` = ${money(marketPoint.p)}`, fill: color.inkMuted }], show: marketP });
    if (market.optimalMeets) pLabels.push({ y: close && !marketLower ? below(optimalPoint.p) : above(optimalPoint.p), pieces: [...symbol("P", "S", pink), { text: ` = ${money(optimalPoint.p)}`, fill: color.inkMuted }], show: optimalP });
  }

  const region = market.lossRegion.map((pt) => `${sx(pt.q)},${clampY(pt.p)}`).join(" ");

  const guides = (point: Point, stroke: string, p: number) => {
    const reach = easeInOut(Math.min(p / 0.7, 1));
    const x = sx(point.q);
    const y = clampY(point.p);
    return (
      <g stroke={stroke} strokeWidth={1.5} strokeDasharray="4 4">
        <line x1={LEFT} y1={y} x2={LEFT + (x - LEFT) * reach} y2={y} />
        <line x1={x} y1={BOTTOM} x2={x} y2={BOTTOM + (y - BOTTOM) * reach} />
      </g>
    );
  };

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
      role="img"
      aria-label={`Paper market from 0 to ${fmt(xMax)} tons a day. MPB = MSB goes from ${money(benefit[0])} to ${money(benefit[last])} a ton, MPC from ${money(privateCost[0])} to ${money(privateCost[last])}, and your MSC from ${money(socialCost[0])} to ${money(socialCost[last])}${hasTax ? `, with a tax of ${money(tax)} a ton` : ""}. The market quantity is ${fmt(market.marketQuantity)} tons${market.marketMeets ? ` at ${money(market.marketPrice)} a ton` : ""}, the socially optimal quantity is ${fmt(market.optimalQuantity)} tons${market.optimalMeets ? ` at ${money(market.optimalPrice)} a ton` : ""}, and the deadweight loss is ${money(market.deadweightLoss)} a day.`}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={LEFT} y={TOP} width={(RIGHT - LEFT) * reveal} height={BOTTOM - TOP} />
        </clipPath>
      </defs>

      <text x={(LEFT + RIGHT) / 2} y={LEGEND_Y} textAnchor="middle" style={type.tick}>
        <tspan fill={ink}>●</tspan>
        <tspan> Market quantity</tspan>
        <tspan dx={14} fill={pink}>○</tspan>
        <tspan> Socially optimal quantity</tspan>
        <tspan dx={14} fill={pink} fillOpacity={0.45}>■</tspan>
        <tspan> Deadweight loss</tspan>
      </text>

      {yTicks.map((v) => (
        <line key={`ygrid-${v}`} x1={LEFT} y1={sy(v)} x2={RIGHT} y2={sy(v)} stroke={color.grid} />
      ))}
      {xTicks.map((q) => (
        <line key={`xgrid-${q}`} x1={sx(q)} y1={TOP} x2={sx(q)} y2={BOTTOM} stroke={color.grid} />
      ))}

      <g clipPath={`url(#${clipId})`}>
        {/* The deadweight loss: the area between MSC and MSB from the socially optimal quantity to the market quantity. */}
        {lossP > 0 && market.lossRegion.length > 0 && <polygon points={region} fill={pink} fillOpacity={0.24 * lossP} />}
        {/* The student's MSC sits under the other lines and is wider, so where MPC or MPC + tax lies right on it, both still show. */}
        <polyline points={path(socialNow)} fill="none" stroke={pink} strokeWidth={4.5} strokeLinejoin="round" />
        <polyline points={path(benefit)} fill="none" stroke={color.series[1]} strokeWidth={2.5} strokeLinejoin="round" />
        <polyline points={path(privateCost)} fill="none" stroke={color.series[3]} strokeWidth={2} strokeLinejoin="round" />
        {hasTax && t >= TAX_AT && <polyline points={path(taxedNow)} fill="none" stroke={color.series[3]} strokeWidth={2} strokeDasharray="7 5" strokeLinejoin="round" />}
      </g>

      {reveal >= 1 &&
        spreadOut(lineLabels).map((label, i) => (
          <text key={`line-${i}`} x={RIGHT + 14} y={label.y + 4} style={type.axisTitle}>
            <Pieces pieces={label.pieces} />
          </text>
        ))}

      {marketP > 0 && guides(marketPoint, color.inkMuted, marketP)}
      {optimalP > 0 && guides(optimalPoint, pink, optimalP)}
      {marketP > 0 && <circle cx={sx(marketPoint.q)} cy={clampY(marketPoint.p)} r={5 * progressBetween(marketP, 0.6, 0.4)} fill={ink} stroke={color.surfaceRaised} strokeWidth={1.5} />}
      {optimalP > 0 && <circle cx={sx(optimalPoint.q)} cy={clampY(optimalPoint.p)} r={10 * progressBetween(optimalP, 0.6, 0.4)} fill="none" stroke={pink} strokeWidth={2.5} />}

      {/* A stroke in the background color behind each letter keeps a P label readable where a line passes under it. */}
      {pLabels
        .filter((label) => label.show > 0)
        .map((label, i) => (
          <text key={`p-${i}`} x={LEFT + 6} y={label.y} opacity={label.show} stroke={color.surface} strokeWidth={3} paintOrder="stroke" style={{ ...type.tick, fontWeight: 600 }}>
            <Pieces pieces={label.pieces} />
          </text>
        ))}

      <line x1={LEFT} y1={BOTTOM} x2={RIGHT} y2={BOTTOM} stroke={color.axis} />
      <line x1={LEFT} y1={TOP} x2={LEFT} y2={BOTTOM} stroke={color.axis} />
      {xTicks.map((q) => (
        <text key={`xtick-${q}`} x={sx(q)} y={BOTTOM + 15} textAnchor="middle" style={type.tick}>
          {fmt(q)}
        </text>
      ))}
      {yTicks.map((v) => (
        <text key={`ytick-${v}`} x={LEFT - 8} y={sy(v) + 4} textAnchor="end" style={type.tick}>
          {fmt(v)}
        </text>
      ))}
      {qLabels
        .filter((label) => label.show > 0)
        .map((label, i) => (
          <text key={`q-${i}`} x={label.x} y={BOTTOM + 31} textAnchor={label.anchor} opacity={label.show} style={{ ...type.tick, fontWeight: 600 }}>
            <Pieces pieces={label.pieces} />
          </text>
        ))}
      <text x={(LEFT + RIGHT) / 2} y={BOTTOM + 56} textAnchor="middle" style={type.axisTitle}>
        Quantity (tons of paper a day)
      </text>
      <text x={14} y={(TOP + BOTTOM) / 2} textAnchor="middle" transform={`rotate(-90, 14, ${(TOP + BOTTOM) / 2})`} style={type.axisTitle}>
        Price (dollars per ton)
      </text>
    </svg>
  );
}

const Component = observer(({ state }: { state: State }) => {
  const market = state.market;
  const times = timeline(market !== null && market.tax !== 0);
  const t = useRunAnimation(market, times.total);

  if (!market) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Press Run to graph the paper market: its marginal benefit and cost lines, the market quantity and the socially optimal quantity." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const gap = market.externalGap === null ? "Varies" : money(market.externalGap);
  const taxShownAt = market.tax !== 0 ? TAX_AT + TAX_MS : CURVES_MS;

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <Graph market={market} t={t} />
      </PluginStage>
      <StatRow
        stats={[
          { label: "Market Q", value: t >= times.marketAt ? fmt(market.marketQuantity) : EMPTY },
          { label: "Optimal Q", value: t >= times.optimalAt ? fmt(market.optimalQuantity) : EMPTY, color: color.series[0] },
          { label: "MSC − MPC", value: t >= LIFT_AT + LIFT_MS ? gap : EMPTY },
          { label: "Tax", value: t >= taxShownAt ? money(market.tax) : EMPTY, color: color.series[3] },
          { label: "Deadweight Loss", value: t >= times.lossAt ? money(market.deadweightLoss) : EMPTY },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
