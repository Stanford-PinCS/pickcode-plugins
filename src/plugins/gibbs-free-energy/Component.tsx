import { observer } from "mobx-react-lite";
import { useEffect, useId, useState } from "react";
import { PAD, VIEW, makeScales, niceStep } from "../../common/chart";
import {
  EMPTY,
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import { color, font, type } from "../../common/tokens";
import { useRunAnimation } from "../../common/useRunAnimation";
import instructions from "./instructions.md?raw";
import type { GibbsLabel } from "./messages";
import State, { type GibbsRun } from "./state";

// The sweep shows one temperature at a time, finishing in about 6 s however
// many points the loop sent (but never faster than MIN_STEP_MS each).
const SWEEP_MS = 6000;
const MIN_STEP_MS = 60;
const MAX_STEP_MS = 450;

const LABEL_COLOR: Record<GibbsLabel, string> = {
  spontaneous: color.series[1],
  nonspontaneous: color.series[0],
  "not spontaneous": color.series[0],
};

// Room above the plot for the legend.
const CHART_PAD = { ...PAD, top: 40 };

/**
 * A nice range [lo, hi] that contains every value, plus its tick step.
 * chart.ts only builds 0..max axes; ΔG is negative and positive, and the
 * temperature axis follows the student's loop (e.g. 250–300 K), so these
 * axes need a non-zero minimum.
 */
function niceRange(min: number, max: number, divisions = 5) {
  const span = max - min || Math.abs(max) || 1;
  const step = niceStep(span, divisions);
  let lo = Math.floor(min / step) * step;
  let hi = Math.ceil(max / step) * step;
  if (hi === lo) hi = lo + step;
  lo = Number(lo.toFixed(10));
  hi = Number(hi.toFixed(10));
  const count = Math.round((hi - lo) / step);
  const values = Array.from({ length: count + 1 }, (_, i) =>
    Number((lo + i * step).toFixed(10))
  );
  const decimals = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
  return { lo, hi, values, decimals };
}

const formatKelvin = (t: number) =>
  Number.isInteger(t) ? String(t) : t.toFixed(1);

/** A clock for the bubbles. Stands still under prefers-reduced-motion. */
function useClock(active: boolean): number {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      setT(now - start);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);
  return t;
}

// ---------------------------------------------------------------- chart

const GibbsChart = ({
  run,
  index,
  showCrossover,
}: {
  run: GibbsRun;
  index: number;
  showCrossover: boolean;
}) => {
  const clipId = `gibbs-plot-${useId().replace(/:/g, "")}`;
  const temps = run.temperatures;
  const gs = run.deltaGs;
  const x = niceRange(Math.min(...temps), Math.max(...temps));
  const y = niceRange(Math.min(0, ...gs), Math.max(0, ...gs));
  const s = makeScales(x.hi - x.lo, y.hi - y.lo, VIEW, CHART_PAD);
  const sx = (t: number) => s.sx(t - x.lo);
  const sy = (g: number) => s.sy(g - y.lo);
  const left = CHART_PAD.left;
  const right = CHART_PAD.left + s.plotWidth;
  const top = CHART_PAD.top;
  const bottom = CHART_PAD.top + s.plotHeight;

  const line = temps
    .slice(0, index + 1)
    .map((t, i) => `${sx(t).toFixed(1)},${sy(gs[i]).toFixed(1)}`)
    .join(" ");
  const cx = sx(temps[index]);
  const cy = sy(gs[index]);
  const cross = run.crossoverK;

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
      role="img"
      aria-label={`ΔG is ${gs[index].toFixed(2)} kJ/mol at ${formatKelvin(
        temps[index]
      )} K, labeled ${run.labels[index]}${
        cross !== null ? `; ΔG crosses zero at ${Math.round(cross)} K` : ""
      }`}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={left} y={top} width={s.plotWidth} height={s.plotHeight} />
        </clipPath>
      </defs>

      {/* Legend */}
      <g style={{ ...type.tick, fill: color.ink }}>
        <circle cx={left + 6} cy={20} r={5} fill={LABEL_COLOR.spontaneous} />
        <text x={left + 16} y={24}>
          Spontaneous
        </text>
        <circle cx={left + 120} cy={20} r={5} fill={LABEL_COLOR.nonspontaneous} />
        <text x={left + 130} y={24}>
          Nonspontaneous
        </text>
      </g>

      <rect
        x={left}
        y={top}
        width={s.plotWidth}
        height={s.plotHeight}
        fill={color.surfaceRaised}
        stroke={color.border}
        rx={4}
      />
      {y.values.map((v) => (
        <line
          key={`grid-${v}`}
          x1={left}
          y1={sy(v)}
          x2={right}
          y2={sy(v)}
          stroke={color.grid}
        />
      ))}

      {/* ΔG = 0: below it the reaction is spontaneous */}
      <line
        x1={left}
        y1={sy(0)}
        x2={right}
        y2={sy(0)}
        stroke={color.reference}
        strokeWidth={2}
        strokeDasharray="8 5"
      />
      <text
        x={right - 6}
        y={sy(0) - 6}
        textAnchor="end"
        style={{ ...type.tick, fill: color.reference, fontWeight: 600 }}
      >
        ΔG = 0
      </text>

      <g clipPath={`url(#${clipId})`}>
        {/* The temperature the loop is on */}
        <line
          x1={cx}
          y1={top}
          x2={cx}
          y2={bottom}
          stroke={color.inkMuted}
          strokeOpacity={0.45}
          strokeDasharray="3 4"
        />
        {index > 0 && (
          <polyline
            points={line}
            fill="none"
            stroke={color.axis}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        )}
      </g>
      {/* Points sit inside the axis range, so they are not clipped (a clip
          would cut the first and last dots in half). */}
      <g>
        {temps.slice(0, index + 1).map((t, i) => (
          <circle
            key={`pt-${i}`}
            cx={sx(t)}
            cy={sy(gs[i])}
            r={5}
            fill={LABEL_COLOR[run.labels[i]]}
            stroke={color.surfaceRaised}
            strokeWidth={1.5}
          />
        ))}
        <circle
          cx={cx}
          cy={cy}
          r={9}
          fill="none"
          stroke={LABEL_COLOR[run.labels[index]]}
          strokeWidth={2}
        />
      </g>

      {/* Crossover temperature, once the sweep has reached it */}
      {showCrossover && cross !== null && (
        <g>
          <rect
            x={sx(cross) - 6}
            y={sy(0) - 6}
            width={12}
            height={12}
            transform={`rotate(45, ${sx(cross)}, ${sy(0)})`}
            fill={color.surface}
            stroke={color.reference}
            strokeWidth={2.5}
          />
          <text
            x={sx(cross)}
            y={sy(0) + 24}
            textAnchor="middle"
            style={{ ...type.tick, fill: color.reference, fontWeight: 600 }}
          >
            {Math.round(cross)} K
          </text>
        </g>
      )}

      <line x1={left} y1={bottom} x2={right} y2={bottom} stroke={color.axis} />
      <line x1={left} y1={top} x2={left} y2={bottom} stroke={color.axis} />

      {x.values.map((v) => (
        <text
          key={`xt-${v}`}
          x={sx(v)}
          y={bottom + 20}
          textAnchor="middle"
          style={type.tick}
        >
          {v.toFixed(x.decimals)}
        </text>
      ))}
      {y.values.map((v) => (
        <text
          key={`yt-${v}`}
          x={left - 8}
          y={sy(v) + 4}
          textAnchor="end"
          style={type.tick}
        >
          {v.toFixed(y.decimals)}
        </text>
      ))}

      <text
        x={left + s.plotWidth / 2}
        y={VIEW.height - 8}
        textAnchor="middle"
        style={type.axisTitle}
      >
        Temperature (K)
      </text>
      <text
        x={14}
        y={top + s.plotHeight / 2}
        textAnchor="middle"
        transform={`rotate(-90, 14, ${top + s.plotHeight / 2})`}
        style={type.axisTitle}
      >
        ΔG (kJ/mol)
      </text>
    </svg>
  );
};

// ---------------------------------------------------------------- reaction

const THERMO_X = 92;
const THERMO_TOP = 44;
const THERMO_BOTTOM = 286;
const BULB_Y = 308;

const FX = 330;
const NECK_TOP = 60;
const NECK_BOTTOM = 120;
const NECK_HALF = 26;
const FLASK_BASE = 290;
const BASE_HALF = 128;
const LIQUID_TOP = 170;

const halfWidth = (yy: number) =>
  NECK_HALF + ((yy - NECK_BOTTOM) / (FLASK_BASE - NECK_BOTTOM)) * (BASE_HALF - NECK_HALF);

const FLASK_PATH = [
  `M ${FX - NECK_HALF} ${NECK_TOP}`,
  `L ${FX - NECK_HALF} ${NECK_BOTTOM}`,
  `L ${FX - BASE_HALF} ${FLASK_BASE}`,
  `L ${FX + BASE_HALF} ${FLASK_BASE}`,
  `L ${FX + NECK_HALF} ${NECK_BOTTOM}`,
  `L ${FX + NECK_HALF} ${NECK_TOP}`,
].join(" ");

const LIQUID_PATH = [
  `M ${FX - halfWidth(LIQUID_TOP)} ${LIQUID_TOP}`,
  `L ${FX + halfWidth(LIQUID_TOP)} ${LIQUID_TOP}`,
  `L ${FX + BASE_HALF} ${FLASK_BASE}`,
  `L ${FX - BASE_HALF} ${FLASK_BASE}`,
  "Z",
].join(" ");

// Fixed bubble layout: horizontal position (fraction of the flask's half
// width), starting phase, and radius.
const BUBBLES = [
  [-0.6, 0.0, 4],
  [-0.3, 0.55, 3],
  [0.05, 0.2, 5],
  [0.35, 0.7, 3.5],
  [0.62, 0.35, 4],
  [-0.45, 0.85, 3],
  [0.2, 0.45, 3],
  [-0.1, 0.95, 4],
] as const;
const BUBBLE_RISE_MS = 2200;

const Reaction = ({
  run,
  index,
  clock,
}: {
  run: GibbsRun;
  index: number;
  clock: number;
}) => {
  const clipId = `gibbs-flask-${useId().replace(/:/g, "")}`;
  const label = run.labels[index];
  const proceeds = label === "spontaneous";
  const t = run.temperatures[index];
  const tMin = Math.min(...run.temperatures);
  const tMax = Math.max(...run.temperatures);
  const fraction = tMax > tMin ? (t - tMin) / (tMax - tMin) : 1;
  // The fluid never drops all the way into the bulb, so the lowest
  // temperature still reads.
  const fluidTop = THERMO_BOTTOM - (0.08 + 0.92 * fraction) * (THERMO_BOTTOM - THERMO_TOP);

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
      role="img"
      aria-label={`At ${formatKelvin(t)} K the reaction ${
        proceeds ? "proceeds" : "does not proceed"
      }`}
    >
      {/* Thermometer: the temperature the loop is on */}
      <circle
        cx={THERMO_X}
        cy={BULB_Y}
        r={19}
        fill={color.surfaceRaised}
        stroke={color.inkMuted}
        strokeWidth={1.5}
      />
      <path
        d={`M ${THERMO_X - 9} ${BULB_Y - 12} L ${THERMO_X - 9} ${THERMO_TOP} A 9 9 0 0 1 ${
          THERMO_X + 9
        } ${THERMO_TOP} L ${THERMO_X + 9} ${BULB_Y - 12}`}
        fill={color.surfaceRaised}
        stroke={color.inkMuted}
        strokeWidth={1.5}
      />
      <rect
        x={THERMO_X - 4}
        y={fluidTop}
        width={8}
        height={BULB_Y - fluidTop}
        fill={color.series[3]}
      />
      <circle cx={THERMO_X} cy={BULB_Y} r={14} fill={color.series[3]} />
      <line
        x1={THERMO_X + 12}
        x2={THERMO_X + 22}
        y1={fluidTop}
        y2={fluidTop}
        stroke={color.series[3]}
        strokeWidth={2}
      />
      <text
        x={THERMO_X + 26}
        y={fluidTop + 5}
        style={{
          fontFamily: font.data,
          fontSize: 14,
          fontWeight: 600,
          fill: color.series[3],
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatKelvin(t)} K
      </text>

      {/* Flask: bubbling when your label says the reaction proceeds */}
      <defs>
        <clipPath id={clipId}>
          <path d={LIQUID_PATH} />
        </clipPath>
      </defs>
      <path
        d={LIQUID_PATH}
        fill={proceeds ? color.series[1] : color.surfaceRaised}
        fillOpacity={proceeds ? 0.16 : 1}
      />
      {proceeds && (
        <g clipPath={`url(#${clipId})`}>
          {BUBBLES.map(([fx, phase, r], i) => {
            const p = (clock / BUBBLE_RISE_MS + phase) % 1;
            const by = FLASK_BASE - 6 - p * (FLASK_BASE - LIQUID_TOP);
            return (
              <circle
                key={`bubble-${i}`}
                cx={FX + fx * halfWidth(by)}
                cy={by}
                r={r}
                fill={color.surfaceRaised}
                stroke={color.series[1]}
                strokeWidth={1.5}
              />
            );
          })}
        </g>
      )}
      <line
        x1={FX - halfWidth(LIQUID_TOP)}
        x2={FX + halfWidth(LIQUID_TOP)}
        y1={LIQUID_TOP}
        y2={LIQUID_TOP}
        stroke={color.axis}
        strokeWidth={1.5}
      />
      <path
        d={FLASK_PATH}
        fill="none"
        stroke={color.inkMuted}
        strokeWidth={2}
        strokeLinejoin="round"
      />

      <text
        x={FX}
        y={326}
        textAnchor="middle"
        style={{
          fontFamily: font.ui,
          fontSize: 18,
          fontWeight: 700,
          fill: LABEL_COLOR[label],
        }}
      >
        {proceeds ? "Proceeds" : "Does not proceed"}
      </text>
      <text x={FX} y={350} textAnchor="middle" style={{ ...type.tick, fontSize: 12 }}>
        label = "{label}"
      </text>
    </svg>
  );
};

// ---------------------------------------------------------------- pane

const Component = observer(({ state }: { state: State }) => {
  const run = state.run;
  const n = run?.temperatures.length ?? 0;
  const stepMs = Math.min(MAX_STEP_MS, Math.max(MIN_STEP_MS, SWEEP_MS / Math.max(n, 1)));
  const duration = n * stepMs;
  const elapsed = useRunAnimation(run, duration);
  const clock = useClock(run !== null);

  if (!run || n === 0) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Press Run to sweep across temperatures and see where the reaction is spontaneous." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const done = elapsed >= duration;
  const index = done ? n - 1 : Math.min(n - 1, Math.floor(elapsed / stepMs));
  const cross = run.crossoverK;
  const first = run.temperatures[0];
  const now = run.temperatures[index];
  const showCrossover =
    cross !== null && (done || (first - cross) * (now - cross) <= 0);
  const correctSoFar = run.correct.slice(0, index + 1).filter(Boolean).length;

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <div
          style={{
            width: "100%",
            height: "100%",
            minHeight: 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))",
            gridAutoRows: "minmax(0, 1fr)",
            gap: 12,
            overflow: "hidden",
          }}
        >
          <div style={{ minWidth: 0, minHeight: 0, overflow: "hidden" }}>
            <GibbsChart run={run} index={index} showCrossover={showCrossover} />
          </div>
          <div style={{ minWidth: 0, minHeight: 0, overflow: "hidden" }}>
            <Reaction run={run} index={index} clock={clock} />
          </div>
        </div>
      </PluginStage>

      <StatRow
        stats={[
          { label: "Temperature", value: `${formatKelvin(now)} K` },
          {
            label: "ΔG",
            value: `${run.deltaGs[index].toFixed(2)} kJ/mol`,
            color: LABEL_COLOR[run.labels[index]],
          },
          {
            label: "Crossover",
            value: cross === null ? "None" : showCrossover ? `${Math.round(cross)} K` : EMPTY,
            color: color.reference,
          },
          { label: "Correct Labels", value: `${correctSoFar}/${index + 1}` },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
