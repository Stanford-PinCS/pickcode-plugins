import { observer } from "mobx-react-lite";
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
import State, { type Country, type CountryOutcome, type Trade } from "./state";

// Timeline of one run, in ms: both PPCs draw from their all-fish end to their all-corn end and each one's opportunity-cost tag fades in, each country's production point pops in where it specializes, its consumption point slides along the trade line to what it has after trading, and a bracket grows from its PPC to the consumption point to show how far beyond (or inside) the PPC it ends up.
const PPC_MS = 700;
const TAG_MS = 300;
const MAKE_AT = 800;
const MAKE_MS = 300;
const TRADE_AT = 1250;
const TRADE_MS = 1200;
const GAIN_AT = 2550;
const GAIN_MS = 450;
const TOTAL_MS = GAIN_AT + GAIN_MS;

// Layout, in the shared VIEW: the shared padding, with more room on top for the legend.
const PLOT_PAD = { ...PAD, top: 40 };
const LEGEND_Y = 18;
const DOT_R = 6;
const RING_R = 7;
const CAP_HALF = 5;
const DIVISIONS = 6;
// type.tick is an 11px monospace font, about 0.6 em per character, so a label's width can be worked out from its length.
const CHAR_W = 6.6;
// Each opportunity-cost tag runs along its PPC, TAG_GAP from the line. TAG_BASELINE puts the baseline that far below the tag's middle line, which centers letters about 8.5 px tall on it. TAG_SPOTS are where its middle may sit, as fractions of the way from the PPC's fish end to its corn end, tried from the middle outward, beyond the PPC first and then inside it.
const TAG_GAP = 4;
const TAG_HALF_HEIGHT = 5.5;
const TAG_BASELINE = 4;
const TAG_SPOTS = [0.5, 0.45, 0.55, 0.4, 0.6, 0.35, 0.65, 0.3, 0.7, 0.25, 0.75, 0.2, 0.8, 0.15, 0.85, 0.1, 0.9];

// Arvia is the first series and Bovia the second, in the line, the points and the bottom row.
const COUNTRY_COLOR = { Arvia: color.series[0], Bovia: color.series[1] } as const;

/** Shows a number with at most two decimals and no trailing zeros. */
const fmt = (v: number) => String(Number(v.toFixed(2)));

/** A gain with its sign in front, using a true minus sign. Rounds first, so a tiny leftover from floating-point math reads as 0. */
function signed(v: number): string {
  const r = Number(v.toFixed(2));
  if (r > 0) return `+${fmt(r)}`;
  if (r < 0) return `−${fmt(-r)}`;
  return "0";
}

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** The end of an axis that starts at 0: the largest value rounded up to a round tick step. */
function axisEnd(max: number): number {
  const step = niceStep(max, DIVISIONS);
  return Math.max(Math.ceil(max / step - 1e-9), 1) * step;
}

type Scale = (v: number) => number;

/** A line of text on the plot: where its anchor is, and which end of the text that is. */
interface Label {
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
  text: string;
}

/** An opportunity-cost tag: its middle, and the angle of the PPC it runs along, in degrees. */
interface Tag {
  x: number;
  y: number;
  angle: number;
  text: string;
}

/** A point a tag has to keep `r` away from. */
interface Mark {
  x: number;
  y: number;
  r: number;
}

/**
 * Where a gain label goes around a consumption point, on a side that the trade line, the bracket and the PPC leave free.
 *
 * The fish maker's trade line comes in from the upper left. With a gain, the bracket hangs below the point, so the label goes to its right. With a loss, the PPC crosses the point's height a little to the right, so the label goes to the left, a bit low to clear the trade line. The corn maker's trade line comes in from the lower right, so its label goes above the point, or to its left when the bracket rises above it.
 */
function gainLabelSpot(
  c: CountryOutcome,
  x: number,
  y: number,
  left: number,
  right: number,
  top: number
): { x: number; y: number; anchor: "start" | "middle" | "end" } {
  const gap = RING_R + 4;
  const toRight = { x: x + gap, anchor: "start" } as const;
  const toLeft = { x: x - gap, anchor: "end" } as const;
  if (c.makes === "fish") {
    if (c.gain > 0) return { ...(x + gap + 60 > right ? toLeft : toRight), y: y + 4 };
    return { ...(x - gap - 60 < left ? toRight : toLeft), y: y + 8 };
  }
  if (c.gain > 0) return { x, y: Math.max(y - gap, top + 10), anchor: "middle" };
  return { ...(x - gap - 60 < left ? toRight : toLeft), y: y + 4 };
}

/** Points along a line, a few pixels apart, each to be kept `r` away from. */
function along(x1: number, y1: number, x2: number, y2: number, r: number): Mark[] {
  const n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 3));
  return Array.from({ length: n + 1 }, (_, i) => ({ x: lerp(x1, x2, i / n), y: lerp(y1, y2, i / n), r }));
}

/**
 * Where each country's opportunity-cost tag goes along its own PPC.
 *
 * Every mark the finished run draws (both PPCs, the trade lines, dots, rings, brackets and gain labels, and the first tag once it's placed) becomes a set of points to keep clear of. Each spot in TAG_SPOTS, beyond the PPC and then inside it, is scored by how many of those points the tag would cover, plus a large penalty for running off the plot, and the lowest score wins, the earlier spot on a tie.
 */
function placeTags(
  trade: Trade,
  sx: Scale,
  sy: Scale,
  labels: Record<Country, Label | null>,
  bounds: { left: number; right: number; top: number; bottom: number }
): Record<Country, Tag> {
  const countries = [trade.arvia, trade.bovia];
  const marks: Mark[] = [];
  for (const c of countries) {
    marks.push(...along(sx(0), sy(c.maxFish), sx(c.maxCorn), sy(0), 1.5));
    marks.push(...along(sx(c.production.corn), sy(c.production.fish), sx(c.consumption.corn), sy(c.consumption.fish), 1.5));
    marks.push({ x: sx(c.production.corn), y: sy(c.production.fish), r: DOT_R + 1 });
    marks.push({ x: sx(c.consumption.corn), y: sy(c.consumption.fish), r: RING_R + 2 });
    const label = labels[c.name];
    if (label) {
      // The bracket, kept CAP_HALF away so its cap is covered too, and the label as a line through the middle of its text, kept half the text's height away.
      const x = sx(c.consumption.corn);
      marks.push(...along(x, sy(c.fishOnOwnPPC), x, sy(c.consumption.fish), CAP_HALF));
      const width = label.text.length * CHAR_W;
      const x0 = label.anchor === "start" ? label.x : label.anchor === "middle" ? label.x - width / 2 : label.x - width;
      marks.push(...along(x0, label.y - 3, x0 + width, label.y - 3, 6));
    }
  }

  const tags = {} as Record<Country, Tag>;
  for (const c of countries) {
    const x0 = sx(0);
    const y0 = sy(c.maxFish);
    const dx = sx(c.maxCorn) - x0;
    const dy = sy(0) - y0;
    const length = Math.hypot(dx, dy);
    // Along the PPC (down and to the right), and square to it, away from the origin.
    const ux = dx / length;
    const uy = dy / length;
    const nx = uy;
    const ny = -ux;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const text = `1 corn = ${fmt(c.opportunityCost)} fish`;
    const halfWidth = (text.length * CHAR_W) / 2;
    let best: { score: number; tag: Tag } | undefined;
    for (const side of [1, -1]) {
      for (const f of TAG_SPOTS) {
        const offset = side * (TAG_GAP + TAG_HALF_HEIGHT);
        const x = x0 + f * dx + nx * offset;
        const y = y0 + f * dy + ny * offset;
        let score = 0;
        for (const m of marks) {
          const ax = m.x - x;
          const ay = m.y - y;
          if (Math.abs(ax * ux + ay * uy) <= halfWidth + m.r && Math.abs(ax * nx + ay * ny) <= TAG_HALF_HEIGHT + m.r) score += 1;
        }
        for (const s of [-1, 1]) {
          for (const t of [-1, 1]) {
            const cx = x + s * halfWidth * ux + t * TAG_HALF_HEIGHT * nx;
            const cy = y + s * halfWidth * uy + t * TAG_HALF_HEIGHT * ny;
            if (cx < bounds.left || cx > bounds.right || cy < bounds.top || cy > bounds.bottom) score += 1000;
          }
        }
        if (!best || score < best.score) best = { score, tag: { x, y, angle, text } };
      }
    }
    const tag = best!.tag;
    tags[c.name] = tag;
    marks.push(...along(tag.x - halfWidth * ux, tag.y - halfWidth * uy, tag.x + halfWidth * ux, tag.y + halfWidth * uy, TAG_HALF_HEIGHT));
  }
  return tags;
}

/** One sentence for screen readers about where a country ends up. */
function describe(c: CountryOutcome): string {
  const where = Math.abs(c.gain) < 0.005 ? "on its PPC" : `${fmt(Math.abs(c.gain))} tons of fish ${c.gain > 0 ? "beyond" : "inside"} its PPC`;
  return `${c.name} makes only ${c.makes} and consumes ${fmt(c.consumption.corn)} tons of corn and ${fmt(c.consumption.fish)} tons of fish, ${where}.`;
}

function Plot({ trade, t }: { trade: Trade; t: number }) {
  const countries = [trade.arvia, trade.bovia];
  const xEnd = axisEnd(Math.max(trade.arvia.maxCorn, trade.bovia.maxCorn));
  const yEnd = axisEnd(Math.max(trade.arvia.maxFish, trade.bovia.maxFish));
  const { sx, sy, plotWidth, plotHeight } = makeScales(xEnd, yEnd, VIEW, PLOT_PAD);
  const left = PLOT_PAD.left;
  const right = left + plotWidth;
  const top = PLOT_PAD.top;
  const bottom = top + plotHeight;

  const ppcP = easeInOut(progressBetween(t, 0, PPC_MS));
  const tagP = progressBetween(t, PPC_MS, TAG_MS);
  const makeP = easeInOut(progressBetween(t, MAKE_AT, MAKE_MS));
  const tradeP = easeInOut(progressBetween(t, TRADE_AT, TRADE_MS));
  const gainP = easeInOut(progressBetween(t, GAIN_AT, GAIN_MS));
  const maker = trade.cornMaker === "Arvia" ? trade.arvia : trade.bovia;
  const payer = trade.cornMaker === "Arvia" ? trade.bovia : trade.arvia;

  // Each gain label, or null when the ring sits on the PPC and there's no gap to label.
  const labelFor = (c: CountryOutcome): Label | null =>
    signed(c.gain) === "0" ? null : { ...gainLabelSpot(c, sx(c.consumption.corn), sy(c.consumption.fish), left, right, top), text: `${signed(c.gain)} fish` };
  const labels = { Arvia: labelFor(trade.arvia), Bovia: labelFor(trade.bovia) };
  const tags = placeTags(trade, sx, sy, labels, { left: left + 2, right: VIEW.width - 2, top: LEGEND_Y + 6, bottom: bottom - 2 });

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
      role="img"
      aria-label={`Production possibilities curves in tons of corn and fish. Arvia can make up to ${fmt(trade.arvia.maxCorn)} tons of corn or ${fmt(trade.arvia.maxFish)} tons of fish, and Bovia up to ${fmt(trade.bovia.maxCorn)} tons of corn or ${fmt(trade.bovia.maxFish)} tons of fish. The opportunity cost of 1 ton of corn is ${fmt(trade.arvia.opportunityCost)} tons of fish for Arvia and ${fmt(trade.bovia.opportunityCost)} tons of fish for Bovia. ${maker.name} ships ${fmt(trade.cornTraded)} tons of corn to ${payer.name} for ${fmt(trade.fishTraded)} tons of fish. ${describe(trade.arvia)} ${describe(trade.bovia)}`}
    >
      <text x={VIEW.width / 2} y={LEGEND_Y} textAnchor="middle" style={type.tick}>
        <tspan fill={COUNTRY_COLOR.Arvia} fontWeight={700}>—</tspan>
        <tspan> Arvia's PPC</tspan>
        <tspan dx={14} fill={COUNTRY_COLOR.Bovia} fontWeight={700}>—</tspan>
        <tspan> Bovia's PPC</tspan>
        <tspan dx={14} fill={color.inkMuted}>●</tspan>
        <tspan> Makes</tspan>
        <tspan dx={14} fill={color.inkMuted}>○</tspan>
        <tspan> Consumes</tspan>
        <tspan dx={14} fill={color.inkMuted} fontWeight={700}>- -</tspan>
        <tspan> Trade</tspan>
      </text>

      {ticks(xEnd, DIVISIONS).map((v) => (
        <line key={`xgrid-${v}`} x1={sx(v)} y1={top} x2={sx(v)} y2={bottom} stroke={color.grid} />
      ))}
      {ticks(yEnd, DIVISIONS).map((v) => (
        <line key={`ygrid-${v}`} x1={left} y1={sy(v)} x2={right} y2={sy(v)} stroke={color.grid} />
      ))}

      {/* Each PPC: a straight line from all fish (0, most fish) to all corn (most corn, 0), so every ton of corn costs the same fish. */}
      {countries.map((c) => (
        <line
          key={`ppc-${c.name}`}
          x1={sx(0)}
          y1={sy(c.maxFish)}
          x2={sx(lerp(0, c.maxCorn, ppcP))}
          y2={sy(lerp(c.maxFish, 0, ppcP))}
          stroke={COUNTRY_COLOR[c.name]}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      ))}

      {/* The reference the student's opportunityCost is checked against: each PPC's own opportunity cost of corn, the most fish divided by the most corn, along the line. A surface-colored outline under the letters keeps it readable where it crosses a grid line. */}
      {tagP > 0 &&
        countries.map((c) => {
          const tag = tags[c.name];
          return (
            <text
              key={`tag-${c.name}`}
              x={0}
              y={0}
              dy={TAG_BASELINE}
              transform={`translate(${tag.x}, ${tag.y}) rotate(${tag.angle})`}
              textAnchor="middle"
              stroke={color.surface}
              strokeWidth={3}
              strokeLinejoin="round"
              paintOrder="stroke"
              opacity={tagP}
              style={{ ...type.tick, fill: color.reference, fontWeight: 600 }}
            >
              {tag.text}
            </text>
          );
        })}

      {/* The trade: a dashed line from what a country makes to what it consumes. It runs left and up for the corn maker (corn out, fish in) and right and down for the other country. */}
      {tradeP > 0 &&
        countries.map((c) => (
          <line
            key={`trade-${c.name}`}
            x1={sx(c.production.corn)}
            y1={sy(c.production.fish)}
            x2={sx(lerp(c.production.corn, c.consumption.corn, tradeP))}
            y2={sy(lerp(c.production.fish, c.consumption.fish, tradeP))}
            stroke={COUNTRY_COLOR[c.name]}
            strokeWidth={2}
            strokeDasharray="6 4"
          />
        ))}

      {/* How far each consumption point sits beyond (or inside) its own PPC, in tons of fish, at the corn it consumes. */}
      {gainP > 0 &&
        countries.map((c) => {
          const label = labels[c.name];
          if (!label) return null;
          const x = sx(c.consumption.corn);
          const from = sy(c.fishOnOwnPPC);
          const to = sy(lerp(c.fishOnOwnPPC, c.consumption.fish, gainP));
          return (
            <g key={`gain-${c.name}`} stroke={COUNTRY_COLOR[c.name]} strokeWidth={1.5}>
              <line x1={x} y1={from} x2={x} y2={to} />
              <line x1={x - CAP_HALF} y1={from} x2={x + CAP_HALF} y2={from} />
              {/* A surface-colored outline under the letters keeps the label readable where it crosses a line. */}
              <text
                x={label.x}
                y={label.y}
                textAnchor={label.anchor}
                stroke={color.surface}
                strokeWidth={3}
                strokeLinejoin="round"
                paintOrder="stroke"
                opacity={gainP}
                style={{ ...type.tick, fill: COUNTRY_COLOR[c.name], fontWeight: 600 }}
              >
                {label.text}
              </text>
            </g>
          );
        })}

      {makeP > 0 &&
        countries.map((c) => (
          <circle key={`make-${c.name}`} cx={sx(c.production.corn)} cy={sy(c.production.fish)} r={DOT_R * makeP} fill={COUNTRY_COLOR[c.name]} />
        ))}

      {tradeP > 0 &&
        countries.map((c) => (
          <circle
            key={`consume-${c.name}`}
            cx={sx(lerp(c.production.corn, c.consumption.corn, tradeP))}
            cy={sy(lerp(c.production.fish, c.consumption.fish, tradeP))}
            r={RING_R}
            fill={color.surface}
            stroke={COUNTRY_COLOR[c.name]}
            strokeWidth={2.5}
          />
        ))}

      <line x1={left} y1={bottom} x2={right} y2={bottom} stroke={color.axis} />
      <line x1={left} y1={top} x2={left} y2={bottom} stroke={color.axis} />
      {ticks(xEnd, DIVISIONS).map((v) => (
        <g key={`xtick-${v}`}>
          <line x1={sx(v)} y1={bottom} x2={sx(v)} y2={bottom + 5} stroke={color.axis} />
          <text x={sx(v)} y={bottom + 18} textAnchor="middle" style={type.tick}>
            {fmt(v)}
          </text>
        </g>
      ))}
      {ticks(yEnd, DIVISIONS).map((v) => (
        <text key={`ytick-${v}`} x={left - 8} y={sy(v) + 4} textAnchor="end" style={type.tick}>
          {fmt(v)}
        </text>
      ))}
      <text x={(left + right) / 2} y={bottom + 38} textAnchor="middle" style={type.axisTitle}>
        Corn (tons)
      </text>
      <text x={14} y={(top + bottom) / 2} textAnchor="middle" transform={`rotate(-90, 14, ${(top + bottom) / 2})`} style={type.axisTitle}>
        Fish (tons)
      </text>
    </svg>
  );
}

const Component = observer(({ state }: { state: State }) => {
  const trade = state.trade;
  const t = useRunAnimation(trade, TOTAL_MS);

  if (!trade) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Press Run to draw both countries' production possibilities curves and see what each one consumes after they trade." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const costsShown = t >= PPC_MS;
  const gainsShown = t >= GAIN_AT;

  // The first two stats are what the student's opportunityCost returned, shown bare: a wrong function's number isn't in tons of fish, so no unit is added. The amber tags on the plot give the real opportunity costs to check them against.
  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <Plot trade={trade} t={t} />
      </PluginStage>
      <StatRow
        stats={[
          { label: "Your Arvia opp. cost", value: costsShown ? fmt(trade.arvia.returnedCost) : EMPTY, color: COUNTRY_COLOR.Arvia },
          { label: "Your Bovia opp. cost", value: costsShown ? fmt(trade.bovia.returnedCost) : EMPTY, color: COUNTRY_COLOR.Bovia },
          { label: "Arvia's gain", value: gainsShown ? `${signed(trade.arvia.gain)} fish` : EMPTY, color: COUNTRY_COLOR.Arvia },
          { label: "Bovia's gain", value: gainsShown ? `${signed(trade.bovia.gain)} fish` : EMPTY, color: COUNTRY_COLOR.Bovia },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
