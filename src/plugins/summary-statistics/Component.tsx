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
import State, { type Summary } from "./state";

// Timeline of one run, in ms: the dots drop in from smallest to largest, then the mean appears, the box opens out from the median to Q1 and Q3, the whiskers reach out, and the outliers pop in last.
const DOTS_MS = 1100;
const DROP_MS = 260;
const MEAN_AT = 1250;
const BOX_AT = 1550;
const BOX_MS = 600;
const WHISKER_AT = 2200;
const WHISKER_MS = 400;
const OUTLIER_AT = 2600;
const OUTLIER_MS = 250;
const TOTAL_MS = OUTLIER_AT + OUTLIER_MS;

// Layout, in the shared VIEW. The dotplot and the boxplot share one number line at the bottom.
const LEFT = 40;
const RIGHT = VIEW.width - 40;
const LEGEND_Y = 16;
const DOT_TOP = 44;
const DOT_BASE = 178;
const BOX_MID = 250;
const BOX_HALF = 22;
const REF_HALF = 31;
const CAP_HALF = 9;
const AXIS_Y = 304;
const MAX_DOT_R = 6;
const HEIGHT = AXIS_Y + 58;

/** Shows a number with at most two decimals and no trailing zeros. */
const fmt = (v: number) => String(Number(v.toFixed(2)));

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

interface Axis {
  start: number;
  end: number;
  ticks: number[];
}

/** A number line from 0 (or below, for negative data) past the largest value, on round tick steps. */
function axisFor(min: number, max: number): Axis {
  const low = Math.min(0, min);
  const step = niceStep(Math.max(max - low, 1), 6);
  const start = Math.floor(low / step) * step;
  let end = Math.ceil(max / step) * step;
  if (end <= start) end = start + step;
  const ticks: number[] = [];
  for (let v = start; v <= end + step * 1e-9; v += step) ticks.push(Number(v.toFixed(10)));
  return { start, end, ticks };
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
      return { x, y: DOT_BASE - r - k * 2 * r };
    });
    const tallest = Math.max(...heights.values());
    if (tallest * 2 * r <= DOT_BASE - DOT_TOP || r <= 1.5) return { r, dots };
  }
}

/** An asterisk: three crossing strokes, the way a boxplot marks an outlier. */
function Asterisk({ x, y, size, stroke }: { x: number; y: number; size: number; stroke: string }) {
  return (
    <g stroke={stroke} strokeWidth={2} strokeLinecap="round">
      {[90, 30, -30].map((deg) => {
        const a = (deg * Math.PI) / 180;
        const dx = Math.cos(a) * size;
        const dy = Math.sin(a) * size;
        return <line key={deg} x1={x - dx} y1={y - dy} x2={x + dx} y2={y + dy} />;
      })}
    </g>
  );
}

function Plot({ summary, t }: { summary: Summary; t: number }) {
  const { values, median, q1, q3, mean, exact } = summary;
  const axis = axisFor(values[0], values[values.length - 1]);
  const sx = (v: number) => LEFT + ((v - axis.start) / (axis.end - axis.start)) * (RIGHT - LEFT);
  const inView = (v: number) => v >= axis.start && v <= axis.end;
  const { r, dots } = layoutDots(values, sx);

  const boxP = easeInOut(progressBetween(t, BOX_AT, BOX_MS));
  const whiskerP = easeInOut(progressBetween(t, WHISKER_AT, WHISKER_MS));
  const outlierP = progressBetween(t, OUTLIER_AT, OUTLIER_MS);
  const meanP = progressBetween(t, MEAN_AT, 300);

  // A wrong median function can return Q1 above Q3, so the box spans whichever is smaller to whichever is larger.
  const boxLow = Math.min(q1, q3);
  const boxHigh = Math.max(q1, q3);
  const left = sx(lerp(median, boxLow, boxP));
  const right = sx(lerp(median, boxHigh, boxP));
  const whiskerLeft = sx(lerp(boxLow, Math.min(summary.whiskerLow, boxLow), whiskerP));
  const whiskerRight = sx(lerp(boxHigh, Math.max(summary.whiskerHigh, boxHigh), whiskerP));
  const meanX = sx(mean);

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
      role="img"
      aria-label={`Dotplot and boxplot of ${values.length} values from ${fmt(values[0])} to ${fmt(values[values.length - 1])}: your median ${fmt(median)}, Q1 ${fmt(q1)}, Q3 ${fmt(q3)}, mean ${fmt(mean)}, ${summary.outliers.length} outlier${summary.outliers.length === 1 ? "" : "s"}`}
    >
      <text x={VIEW.width / 2} y={LEGEND_Y} textAnchor="middle" style={type.tick}>
        <tspan fill={color.inkMuted}>●</tspan>
        <tspan> Data</tspan>
        <tspan dx={14} fill={color.series[0]}>■</tspan>
        <tspan> Your boxplot</tspan>
        <tspan dx={14} fill={color.reference}>¦</tspan>
        <tspan> Correct quartiles</tspan>
        <tspan dx={14} fill={color.series[1]}>¦</tspan>
        <tspan> Mean</tspan>
      </text>

      {axis.ticks.map((v) => (
        <line key={`grid-${v}`} x1={sx(v)} y1={DOT_TOP - 6} x2={sx(v)} y2={AXIS_Y} stroke={color.grid} />
      ))}
      <line x1={LEFT} y1={DOT_BASE + 1} x2={RIGHT} y2={DOT_BASE + 1} stroke={color.border} />

      {/* The dotplot: each dot drops into its stack in sorted order. */}
      {dots.map((d, i) => {
        const p = progressBetween(t, (i / values.length) * DOTS_MS, DROP_MS);
        if (p <= 0) return null;
        const y = lerp(DOT_TOP - 20, d.y, easeInOut(p));
        return <circle key={i} cx={d.x} cy={y} r={r} fill={color.inkMuted} fillOpacity={0.55} stroke={color.inkMuted} strokeWidth={1} />;
      })}

      {meanP > 0 && (
        <g opacity={meanP}>
          <line x1={meanX} y1={DOT_TOP - 4} x2={meanX} y2={DOT_BASE} stroke={color.series[1]} strokeWidth={2} strokeDasharray="6 4" />
          <text x={Math.min(Math.max(meanX, LEFT + 30), RIGHT - 30)} y={DOT_TOP - 10} textAnchor="middle" style={{ ...type.tick, fill: color.series[1] }}>
            Mean {fmt(mean)}
          </text>
        </g>
      )}

      {/* The boxplot from the student's median and quartiles. */}
      {boxP > 0 && (
        <g>
          {whiskerP > 0 && (
            <g stroke={color.series[0]} strokeWidth={2}>
              <line x1={whiskerLeft} y1={BOX_MID} x2={left} y2={BOX_MID} />
              <line x1={right} y1={BOX_MID} x2={whiskerRight} y2={BOX_MID} />
              {whiskerP >= 1 && (
                <>
                  <line x1={whiskerLeft} y1={BOX_MID - CAP_HALF} x2={whiskerLeft} y2={BOX_MID + CAP_HALF} />
                  <line x1={whiskerRight} y1={BOX_MID - CAP_HALF} x2={whiskerRight} y2={BOX_MID + CAP_HALF} />
                </>
              )}
            </g>
          )}
          <rect x={left} y={BOX_MID - BOX_HALF} width={Math.max(right - left, 0)} height={BOX_HALF * 2} fill={color.accentSoft} stroke={color.series[0]} strokeWidth={2.5} />
          <line x1={sx(median)} y1={BOX_MID - BOX_HALF} x2={sx(median)} y2={BOX_MID + BOX_HALF} stroke={color.series[0]} strokeWidth={3.5} />

          {/* Where the correct Q1, median and Q3 are, taller than the box so they show even when the box sits right on them. */}
          {[exact.q1, exact.median, exact.q3].filter(inView).map((v, i) => (
            <line key={`ref-${i}`} x1={sx(v)} y1={BOX_MID - REF_HALF} x2={sx(v)} y2={BOX_MID + REF_HALF} stroke={color.reference} strokeWidth={2} strokeDasharray="5 4" opacity={boxP} />
          ))}
        </g>
      )}

      {whiskerP >= 1 && summary.iqr > 0 && (
        <g opacity={whiskerP}>
          {[
            { v: summary.lowFence, label: "Q1 − 1.5 × IQR" },
            { v: summary.highFence, label: "Q3 + 1.5 × IQR" },
          ]
            .filter((fence) => inView(fence.v))
            .map((fence) => (
              <g key={fence.label}>
                <line x1={sx(fence.v)} y1={BOX_MID - BOX_HALF} x2={sx(fence.v)} y2={BOX_MID + BOX_HALF} stroke={color.inkMuted} strokeWidth={1} strokeDasharray="2 3" />
                <text x={sx(fence.v)} y={BOX_MID + REF_HALF + 12} textAnchor="middle" style={{ ...type.tick, fontSize: 10 }}>
                  {fence.label}
                </text>
              </g>
            ))}
        </g>
      )}

      {outlierP > 0 && summary.outliers.map((v, i) => <Asterisk key={`out-${i}`} x={sx(v)} y={BOX_MID} size={7 * (0.4 + 0.6 * outlierP)} stroke={color.series[0]} />)}

      <line x1={LEFT} y1={AXIS_Y} x2={RIGHT} y2={AXIS_Y} stroke={color.axis} />
      {axis.ticks.map((v) => (
        <g key={`tick-${v}`}>
          <line x1={sx(v)} y1={AXIS_Y} x2={sx(v)} y2={AXIS_Y + 5} stroke={color.axis} />
          <text x={sx(v)} y={AXIS_Y + 20} textAnchor="middle" style={type.tick}>
            {fmt(v)}
          </text>
        </g>
      ))}
      <text x={(LEFT + RIGHT) / 2} y={AXIS_Y + 46} textAnchor="middle" style={type.axisTitle}>
        Minutes to Get to School
      </text>
    </svg>
  );
}

const Component = observer(({ state }: { state: State }) => {
  const summary = state.summary;
  const t = useRunAnimation(summary, TOTAL_MS);

  if (!summary) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Press Run to plot how long each student takes to get to school, as a dotplot and a boxplot." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const boxShown = t >= BOX_AT;
  const meanShown = t >= MEAN_AT;

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <Plot summary={summary} t={t} />
      </PluginStage>
      <StatRow
        stats={[
          { label: "Q1", value: boxShown ? fmt(summary.q1) : EMPTY },
          { label: "Median", value: boxShown ? fmt(summary.median) : EMPTY, color: color.series[0] },
          { label: "Q3", value: boxShown ? fmt(summary.q3) : EMPTY },
          { label: "IQR", value: boxShown ? fmt(summary.iqr) : EMPTY },
          { label: "Mean", value: meanShown ? fmt(summary.mean) : EMPTY, color: color.series[1] },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
