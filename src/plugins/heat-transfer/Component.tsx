import { observer } from "mobx-react-lite";
import { useId } from "react";
import { PAD, VIEW, makeScales, niceStep, ticks } from "../../common/chart";
import { useRunAnimation } from "../../common/useRunAnimation";
import {
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import { color, type } from "../../common/tokens";
import instructions from "./instructions.md?raw";
import State, { type CalorimeterRun } from "./state";

/*
 * Left: a coffee-cup calorimeter. A pink metal block sits in teal water, with
 * a thermometer for each and arrows showing heat leaving the block while the
 * loop runs. Right: both temperatures against loop pass, drawn live, with a
 * dashed amber line at the predicted final temperature.
 */

/** The replay takes PASS_MS per loop pass, held between these limits. */
const PASS_MS = 15;
const MIN_TOTAL_MS = 2500;
const MAX_TOTAL_MS = 6000;
/** Longest line the graph draws; longer runs are thinned evenly. */
const MAX_POINTS = 800;
/** One heat-arrow pulse, in ms. */
const PULSE_MS = 900;

const totalMs = (passes: number) =>
  Math.min(MAX_TOTAL_MS, Math.max(MIN_TOTAL_MS, passes * PASS_MS));

const fmtTemp = (t: number) => `${t.toFixed(1)} °C`;

/** Top of the temperature axis: at least 100 °C, rounded up to a nice step. */
function tempAxisMax(run: CalorimeterRun): number {
  const hottest = Math.max(100, run.metalTemps[0], run.waterTemps[0]);
  const step = niceStep(hottest, 4);
  return Math.ceil(hottest / step) * step;
}

/* ───────── Calorimeter ───────── */

const CUP = { left: 170, right: 370, top: 78, bottom: 322, taper: 12 };
const WATER_TOP = 122;
const BLOCK = { x: 228, y: 252, w: 84, h: 58 };
const THERMO = { top: 70, bottom: 300, bulb: 13, width: 14 };

const Thermometer = ({
  x,
  label,
  temp,
  yMax,
  predicted,
  fill,
}: {
  x: number;
  label: string;
  temp: number;
  yMax: number;
  predicted: number;
  fill: string;
}) => {
  const span = THERMO.bottom - THERMO.top;
  const yOf = (t: number) =>
    THERMO.bottom - (Math.min(Math.max(t, 0), yMax) / yMax) * span;
  const half = THERMO.width / 2;
  return (
    <g>
      <text x={x} y={THERMO.top - 26} textAnchor="middle" style={{ ...type.axisTitle, fill: color.ink }}>
        {label}
      </text>
      <text
        x={x}
        y={THERMO.top - 10}
        textAnchor="middle"
        style={{ ...type.tick, fill, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
      >
        {fmtTemp(temp)}
      </text>
      <rect
        x={x - half}
        y={THERMO.top}
        width={THERMO.width}
        height={span + THERMO.bulb}
        rx={half}
        fill={color.surfaceRaised}
        stroke={color.inkMuted}
        strokeWidth={1.5}
      />
      <rect
        x={x - half + 3}
        y={yOf(temp)}
        width={THERMO.width - 6}
        height={THERMO.bottom + THERMO.bulb - yOf(temp)}
        rx={2}
        fill={fill}
      />
      <circle
        cx={x}
        cy={THERMO.bottom + THERMO.bulb}
        r={THERMO.bulb}
        fill={fill}
        stroke={color.inkMuted}
        strokeWidth={1.5}
      />
      {ticks(yMax, 4).map((t) => (
        <g key={t}>
          <line x1={x + half} y1={yOf(t)} x2={x + half + 5} y2={yOf(t)} stroke={color.axis} />
          <text x={x + half + 8} y={yOf(t) + 4} style={type.tick}>
            {t}
          </text>
        </g>
      ))}
      <line
        x1={x - half - 5}
        y1={yOf(predicted)}
        x2={x + half}
        y2={yOf(predicted)}
        stroke={color.reference}
        strokeWidth={2}
        strokeDasharray="4 2"
      />
    </g>
  );
};

/** Short arrows leaving the block, pulsing outward while heat flows. */
const HeatArrows = ({ strength, elapsed }: { strength: number; elapsed: number }) => {
  if (strength <= 0) return null;
  const cx = BLOCK.x + BLOCK.w / 2;
  const cy = BLOCK.y + BLOCK.h / 2;
  const directions = [-160, -125, -90, -55, -20, 180, 0].map((d) => (d * Math.PI) / 180);
  const pulse = (elapsed % PULSE_MS) / PULSE_MS;
  return (
    <g>
      {directions.map((a, i) => {
        // Start at the block's edge (an ellipse around it is close enough).
        const edgeX = cx + Math.cos(a) * (BLOCK.w / 2 + 6);
        const edgeY = cy + Math.sin(a) * (BLOCK.h / 2 + 6);
        const shift = 4 + pulse * 16;
        const x1 = edgeX + Math.cos(a) * shift;
        const y1 = edgeY + Math.sin(a) * shift;
        const x2 = x1 + Math.cos(a) * 16;
        const y2 = y1 + Math.sin(a) * 16;
        const head = 5;
        const left = a + Math.PI * 0.8;
        const right = a - Math.PI * 0.8;
        return (
          <g key={i} opacity={strength * (1 - pulse * 0.7)}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color.series[0]} strokeWidth={2} strokeLinecap="round" />
            <path
              d={`M ${x2} ${y2} L ${x2 + Math.cos(left) * head} ${y2 + Math.sin(left) * head} L ${
                x2 + Math.cos(right) * head
              } ${y2 + Math.sin(right) * head} Z`}
              fill={color.series[0]}
            />
          </g>
        );
      })}
    </g>
  );
};

const Calorimeter = ({
  run,
  pass,
  passes,
  elapsed,
  flowing,
}: {
  run: CalorimeterRun;
  pass: number;
  passes: number;
  elapsed: number;
  flowing: boolean;
}) => {
  const metal = run.metalTemps[pass];
  const water = run.waterTemps[pass];
  const yMax = tempAxisMax(run);
  const startGap = run.metalTemps[0] - run.waterTemps[0];
  const strength = flowing && startGap > 0 ? Math.sqrt(Math.min(1, Math.max(0, (metal - water) / startGap))) : 0;

  const cupPath = `M ${CUP.left} ${CUP.top} L ${CUP.right} ${CUP.top} L ${CUP.right - CUP.taper} ${CUP.bottom} L ${
    CUP.left + CUP.taper
  } ${CUP.bottom} Z`;
  const taperAt = (y: number) => (CUP.taper * (y - CUP.top)) / (CUP.bottom - CUP.top);
  const waterPath = `M ${CUP.left + taperAt(WATER_TOP)} ${WATER_TOP} L ${CUP.right - taperAt(WATER_TOP)} ${WATER_TOP} L ${
    CUP.right - CUP.taper
  } ${CUP.bottom} L ${CUP.left + CUP.taper} ${CUP.bottom} Z`;

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
      role="img"
      aria-label={`Calorimeter on loop pass ${pass} of ${passes}: metal at ${fmtTemp(metal)}, water at ${fmtTemp(
        water
      )}, predicted final temperature ${fmtTemp(run.predictedFinal)}`}
    >
      {/* Lid */}
      <rect x={CUP.left - 10} y={CUP.top - 12} width={CUP.right - CUP.left + 20} height={12} rx={3} fill={color.border} />
      <path d={cupPath} fill={color.surfaceRaised} stroke={color.inkMuted} strokeWidth={2} strokeLinejoin="round" />
      <path d={waterPath} fill={color.series[1]} opacity={0.16} />
      <line
        x1={CUP.left + taperAt(WATER_TOP)}
        y1={WATER_TOP}
        x2={CUP.right - taperAt(WATER_TOP)}
        y2={WATER_TOP}
        stroke={color.series[1]}
        strokeWidth={1.5}
      />

      <HeatArrows strength={strength} elapsed={elapsed} />

      <rect x={BLOCK.x} y={BLOCK.y} width={BLOCK.w} height={BLOCK.h} rx={4} fill={color.series[0]} />
      <text
        x={BLOCK.x + BLOCK.w / 2}
        y={BLOCK.y + BLOCK.h / 2 + 4}
        textAnchor="middle"
        style={{ ...type.axisTitle, fill: color.surfaceRaised }}
      >
        Metal
      </text>
      <text
        x={(CUP.left + CUP.right) / 2}
        y={WATER_TOP + 26}
        textAnchor="middle"
        style={{ ...type.axisTitle, fill: color.series[1] }}
      >
        Water
      </text>

      <Thermometer x={86} label="Metal" temp={metal} yMax={yMax} predicted={run.predictedFinal} fill={color.series[0]} />
      <Thermometer x={436} label="Water" temp={water} yMax={yMax} predicted={run.predictedFinal} fill={color.series[1]} />

      <text x={VIEW.width / 2} y={VIEW.height - 8} textAnchor="middle" style={{ ...type.axisTitle, fill: color.ink }}>
        Loop pass {pass} of {passes}
      </text>
    </svg>
  );
};

/* ───────── Temperature graph ───────── */

const TemperatureGraph = ({ run, pass, passes }: { run: CalorimeterRun; pass: number; passes: number }) => {
  const clipId = `heat-plot-${useId().replace(/:/g, "")}`;
  const xMax = Math.max(passes, 10);
  const yMax = tempAxisMax(run);
  const s = makeScales(xMax, yMax);

  // Indices to draw up to the current pass, thinned for long runs.
  const stride = Math.max(1, Math.ceil(passes / MAX_POINTS));
  const shown: number[] = [];
  for (let i = 0; i < pass; i += stride) shown.push(i);
  shown.push(pass);
  const line = (temps: number[]) => shown.map((i) => `${s.sx(i).toFixed(1)},${s.sy(temps[i]).toFixed(1)}`).join(" ");

  const tf = run.predictedFinal;
  const labelBelow = tf > yMax * 0.85;

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
      role="img"
      aria-label={`Temperatures over ${passes} loop passes. Metal ends at ${fmtTemp(
        run.metalTemps[passes]
      )} and water at ${fmtTemp(run.waterTemps[passes])}. Predicted final temperature ${fmtTemp(tf)}.`}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={PAD.left} y={PAD.top} width={s.plotWidth} height={s.plotHeight} />
        </clipPath>
      </defs>
      <rect x={PAD.left} y={PAD.top} width={s.plotWidth} height={s.plotHeight} fill={color.surfaceRaised} stroke={color.border} rx={4} />
      {ticks(yMax, 4).map((v) => (
        <line key={`grid-${v}`} x1={PAD.left} y1={s.sy(v)} x2={PAD.left + s.plotWidth} y2={s.sy(v)} stroke={color.grid} />
      ))}

      <line
        x1={PAD.left}
        y1={s.sy(tf)}
        x2={PAD.left + s.plotWidth}
        y2={s.sy(tf)}
        stroke={color.reference}
        strokeWidth={2}
        strokeDasharray="8 5"
      />
      {/* Mid-plot: the lines meet this line at the right edge, and the
          water line starts close to it on the left. */}
      <text
        x={PAD.left + s.plotWidth * 0.62}
        y={s.sy(tf) + (labelBelow ? 16 : -7)}
        textAnchor="middle"
        style={{ ...type.tick, fill: color.reference }}
      >
        Predicted {fmtTemp(tf)}
      </text>

      <g clipPath={`url(#${clipId})`}>
        <line x1={s.sx(pass)} y1={PAD.top} x2={s.sx(pass)} y2={s.sy(0)} stroke={color.inkMuted} strokeWidth={1} />
        <polyline points={line(run.waterTemps)} fill="none" stroke={color.series[1]} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={line(run.metalTemps)} fill="none" stroke={color.series[0]} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={s.sx(pass)} cy={s.sy(run.waterTemps[pass])} r={4} fill={color.series[1]} stroke={color.surfaceRaised} strokeWidth={1.5} />
        <circle cx={s.sx(pass)} cy={s.sy(run.metalTemps[pass])} r={4} fill={color.series[0]} stroke={color.surfaceRaised} strokeWidth={1.5} />
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

      {/* Legend, top right. */}
      <g transform={`translate(${PAD.left + s.plotWidth - 140}, ${PAD.top + 16})`}>
        <rect x={-6} y={-12} width={140} height={20} rx={3} fill={color.surfaceRaised} />
        <line x1={0} y1={-4} x2={18} y2={-4} stroke={color.series[0]} strokeWidth={2.5} />
        <text x={24} y={0} style={type.tick}>
          Metal
        </text>
        <line x1={70} y1={-4} x2={88} y2={-4} stroke={color.series[1]} strokeWidth={2.5} />
        <text x={94} y={0} style={type.tick}>
          Water
        </text>
      </g>

      <text x={PAD.left + s.plotWidth / 2} y={VIEW.height - 8} textAnchor="middle" style={type.axisTitle}>
        Loop pass
      </text>
      <text
        x={14}
        y={PAD.top + s.plotHeight / 2}
        textAnchor="middle"
        transform={`rotate(-90, 14, ${PAD.top + s.plotHeight / 2})`}
        style={type.axisTitle}
      >
        Temperature (°C)
      </text>
    </svg>
  );
};

const Component = observer(({ state }: { state: State }) => {
  const run = state.run;
  // Pass i is the temperatures at the start of loop pass i; the last entry is
  // where the loop left them.
  const passes = run ? run.metalTemps.length - 1 : 0;
  const duration = run ? totalMs(passes) : 0;
  const elapsed = useRunAnimation(run, duration);

  if (!run) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Press Run to drop the hot metal into the water and watch the heat flow." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const pass = duration > 0 ? Math.min(passes, Math.floor((elapsed / duration) * passes + 1e-9)) : passes;
  const metal = run.metalTemps[pass];
  const water = run.waterTemps[pass];
  const heatLost = run.metalMass * run.metalC * (run.metalTemps[0] - metal);
  const heatGained = run.waterMass * run.waterC * (water - run.waterTemps[0]);

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
            <Calorimeter run={run} pass={pass} passes={passes} elapsed={elapsed} flowing={pass < passes} />
          </div>
          <div style={{ minWidth: 0, minHeight: 0, overflow: "hidden" }}>
            <TemperatureGraph run={run} pass={pass} passes={passes} />
          </div>
        </div>
      </PluginStage>

      <StatRow
        stats={[
          { label: "Metal", value: fmtTemp(metal), color: color.series[0] },
          { label: "Water", value: fmtTemp(water), color: color.series[1] },
          { label: "Heat Lost", value: `${Math.round(heatLost)} J`, color: color.series[0] },
          { label: "Heat Gained", value: `${Math.round(heatGained)} J`, color: color.series[1] },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
