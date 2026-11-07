import { observer } from "mobx-react-lite";
import { useId } from "react";
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
import State, { type Fit, type Prediction } from "./state";

// Timeline of one run, in ms: the points pop in, a flat line appears at ȳ with the dashed least-squares line, then the line turns about (x̄, ȳ) to the student's slope while the residuals follow it. The residual plot fills in last, along with the predicted point if there is one.
const DOTS_MS = 800;
const POP_MS = 250;
const LINE_AT = 1100;
const LINE_MS = 300;
const PIVOT_AT = 1500;
const PIVOT_MS = 1100;
const SETTLED_AT = PIVOT_AT + PIVOT_MS;
const RESIDUAL_PLOT_MS = 500;
const PREDICT_AT = SETTLED_AT + 100;
const PREDICT_MS = 400;
const TOTAL_MS = SETTLED_AT + RESIDUAL_PLOT_MS;

// Layout, in the shared VIEW width. The scatterplot sits on top and the residual plot below it, on the same x scale.
const LEFT = PAD.left;
const RIGHT = VIEW.width - PAD.right;
const LEGEND_Y = 14;
const PLOT_TOP = 30;
const PLOT_BOTTOM = 250;
const RES_TOP = 308;
const RES_BOTTOM = 388;
const HEIGHT = RES_BOTTOM + 22;
const DOT_R = 4.5;
const RES_DOT_R = 3.5;

/** Shows a number with at most two decimals and no trailing zeros. */
const fmt = (v: number) => String(Number(v.toFixed(2)));

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** The line ŷ = a + bx written out, with a minus sign instead of "+ −" when the slope is negative. */
const equation = (a: number, b: number) => `ŷ = ${fmt(a)} ${b < 0 ? "−" : "+"} ${fmt(Math.abs(b))}x`;

interface Axis {
  start: number;
  end: number;
  ticks: number[];
}

/** A number line from 0 (or below, for negative values) past the largest value, on round tick steps. With `roomPastMax`, a largest value that lands right on a tick gets one more step after it, so its point isn't on the plot's edge. */
function axisFor(min: number, max: number, divisions: number, roomPastMax = false): Axis {
  const low = Math.min(0, min);
  const high = Math.max(0, max);
  const step = niceStep(Math.max(high - low, 1), divisions);
  const start = Math.floor(low / step) * step;
  let end = Math.ceil(high / step) * step;
  if (roomPastMax && end === high) end += step;
  if (end <= start) end = start + step;
  const ticks: number[] = [];
  for (let v = start; v <= end + step * 1e-9; v += step) ticks.push(Number(v.toFixed(10)));
  return { start, end, ticks };
}

/** The residual plot's vertical axis: the same distance above and below 0, just past the largest residual. */
function residualAxisFor(residuals: readonly number[]): Axis {
  const largest = Math.max(...residuals.map(Math.abs), 1e-9);
  const step = niceStep(largest, 4);
  const end = Math.max(Math.ceil(largest / step) * step, step);
  return { start: -end, end, ticks: [-end, 0, end] };
}

function signColor(residual: number) {
  if (residual > 0) return color.series[1];
  if (residual < 0) return color.series[3];
  return color.inkMuted;
}

function Plot({ fit, prediction, t }: { fit: Fit; prediction: Prediction | null; t: number }) {
  const clipId = useId();
  const { xs, ys, xMean, yMean, exact } = fit;
  const n = xs.length;

  // Both axes start at 0. The predicted point is part of the range so it's never off the plot. Test scores can't pass 100, so only the x-axis gets room past its largest value.
  const xAxis = axisFor(Math.min(...xs, prediction?.x ?? 0), Math.max(...xs, prediction?.x ?? 0), 6, true);
  const yAxis = axisFor(Math.min(...ys, prediction?.predicted ?? 0), Math.max(...ys, prediction?.predicted ?? 0), 5);
  const resAxis = residualAxisFor(fit.residuals);
  const sx = (v: number) => LEFT + ((v - xAxis.start) / (xAxis.end - xAxis.start)) * (RIGHT - LEFT);
  const sy = (v: number) => PLOT_BOTTOM - ((v - yAxis.start) / (yAxis.end - yAxis.start)) * (PLOT_BOTTOM - PLOT_TOP);
  const sr = (v: number) => RES_BOTTOM - ((v - resAxis.start) / (resAxis.end - resAxis.start)) * (RES_BOTTOM - RES_TOP);

  const lineP = progressBetween(t, LINE_AT, LINE_MS);
  const pivotP = easeInOut(progressBetween(t, PIVOT_AT, PIVOT_MS));
  const predictP = progressBetween(t, PREDICT_AT, PREDICT_MS);
  const settled = t >= SETTLED_AT;

  // The line on screen starts flat at ȳ and turns to the student's slope, keeping its height at x̄ moving from ȳ to the student's line there. The prefix's intercept always puts the student's line through (x̄, ȳ), so it simply turns about that point.
  const slopeNow = lerp(0, fit.slope, pivotP);
  const atMeanNow = lerp(yMean, fit.intercept + fit.slope * xMean, pivotP);
  const yHat = (x: number) => atMeanNow + slopeNow * (x - xMean);
  const exactAt = (x: number) => exact.intercept + exact.slope * x;

  const r = fit.r === null ? "undefined" : fmt(fit.r);

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
      role="img"
      aria-label={`Scatterplot of test score against hours studied for ${n} students, with correlation r = ${r}. Your line is ${equation(fit.intercept, fit.slope)}, with a sum of squared residuals of ${fmt(fit.sumSquares)}. The least-squares line is ${equation(exact.intercept, exact.slope)}, with a sum of squared residuals of ${fmt(exact.sumSquares)}.${prediction ? ` Your predicted score at ${fmt(prediction.x)} hours is ${fmt(prediction.predicted)}.` : ""}`}
    >
      <defs>
        <clipPath id={`${clipId}-plot`}>
          <rect x={LEFT} y={PLOT_TOP} width={RIGHT - LEFT} height={PLOT_BOTTOM - PLOT_TOP} />
        </clipPath>
        <clipPath id={`${clipId}-res`}>
          <rect x={LEFT - RES_DOT_R} y={RES_TOP - RES_DOT_R} width={RIGHT - LEFT + 2 * RES_DOT_R} height={RES_BOTTOM - RES_TOP + 2 * RES_DOT_R} />
        </clipPath>
      </defs>

      <text x={VIEW.width / 2} y={LEGEND_Y} textAnchor="middle" style={type.tick}>
        <tspan fill={color.inkMuted}>●</tspan>
        <tspan> Data</tspan>
        <tspan dx={12} fill={color.series[0]} fontWeight={700}>—</tspan>
        <tspan> Your line</tspan>
        <tspan dx={12} fill={color.reference} fontWeight={700}>- -</tspan>
        <tspan> Least-squares line</tspan>
        <tspan dx={12} fill={color.series[1]} fontWeight={700}>|</tspan>
        <tspan> Residual &gt; 0</tspan>
        <tspan dx={12} fill={color.series[3]} fontWeight={700}>|</tspan>
        <tspan> Residual &lt; 0</tspan>
      </text>

      {/* The scatterplot. */}
      {yAxis.ticks.map((v) => (
        <line key={`ygrid-${v}`} x1={LEFT} y1={sy(v)} x2={RIGHT} y2={sy(v)} stroke={color.grid} />
      ))}
      {xAxis.ticks.map((v) => (
        <line key={`xgrid-${v}`} x1={sx(v)} y1={PLOT_TOP} x2={sx(v)} y2={PLOT_BOTTOM} stroke={color.grid} />
      ))}

      {lineP > 0 && (
        <g clipPath={`url(#${clipId}-plot)`} opacity={lineP}>
          {/* Each residual: a vertical segment from the line to the point, teal when the point is above the line and purple when it's below. */}
          {xs.map((x, i) => {
            const residual = ys[i] - yHat(x);
            return <line key={`seg-${i}`} x1={sx(x)} y1={sy(yHat(x))} x2={sx(x)} y2={sy(ys[i])} stroke={signColor(residual)} strokeWidth={2} />;
          })}
          <line x1={sx(xAxis.start)} y1={sy(yHat(xAxis.start))} x2={sx(xAxis.end)} y2={sy(yHat(xAxis.end))} stroke={color.series[0]} strokeWidth={3} strokeLinecap="round" />
          {/* The least-squares line goes on top, so its dashes still show when the student's line lies right under it. */}
          <line x1={sx(xAxis.start)} y1={sy(exactAt(xAxis.start))} x2={sx(xAxis.end)} y2={sy(exactAt(xAxis.end))} stroke={color.reference} strokeWidth={2} strokeDasharray="8 6" />
        </g>
      )}

      {xs.map((x, i) => {
        const p = easeInOut(progressBetween(t, (i / n) * DOTS_MS, POP_MS));
        if (p <= 0) return null;
        return <circle key={`dot-${i}`} cx={sx(x)} cy={sy(ys[i])} r={DOT_R * p} fill={color.inkMuted} fillOpacity={0.55} stroke={color.inkMuted} strokeWidth={1} />;
      })}

      {/* The point (x̄, ȳ), which every line in this plugin passes through. */}
      {lineP > 0 && (
        <g stroke={color.ink} strokeWidth={2} opacity={lineP}>
          <line x1={sx(xMean) - 7} y1={sy(yMean)} x2={sx(xMean) + 7} y2={sy(yMean)} />
          <line x1={sx(xMean)} y1={sy(yMean) - 7} x2={sx(xMean)} y2={sy(yMean) + 7} />
        </g>
      )}

      {settled && (
        <text x={LEFT + 8} y={PLOT_TOP + 14} style={{ ...type.tick, fill: color.series[0], fontWeight: 600 }}>
          Your line: {equation(fit.intercept, fit.slope)}
        </text>
      )}

      {prediction && predictP > 0 && (
        <g opacity={predictP}>
          <g clipPath={`url(#${clipId}-plot)`} stroke={color.series[0]} strokeWidth={1.5} strokeDasharray="2 4">
            <line x1={sx(prediction.x)} y1={PLOT_BOTTOM} x2={sx(prediction.x)} y2={sy(prediction.predicted)} />
            <line x1={LEFT} y1={sy(prediction.predicted)} x2={sx(prediction.x)} y2={sy(prediction.predicted)} />
          </g>
          <circle cx={sx(prediction.x)} cy={sy(prediction.predicted)} r={6} fill={color.surface} stroke={color.series[0]} strokeWidth={2.5} />
          <text x={LEFT + 6} y={sy(prediction.predicted) - 6} style={{ ...type.tick, fill: color.series[0] }}>
            ŷ = {fmt(prediction.predicted)}
          </text>
          <text x={sx(prediction.x) + 6} y={PLOT_BOTTOM - 6} style={{ ...type.tick, fill: color.series[0] }}>
            x = {fmt(prediction.x)}
          </text>
        </g>
      )}

      <line x1={LEFT} y1={PLOT_BOTTOM} x2={RIGHT} y2={PLOT_BOTTOM} stroke={color.axis} />
      <line x1={LEFT} y1={PLOT_TOP} x2={LEFT} y2={PLOT_BOTTOM} stroke={color.axis} />
      {xAxis.ticks.map((v) => (
        <text key={`xtick-${v}`} x={sx(v)} y={PLOT_BOTTOM + 16} textAnchor="middle" style={type.tick}>
          {fmt(v)}
        </text>
      ))}
      {yAxis.ticks.map((v) => (
        <text key={`ytick-${v}`} x={LEFT - 8} y={sy(v) + 4} textAnchor="end" style={type.tick}>
          {fmt(v)}
        </text>
      ))}
      <text x={(LEFT + RIGHT) / 2} y={PLOT_BOTTOM + 36} textAnchor="middle" style={type.axisTitle}>
        Hours Studied
      </text>
      <text x={14} y={(PLOT_TOP + PLOT_BOTTOM) / 2} textAnchor="middle" transform={`rotate(-90, 14, ${(PLOT_TOP + PLOT_BOTTOM) / 2})`} style={type.axisTitle}>
        Test Score
      </text>

      {/* The residual plot: each residual of the student's line against hours studied. The line at 0 is the student's line. */}
      {xAxis.ticks.map((v) => (
        <line key={`rgrid-${v}`} x1={sx(v)} y1={RES_TOP} x2={sx(v)} y2={RES_BOTTOM} stroke={color.grid} />
      ))}
      {resAxis.ticks.map((v) => (
        <g key={`rtick-${v}`}>
          <line x1={LEFT} y1={sr(v)} x2={RIGHT} y2={sr(v)} stroke={color.grid} />
          <text x={LEFT - 8} y={sr(v) + 4} textAnchor="end" style={type.tick}>
            {v < 0 ? `−${fmt(-v)}` : fmt(v)}
          </text>
        </g>
      ))}
      <line x1={LEFT} y1={RES_TOP} x2={LEFT} y2={RES_BOTTOM} stroke={color.axis} />
      {lineP > 0 && <line x1={LEFT} y1={sr(0)} x2={RIGHT} y2={sr(0)} stroke={color.series[0]} strokeWidth={2} opacity={lineP} />}
      <g clipPath={`url(#${clipId}-res)`}>
        {fit.residuals.map((residual, i) => {
          const p = easeInOut(progressBetween(t, SETTLED_AT + (i / n) * (RESIDUAL_PLOT_MS - POP_MS), POP_MS));
          if (p <= 0) return null;
          return <circle key={`res-${i}`} cx={sx(xs[i])} cy={sr(lerp(0, residual, p))} r={RES_DOT_R} fill={signColor(residual)} />;
        })}
      </g>
      {xAxis.ticks.map((v) => (
        <text key={`rxtick-${v}`} x={sx(v)} y={RES_BOTTOM + 16} textAnchor="middle" style={type.tick}>
          {fmt(v)}
        </text>
      ))}
      <text x={14} y={(RES_TOP + RES_BOTTOM) / 2} textAnchor="middle" transform={`rotate(-90, 14, ${(RES_TOP + RES_BOTTOM) / 2})`} style={type.axisTitle}>
        Residual
      </text>
    </svg>
  );
}

const Component = observer(({ state }: { state: State }) => {
  const fit = state.fit;
  const t = useRunAnimation(fit, TOTAL_MS);

  if (!fit) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Press Run to plot each student's hours studied and test score, with the line your slope function finds." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const shown = t >= LINE_AT;
  const settled = t >= SETTLED_AT;

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <Plot fit={fit} prediction={state.prediction} t={t} />
      </PluginStage>
      <StatRow
        stats={[
          { label: "Slope", value: settled ? fmt(fit.slope) : EMPTY, color: color.series[0] },
          { label: "Intercept", value: settled ? fmt(fit.intercept) : EMPTY },
          { label: "r", value: shown && fit.r !== null ? fmt(fit.r) : EMPTY },
          { label: "r²", value: shown && fit.r !== null ? fmt(fit.r * fit.r) : EMPTY },
          { label: "Σ residual²", value: settled ? fmt(fit.sumSquares) : EMPTY },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
