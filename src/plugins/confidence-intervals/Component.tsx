import { observer } from "mobx-react-lite";
import type { ReactElement } from "react";
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
import State, { type PollSummary } from "./state";

// Timeline of one run, in ms: the pollsters' intervals appear from top to bottom in a muted color, each opening out from its p̂ dot. Then the dashed line at the true p drops in, and every interval takes the color that says whether it captures p.
const ROWS_MS = 1500;
const DOT_MS = 120;
const GROW_MS = 300;
const DRAWN_AT = ROWS_MS + GROW_MS;
const LINE_AT = 1950;
const LINE_MS = 450;
const MARK_AT = 2500;
const MARK_MS = 400;
const TOTAL_MS = MARK_AT + MARK_MS;

// Layout, in the shared VIEW width. One row per pollster, pollster 1 at the top, above a number line of proportions.
const LEFT = 52;
const RIGHT = VIEW.width - 24;
const LEGEND_Y = 14;
const P_LABEL_Y = 31;
const PLOT_TOP = 40;
const PLOT_BOTTOM = 360;
const AXIS_Y = 364;
const HEIGHT = AXIS_Y + 54;
const MAX_ROW = 12;

/** Shows a proportion with at most three decimals and no trailing zeros. */
const fmt = (v: number) => String(Number(v.toFixed(3)));

/** Shows a level from 0 to 1 as a percent with at most one decimal. */
const pct = (v: number) => `${Number((v * 100).toFixed(1))}%`;

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

interface Axis {
  start: number;
  end: number;
  ticks: number[];
}

/** A number line of proportions from 0 to 1. A wrong formula can give limits below 0 or above 1, so then the line stretches on round tick steps to show them. */
function axisFor(min: number, max: number): Axis {
  const low = Math.min(0, min);
  const high = Math.max(1, max);
  const step = niceStep(high - low, 10);
  const start = Math.floor(low / step + 1e-9) * step;
  const end = Math.ceil(high / step - 1e-9) * step;
  const ticks: number[] = [];
  for (let k = 0; start + k * step <= end + step * 1e-9; k++) ticks.push(Number((start + k * step).toFixed(10)));
  return { start, end, ticks };
}

/** Pollster numbers to label down the left side: the first one, then round steps. */
function pollsterTicks(count: number): number[] {
  const step = Math.max(1, Math.round(niceStep(count, 5)));
  const out = [1];
  for (let k = step; k <= count; k += step) if (k > 1) out.push(k);
  return out;
}

function Plot({ summary, t }: { summary: PollSummary; t: number }) {
  const { p, n, zStar, polls, captured } = summary;
  const count = polls.length;
  const axis = axisFor(Math.min(...polls.map((poll) => poll.lower)), Math.max(...polls.map((poll) => poll.upper)));
  const sx = (v: number) => LEFT + ((v - axis.start) / (axis.end - axis.start)) * (RIGHT - LEFT);

  // Rows share the plot's height; their strokes scale with them so 100 pollsters still leave a gap between rows.
  const rowH = Math.min(MAX_ROW, (PLOT_BOTTOM - PLOT_TOP) / count);
  const rowY = (i: number) => PLOT_TOP + (i + 0.5) * rowH;
  const thin = Math.min(2, rowH * 0.5);
  const thick = Math.min(3.5, rowH * 0.78);
  const dotR = Math.min(4, rowH * 0.62);

  const lineP = easeInOut(progressBetween(t, LINE_AT, LINE_MS));
  const markP = progressBetween(t, MARK_AT, MARK_MS);
  const px = sx(p);

  // Where each row is at time t: the p̂ dot pops in, then the interval opens out to its limits. Rows not started yet are left out.
  const rows = polls.flatMap((poll, i) => {
    const start = (i / count) * ROWS_MS;
    const dotP = progressBetween(t, start, DOT_MS);
    if (dotP <= 0) return [];
    const growP = easeInOut(progressBetween(t, start, GROW_MS));
    return [
      {
        i,
        y: rowY(i),
        x: sx(poll.pHat),
        x1: sx(lerp(poll.pHat, poll.lower, growP)),
        x2: sx(lerp(poll.pHat, poll.upper, growP)),
        r: dotR * dotP,
        final: poll.captured ? color.series[0] : color.series[1],
        width: poll.captured ? thin : lerp(thin, thick, markP),
      },
    ];
  });

  // Draws one mark per row twice: in the muted color the rows start in, fading out, and in each row's own color, fading in once the true p is shown.
  const layers = (draw: (row: (typeof rows)[number], paint: string) => ReactElement) => (
    <>
      {markP < 1 && <g opacity={1 - markP}>{rows.map((row) => draw(row, color.inkMuted))}</g>}
      {markP > 0 && <g opacity={markP}>{rows.map((row) => draw(row, row.final))}</g>}
    </>
  );

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
      role="img"
      aria-label={`${count} confidence intervals for the proportion of students who support a later start time, each from a random sample of ${n} students with z* = ${zStar}: ${captured} capture the true proportion ${fmt(p)} and ${count - captured} miss it. Average margin of error ${fmt(summary.meanMargin)}.`}
    >
      <text x={VIEW.width / 2} y={LEGEND_Y} textAnchor="middle" style={type.tick}>
        <tspan fill={color.series[0]}>■</tspan>
        <tspan> Captures p</tspan>
        <tspan dx={14} fill={color.series[1]}>■</tspan>
        <tspan> Misses p</tspan>
        <tspan dx={14} fill={color.reference}>¦</tspan>
        <tspan> True proportion p</tspan>
      </text>

      {axis.ticks.map((v) => (
        <line key={`grid-${v}`} x1={sx(v)} y1={PLOT_TOP - 4} x2={sx(v)} y2={AXIS_Y} stroke={color.grid} />
      ))}

      {pollsterTicks(count).map((k) => (
        <text key={`row-${k}`} x={LEFT - 8} y={rowY(k - 1) + 4} textAnchor="end" style={type.tick}>
          {k}
        </text>
      ))}
      <text x={16} y={(PLOT_TOP + PLOT_BOTTOM) / 2} textAnchor="middle" transform={`rotate(-90 16 ${(PLOT_TOP + PLOT_BOTTOM) / 2})`} style={type.axisTitle}>
        Pollster
      </text>

      {/* One row per pollster: the interval lines first, then the dashed line at p over them, then the p̂ dots on top so a dot sitting right on p still shows. */}
      {layers((row, paint) => (
        <line key={row.i} x1={row.x1} y1={row.y} x2={row.x2} y2={row.y} stroke={paint} strokeWidth={row.width} />
      ))}

      {/* The true proportion p, which the pollsters don't know, drops in after every interval is drawn. */}
      {lineP > 0 && (
        <g>
          <line x1={px} y1={PLOT_TOP - 4} x2={px} y2={lerp(PLOT_TOP - 4, AXIS_Y, lineP)} stroke={color.reference} strokeWidth={2} strokeDasharray="6 4" />
          <text x={px} y={P_LABEL_Y} textAnchor="middle" opacity={lineP} style={{ ...type.tick, fill: color.reference }}>
            p = {fmt(p)}
          </text>
        </g>
      )}

      {layers((row, paint) => (
        <circle key={row.i} cx={row.x} cy={row.y} r={row.r} fill={paint} />
      ))}

      <line x1={LEFT} y1={AXIS_Y} x2={RIGHT} y2={AXIS_Y} stroke={color.axis} />
      {axis.ticks.map((v) => (
        <g key={`tick-${v}`}>
          <line x1={sx(v)} y1={AXIS_Y} x2={sx(v)} y2={AXIS_Y + 5} stroke={color.axis} />
          <text x={sx(v)} y={AXIS_Y + 18} textAnchor="middle" style={type.tick}>
            {fmt(v)}
          </text>
        </g>
      ))}
      <text x={(LEFT + RIGHT) / 2} y={AXIS_Y + 42} textAnchor="middle" style={type.axisTitle}>
        Proportion Who Support a Later Start Time
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
          <EmptyState message="Press Run to have 100 pollsters each survey a random sample of students and build a confidence interval from it." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const drawn = t >= DRAWN_AT;
  const marked = t >= MARK_AT;

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <Plot summary={summary} t={t} />
      </PluginStage>
      <StatRow
        stats={[
          { label: "Captured", value: marked ? `${summary.captured} / ${summary.polls.length}` : EMPTY, color: color.series[0] },
          { label: "Confidence", value: pct(summary.confidence) },
          { label: "Sample size", value: String(summary.n) },
          { label: "Avg. margin", value: drawn ? fmt(summary.meanMargin) : EMPTY },
          { label: "Avg. estimate", value: drawn ? fmt(summary.meanPHat) : EMPTY },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
