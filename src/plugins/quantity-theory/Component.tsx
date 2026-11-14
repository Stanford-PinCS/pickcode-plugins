import { observer } from "mobx-react-lite";
import { useId, type ReactNode } from "react";
import { VIEW, niceStep, ticks } from "../../common/chart";
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
import State, { type Economy } from "./state";

// Timeline of one run, in ms: the three line graphs draw from year 0 to the last year at a steady pace, and each year's pair of bars rises while the lines move from the year before to that year. The bottom row shows the year the lines have reached.
const DRAW_MS = 2600;

// Colors: the student's price level and the inflation rate worked out from it are the primary series, and the correct price level is the dashed reference. The money supply and its growth rate are the second series, and real output, which no code here changes, the fourth. series[2] is skipped because it's the same amber as the reference.
const YOURS = color.series[0];
const MONEY = color.series[1];
const OUTPUT = color.series[3];

// Layout, in the shared VIEW: three small line graphs side by side on top (money supply, price level, real output), each with its own axis, and one wide bar graph of the growth rates under them.
const EDGE = 6;
const PANEL_GAP = 20;
const SLOT = (VIEW.width - 2 * EDGE - 2 * PANEL_GAP) / 3;
const TITLE_Y = 13;
const KEY_Y = 28;
const TOP_PLOT_TOP = 38;
const TOP_PLOT_BOTTOM = 150;
const TOP_TICK_Y = TOP_PLOT_BOTTOM + 15;
const TOP_AXIS_TITLE_Y = TOP_PLOT_BOTTOM + 31;
const BAR_TITLE_Y = 208;
const BAR_PLOT_TOP = 222;
const BAR_PLOT_BOTTOM = 334;
const BAR_TICK_Y = BAR_PLOT_BOTTOM + 15;
const BAR_AXIS_TITLE_Y = BAR_PLOT_BOTTOM + 32;
// type.tick is a monospace face at 11px, so a label is about this wide per character.
const CHAR_W = 6.6;
// Room right of each small graph, so its last year label stays inside the picture.
const GRAPH_RIGHT_PAD = 8;
// Small dots with no ring, so a line through a dot each year still reads as solid, not dashed like the correct price level.
const DOT_R = 2.5;
// A growth rate above this many percent runs off the top of the bar graph and gets a caret there.
const RATE_CAP = 1000;
// When every growth rate shows as 0%, the bar graph keeps the scale a 5% rate gets, so it doesn't jump between runs.
const FLAT_TOP = 5;

/** Adds thousands separators to a number written out in decimal, with a real minus sign. */
function grouped(text: string): string {
  const [whole, fraction] = text.split(".");
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (fraction === undefined ? withCommas : `${withCommas}.${fraction}`).replace("-", "−");
}

/** A number with at most two decimals and no trailing zeros, like 551.25 or 1,000. A value too small for two decimals keeps three significant digits, like 0.000125. */
function num(v: number): string {
  if (v !== 0 && Math.abs(v) < 0.01) return String(Number(v.toPrecision(3))).replace("-", "−");
  return grouped(String(Number(v.toFixed(2))));
}

/** An amount in billions of dollars: $814.45B. */
const billions = (v: number) => `$${num(v)}B`;

/** A price level with two decimals, like 2.00 or 3.26: whole numbers from 1,000 up, and three significant digits below 0.01. */
function level(v: number): string {
  if (v < 0.01) return String(Number(v.toPrecision(3)));
  return grouped(v >= 1000 ? v.toFixed(0) : v.toFixed(2));
}

/** A growth rate in percent, with at most two decimals and no trailing zeros: 5%, −4.76%. */
const percent = (v: number) => `${grouped(String(Number(v.toFixed(2))))}%`;

/** A tick label with as many decimals as the tick step needs. */
function tickText(v: number, step: number): string {
  const decimals = step >= 1 ? 0 : Math.min(10, Math.ceil(-Math.log10(step) - 1e-9));
  return grouped(v.toFixed(decimals));
}

interface Axis {
  start: number;
  end: number;
  ticks: number[];
  step: number;
}

/** An axis from 0 to a round number at or above `top`. */
function zeroAxis(top: number): Axis {
  const step = niceStep(top, 3);
  const end = Math.max(Math.ceil(top / step - 1e-9), 1) * step;
  const values = ticks(end, 3);
  return { start: 0, end, ticks: values, step: values.length > 1 ? values[1] - values[0] : end };
}

/** The price level axis fits the correct price levels, and the student's too unless they're more than three times as high. Higher ones get carets on the top edge instead, so a wrong answer can't flatten the correct line against the bottom. */
function priceAxis(yours: readonly number[], correct: readonly number[]): Axis {
  const own = Math.max(...correct);
  const theirs = Math.max(...yours);
  return zeroAxis((theirs <= 3 * own ? Math.max(own, theirs) : own) * 1.05);
}

/** The growth-rate axis: from 0, or from a round number below the lowest rate when one is negative, to a round number past the highest rate, which stops at RATE_CAP. Rates that show as 0% don't stretch it. */
function rateAxis(rates: readonly number[]): Axis {
  const shown = rates.filter((r) => Math.abs(r) >= 0.005);
  const low = Math.min(0, ...shown);
  let high = Math.min(Math.max(0, ...shown), RATE_CAP);
  if (low === 0 && high === 0) high = FLAT_TOP;
  const step = niceStep((high - low) * 1.08, 4);
  const start = low < 0 ? Math.floor((low * 1.08) / step) * step : 0;
  const end = high > 0 ? Math.ceil((high * 1.08) / step) * step : 0;
  // chart.ts's ticks only runs from 0 up, and a wrong price level can make inflation negative, so this axis counts whole steps from start to end. The step comes from niceStep on the same range, so that's at most about six ticks.
  const values: number[] = [];
  for (let k = Math.round(start / step); k <= Math.round(end / step); k++) values.push(k * step);
  return { start, end, ticks: values, step };
}

/** The points of a yearly series from year 0 up to `reached`, a year that may fall between two, so a line grows smoothly. Each point is [year, value]. */
function revealed(values: readonly number[], reached: number): [number, number][] {
  const whole = Math.min(Math.floor(reached + 1e-9), values.length - 1);
  const out: [number, number][] = [];
  for (let i = 0; i <= whole; i++) out.push([i, values[i]]);
  const f = reached - whole;
  if (whole < values.length - 1 && f > 1e-9) out.push([reached, values[whole] + (values[whole + 1] - values[whole]) * f]);
  return out;
}

/** A small triangle pointing up, marking a value above the top of its graph. */
function Caret({ x, y, fill }: { x: number; y: number; fill: string }) {
  return <polygon points={`${x - 4},${y + 6} ${x + 4},${y + 6} ${x},${y}`} fill={fill} />;
}

const slotLeft = (slot: number) => EDGE + slot * (SLOT + PANEL_GAP);

interface Line {
  key: string;
  values: readonly number[];
  stroke: string;
  width: number;
  dash?: string;
  /** A dot on each year's point. */
  dots?: boolean;
  /** Carets on the top edge for the years whose value is above the axis. */
  carets?: boolean;
}

/** One of the three small line graphs: years along the bottom, its own axis up the side starting at 0, and its title above. */
function LineGraph({ slot, title, swatch, keys, axis, lines, last, reached }: {
  slot: number;
  title: string;
  swatch?: string;
  keys?: ReactNode;
  axis: Axis;
  lines: readonly Line[];
  last: number;
  reached: number;
}) {
  const clipId = `quantity-theory-${slot}-${useId().replace(/:/g, "")}`;
  const tickLabels = axis.ticks.map((v) => tickText(v, axis.step));
  const x0 = slotLeft(slot);
  const left = x0 + Math.max(...tickLabels.map((s) => s.length)) * CHAR_W + 8;
  const right = x0 + SLOT - GRAPH_RIGHT_PAD;
  const sx = (year: number) => left + (year / last) * (right - left);
  const sy = (v: number) => TOP_PLOT_BOTTOM - (v / axis.end) * (TOP_PLOT_BOTTOM - TOP_PLOT_TOP);
  const whole = Math.min(Math.floor(reached + 1e-9), last);
  // Dots only when the years are far enough apart to keep them from running together.
  const dotsFit = (right - left) / last >= 8;

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={left} y={TOP_PLOT_TOP - 3} width={right - left + 3} height={TOP_PLOT_BOTTOM - TOP_PLOT_TOP + 6} />
        </clipPath>
      </defs>

      {swatch && <line x1={x0} y1={TITLE_Y - 4} x2={x0 + 12} y2={TITLE_Y - 4} stroke={swatch} strokeWidth={2.5} />}
      <text x={x0 + (swatch ? 17 : 0)} y={TITLE_Y} style={type.axisTitle}>
        {title}
      </text>
      {keys}

      {axis.ticks.map((v, i) => (
        <g key={`y-${v}`}>
          {v !== 0 && <line x1={left} y1={sy(v)} x2={right} y2={sy(v)} stroke={color.grid} />}
          <text x={left - 6} y={sy(v) + 4} textAnchor="end" style={type.tick}>
            {tickLabels[i]}
          </text>
        </g>
      ))}

      <g clipPath={`url(#${clipId})`}>
        {lines.map((line) => {
          const points = revealed(line.values, reached).map(([year, v]) => `${sx(year)},${sy(v)}`);
          return (
            <g key={line.key}>
              {points.length > 1 && <polyline points={points.join(" ")} fill="none" stroke={line.stroke} strokeWidth={line.width} strokeDasharray={line.dash} strokeLinejoin="round" />}
              {line.dots && dotsFit && line.values.slice(0, whole + 1).map((v, i) => <circle key={i} cx={sx(i)} cy={sy(v)} r={DOT_R} fill={line.stroke} />)}
            </g>
          );
        })}
      </g>

      {lines.map((line) => line.carets && line.values.slice(0, whole + 1).map((v, i) => (v > axis.end ? <Caret key={`${line.key}-caret-${i}`} x={sx(i)} y={TOP_PLOT_TOP - 4} fill={line.stroke} /> : null)))}

      <line x1={left} y1={TOP_PLOT_BOTTOM} x2={right} y2={TOP_PLOT_BOTTOM} stroke={color.axis} />
      <line x1={left} y1={TOP_PLOT_TOP} x2={left} y2={TOP_PLOT_BOTTOM} stroke={color.axis} />
      {ticks(last, Math.min(last, 3)).map((year) => (
        <g key={`x-${year}`}>
          <line x1={sx(year)} y1={TOP_PLOT_BOTTOM} x2={sx(year)} y2={TOP_PLOT_BOTTOM + 4} stroke={color.axis} />
          <text x={sx(year)} y={TOP_TICK_Y} textAnchor="middle" style={type.tick}>
            {year}
          </text>
        </g>
      ))}
    </g>
  );
}

/** The bar graph: for each year after year 0, the money growth rate and the inflation rate side by side. */
function GrowthBars({ moneyGrowth, inflation, last, reached }: { moneyGrowth: readonly number[]; inflation: readonly number[]; last: number; reached: number }) {
  const axis = rateAxis([...moneyGrowth, ...inflation]);
  const tickLabels = axis.ticks.map((v) => `${tickText(v, axis.step)}%`);
  const left = EDGE + Math.max(...tickLabels.map((s) => s.length)) * CHAR_W + 8;
  const right = VIEW.width - EDGE;
  const slot = (right - left) / last;
  const sy = (v: number) => BAR_PLOT_BOTTOM - ((v - axis.start) / (axis.end - axis.start)) * (BAR_PLOT_BOTTOM - BAR_PLOT_TOP);
  const zeroY = sy(0);
  // A 2-unit gap between the two bars of a year, narrower when there are many years.
  const gap = Math.min(2, slot * 0.08);
  const barWidth = Math.max((slot * 0.62 - gap) / 2, 0.75);
  const yearLabels = last <= 12 ? Array.from({ length: last }, (_, i) => i + 1) : ticks(last, 10).filter((year) => year >= 1);

  // The key sits at the right end of the title row: a square, then its name, for each series.
  const inflationTextX = right - "Inflation".length * CHAR_W;
  const growthTextX = inflationTextX - 14 - 14 - "Money growth".length * CHAR_W;

  return (
    <g>
      <text x={EDGE} y={BAR_TITLE_Y} style={type.axisTitle}>
        Growth rate from the year before (%)
      </text>
      <rect x={growthTextX - 14} y={BAR_TITLE_Y - 9} width={10} height={10} fill={MONEY} />
      <text x={growthTextX} y={BAR_TITLE_Y} style={type.tick}>
        Money growth
      </text>
      <rect x={inflationTextX - 14} y={BAR_TITLE_Y - 9} width={10} height={10} fill={YOURS} />
      <text x={inflationTextX} y={BAR_TITLE_Y} style={type.tick}>
        Inflation
      </text>

      {axis.ticks.map((v, i) => (
        <g key={`y-${v}`}>
          {v !== 0 && <line x1={left} y1={sy(v)} x2={right} y2={sy(v)} stroke={color.grid} />}
          <text x={left - 6} y={sy(v) + 4} textAnchor="end" style={type.tick}>
            {tickLabels[i]}
          </text>
        </g>
      ))}

      {moneyGrowth.map((growth, i) => {
        const year = i + 1;
        // Each year's bars rise while the lines move from the year before to that year.
        const rise = easeInOut(progressBetween(reached, year - 1, 1));
        if (rise <= 0) return null;
        const center = left + (year - 0.5) * slot;
        const bars = [
          { key: "money", x: center - gap / 2 - barWidth, value: growth, fill: MONEY },
          { key: "inflation", x: center + gap / 2, value: inflation[i], fill: YOURS },
        ];
        return (
          <g key={`year-${year}`}>
            {bars.map((bar) => {
              const top = sy(Math.min(Math.max(bar.value, axis.start), axis.end) * rise);
              return (
                <g key={bar.key}>
                  <rect x={bar.x} y={Math.min(top, zeroY)} width={barWidth} height={Math.abs(zeroY - top)} fill={bar.fill} />
                  {bar.value > axis.end && rise >= 1 && <Caret x={bar.x + barWidth / 2} y={BAR_PLOT_TOP - 9} fill={bar.fill} />}
                </g>
              );
            })}
          </g>
        );
      })}

      <line x1={left} y1={zeroY} x2={right} y2={zeroY} stroke={color.axis} />
      <line x1={left} y1={BAR_PLOT_TOP} x2={left} y2={BAR_PLOT_BOTTOM} stroke={color.axis} />
      {yearLabels.map((year) => (
        <text key={`x-${year}`} x={left + (year - 0.5) * slot} y={BAR_TICK_Y} textAnchor="middle" style={type.tick}>
          {year}
        </text>
      ))}
      <text x={(left + right) / 2} y={BAR_AXIS_TITLE_Y} textAnchor="middle" style={type.axisTitle}>
        Year
      </text>
    </g>
  );
}

/** "5% every year" when a series shows the same in every year. Otherwise its first and last values with their years, plus its highest or lowest value when that lies beyond both ends, so a series that rises or falls and comes back doesn't read as flat. */
function fromTo(values: readonly number[], firstYear: number, show: (v: number) => string): string {
  const first = show(values[0]);
  if (values.every((v) => show(v) === first)) return `${first} every year`;
  const lastIndex = values.length - 1;
  const ends = [values[0], values[lastIndex]];
  const endsShown = ends.map(show);
  let text = `${first} in year ${firstYear} to ${endsShown[1]} in year ${firstYear + lastIndex}`;
  const high = values.indexOf(Math.max(...values));
  const low = values.indexOf(Math.min(...values));
  if (values[high] > Math.max(...ends) && !endsShown.includes(show(values[high]))) text += `, highest ${show(values[high])} in year ${firstYear + high}`;
  if (values[low] < Math.min(...ends) && !endsShown.includes(show(values[low]))) text += `, lowest ${show(values[low])} in year ${firstYear + low}`;
  return text;
}

function Plot({ economy, t }: { economy: Economy; t: number }) {
  const { moneySupply, priceLevels, correctPriceLevels, realOutput, moneyGrowth, inflation } = economy;
  const last = moneySupply.length - 1;
  const reached = last * progressBetween(t, 0, DRAW_MS);
  const output = moneySupply.map(() => realOutput);
  const keyX = slotLeft(1);

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
      role="img"
      aria-label={`Line graphs of the money supply, the price level and real output from year 0 to year ${last}, and a bar graph of each year's money growth and inflation rates. Money supply: ${fromTo(moneySupply, 0, billions)}. Your price level: ${fromTo(priceLevels, 0, level)}. Correct price level: ${fromTo(correctPriceLevels, 0, level)}. Real output: ${billions(realOutput)} every year. Money growth: ${fromTo(moneyGrowth, 1, percent)}. Inflation: ${fromTo(inflation, 1, percent)}.`}
    >
      <LineGraph
        slot={0}
        title="Money supply, M ($B)"
        swatch={MONEY}
        axis={zeroAxis(Math.max(...moneySupply) * 1.05)}
        lines={[{ key: "money", values: moneySupply, stroke: MONEY, width: 2, dots: true }]}
        last={last}
        reached={reached}
      />
      <LineGraph
        slot={1}
        title="Price level, P"
        keys={
          <g>
            <line x1={keyX} y1={KEY_Y - 4} x2={keyX + 14} y2={KEY_Y - 4} stroke={YOURS} strokeWidth={2.5} />
            <text x={keyX + 18} y={KEY_Y} style={type.tick}>
              Yours
            </text>
            <line x1={keyX + 64} y1={KEY_Y - 4} x2={keyX + 78} y2={KEY_Y - 4} stroke={color.reference} strokeWidth={2} strokeDasharray="4 3" />
            <text x={keyX + 82} y={KEY_Y} style={type.tick}>
              Correct
            </text>
          </g>
        }
        axis={priceAxis(priceLevels, correctPriceLevels)}
        lines={[
          { key: "yours", values: priceLevels, stroke: YOURS, width: 2.5, dots: true, carets: true },
          // The correct price level, thinner and on top, so it shows through when the student's line lies on it.
          { key: "correct", values: correctPriceLevels, stroke: color.reference, width: 1.5, dash: "5 4" },
        ]}
        last={last}
        reached={reached}
      />
      <LineGraph
        slot={2}
        title="Real output, Y ($B)"
        swatch={OUTPUT}
        axis={zeroAxis(realOutput * 1.05)}
        lines={[{ key: "output", values: output, stroke: OUTPUT, width: 2, dots: true }]}
        last={last}
        reached={reached}
      />
      <text x={VIEW.width / 2} y={TOP_AXIS_TITLE_Y} textAnchor="middle" style={type.axisTitle}>
        Year
      </text>

      <GrowthBars moneyGrowth={moneyGrowth} inflation={inflation} last={last} reached={reached} />
    </svg>
  );
}

const Component = observer(({ state }: { state: State }) => {
  const economy = state.economy;
  const t = useRunAnimation(economy, DRAW_MS);

  if (!economy) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Press Run to follow Selvaro's money supply, price level and real output year by year, with each year's money growth and inflation." />
        </PluginStage>
      </PluginSurface>
    );
  }

  // The bottom row shows the year the lines have reached. Year 0 has no year before it, so it has no growth rates.
  const last = economy.moneySupply.length - 1;
  const year = Math.min(Math.floor(last * progressBetween(t, 0, DRAW_MS) + 1e-9), last);

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <Plot economy={economy} t={t} />
      </PluginStage>
      <StatRow
        stats={[
          { label: "Year", value: String(year) },
          { label: "Money supply", value: billions(economy.moneySupply[year]), color: MONEY },
          { label: "Price level", value: level(economy.priceLevels[year]), color: YOURS },
          { label: "Money growth", value: year > 0 ? percent(economy.moneyGrowth[year - 1]) : EMPTY, color: MONEY },
          { label: "Inflation", value: year > 0 ? percent(economy.inflation[year - 1]) : EMPTY, color: YOURS },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
