import { observer } from "mobx-react-lite";
import { memo, useId } from "react";
import { PAD, VIEW, makeScales, ticks } from "../../common/chart";
import { useRunAnimation } from "../../common/useRunAnimation";
import {
  EMPTY,
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import { color, type } from "../../common/tokens";
import instructions from "./instructions.md?raw";
import State, { type KineticsRun } from "./state";

/*
 * Left: every molecule in the box, pink while it is still A, teal once it
 * has turned into B. Molecules that react in the step on screen get an
 * outline. Right: the number of A molecules over time, drawn live, over the
 * dashed integrated rate law [A] = [A]0 e^(-kt) with half-life markers.
 */

// The molecule box is the graph's plot box, so both panels line up.
const BOX_W = VIEW.width - PAD.left - PAD.right;
const BOX_H = VIEW.height - PAD.top - PAD.bottom;

/** The whole replay takes STEP_MS per step, held between these limits. */
const STEP_MS = 250;
const MIN_TOTAL_MS = 2500;
const MAX_TOTAL_MS = 7000;

const totalMs = (numSteps: number) =>
  Math.min(MAX_TOTAL_MS, Math.max(MIN_TOTAL_MS, numSteps * STEP_MS));

/** ln 2 / k (= 0.693 / k), the first-order half-life in seconds. */
const halfLife = (k: number) => (k > 0 ? Math.LN2 / k : Infinity);

/** Re-renders only when the step changes, not on every animation frame. */
const MoleculeGrid = memo(
  ({ run, step }: { run: KineticsRun; step: number }) => {
    const n = run.numMolecules;
    const cols = Math.max(1, Math.ceil(Math.sqrt((n * BOX_W) / BOX_H)));
    const rows = Math.ceil(n / cols);
    const cell = Math.min(BOX_W / cols, BOX_H / rows);
    const left = PAD.left + (BOX_W - cols * cell) / 2;
    const top = PAD.top + (BOX_H - rows * cell) / 2;
    const r = cell * 0.36;

    return (
      <g>
        {run.reactedAt.map((reacted, i) => {
          const isB = reacted > 0 && reacted <= step;
          const justReacted = step > 0 && reacted === step;
          return (
            <circle
              key={i}
              cx={left + ((i % cols) + 0.5) * cell}
              cy={top + (Math.floor(i / cols) + 0.5) * cell}
              r={r}
              fill={isB ? color.series[1] : color.series[0]}
              stroke={justReacted ? color.ink : "none"}
              strokeWidth={Math.max(1, cell * 0.08)}
            />
          );
        })}
      </g>
    );
  }
);

const ConcentrationGraph = ({
  run,
  step,
}: {
  run: KineticsRun;
  step: number;
}) => {
  const clipId = `kinetics-plot-${useId().replace(/:/g, "")}`;
  const n = run.numMolecules;
  const xMax = Math.max(run.numSteps, 10);
  const yMax = n;
  const s = makeScales(xMax, yMax);
  const tHalf = halfLife(run.k);

  // Dashed integrated rate law over the whole run, drawn from the start.
  const samples = 200;
  const theory = Array.from({ length: samples + 1 }, (_, i) => {
    const t = (xMax * i) / samples;
    return `${s.sx(t).toFixed(1)},${s.sy(n * Math.exp(-run.k * t)).toFixed(1)}`;
  }).join(" ");

  const simulated = run.countA
    .slice(0, step + 1)
    .map((a, t) => `${s.sx(t).toFixed(1)},${s.sy(a).toFixed(1)}`)
    .join(" ");

  const markers = [1, 2, 3]
    .map((m) => ({ m, t: m * tHalf, a: n / 2 ** m }))
    .filter(({ t }) => t <= xMax);

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
      role="img"
      aria-label={`A molecules over time: ${run.countA[step]} of ${n} left after ${step} seconds. The rate law predicts a half-life of ${
        Number.isFinite(tHalf) ? tHalf.toFixed(1) : "forever"
      } seconds.`}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={PAD.left} y={PAD.top} width={s.plotWidth} height={s.plotHeight} />
        </clipPath>
      </defs>

      <rect
        x={PAD.left}
        y={PAD.top}
        width={s.plotWidth}
        height={s.plotHeight}
        fill={color.surfaceRaised}
        stroke={color.border}
        rx={4}
      />
      {ticks(yMax, 4).map((v) => (
        <line
          key={`grid-${v}`}
          x1={PAD.left}
          y1={s.sy(v)}
          x2={PAD.left + s.plotWidth}
          y2={s.sy(v)}
          stroke={color.grid}
        />
      ))}

      <g clipPath={`url(#${clipId})`}>
        {/* Half-life markers: each one halves what is left. */}
        {markers.map(({ m, t, a }) => (
          <g key={`half-${m}`}>
            <line
              x1={s.sx(t)}
              y1={s.sy(0)}
              x2={s.sx(t)}
              y2={s.sy(a)}
              stroke={color.reference}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle cx={s.sx(t)} cy={s.sy(a)} r={3.5} fill={color.reference} />
            <text
              x={s.sx(t) + 5}
              y={s.sy(a) - 6}
              style={{ ...type.tick, fill: color.reference }}
            >
              {m === 1 ? "t½" : `${m}t½`}
            </text>
          </g>
        ))}

        <polyline
          points={theory}
          fill="none"
          stroke={color.reference}
          strokeWidth={2}
          strokeDasharray="8 5"
        />

        {/* Which step the loop is on. */}
        <line
          x1={s.sx(step)}
          y1={PAD.top}
          x2={s.sx(step)}
          y2={s.sy(0)}
          stroke={color.inkMuted}
          strokeWidth={1}
        />

        {step > 0 && (
          <polyline
            points={simulated}
            fill="none"
            stroke={color.series[0]}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        <circle
          cx={s.sx(step)}
          cy={s.sy(run.countA[step])}
          r={4}
          fill={color.series[0]}
          stroke={color.surfaceRaised}
          strokeWidth={1.5}
        />
      </g>

      <line x1={PAD.left} y1={s.sy(0)} x2={PAD.left + s.plotWidth} y2={s.sy(0)} stroke={color.axis} />
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={s.sy(0)} stroke={color.axis} />

      {ticks(xMax).map((v) => (
        <text key={`xt-${v}`} x={s.sx(v)} y={s.sy(0) + 20} textAnchor="middle" style={type.tick}>
          {v}
        </text>
      ))}
      {ticks(yMax, 4).map((v) => (
        <text key={`yt-${v}`} x={PAD.left - 8} y={s.sy(v) + 4} textAnchor="end" style={type.tick}>
          {v}
        </text>
      ))}

      {/* Legend, top right, where the falling A line has already left. */}
      <g transform={`translate(${PAD.left + s.plotWidth - 222}, ${PAD.top + 16})`}>
        <rect x={-6} y={-12} width={222} height={20} rx={3} fill={color.surfaceRaised} />
        <line x1={0} y1={-4} x2={18} y2={-4} stroke={color.series[0]} strokeWidth={2.5} />
        <text x={24} y={0} style={type.tick}>
          A molecules
        </text>
        <line
          x1={104}
          y1={-4}
          x2={122}
          y2={-4}
          stroke={color.reference}
          strokeWidth={2}
          strokeDasharray="5 3"
        />
        <text x={128} y={0} style={type.tick}>
          [A]₀e^(−kt)
        </text>
      </g>

      <text
        x={PAD.left + s.plotWidth / 2}
        y={VIEW.height - 8}
        textAnchor="middle"
        style={type.axisTitle}
      >
        Time (s)
      </text>
      <text
        x={14}
        y={PAD.top + s.plotHeight / 2}
        textAnchor="middle"
        transform={`rotate(-90, 14, ${PAD.top + s.plotHeight / 2})`}
        style={type.axisTitle}
      >
        A molecules
      </text>
    </svg>
  );
};

const Component = observer(({ state }: { state: State }) => {
  const run = state.run;
  const duration = run ? totalMs(run.numSteps) : 0;
  const elapsed = useRunAnimation(run, duration);

  if (!run) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Press Run to start the reaction and watch A molecules turn into B." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const step = Math.min(
    run.numSteps,
    Math.floor((elapsed / duration) * run.numSteps + 1e-9)
  );
  const n = run.numMolecules;
  const aLeft = run.countA[step];
  const measuredIndex = run.countA
    .slice(0, step + 1)
    .findIndex((a) => a <= n / 2);
  const predicted = halfLife(run.k);

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
            <svg
              viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
              preserveAspectRatio="xMidYMid meet"
              style={{ width: "100%", height: "100%" }}
              role="img"
              aria-label={`${aLeft} A molecules and ${n - aLeft} B molecules after ${step} seconds`}
            >
              <rect
                x={PAD.left}
                y={PAD.top}
                width={BOX_W}
                height={BOX_H}
                fill={color.surfaceRaised}
                stroke={color.border}
                rx={4}
              />
              <MoleculeGrid run={run} step={step} />
              <text
                x={PAD.left + BOX_W / 2}
                y={VIEW.height - 8}
                textAnchor="middle"
                style={type.tick}
              >
                <tspan fill={color.series[0]}>●</tspan>
                <tspan> A</tspan>
                <tspan dx={12} fill={color.series[1]}>
                  ●
                </tspan>
                <tspan> B</tspan>
                <tspan dx={18} style={{ ...type.axisTitle, fill: color.ink }}>
                  Step {step} of {run.numSteps}
                </tspan>
              </text>
            </svg>
          </div>
          <div style={{ minWidth: 0, minHeight: 0, overflow: "hidden" }}>
            <ConcentrationGraph run={run} step={step} />
          </div>
        </div>
      </PluginStage>

      <StatRow
        stats={[
          { label: "Time", value: `${step} s` },
          { label: "A Left", value: String(aLeft), color: color.series[0] },
          {
            label: "Measured t½",
            value: measuredIndex > 0 ? `${measuredIndex} s` : EMPTY,
          },
          {
            label: "Predicted t½",
            value: Number.isFinite(predicted) ? `${predicted.toFixed(1)} s` : EMPTY,
            color: color.reference,
          },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
