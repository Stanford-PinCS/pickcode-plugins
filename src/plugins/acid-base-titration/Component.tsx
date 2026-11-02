import { observer } from "mobx-react-lite";
import { useId, useMemo } from "react";
import { PAD, VIEW, makeScales, niceStep, ticks } from "../../common/chart";
import {
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import { color, font, type } from "../../common/tokens";
import { useRunAnimation } from "../../common/useRunAnimation";
import instructions from "./instructions.md?raw";
import type { Region } from "./messages";
import State, { type TitrationRun } from "./state";

// One addition of base every STEP_MS. Like a real titration, the replay slows
// down within a few mL of the equivalence point and pauses on it, so the
// student can see the jump (and read "Equivalence") before it races past.
const STEP_MS = 90;
const SLOW_EXTRA_MS = 260;
const SLOW_WIDTH_ML = 1.5;
const EQUIVALENCE_HOLD_MS = 1400;
// The drop falls during the last FALL_MS of each addition.
const FALL_MS = 200;
// The buret holds 50.0 mL, so the volume axis always runs 0–50 mL.
const BURET_ML = 50;
// Phenolphthalein is colorless below about pH 8.2 and fully pink by about 10.
const INDICATOR_START = 8.2;
const INDICATOR_END = 10;

const REGION_LABEL: Record<Region, string> = {
  excessH: "Excess H⁺",
  equivalence: "Equivalence",
  excessOH: "Excess OH⁻",
};

/** 0 when colorless, rising to 1 across the indicator's range. */
const pinkness = (pH: number) =>
  Math.min(Math.max((pH - INDICATOR_START) / (INDICATOR_END - INDICATOR_START), 0), 1);

const indicatorName = (pH: number) =>
  pH < INDICATOR_START ? "colorless" : pH < INDICATOR_END ? "faint pink" : "pink";

/**
 * Tick values from lo to hi. chart.ts's `ticks` only covers 0..max, and a
 * student's pH can come out negative (a missing minus sign), so the pH axis
 * may need to reach below zero.
 */
function rangeTicks(lo: number, hi: number, divisions: number): number[] {
  if (lo >= 0) return ticks(hi, divisions);
  const step = niceStep(hi - lo, divisions);
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) out.push(v);
  return out;
}

// ---------------------------------------------------------------- apparatus

// The buret: 0 mL mark at the top, 50 mL at the bottom, like a real one.
const BX = 200;
const BURET_TOP = 18;
const BURET_BOTTOM = 178;
const BURET_HALF = 13;
const TIP_Y = 208;
const buretY = (mL: number) => BURET_TOP + (mL / BURET_ML) * (BURET_BOTTOM - BURET_TOP);

// The Erlenmeyer flask, centered under the buret tip.
const NECK_TOP = 216;
const NECK_BOTTOM = 248;
const NECK_HALF = 22;
const FLASK_BASE = 362;
const BASE_HALF = 112;
// Liquid height is drawn as if 90 mL would reach the bottom of the neck.
const FLASK_FULL_ML = 90;

const flaskHalfWidth = (y: number) =>
  y <= NECK_BOTTOM
    ? NECK_HALF
    : NECK_HALF + ((y - NECK_BOTTOM) / (FLASK_BASE - NECK_BOTTOM)) * (BASE_HALF - NECK_HALF);
const liquidTop = (totalML: number) =>
  FLASK_BASE - Math.min(totalML / FLASK_FULL_ML, 1) * (FLASK_BASE - NECK_BOTTOM);

const FLASK_PATH = [
  `M ${BX - NECK_HALF} ${NECK_TOP}`,
  `L ${BX - NECK_HALF} ${NECK_BOTTOM}`,
  `L ${BX - BASE_HALF} ${FLASK_BASE}`,
  `L ${BX + BASE_HALF} ${FLASK_BASE}`,
  `L ${BX + NECK_HALF} ${NECK_BOTTOM}`,
  `L ${BX + NECK_HALF} ${NECK_TOP}`,
].join(" ");

const Apparatus = ({
  run,
  index,
  dropProgress,
}: {
  run: TitrationRun;
  index: number;
  /** 0–1 while the next addition is falling, null when no drop is in the air. */
  dropProgress: number | null;
}) => {
  const added = run.volumesML[index];
  const pH = run.pHs[index];
  const level = liquidTop(run.acidVolumeML + added);
  const halfAtLevel = flaskHalfWidth(level);
  const liquid = [
    `M ${BX - halfAtLevel} ${level}`,
    `L ${BX + halfAtLevel} ${level}`,
    `L ${BX + BASE_HALF} ${FLASK_BASE}`,
    `L ${BX - BASE_HALF} ${FLASK_BASE}`,
    "Z",
  ].join(" ");
  const pink = pinkness(pH);
  const shown = Math.min(added, BURET_ML);
  const dropY =
    dropProgress === null ? null : TIP_Y + dropProgress * dropProgress * (level - TIP_Y);

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
      role="img"
      aria-label={`Buret has added ${added.toFixed(1)} mL of base; the flask is ${indicatorName(
        pH
      )} at pH ${pH.toFixed(2)}`}
    >
      {/* Buret: base left in the tube, then graduations */}
      <rect
        x={BX - BURET_HALF}
        y={buretY(shown)}
        width={BURET_HALF * 2}
        height={BURET_BOTTOM - buretY(shown)}
        fill={color.series[1]}
        fillOpacity={0.22}
      />
      <rect
        x={BX - BURET_HALF}
        y={BURET_TOP}
        width={BURET_HALF * 2}
        height={BURET_BOTTOM - BURET_TOP}
        fill="none"
        stroke={color.inkMuted}
        strokeWidth={1.5}
      />
      {Array.from({ length: BURET_ML / 5 + 1 }, (_, i) => i * 5).map((mL) => (
        <g key={`grad-${mL}`}>
          <line
            x1={BX - BURET_HALF}
            x2={BX - BURET_HALF + (mL % 10 === 0 ? 9 : 5)}
            y1={buretY(mL)}
            y2={buretY(mL)}
            stroke={color.inkMuted}
          />
          {mL % 10 === 0 && (
            <text
              x={BX - BURET_HALF - 6}
              y={buretY(mL) + 4}
              textAnchor="end"
              style={type.tick}
            >
              {mL}
            </text>
          )}
        </g>
      ))}
      {/* Liquid level marker: the current step */}
      <line
        x1={BX - BURET_HALF}
        x2={BX + BURET_HALF}
        y1={buretY(shown)}
        y2={buretY(shown)}
        stroke={color.series[1]}
        strokeWidth={2}
      />
      {/* Stopcock and tip */}
      <rect
        x={BX - 5}
        y={BURET_BOTTOM}
        width={10}
        height={14}
        fill={color.surfaceRaised}
        stroke={color.inkMuted}
        strokeWidth={1.5}
      />
      <line
        x1={BX - 16}
        x2={BX + 16}
        y1={BURET_BOTTOM + 7}
        y2={BURET_BOTTOM + 7}
        stroke={color.inkMuted}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path
        d={`M ${BX - 4} ${BURET_BOTTOM + 14} L ${BX - 1.5} ${TIP_Y} L ${BX + 1.5} ${TIP_Y} L ${
          BX + 4
        } ${BURET_BOTTOM + 14}`}
        fill={color.surfaceRaised}
        stroke={color.inkMuted}
        strokeWidth={1.5}
      />

      {dropY !== null && (
        <circle cx={BX} cy={dropY} r={4} fill={color.series[1]} />
      )}

      {/* Flask: clear until phenolphthalein starts turning pink */}
      <path d={liquid} fill={color.surfaceRaised} />
      <path d={liquid} fill={color.accentSoft} fillOpacity={pink > 0 ? 1 : 0} />
      <path d={liquid} fill={color.accent} fillOpacity={pink * 0.6} />
      <line
        x1={BX - halfAtLevel}
        x2={BX + halfAtLevel}
        y1={level}
        y2={level}
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

      {/* Labels */}
      <text x={BX + 34} y={58} style={{ ...type.axisTitle, fill: color.ink }}>
        NaOH (base)
      </text>
      <text x={BX + 34} y={76} style={type.tick}>
        {run.baseConcentration.toFixed(3)} M
      </text>
      <text
        x={BX + 34}
        y={104}
        style={{ ...type.tick, fill: color.series[1], fontWeight: 600 }}
      >
        {added.toFixed(1)} mL added
      </text>

      <text x={BX + BASE_HALF - 30} y={252} style={{ ...type.axisTitle, fill: color.ink }}>
        HCl (acid) + phenolphthalein
      </text>
      <text x={BX + BASE_HALF - 30} y={270} style={type.tick}>
        {run.acidConcentration.toFixed(3)} M, {run.acidVolumeML.toFixed(1)} mL
      </text>
      <text
        x={BX + BASE_HALF - 30}
        y={298}
        style={{
          ...type.tick,
          fill: pink > 0 ? color.accent : color.inkMuted,
          fontWeight: 600,
        }}
      >
        Indicator: {indicatorName(pH)}
      </text>
    </svg>
  );
};

// ---------------------------------------------------------------- pH curve

const PHCurve = ({ run, index }: { run: TitrationRun; index: number }) => {
  const clipId = `titration-plot-${useId().replace(/:/g, "")}`;
  const visible = run.pHs.slice(0, index + 1);
  const yLo = Math.min(0, Math.floor(Math.min(...run.pHs)));
  const yHi = Math.max(14, Math.ceil(Math.max(...run.pHs)));
  const s = makeScales(BURET_ML, yHi - yLo);
  const sx = s.sx;
  const sy = (pH: number) => s.sy(pH - yLo);
  const yTicks = rangeTicks(yLo, yHi, 7);

  const points = visible
    .map((pH, i) => `${sx(run.volumesML[i]).toFixed(1)},${sy(pH).toFixed(1)}`)
    .join(" ");
  const current = { x: sx(run.volumesML[index]), y: sy(run.pHs[index]) };
  const eq = run.equivalenceML;
  const showEq = eq > 0 && eq <= BURET_ML;

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
      role="img"
      aria-label={`pH ${run.pHs[index].toFixed(2)} after ${run.volumesML[index].toFixed(
        1
      )} mL of base${showEq ? `; equivalence point at ${eq.toFixed(1)} mL` : ""}`}
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

      {/* Phenolphthalein's color-change range */}
      <rect
        x={PAD.left}
        y={sy(INDICATOR_END)}
        width={s.plotWidth}
        height={sy(INDICATOR_START) - sy(INDICATOR_END)}
        fill={color.accentSoft}
      />
      <text
        x={PAD.left + 8}
        y={sy(INDICATOR_END) + 13}
        style={{ ...type.tick, fill: color.accent }}
      >
        phenolphthalein turns pink
      </text>

      {yTicks.map((v) => (
        <line
          key={`grid-${v}`}
          x1={PAD.left}
          y1={sy(v)}
          x2={PAD.left + s.plotWidth}
          y2={sy(v)}
          stroke={color.grid}
        />
      ))}

      {showEq && (
        <>
          <line
            x1={sx(eq)}
            y1={PAD.top}
            x2={sx(eq)}
            y2={PAD.top + s.plotHeight}
            stroke={color.reference}
            strokeWidth={2}
            strokeDasharray="8 5"
          />
          <text
            x={sx(eq) + (eq > BURET_ML * 0.7 ? -6 : 6)}
            y={PAD.top + 16}
            textAnchor={eq > BURET_ML * 0.7 ? "end" : "start"}
            style={{ ...type.tick, fill: color.reference, fontWeight: 600 }}
          >
            equivalence
          </text>
        </>
      )}

      <g clipPath={`url(#${clipId})`}>
        {/* The current addition */}
        <line
          x1={current.x}
          y1={PAD.top}
          x2={current.x}
          y2={PAD.top + s.plotHeight}
          stroke={color.inkMuted}
          strokeOpacity={0.45}
          strokeDasharray="3 4"
        />
        {visible.length > 1 && (
          <polyline
            points={points}
            fill="none"
            stroke={color.series[0]}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
      </g>
      {/* Points sit inside the axis range, so they are not clipped (a clip
          would cut the dots at 0 and 50 mL in half). */}
      <g>
        {visible.map((pH, i) => (
          <circle
            key={`pt-${i}`}
            cx={sx(run.volumesML[i])}
            cy={sy(pH)}
            r={2.2}
            fill={color.series[0]}
          />
        ))}
        <circle
          cx={current.x}
          cy={current.y}
          r={6.5}
          fill="none"
          stroke={color.series[0]}
          strokeWidth={2}
        />
      </g>

      <line
        x1={PAD.left}
        y1={sy(yLo)}
        x2={PAD.left + s.plotWidth}
        y2={sy(yLo)}
        stroke={color.axis}
      />
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={sy(yLo)} stroke={color.axis} />

      {ticks(BURET_ML).map((v) => (
        <text
          key={`xt-${v}`}
          x={sx(v)}
          y={sy(yLo) + 20}
          textAnchor="middle"
          style={type.tick}
        >
          {v}
        </text>
      ))}
      {yTicks.map((v) => (
        <text
          key={`yt-${v}`}
          x={PAD.left - 8}
          y={sy(v) + 4}
          textAnchor="end"
          style={type.tick}
        >
          {v}
        </text>
      ))}

      <text
        x={PAD.left + s.plotWidth / 2}
        y={VIEW.height - 8}
        textAnchor="middle"
        style={type.axisTitle}
      >
        NaOH added (mL)
      </text>
      <text
        x={14}
        y={PAD.top + s.plotHeight / 2}
        textAnchor="middle"
        transform={`rotate(-90, 14, ${PAD.top + s.plotHeight / 2})`}
        style={type.axisTitle}
      >
        pH
      </text>
    </svg>
  );
};

// ---------------------------------------------------------------- pane

/** How long each addition stays on screen, and when each one starts. */
function schedule(run: TitrationRun) {
  const eq = run.equivalenceML;
  const durations = run.volumesML.map((v, i) => {
    const near = eq <= BURET_ML ? Math.exp(-(((v - eq) / SLOW_WIDTH_ML) ** 2)) : 0;
    const hold = run.regions[i] === "equivalence" ? EQUIVALENCE_HOLD_MS : 0;
    return STEP_MS + SLOW_EXTRA_MS * near + hold;
  });
  const starts: number[] = [];
  let t = 0;
  for (const d of durations) {
    starts.push(t);
    t += d;
  }
  return { durations, starts, total: t };
}

const Component = observer(({ state }: { state: State }) => {
  const run = state.run;
  const n = run?.pHs.length ?? 0;
  const timing = useMemo(() => (run ? schedule(run) : null), [run]);
  const duration = timing?.total ?? 0;
  const elapsed = useRunAnimation(run, duration);

  if (!run || !timing || n === 0) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Press Run to drip base into the acid and graph the pH." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const done = elapsed >= duration;
  let index = n - 1;
  if (!done) {
    index = 0;
    while (index < n - 1 && timing.starts[index + 1] <= elapsed) index++;
  }
  // The next addition falls during the end of this one's time on screen.
  const fall = Math.min(FALL_MS, timing.durations[index]);
  const fallStart = timing.starts[index] + timing.durations[index] - fall;
  const dropProgress =
    !done && index < n - 1 && elapsed >= fallStart ? (elapsed - fallStart) / fall : null;
  const eq = run.equivalenceML;

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
            fontFamily: font.ui,
          }}
        >
          <div style={{ minWidth: 0, minHeight: 0, overflow: "hidden" }}>
            <Apparatus run={run} index={index} dropProgress={dropProgress} />
          </div>
          <div style={{ minWidth: 0, minHeight: 0, overflow: "hidden" }}>
            <PHCurve run={run} index={index} />
          </div>
        </div>
      </PluginStage>

      <StatRow
        stats={[
          { label: "Base Added", value: `${run.volumesML[index].toFixed(1)} mL` },
          { label: "pH", value: run.pHs[index].toFixed(2), color: color.series[0] },
          { label: "Region", value: REGION_LABEL[run.regions[index]] },
          {
            label: "Equivalence",
            value: eq <= BURET_ML ? `${eq.toFixed(1)} mL` : `> ${BURET_ML} mL`,
            color: color.reference,
          },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
