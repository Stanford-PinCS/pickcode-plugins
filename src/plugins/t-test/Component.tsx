import { observer } from "mobx-react-lite";
import { VIEW, niceStep } from "../../common/chart";
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
import type { Alternative } from "./messages";
import State, { ALPHA, tDensity, type SimulationResult, type TestResult } from "./state";

// Timeline of one test, in ms: the dots drop in while the t-distribution draws, then x̄ appears, the x̄ ± s bar opens out, the observed t slides out from 0, the p-value's tail area fills in, and the decision appears last.
const DOTS_MS = 1000;
const DROP_MS = 260;
const CURVE_MS = 900;
const MEAN_AT = 1150;
const MEAN_MS = 300;
const S_AT = 1500;
const S_MS = 450;
const T_AT = 2050;
const T_MS = 650;
const TAIL_AT = 2750;
const TAIL_MS = 400;
const DECISION_AT = 3200;
const DECISION_MS = 300;
const TEST_MS = DECISION_AT + DECISION_MS;

// Timeline of a simulation: the samples pile into both histograms one after another.
const SAMPLES_MS = 2600;
const SIM_MS = SAMPLES_MS + 300;

// Layout, in the shared VIEW. Top: the sample on a number line in grams. Bottom: the t-distribution.
const LEFT = 40;
const RIGHT = VIEW.width - 40;
const LABEL_Y = 16;
const MARK_TOP = 22;
const BAR_Y = 40;
const DOT_TOP = 52;
const HIST_TOP = 34;
const AXIS_TOP = 124;
const HEAD1_Y = 192;
const HEAD2_Y = 207;
const CURVE_TOP = 220;
const AXIS_T = 338;
const HEIGHT = AXIS_T + 48;
const MAX_DOT_R = 6;
const CAP_HALF = 6;
/** Left edge of the simulation's legend, top right of the bottom panel. */
const LEGEND_X = RIGHT - 222;
/** About how wide one character of tick text is, for keeping labels apart. */
const CHAR_W = 6.6;

/** Shows a number with at most two decimals, no trailing zeros, and a real minus sign. */
const fmt = (v: number) => String(Number(v.toFixed(2))).replace("-", "−");
const fmt3 = (v: number) => String(Number(v.toFixed(3))).replace("-", "−");
const fmtP = (p: number) => (p < 0.001 ? "< 0.001" : p.toFixed(3));
const pText = (p: number) => (p < 0.001 ? "p-value < 0.001" : `p-value = ${p.toFixed(3)}`);
const pct = (part: number, whole: number) => (whole === 0 ? EMPTY : `${((100 * part) / whole).toFixed(1)}%`);
const HA_SIGN: Record<Alternative, string> = { "!=": "≠", "<": "<", ">": ">" };

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

interface Axis {
  start: number;
  end: number;
  step: number;
  ticks: number[];
}

function makeAxis(start: number, end: number, step: number): Axis {
  const ticks: number[] = [];
  for (let v = start; v <= end + step * 1e-9; v += step) ticks.push(Number(v.toFixed(10)));
  return { start, end, step, ticks };
}

// Box weights all sit near 500 g, so a gram axis from 0 would squeeze every dot into one spot. This one covers just the values (and μ0), with a little room on each side.
function gramAxis(min: number, max: number): Axis {
  const step = niceStep(Math.max(max - min, 1), 7);
  let start = Math.floor(min / step) * step;
  let end = Math.ceil(max / step) * step;
  if (min - start < step * 0.3) start -= step;
  if (end - max < step * 0.3) end += step;
  return makeAxis(start, end, step);
}

/** A t axis centered on 0 that reaches at least `reach` each way, on round steps. */
function tAxis(reach: number): Axis {
  const step = niceStep(reach, 6);
  const end = Math.ceil(reach / step) * step;
  return makeAxis(-end, end, step);
}

/** Stacks one dot per value above its spot on the number line. Dots closer than one dot width share a column, and the radius shrinks until the tallest column fits. */
function layoutDots(values: readonly number[], sx: (v: number) => number) {
  for (let r = MAX_DOT_R; ; r -= 0.5) {
    const heights = new Map<number, number>();
    const dots = values.map((v) => {
      const x = sx(v);
      const column = Math.round(x / (2 * r));
      const k = heights.get(column) ?? 0;
      heights.set(column, k + 1);
      return { x, y: AXIS_TOP - r - k * 2 * r };
    });
    const tallest = Math.max(...heights.values());
    if (tallest * 2 * r <= AXIS_TOP - DOT_TOP || r <= 1.5) return { r, dots };
  }
}

/** Centers two labels over their marks, pushing them apart when they'd overlap, and keeps both inside the plot. */
function spreadLabels(a: { x: number; w: number }, b: { x: number; w: number }): [number, number] {
  let xa = a.x;
  let xb = b.x;
  const need = (a.w + b.w) / 2 + 10;
  const gap = Math.abs(xb - xa);
  if (gap < need) {
    const push = (need - gap) / 2;
    if (xa <= xb) {
      xa -= push;
      xb += push;
    } else {
      xa += push;
      xb -= push;
    }
  }
  return [clamp(xa, LEFT + a.w / 2, RIGHT - a.w / 2), clamp(xb, LEFT + b.w / 2, RIGHT - b.w / 2)];
}

/** A label with a subscript zero, like H0 or μ0: `before` + "0" lowered + `after`. */
function Sub0({ before, after }: { before: string; after: string }) {
  return (
    <>
      {before}
      <tspan dy={3} fontSize="0.75em">
        0
      </tspan>
      <tspan dy={-3}>{after}</tspan>
    </>
  );
}

/** The bottom axis line, ticks, tick labels and title. */
function AxisLine({ axis, sx, y, title }: { axis: Axis; sx: (v: number) => number; y: number; title: string }) {
  return (
    <g>
      <line x1={LEFT} y1={y} x2={RIGHT} y2={y} stroke={color.axis} />
      {axis.ticks.map((v) => (
        <g key={`tick-${v}`}>
          <line x1={sx(v)} y1={y} x2={sx(v)} y2={y + 5} stroke={color.axis} />
          <text x={sx(v)} y={y + 18} textAnchor="middle" style={type.tick}>
            {fmt(v)}
          </text>
        </g>
      ))}
      <text x={(LEFT + RIGHT) / 2} y={y + 38} textAnchor="middle" style={type.axisTitle}>
        {title}
      </text>
    </g>
  );
}

/** The t-distribution's density curve, scaled into the bottom panel. */
function curveScales(axis: Axis, yMax: number) {
  const st = (v: number) => LEFT + ((v - axis.start) / (axis.end - axis.start)) * (RIGHT - LEFT);
  const sy = (d: number) => AXIS_T - (d / yMax) * (AXIS_T - CURVE_TOP);
  return { st, sy };
}

function curvePoints(df: number, from: number, to: number, st: (v: number) => number, sy: (d: number) => number): string {
  const steps = Math.max(2, Math.ceil(Math.abs(to - from) * 30));
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const v = from + ((to - from) * i) / steps;
    points.push(`${st(v).toFixed(2)},${sy(tDensity(v, df)).toFixed(2)}`);
  }
  return points.join(" ");
}

/** The area under the curve between two t values, as a closed polygon. */
function areaPoints(df: number, from: number, to: number, st: (v: number) => number, sy: (d: number) => number): string {
  if (to <= from) return "";
  return `${st(from).toFixed(2)},${AXIS_T} ${curvePoints(df, from, to, st, sy)} ${st(to).toFixed(2)},${AXIS_T}`;
}

/** The hypotheses, top left of the bottom panel. */
function Hypotheses({ mu0, alternative, df, nullTrue }: { mu0: number; alternative: Alternative; df: number; nullTrue?: boolean }) {
  return (
    <g style={type.tick}>
      <text x={LEFT} y={HEAD1_Y} style={{ ...type.tick, fill: color.ink }}>
        <Sub0 before="H" after={`: μ = ${fmt(mu0)}${nullTrue ? " (true)" : ""}`} />
        <tspan dx={14}>H</tspan>
        <tspan dy={3} fontSize="0.75em">
          a
        </tspan>
        <tspan dy={-3}>{`: μ ${HA_SIGN[alternative]} ${fmt(mu0)}`}</tspan>
      </text>
      <text x={LEFT} y={HEAD2_Y} style={type.tick}>
        t-distribution, df = {df}
      </text>
    </g>
  );
}

function TestPlot({ result, t }: { result: TestResult; t: number }) {
  const { values, mu0, xBar, s, df, alternative } = result;
  const n = values.length;

  // Top: the sample.
  const gAxis = gramAxis(Math.min(values[0], mu0, xBar), Math.max(values[n - 1], mu0, xBar));
  const sx = (v: number) => LEFT + ((v - gAxis.start) / (gAxis.end - gAxis.start)) * (RIGHT - LEFT);
  const { r, dots } = layoutDots(values, sx);
  const meanP = progressBetween(t, MEAN_AT, MEAN_MS);
  const sP = easeInOut(progressBetween(t, S_AT, S_MS));
  const barLow = clamp(xBar - s * sP, gAxis.start, gAxis.end);
  const barHigh = clamp(xBar + s * sP, gAxis.start, gAxis.end);
  const muLabel = `μ0 = ${fmt(mu0)}`;
  const xBarLabel = `x̄ = ${fmt(xBar)}`;
  const [muLabelX, xBarLabelX] = spreadLabels({ x: sx(mu0), w: muLabel.length * CHAR_W }, { x: sx(xBar), w: (xBarLabel.length - 1) * CHAR_W });
  // The x̄ ± s label goes beside the bar on the side away from μ0. When the bar runs off the axis on that side (a much too large s), the label sits just above the bar's end instead.
  const barLabelLeft = xBar <= mu0;
  const barLabelW = 5 * CHAR_W;
  const barLabelBeside = barLabelLeft ? sx(xBar - s) - 8 - barLabelW >= 2 : sx(xBar + s) + 8 + barLabelW <= VIEW.width - 2;
  const barLabel = barLabelBeside
    ? { x: barLabelLeft ? sx(barLow) - 8 : sx(barHigh) + 8, y: BAR_Y + 4, anchor: barLabelLeft ? "end" : "start" }
    : { x: barLabelLeft ? LEFT : RIGHT, y: BAR_Y - 8, anchor: barLabelLeft ? "start" : "end" };

  // Bottom: the t-distribution and the observed t.
  const reach = Math.min(Math.max(4, Math.abs(result.t) + 0.6), 30);
  const axis = tAxis(reach);
  const yMax = tDensity(0, df) * 1.08;
  const { st, sy } = curveScales(axis, yMax);
  const curveP = progressBetween(t, 0, CURVE_MS);
  const slideP = easeInOut(progressBetween(t, T_AT, T_MS));
  const tailP = progressBetween(t, TAIL_AT, TAIL_MS);
  const decisionP = progressBetween(t, DECISION_AT, DECISION_MS);
  const shownT = clamp(result.t * slideP, axis.start, axis.end);
  const offScale = Math.abs(result.t) > axis.end;
  const markerTop = (v: number) => Math.min(sy(tDensity(v, df)) - 16, AXIS_T - 34);

  // The p-value's tail area(s), in the direction of Ha.
  const absT = Math.abs(result.t);
  const tails: [number, number][] =
    alternative === "<"
      ? [[axis.start, Math.min(result.t, axis.end)]]
      : alternative === ">"
        ? [[Math.max(result.t, axis.start), axis.end]]
        : [
            [axis.start, Math.max(-absT, axis.start)],
            [Math.min(absT, axis.end), axis.end],
          ];

  // Marker labels sit on the side away from 0, where the curve is lower, so they never cross it.
  const markerLabel = (v: number, text: string) => {
    const w = text.length * CHAR_W;
    const away = v < 0 ? "end" : "start";
    const x = v < 0 ? clamp(st(v) + 6, LEFT + w, RIGHT) : clamp(st(v) - 6, LEFT, RIGHT - w);
    return { x, anchor: away as "end" | "start" };
  };
  const tText = `t = ${fmt(result.t * slideP)}`;
  // A t past the end of the axis gets an arrow pointing the way it went.
  const tLabel = offScale && slideP >= 1 ? (result.t < 0 ? `← ${tText}` : `${tText} →`) : tText;
  const tLabelAt = markerLabel(result.t < 0 ? Math.min(shownT, -1e-9) : Math.max(shownT, 0), tLabel);
  const mirrorAt = markerLabel(-result.t, fmt(-result.t));

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
      role="img"
      aria-label={`Dotplot of ${n} box weights from ${fmt(values[0])} to ${fmt(values[n - 1])} grams, with mean ${fmt(xBar)} and claimed mean ${fmt(mu0)}. Your s is ${fmt(s)}, so t = ${fmt(result.t)} with ${df} degrees of freedom. The p-value is ${fmtP(result.pValue)}, so ${result.reject ? "reject" : "fail to reject"} the null hypothesis at alpha = ${ALPHA}.`}
    >
      {/* Top: the sample, with μ0 and x̄. */}
      {gAxis.ticks.map((v) => (
        <line key={`grid-${v}`} x1={sx(v)} y1={MARK_TOP} x2={sx(v)} y2={AXIS_TOP} stroke={color.grid} />
      ))}

      <line x1={sx(mu0)} y1={MARK_TOP} x2={sx(mu0)} y2={AXIS_TOP} stroke={color.reference} strokeWidth={2} strokeDasharray="5 4" />
      <text x={muLabelX} y={LABEL_Y} textAnchor="middle" style={{ ...type.tick, fill: color.reference }}>
        <Sub0 before="μ" after={` = ${fmt(mu0)}`} />
      </text>

      {dots.map((d, i) => {
        const p = progressBetween(t, (i / n) * DOTS_MS, DROP_MS);
        if (p <= 0) return null;
        const y = lerp(DOT_TOP - 30, d.y, easeInOut(p));
        return <circle key={i} cx={d.x} cy={y} r={r} fill={color.inkMuted} fillOpacity={0.55} stroke={color.inkMuted} strokeWidth={1} />;
      })}

      {meanP > 0 && (
        <g opacity={meanP}>
          <line x1={sx(xBar)} y1={MARK_TOP} x2={sx(xBar)} y2={AXIS_TOP} stroke={color.series[1]} strokeWidth={2} />
          <text x={xBarLabelX} y={LABEL_Y} textAnchor="middle" style={{ ...type.tick, fill: color.series[1] }}>
            {xBarLabel}
          </text>
        </g>
      )}

      {/* x̄ ± s: one standard deviation on each side of the mean. */}
      {sP > 0 && (
        <g stroke={color.series[0]} strokeWidth={2.5}>
          <line x1={sx(barLow)} y1={BAR_Y} x2={sx(barHigh)} y2={BAR_Y} />
          {xBar - s >= gAxis.start && <line x1={sx(barLow)} y1={BAR_Y - CAP_HALF} x2={sx(barLow)} y2={BAR_Y + CAP_HALF} />}
          {xBar + s <= gAxis.end && <line x1={sx(barHigh)} y1={BAR_Y - CAP_HALF} x2={sx(barHigh)} y2={BAR_Y + CAP_HALF} />}
          {sP >= 1 && (
            <text
              x={barLabel.x}
              y={barLabel.y}
              textAnchor={barLabel.anchor}
              stroke="none"
              style={{ ...type.tick, fill: color.series[0] }}
            >
              x̄ ± s
            </text>
          )}
        </g>
      )}

      <AxisLine axis={gAxis} sx={sx} y={AXIS_TOP} title="Weight of Box (grams)" />

      {/* Bottom: the t-distribution with df = n − 1, the observed t, and the p-value. */}
      <Hypotheses mu0={mu0} alternative={alternative} df={df} />

      {tailP > 0 &&
        tails.map(([from, to], i) => (
          <polygon key={`tail-${i}`} points={areaPoints(df, from, to, st, sy)} fill={color.series[0]} fillOpacity={0.42 * tailP} stroke="none" />
        ))}

      <polyline points={curvePoints(df, axis.start, lerp(axis.start, axis.end, curveP), st, sy)} fill="none" stroke={color.ink} strokeWidth={2} />

      {alternative === "!=" && tailP > 0 && absT <= axis.end && (
        <g opacity={tailP}>
          <line x1={st(-result.t)} y1={AXIS_T} x2={st(-result.t)} y2={markerTop(-result.t)} stroke={color.series[0]} strokeWidth={1.5} strokeDasharray="3 3" />
          <text x={mirrorAt.x} y={markerTop(-result.t) - 5} textAnchor={mirrorAt.anchor} style={{ ...type.tick, fill: color.series[0] }}>
            {fmt(-result.t)}
          </text>
        </g>
      )}

      {slideP > 0 && (
        <g>
          <line x1={st(shownT)} y1={AXIS_T} x2={st(shownT)} y2={markerTop(shownT)} stroke={color.series[0]} strokeWidth={2.5} />
          <text x={tLabelAt.x} y={markerTop(shownT) - 5} textAnchor={tLabelAt.anchor} style={{ ...type.tick, fontWeight: 600, fill: color.series[0] }}>
            {tLabel}
          </text>
        </g>
      )}

      {decisionP > 0 && (
        <g opacity={decisionP}>
          <text x={RIGHT} y={HEAD1_Y} textAnchor="end" style={{ ...type.tick, fill: color.series[0] }}>
            {pText(result.pValue)} {result.reject ? "≤" : ">"} α = {ALPHA}
          </text>
          <text x={RIGHT} y={HEAD2_Y} textAnchor="end" style={{ ...type.tick, fontWeight: 600, fill: color.ink }}>
            {result.reject ? "Reject " : "Fail to reject "}
            <Sub0 before="H" after="" />
          </text>
        </g>
      )}

      <AxisLine axis={axis} sx={st} y={AXIS_T} title="Test Statistic, t" />
    </svg>
  );
}

interface Bin {
  kept: number;
  rejected: number;
}

/** Counts the first `count` values into bins of `width` starting at `start`, split by whether that sample rejected H0. Values off both ends are left out. */
function histogram(values: readonly number[], rejected: readonly boolean[], count: number, start: number, width: number, bins: number): Bin[] {
  const out: Bin[] = Array.from({ length: bins }, () => ({ kept: 0, rejected: 0 }));
  for (let i = 0; i < count; i++) {
    const k = Math.floor((values[i] - start) / width);
    if (k < 0 || k >= bins) continue;
    if (rejected[i]) out[k].rejected++;
    else out[k].kept++;
  }
  return out;
}

function Bars({ bins, start, width, sx, base, scale }: { bins: Bin[]; start: number; width: number; sx: (v: number) => number; base: number; scale: (count: number) => number }) {
  return (
    <g>
      {bins.map((b, i) => {
        const x0 = sx(start + i * width) + 0.5;
        const w = Math.max(sx(start + (i + 1) * width) - sx(start + i * width) - 1, 0.5);
        const hRejected = scale(b.rejected);
        const hKept = scale(b.kept);
        return (
          <g key={i}>
            {b.rejected > 0 && <rect x={x0} y={base - hRejected} width={w} height={hRejected} fill={color.series[0]} fillOpacity={0.75} />}
            {b.kept > 0 && <rect x={x0} y={base - hRejected - hKept} width={w} height={hKept} fill={color.inkMuted} fillOpacity={0.35} />}
          </g>
        );
      })}
    </g>
  );
}

function SimulationPlot({ result, t, shown }: { result: SimulationResult; t: number; shown: number }) {
  const { means, tValues, rejected, mu0, df, alternative, cutoff } = result;
  const total = means.length;

  // Top: the sample means.
  let lo = mu0;
  let hi = mu0;
  for (const m of means) {
    lo = Math.min(lo, m);
    hi = Math.max(hi, m);
  }
  const gAxis = gramAxis(lo, hi);
  const sx = (v: number) => LEFT + ((v - gAxis.start) / (gAxis.end - gAxis.start)) * (RIGHT - LEFT);
  const meanWidth = niceStep(gAxis.end - gAxis.start, 28);
  const meanBins = Math.ceil((gAxis.end - gAxis.start) / meanWidth);
  const tallestMean = Math.max(1, ...histogram(means, rejected, total, gAxis.start, meanWidth, meanBins).map((b) => b.kept + b.rejected));
  const meanScale = (c: number) => (c / tallestMean) * (AXIS_TOP - HIST_TOP);
  let sum = 0;
  for (let i = 0; i < shown; i++) sum += means[i];
  const meanOfShown = shown > 0 ? sum / shown : mu0;
  let squares = 0;
  for (let i = 0; i < shown; i++) squares += (means[i] - meanOfShown) ** 2;
  const sdOfShown = shown > 1 ? Math.sqrt(squares / (shown - 1)) : 0;

  // Bottom: each sample's t over the t-distribution, on a density scale so the bars and the curve share one y axis.
  const axis = tAxis(Math.max(5, Math.abs(cutoff) + 1));
  const tWidth = 0.25;
  const tBins = Math.round((axis.end - axis.start) / tWidth);
  const finalT = histogram(tValues, rejected, total, axis.start, tWidth, tBins);
  const tallestDensity = Math.max(...finalT.map((b) => (b.kept + b.rejected) / (total * tWidth)));
  const yMax = Math.max(tDensity(0, df), tallestDensity) * 1.08;
  const { st, sy } = curveScales(axis, yMax);
  const tScale = (c: number) => AXIS_T - sy(c / (total * tWidth));
  const curveP = progressBetween(t, 0, CURVE_MS);
  const cutoffs = alternative === "!=" ? [-cutoff, cutoff] : [cutoff];

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
      role="img"
      aria-label={`${total} random samples of ${result.n} boxes from a population with mean ${fmt(mu0)}, where the null hypothesis is true. Their sample means center at ${fmt(result.meanOfMeans)} with standard deviation ${fmt(result.sdOfMeans)}, and their t statistics follow the t-distribution with ${df} degrees of freedom. ${result.rejections} of them (${pct(result.rejections, total)}) had a p-value at most ${ALPHA} and rejected the null hypothesis.`}
    >
      {/* Top: a histogram of the sample means. */}
      {gAxis.ticks.map((v) => (
        <line key={`grid-${v}`} x1={sx(v)} y1={MARK_TOP} x2={sx(v)} y2={AXIS_TOP} stroke={color.grid} />
      ))}
      <Bars bins={histogram(means, rejected, shown, gAxis.start, meanWidth, meanBins)} start={gAxis.start} width={meanWidth} sx={sx} base={AXIS_TOP} scale={meanScale} />
      <line x1={sx(mu0)} y1={MARK_TOP} x2={sx(mu0)} y2={AXIS_TOP} stroke={color.reference} strokeWidth={2} strokeDasharray="5 4" />
      <text x={sx(mu0)} y={LABEL_Y} textAnchor="middle" style={{ ...type.tick, fill: color.reference }}>
        <Sub0 before="μ = μ" after={` = ${fmt(mu0)}`} />
      </text>
      {shown > 1 && (
        <g style={type.tick}>
          <text x={RIGHT} y={LABEL_Y} textAnchor="end" style={type.tick}>
            {shown} sample means x̄
          </text>
          <text x={RIGHT} y={LABEL_Y + 14} textAnchor="end" style={type.tick}>
            mean {fmt(meanOfShown)}, SD {fmt(sdOfShown)}
          </text>
        </g>
      )}
      <AxisLine axis={gAxis} sx={sx} y={AXIS_TOP} title="Sample Mean, x̄ (grams)" />

      {/* Bottom: the t statistics, the t-distribution, and where p-value ≤ α. */}
      <Hypotheses mu0={mu0} alternative={alternative} df={df} nullTrue />
      <g>
        <rect x={LEGEND_X} y={HEAD1_Y - 8} width={9} height={9} fill={color.series[0]} fillOpacity={0.75} />
        <text x={LEGEND_X + 14} y={HEAD1_Y} style={{ ...type.tick, fill: color.series[0] }}>
          p-value ≤ {ALPHA}: reject <Sub0 before="H" after="" />
        </text>
        <rect x={LEGEND_X} y={HEAD2_Y - 8} width={9} height={9} fill={color.inkMuted} fillOpacity={0.35} />
        <text x={LEGEND_X + 14} y={HEAD2_Y} style={type.tick}>
          p-value &gt; {ALPHA}: fail to reject <Sub0 before="H" after="" />
        </text>
      </g>

      <Bars bins={histogram(tValues, rejected, shown, axis.start, tWidth, tBins)} start={axis.start} width={tWidth} sx={st} base={AXIS_T} scale={tScale} />
      <polyline points={curvePoints(df, axis.start, lerp(axis.start, axis.end, curveP), st, sy)} fill="none" stroke={color.ink} strokeWidth={2} />
      {cutoffs.map((c) => (
        <g key={`cut-${c}`}>
          <line x1={st(c)} y1={AXIS_T} x2={st(c)} y2={CURVE_TOP} stroke={color.reference} strokeWidth={2} strokeDasharray="5 4" />
          <text x={c < 0 ? st(c) - 5 : st(c) + 5} y={CURVE_TOP + 10} textAnchor={c < 0 ? "end" : "start"} style={{ ...type.tick, fill: color.reference }}>
            t = {fmt3(c)}
          </text>
        </g>
      ))}

      <AxisLine axis={axis} sx={st} y={AXIS_T} title="Test Statistic, t" />
    </svg>
  );
}

/** How many simulated samples are in the histograms at time t. */
const samplesShown = (result: SimulationResult, t: number) => Math.round(result.means.length * progressBetween(t, 0, SAMPLES_MS));

const Component = observer(({ state }: { state: State }) => {
  const result = state.result;
  const t = useRunAnimation(result, result?.kind === "simulation" ? SIM_MS : TEST_MS);

  if (!result) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Press Run to test the claim that the cereal boxes hold 500 grams on average, using the weights of 12 boxes." />
        </PluginStage>
      </PluginSurface>
    );
  }

  if (result.kind === "simulation") {
    const shown = samplesShown(result, t);
    let rejections = 0;
    for (let i = 0; i < shown; i++) if (result.rejected[i]) rejections++;
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <SimulationPlot result={result} t={t} shown={shown} />
        </PluginStage>
        <StatRow
          stats={[
            { label: "Samples", value: String(shown) },
            { label: "Type I errors", value: String(rejections), color: color.series[0] },
            { label: "Error rate", value: pct(rejections, shown), color: color.series[0] },
            { label: "Alpha", value: String(ALPHA) },
          ]}
        />
      </PluginSurface>
    );
  }

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <TestPlot result={result} t={t} />
      </PluginStage>
      <StatRow
        stats={[
          { label: "Mean", value: t >= MEAN_AT ? fmt(result.xBar) : EMPTY, color: color.series[1] },
          { label: "SD", value: t >= S_AT ? fmt(result.s) : EMPTY, color: color.series[0] },
          { label: "t", value: t >= T_AT + T_MS ? fmt(result.t) : EMPTY, color: color.series[0] },
          { label: "df", value: t >= T_AT ? String(result.df) : EMPTY },
          { label: "p-value", value: t >= TAIL_AT ? fmtP(result.pValue) : EMPTY, color: color.series[0] },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
