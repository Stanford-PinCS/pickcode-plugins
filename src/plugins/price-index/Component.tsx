import { observer } from "mobx-react-lite";
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
import State, { type PriceIndexRun } from "./state";

// Timeline of one run, in ms: the CPI bars rise one year at a time, each with its basket cost under it, then the correct CPI marks fade in. The inflation rates appear one year at a time. Then the wage bars rise one year at a time and the correct real wage marks fade in.
const CPI_PHASE_MS = 1100;
const RISE_MS = 450;
const MARK_DELAY_MS = 100;
const MARK_MS = 300;
const INFLATION_DELAY_MS = 100;
const INFLATION_PHASE_MS = 600;
const FADE_MS = 250;
const WAGE_DELAY_MS = 150;
const WAGE_PHASE_MS = 900;

// Layout, in the shared VIEW width: a legend, the CPI graph, rows of numbers under it (the years, the basket costs and the inflation rates), then the wage graph. The left edge leaves room for the row titles.
const LEFT = 104;
const RIGHT = VIEW.width - 16;
const LEGEND_Y = 14;
const CPI_TOP = 34;
const CPI_BOTTOM = 150;
const YEAR_ROW_Y = 166;
const COST_ROW_Y = 183;
const YOURS_ROW_Y = 199;
const RATE_ROW_Y = 215;
const WAGE_TOP = 240;
const WAGE_BOTTOM = 350;
const WAGE_YEAR_ROW_Y = 366;
const HEIGHT = 376;
const ROW_TITLE_X = LEFT - 8;
const Y_TITLE_X = 14;
// Share of each year's slot that its CPI bar fills, and the most room (as a share of the axis) left above the tallest bar for its label.
const CPI_BAR_SHARE = 0.46;
const CPI_ROOM = 0.18;
const WAGE_ROOM = 0.3;
// How far a correct-value mark reaches past each side of its bar.
const MARK_OVERHANG = 4;
// type.tick is a monospace face at 11px: each character is about 6.6 wide, and a line of it needs about 12 of height to clear the next.
const CHAR_W = 6.6;
const LINE_H = 12;
// The narrowest a CPI bar gets: wide enough to hold a six-character label like 103.57 inside it. With 5 or 6 years, CPI_BAR_SHARE of a slot would be narrower; with at most 6 years a slot is 70 wide, so the bar still leaves a gap.
const CPI_BAR_MIN = Math.ceil(6 * CHAR_W + 4);

// A value closer to 0 than this is floating-point noise and is shown as 0. When two years' baskets cost exactly the same at different prices, the inflation rate between them comes out as about 2.8e-14 instead of 0.
const NOISE = 1e-9;

/** A number with at most two decimals and no trailing zeros, with thousands separators and a true minus sign, like 1,250 or −3.57. A number of 100,000 or more is written in short form, like 250K or 2.5M, so no label is wider than a year's column, and one that isn't 0 but would round to 0 keeps two significant digits, like 0.0014, never in e-notation. Noise (under NOISE) is 0. */
function fmt(v: number): string {
  const a = Math.abs(v) < NOISE ? 0 : Math.abs(v);
  let text: string;
  if (a >= 1e5) text = a.toLocaleString("en-US", { notation: "compact", maximumSignificantDigits: 3 });
  else if (a !== 0 && a < 0.005) text = a.toLocaleString("en-US", { maximumSignificantDigits: 2 });
  else text = a.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return v < 0 && text !== "0" ? `−${text}` : text;
}

/** Dollars with thousands separators, and cents only when the amount isn't a whole number of dollars: $1,400, $37.50. An amount of $100,000 or more is written in short form, like $250K or $2.5M, so no label is wider than a year's column, and an amount that isn't 0 but would round to $0.00 keeps two significant digits, never in e-notation. Noise (under NOISE) is $0. */
function money(v: number): string {
  const a = Math.abs(v) < NOISE ? 0 : Math.abs(v);
  const cents = Math.round(a * 100);
  let text: string;
  if (a >= 1e5) text = a.toLocaleString("en-US", { notation: "compact", maximumSignificantDigits: 3 });
  else if (a !== 0 && cents === 0) text = a.toLocaleString("en-US", { maximumSignificantDigits: 2 });
  else text = (cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 });
  return `${v < 0 && text !== "0" ? "−" : ""}$${text}`;
}

/** A change with its sign in front, like +25, −10 or 0. */
function signed(v: number): string {
  const text = fmt(Math.abs(v));
  if (text === "0") return "0";
  return `${v < 0 ? "−" : "+"}${text}`;
}

/** A percentage change with its sign in front, like +25% or −10%. */
const percentSigned = (v: number) => `${signed(v)}%`;

/** The end of an axis that starts at 0: past the largest value by `room` of it, rounded up to a round tick step. */
function axisEnd(max: number, divisions: number, room: number): number {
  const top = Math.max(max * (1 + room), 1e-9);
  const step = niceStep(top, divisions);
  return Math.max(Math.ceil(top / step - 1e-9), 1) * step;
}

const yearName = (year: number) => (year === 0 ? "Base year" : `Year ${year}`);

interface Timing {
  /** When each year's CPI bar starts to rise. */
  cpiStart: (year: number) => number;
  cpiDone: number;
  cpiMarkAt: number;
  /** When each year's inflation rate (year 1 on) starts to fade in. */
  inflationStart: (year: number) => number;
  inflationDone: number;
  /** When each year's wage bars start to rise. */
  wageStart: (year: number) => number;
  wageDone: number;
  wageMarkAt: number;
  total: number;
}

function timingFor(years: number): Timing {
  const cpiStagger = (CPI_PHASE_MS - RISE_MS) / Math.max(years - 1, 1);
  const cpiStart = (year: number) => year * cpiStagger;
  const cpiDone = cpiStart(years - 1) + RISE_MS;
  const cpiMarkAt = cpiDone + MARK_DELAY_MS;
  const inflationAt = cpiMarkAt + MARK_MS + INFLATION_DELAY_MS;
  const inflationStagger = (INFLATION_PHASE_MS - FADE_MS) / Math.max(years - 2, 1);
  const inflationStart = (year: number) => inflationAt + (year - 1) * inflationStagger;
  const inflationDone = inflationStart(years - 1) + FADE_MS;
  const wageAt = inflationDone + WAGE_DELAY_MS;
  const wageStagger = (WAGE_PHASE_MS - RISE_MS) / Math.max(years - 1, 1);
  const wageStart = (year: number) => wageAt + year * wageStagger;
  const wageDone = wageStart(years - 1) + RISE_MS;
  const wageMarkAt = wageDone + MARK_DELAY_MS;
  return { cpiStart, cpiDone, cpiMarkAt, inflationStart, inflationDone, wageStart, wageDone, wageMarkAt, total: wageMarkAt + MARK_MS };
}

/** The data in words, for screen readers. */
function describeRun(run: PriceIndexRun): string {
  const list = (values: readonly number[], write: (v: number) => string) => values.map(write).join(", ");
  const basket = run.goods.map((good, i) => `${good} (quantity ${fmt(run.quantities[i])})`).join(", ");
  return (
    `A fixed basket of ${basket}, priced in the base year and ${run.years - 1} more year${run.years === 2 ? "" : "s"}. ` +
    `Your basket costs: ${list(run.costs, money)}. Your CPI: ${list(run.cpis, fmt)}; the correct CPI: ${list(run.correct.cpis, fmt)}. ` +
    `Your inflation rates from year 1 on: ${list(run.inflation, signed)}; the correct inflation rates: ${list(run.correct.inflation, percentSigned)}. ` +
    `Nominal wage: ${list(run.wages, money)}. Your real wage: ${list(run.realWages, money)}; the correct real wage: ${list(run.correct.realWages, money)}.`
  );
}

/** A label above a bar: the middle of its baseline, and its text. */
interface BarLabel {
  x: number;
  y: number;
  text: string;
}

/** Whether a bar's correct-value mark at `markY` would run through a label just above the bar, whose top is at `top`. */
const markCrosses = (top: number, markY: number) => markY > top - 6 - LINE_H + 1 && markY < top - 2;

/** The baseline of a label just above a bar whose top is at `top`. When the bar's correct-value mark at `markY` would run through the label, the label sits just above the mark instead. */
function labelAbove(top: number, markY: number): number {
  return markCrosses(top, markY) ? markY - 6 : top - 6;
}

/** Where a CPI bar's label goes: just above the bar, unless the correct-value mark would run through it there. Then the label goes inside the bar, just under its top, so it stays with its own bar instead of reading as the mark's label. Only a bar too short or too narrow to hold the label has it just above the mark. */
function cpiLabelPlace(top: number, markY: number, text: string, barW: number): { y: number; inside: boolean } {
  if (!markCrosses(top, markY)) return { y: top - 6, inside: false };
  const fits = CPI_BOTTOM - top >= LINE_H + 4 && text.length * CHAR_W <= barW - 4;
  return fits ? { y: top + LINE_H, inside: true } : { y: markY - 6, inside: false };
}

/** Whether two labels are far enough apart, side by side or one above the other, not to run into each other. */
const clear = (a: BarLabel, b: BarLabel) =>
  Math.abs(a.x - b.x) >= ((a.text.length + b.text.length) * CHAR_W) / 2 + 3 || Math.abs(a.y - b.y) >= LINE_H;

/** Places labels from the lowest up: each at its own spot, or lifted one or two lines to clear the labels already placed, but never with its top above `top`. So when two bars side by side end near the same height, the shorter bar's label stays on it and the taller bar's moves up. A label that still runs into one is left off (null); its value is still in the aria-label. Returns the labels in the order they came. */
function placeLabels(labels: readonly BarLabel[], top: number): (BarLabel | null)[] {
  const placed: BarLabel[] = [];
  const result: (BarLabel | null)[] = labels.map(() => null);
  const lowestFirst = labels.map((label, i) => ({ label, i })).sort((a, b) => b.label.y - a.label.y || a.i - b.i);
  for (const { label, i } of lowestFirst) {
    for (let lift = 0; lift <= 2; lift++) {
      const spot = { ...label, y: label.y - lift * LINE_H };
      if (spot.y - LINE_H + 3 < top) break;
      if (placed.every((p) => clear(p, spot))) {
        placed.push(spot);
        result[i] = spot;
        break;
      }
    }
  }
  return result;
}

// A stroke in the background color behind each letter keeps a label readable where it crosses a bar, a mark or a grid line.
const HALO = { stroke: color.surface, strokeWidth: 3, strokeLinejoin: "round", paintOrder: "stroke" } as const;

function Plot({ run, t, timing }: { run: PriceIndexRun; t: number; timing: Timing }) {
  const { years, correct } = run;
  const slot = (RIGHT - LEFT) / years;
  const center = (year: number) => LEFT + slot * (year + 0.5);

  const cpiEnd = axisEnd(Math.max(...run.cpis, ...correct.cpis), 4, CPI_ROOM);
  const syCpi = (v: number) => CPI_BOTTOM - (v / cpiEnd) * (CPI_BOTTOM - CPI_TOP);
  const wageEnd = axisEnd(Math.max(...run.wages, ...run.realWages, ...correct.realWages), 4, WAGE_ROOM);
  const syWage = (v: number) => WAGE_BOTTOM - (v / wageEnd) * (WAGE_BOTTOM - WAGE_TOP);

  const cpiBarW = Math.max(slot * CPI_BAR_SHARE, CPI_BAR_MIN);
  const wageBarW = Math.min(30, slot * 0.29);
  const wageGap = wageBarW * 0.3;

  const cpiRise = (year: number) => easeInOut(progressBetween(t, timing.cpiStart(year), RISE_MS));
  const cpiSettled = (year: number) => progressBetween(t, timing.cpiStart(year) + RISE_MS * 0.7, RISE_MS * 0.3);
  const cpiMarkP = progressBetween(t, timing.cpiMarkAt, MARK_MS);
  const inflationP = (year: number) => progressBetween(t, timing.inflationStart(year), FADE_MS);
  const wageRise = (year: number) => easeInOut(progressBetween(t, timing.wageStart(year), RISE_MS));
  const wageSettled = (year: number) => progressBetween(t, timing.wageStart(year) + RISE_MS * 0.7, RISE_MS * 0.3);
  const wageMarkP = progressBetween(t, timing.wageMarkAt, MARK_MS);
  const yearList = Array.from({ length: years }, (_, year) => year);

  // Each year's nominal wage label goes above its bar, and its real wage label above its bar, or above the correct-value mark when the mark would run through it. Then they're placed from the lowest up so that none runs into another, staying below the inflation rate row.
  const nominalX = (year: number) => center(year) - wageGap / 2 - wageBarW;
  const realX = (year: number) => center(year) + wageGap / 2;
  const wageLabels = placeLabels(
    yearList.flatMap((year) => [
      { x: nominalX(year) + wageBarW / 2, y: syWage(run.wages[year]) - 6, text: money(run.wages[year]) },
      { x: realX(year) + wageBarW / 2, y: labelAbove(syWage(run.realWages[year]), syWage(correct.realWages[year])), text: money(run.realWages[year]) },
    ]),
    RATE_ROW_Y + 6
  );

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
      role="img"
      aria-label={describeRun(run)}
    >
      <text x={VIEW.width / 2} y={LEGEND_Y} textAnchor="middle" style={type.tick}>
        <tspan fill={color.series[0]}>■</tspan>
        <tspan> Your CPI and real wage</tspan>
        <tspan dx={14} fill={color.series[1]}>■</tspan>
        <tspan> Nominal wage</tspan>
        <tspan dx={14} fill={color.reference} fontWeight={700}>- -</tspan>
        <tspan> Correct</tspan>
      </text>

      {/* The CPI graph: one bar per year, from the student's cpi, with the correct CPI marked across it. Every bar in both graphs is fully opaque, so a label in the background color inside a CPI bar has the same contrast as pink text on the background; a see-through bar is lighter and lowers it. */}
      {ticks(cpiEnd, 4).map((v) => (
        <g key={`cpi-grid-${v}`}>
          {v > 0 && <line x1={LEFT} y1={syCpi(v)} x2={RIGHT} y2={syCpi(v)} stroke={color.grid} />}
          <text x={LEFT - 8} y={syCpi(v) + 4} textAnchor="end" style={type.tick}>
            {fmt(v)}
          </text>
        </g>
      ))}
      {yearList.map((year) => {
        const rise = cpiRise(year);
        if (rise <= 0) return null;
        const x = center(year) - cpiBarW / 2;
        const top = syCpi(run.cpis[year] * rise);
        return (
          <g key={`cpi-${year}`}>
            <rect x={x} y={top} width={cpiBarW} height={CPI_BOTTOM - top} fill={color.series[0]} />
            {/* The bar's top edge, so even a bar too short to see shows where it ends. */}
            <line x1={x} y1={top} x2={x + cpiBarW} y2={top} stroke={color.series[0]} strokeWidth={2} />
          </g>
        );
      })}
      {cpiMarkP > 0 &&
        yearList.map((year) => {
          const y = syCpi(correct.cpis[year]);
          const x = center(year) - cpiBarW / 2;
          return (
            <line key={`cpi-mark-${year}`} x1={x - MARK_OVERHANG} y1={y} x2={x + cpiBarW + MARK_OVERHANG} y2={y} stroke={color.reference} strokeWidth={2.5} strokeDasharray="5 3" opacity={cpiMarkP} />
          );
        })}
      {/* Each bar's value, drawn after every bar and mark so nothing covers it: in pink above the bar, or in the background color inside it. */}
      {yearList.map((year) => {
        const text = fmt(run.cpis[year]);
        const place = cpiLabelPlace(syCpi(run.cpis[year]), syCpi(correct.cpis[year]), text, cpiBarW);
        return (
          <text
            key={`cpi-label-${year}`}
            x={center(year)}
            y={place.y}
            textAnchor="middle"
            opacity={cpiSettled(year)}
            {...(place.inside ? {} : HALO)}
            style={{ ...type.tick, fill: place.inside ? color.surface : color.series[0], fontWeight: 600 }}
          >
            {text}
          </text>
        );
      })}
      <line x1={LEFT} y1={CPI_BOTTOM} x2={RIGHT} y2={CPI_BOTTOM} stroke={color.axis} />
      <line x1={LEFT} y1={CPI_TOP} x2={LEFT} y2={CPI_BOTTOM} stroke={color.axis} />
      <text x={Y_TITLE_X} y={(CPI_TOP + CPI_BOTTOM) / 2} textAnchor="middle" transform={`rotate(-90, ${Y_TITLE_X}, ${(CPI_TOP + CPI_BOTTOM) / 2})`} style={type.axisTitle}>
        CPI (base year = 100)
      </text>

      {/* Under the CPI graph: each year, what the student's basketCost returned and what their inflationRate returned (from the year before), both in pink, and the correct inflation rate in amber. */}
      <g style={type.tick}>
        <text x={ROW_TITLE_X} y={COST_ROW_Y} textAnchor="end" fill={color.series[0]}>
          Basket cost
        </text>
        <text x={ROW_TITLE_X} y={YOURS_ROW_Y} textAnchor="end" fill={color.series[0]}>
          Your inflation
        </text>
        <text x={ROW_TITLE_X} y={RATE_ROW_Y} textAnchor="end" fill={color.reference}>
          Inflation rate
        </text>
      </g>
      {yearList.map((year) => (
        <g key={`row-${year}`} style={type.tick}>
          <text x={center(year)} y={YEAR_ROW_Y} textAnchor="middle" fill={color.ink}>
            {yearName(year)}
          </text>
          <text x={center(year)} y={COST_ROW_Y} textAnchor="middle" opacity={cpiSettled(year)} fill={color.series[0]} fontWeight={600}>
            {money(run.costs[year])}
          </text>
          {year === 0 ? (
            <g opacity={progressBetween(t, timing.inflationStart(1), FADE_MS)}>
              <text x={center(year)} y={YOURS_ROW_Y} textAnchor="middle">
                {EMPTY}
              </text>
              <text x={center(year)} y={RATE_ROW_Y} textAnchor="middle">
                {EMPTY}
              </text>
            </g>
          ) : (
            <g opacity={inflationP(year)} fontWeight={600}>
              <text x={center(year)} y={YOURS_ROW_Y} textAnchor="middle" fill={color.series[0]}>
                {signed(run.inflation[year - 1])}
              </text>
              <text x={center(year)} y={RATE_ROW_Y} textAnchor="middle" fill={color.reference}>
                {percentSigned(correct.inflation[year - 1])}
              </text>
            </g>
          )}
        </g>
      ))}

      {/* The wage graph: for each year, the nominal wage beside the student's real wage, with the correct real wage marked across it. */}
      {ticks(wageEnd, 4).map((v) => (
        <g key={`wage-grid-${v}`}>
          {v > 0 && <line x1={LEFT} y1={syWage(v)} x2={RIGHT} y2={syWage(v)} stroke={color.grid} />}
          <text x={LEFT - 8} y={syWage(v) + 4} textAnchor="end" style={type.tick}>
            {money(v)}
          </text>
        </g>
      ))}
      {yearList.map((year) => {
        const rise = wageRise(year);
        if (rise <= 0) return null;
        const nominalTop = syWage(run.wages[year] * rise);
        const realTop = syWage(run.realWages[year] * rise);
        return (
          <g key={`wage-${year}`}>
            <rect x={nominalX(year)} y={nominalTop} width={wageBarW} height={WAGE_BOTTOM - nominalTop} fill={color.series[1]} />
            <line x1={nominalX(year)} y1={nominalTop} x2={nominalX(year) + wageBarW} y2={nominalTop} stroke={color.series[1]} strokeWidth={2} />
            <rect x={realX(year)} y={realTop} width={wageBarW} height={WAGE_BOTTOM - realTop} fill={color.series[0]} />
            <line x1={realX(year)} y1={realTop} x2={realX(year) + wageBarW} y2={realTop} stroke={color.series[0]} strokeWidth={2} />
          </g>
        );
      })}
      {wageMarkP > 0 &&
        yearList.map((year) => {
          const y = syWage(correct.realWages[year]);
          const x = realX(year);
          return (
            <line key={`wage-mark-${year}`} x1={x - MARK_OVERHANG} y1={y} x2={x + wageBarW + MARK_OVERHANG} y2={y} stroke={color.reference} strokeWidth={2.5} strokeDasharray="5 3" opacity={wageMarkP} />
          );
        })}
      {/* Each wage bar's value, drawn after every bar and mark so nothing covers it. */}
      {yearList.map((year) => {
        const nominalLabel = wageLabels[2 * year];
        const realLabel = wageLabels[2 * year + 1];
        return (
          <g key={`wage-labels-${year}`} opacity={wageSettled(year)} style={{ ...type.tick, fontWeight: 600 }} {...HALO}>
            {nominalLabel && (
              <text x={nominalLabel.x} y={nominalLabel.y} textAnchor="middle" fill={color.series[1]}>
                {nominalLabel.text}
              </text>
            )}
            {realLabel && (
              <text x={realLabel.x} y={realLabel.y} textAnchor="middle" fill={color.series[0]}>
                {realLabel.text}
              </text>
            )}
          </g>
        );
      })}
      <line x1={LEFT} y1={WAGE_BOTTOM} x2={RIGHT} y2={WAGE_BOTTOM} stroke={color.axis} />
      <line x1={LEFT} y1={WAGE_TOP} x2={LEFT} y2={WAGE_BOTTOM} stroke={color.axis} />
      {yearList.map((year) => (
        <text key={`wage-year-${year}`} x={center(year)} y={WAGE_YEAR_ROW_Y} textAnchor="middle" style={{ ...type.tick, fill: color.ink }}>
          {yearName(year)}
        </text>
      ))}
      <text x={Y_TITLE_X} y={(WAGE_TOP + WAGE_BOTTOM) / 2} textAnchor="middle" transform={`rotate(-90, ${Y_TITLE_X}, ${(WAGE_TOP + WAGE_BOTTOM) / 2})`} style={type.axisTitle}>
        Wage ($ per hour)
      </text>
    </svg>
  );
}

const Component = observer(({ state }: { state: State }) => {
  const run = state.run;
  const timing = run ? timingFor(run.years) : null;
  const t = useRunAnimation(run, timing?.total ?? 0);

  if (!run || !timing) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Press Run to build a consumer price index from a basket of goods and services, measure inflation, and compare a wage with prices." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const last = run.years - 1;
  const costShown = t >= timing.cpiStart(0) + RISE_MS;
  const cpiShown = t >= timing.cpiDone;
  const inflationShown = t >= timing.inflationDone;
  const wagesShown = t >= timing.wageDone;

  // Every stat but the wage is what the student's own functions returned. The inflation rate is shown bare, with no % sign: the starter's inflationRate returns a change in index points, not a percentage, and the graph's amber row gives the correct percentages to check it against.
  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <Plot run={run} t={t} timing={timing} />
      </PluginStage>
      <StatRow
        stats={[
          { label: "Base cost", value: costShown ? money(run.costs[0]) : EMPTY, color: color.series[0] },
          { label: `Year ${last} CPI`, value: cpiShown ? fmt(run.cpis[last]) : EMPTY, color: color.series[0] },
          { label: `Year ${last} inflation`, value: inflationShown ? signed(run.inflation[last - 1]) : EMPTY, color: color.series[0] },
          { label: `Year ${last} wage`, value: wagesShown ? money(run.wages[last]) : EMPTY, color: color.series[1] },
          { label: `Year ${last} real wage`, value: wagesShown ? money(run.realWages[last]) : EMPTY, color: color.series[0] },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
