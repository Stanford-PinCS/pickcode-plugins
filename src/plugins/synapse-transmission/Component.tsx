import { observer } from "mobx-react-lite";
import { useId } from "react";
import { VIEW, makeScales, ticks, type Padding } from "../../common/chart";
import {
  EMPTY,
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import { color, font, type } from "../../common/tokens";
import {
  easeInOut,
  progressBetween,
  useRunAnimation,
} from "../../common/useRunAnimation";
import instructions from "./instructions.md?raw";
import State from "./state";

const REST_MV = -70;
const SPIKE_PEAK_MV = 40;
const UNDERSHOOT_MV = -77;

// Each signal takes one "slot" of time; the decision afterwards takes two.
const TOTAL_SIGNAL_MS = 9000;
const MIN_SIGNAL_MS = 1000;
const MAX_SIGNAL_MS = 1800;
const DECISION_MS = 3000;
const DECISION_SLOTS = 2;

// Phases inside one signal's slot, as fractions of it.
const AP_END = 0.22; // action potential reaches the terminal
const FUSE_END = 0.34; // vesicle fuses with the membrane
const CROSS_END = 0.7; // molecules have crossed the cleft
const BIND_END = 0.84; // potential has stepped up or down
// then reuptake until 1

// ---- Synapse drawing (top band), in VIEW units ----
const TERMINAL_LEFT = 14;
const TERMINAL_RIGHT = 186;
const RELEASE_X = 180;
const RECEIVER = { x: 232, y: 8, width: 100, height: 154 };
const RECEPTOR_X = RECEIVER.x - 6;
const AXON = { x: RECEIVER.x + RECEIVER.width - 2, y: 78, height: 14 };
const AXON_END = VIEW.width - 12;
const PULSE_W = 34;

interface Terminal {
  label: string;
  cy: number;
  molecule: string;
}
const EXCITATORY: Terminal = { label: "Excitatory", cy: 46, molecule: color.series[1] };
const INHIBITORY: Terminal = { label: "Inhibitory", cy: 128, molecule: color.series[3] };
const RECEPTOR_OFFSETS = [-18, 0, 18];
const VESICLES = [
  { dx: 92, dy: 10 },
  { dx: 114, dy: -14 },
  { dx: 136, dy: 14 },
];
/** The vesicle that moves to the membrane and releases each burst. */
const RELEASING = { dx: 150, dy: -6 };

// ---- Membrane potential chart (bottom band) ----
const CHART_TOP = 192;
// The chart uses the shared VIEW, with its plot box padded down into the bottom band.
const CHART_PAD: Padding = { top: CHART_TOP + 8, right: 28, bottom: 34, left: 54 };
const CHART_MIN_MV = -80;

/** Stable pseudo-random number in [0, 1) for a given seed. */
const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** Numbers as a student wrote them: whole numbers stay whole. */
const fmt = (v: number) =>
  Number.isInteger(v) ? String(v) : String(Number(v.toFixed(1)));
const signed = (v: number) => (v > 0 ? `+${fmt(v)}` : fmt(v));

const Component = observer(({ state }: { state: State }) => {
  const clipId = `synapse-plot-${useId().replace(/:/g, "")}`;
  const run = state.run;
  const n = run?.signals.length ?? 0;
  const signalMs = Math.min(
    MAX_SIGNAL_MS,
    Math.max(MIN_SIGNAL_MS, TOTAL_SIGNAL_MS / Math.max(n, 1))
  );
  const duration = n * signalMs + DECISION_MS;
  const elapsed = useRunAnimation(run, duration);

  if (!run || n === 0) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Press Run to send your signals across the synapse." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const { signals, threshold, fires } = run;

  // Running total after each signal: exactly what the student's loop adds up.
  const totals: number[] = [];
  signals.reduce((sum, s) => {
    totals.push(sum + s);
    return sum + s;
  }, REST_MV);
  const total = totals[n - 1];
  const before = (k: number) => (k === 0 ? REST_MV : totals[k - 1]);

  /** Membrane potential at chart time x (one unit per signal, then the decision). */
  const potentialAt = (x: number): number => {
    if (x < n) {
      const k = Math.floor(x);
      const f = x - k;
      const step = easeInOut(progressBetween(f, CROSS_END, BIND_END - CROSS_END));
      return before(k) + (totals[k] - before(k)) * step;
    }
    const d = x - n;
    if (!fires) {
      // Decays back to rest, landing exactly on it at the end of the decision.
      const end = Math.exp(-2.2 * DECISION_SLOTS);
      return REST_MV + (total - REST_MV) * Math.max(0, (Math.exp(-2.2 * d) - end) / (1 - end));
    }
    if (d < 0.15) return total;
    if (d < 0.4) return total + (SPIKE_PEAK_MV - total) * easeInOut(progressBetween(d, 0.15, 0.25));
    if (d < 0.75)
      return SPIKE_PEAK_MV + (UNDERSHOOT_MV - SPIKE_PEAK_MV) * easeInOut(progressBetween(d, 0.4, 0.35));
    return UNDERSHOOT_MV + (REST_MV - UNDERSHOOT_MV) * easeInOut(progressBetween(d, 0.75, 0.85));
  };

  // Where the replay has got to.
  const signalTime = n * signalMs;
  const x =
    elapsed < signalTime
      ? elapsed / signalMs
      : n + (DECISION_SLOTS * Math.min(elapsed - signalTime, DECISION_MS)) / DECISION_MS;
  const deciding = x >= n;
  const k = Math.min(Math.floor(x), n - 1);
  const f = deciding ? 1 : x - k;
  const d = deciding ? x - n : 0;
  const current = potentialAt(x);
  const received = deciding ? n : k + (f >= BIND_END ? 1 : 0);
  const finished = elapsed >= duration;
  // Whole-number runs read in whole millivolts; otherwise one decimal place.
  const wholeNumbers = signals.every(Number.isInteger) && Number.isInteger(threshold);
  const shown = (mv: number) =>
    wholeNumbers ? String(Math.round(mv)) : (Math.round(mv * 10) / 10).toFixed(1);

  // ---- Synapse animation for the signal under way ----
  const s = signals[k];
  const terminal = s < 0 ? INHIBITORY : EXCITATORY;
  const molecules = deciding ? 0 : Math.min(18, Math.round(Math.abs(s) * 2));
  const fuse = easeInOut(progressBetween(f, AP_END, FUSE_END - AP_END));
  const releaseVisible = deciding || f < FUSE_END + 0.04;
  const bound = !deciding && f >= CROSS_END && f < BIND_END && molecules > 0;

  const particles = Array.from({ length: molecules }, (_, q) => {
    const seed = k * 97 + q * 13;
    const startY = terminal.cy + (rand(seed) - 0.5) * 20;
    const receptorY = terminal.cy + RECEPTOR_OFFSETS[q % 3] + (rand(seed + 1) - 0.5) * 6;
    const delay = rand(seed + 2) * 0.08;
    const backY = terminal.cy + (rand(seed + 3) - 0.5) * 30;
    if (f < FUSE_END) return null;
    if (f < CROSS_END) {
      const t = easeInOut(progressBetween(f, FUSE_END + delay, CROSS_END - FUSE_END - delay));
      return {
        x: RELEASE_X + (RECEPTOR_X - 3 - RELEASE_X) * t,
        y: startY + (receptorY - startY) * t + Math.sin(t * Math.PI * 2 + seed) * 4 * (1 - t),
        opacity: 1,
      };
    }
    if (f < BIND_END) return { x: RECEPTOR_X - 3, y: receptorY, opacity: 1 };
    // Reuptake: transporters pull the molecules back into the sending terminal.
    const t = easeInOut(progressBetween(f, BIND_END, 1 - BIND_END));
    return {
      x: RECEPTOR_X - 3 + (RELEASE_X - 4 - (RECEPTOR_X - 3)) * t,
      y: receptorY + (backY - receptorY) * t,
      opacity: 1 - 0.8 * t,
    };
  });

  // ---- Chart ----
  const yTop = Math.max(-40, Math.ceil((Math.max(threshold, ...totals) + 8) / 10) * 10);
  const span = yTop - CHART_MIN_MV;
  const xMax = n + DECISION_SLOTS;
  const sc = makeScales(xMax, span, VIEW, CHART_PAD);
  const sy = (mv: number) => sc.sy(mv - CHART_MIN_MV);
  const sx = sc.sx;
  const tracePoints: string[] = [];
  for (let t = 0; t <= x + 1e-9; t += 0.02) {
    tracePoints.push(`${sx(t).toFixed(1)},${sy(potentialAt(t)).toFixed(1)}`);
  }
  tracePoints.push(`${sx(x).toFixed(1)},${sy(current).toFixed(1)}`);
  const spikeClipped = fires && deciding && d > 0.25 && SPIKE_PEAK_MV > yTop;

  const pulseT = fires ? progressBetween(d, 0.3, 1.2) : 0;
  const pulseOn = fires && deciding && d >= 0.3 && pulseT < 1;
  const pulseX = AXON.x + (AXON_END - PULSE_W - AXON.x) * pulseT;

  const axonLabel = !deciding || d < 0.2
    ? "Axon"
    : fires
      ? "Action potential travels on"
      : "No action potential";

  const readout = deciding
    ? `potential = ${fmt(total)} mV. Your if says ${fires ? "fire → action potential" : "don't fire → back to rest"}`
    : f >= BIND_END
      ? `i = ${k}: signals[${k}] = ${signed(s)} mV → potential = ${fmt(totals[k])} mV`
      : `i = ${k}: signals[${k}] = ${signed(s)} mV`;

  const drawTerminal = (t: Terminal) => {
    const active = !deciding && t === terminal;
    const apX = TERMINAL_LEFT + 70 * progressBetween(f, 0, AP_END);
    return (
      <g key={t.label}>
        {/* Axon leading into the terminal */}
        <rect
          x={0}
          y={t.cy - 8}
          width={40}
          height={16}
          fill={color.surfaceRaised}
          stroke={color.inkMuted}
        />
        <rect
          x={TERMINAL_LEFT}
          y={t.cy - 32}
          width={TERMINAL_RIGHT - TERMINAL_LEFT}
          height={64}
          rx={32}
          fill={color.surfaceRaised}
          stroke={color.inkMuted}
          strokeWidth={1.5}
        />
        <text x={26} y={t.cy - 10} style={type.tick}>
          {t.label}
        </text>
        {VESICLES.map((v, i) => (
          <g key={i}>
            <circle
              cx={TERMINAL_LEFT + v.dx}
              cy={t.cy + v.dy}
              r={9}
              fill={color.surface}
              stroke={color.inkMuted}
            />
            {[-3.5, 0, 3.5].map((o) => (
              <circle
                key={o}
                cx={TERMINAL_LEFT + v.dx + o}
                cy={t.cy + v.dy + (o === 0 ? -2 : 2)}
                r={1.8}
                fill={t.molecule}
              />
            ))}
          </g>
        ))}
        {/* The vesicle that releases this burst moves to the membrane and opens. */}
        {(!active || releaseVisible) && (
          <g
            opacity={active ? 1 - progressBetween(f, FUSE_END - 0.02, 0.06) : 1}
            transform={
              active
                ? `translate(${(RELEASE_X - 6 - (TERMINAL_LEFT + RELEASING.dx)) * fuse}, ${-RELEASING.dy * fuse})`
                : undefined
            }
          >
            <circle
              cx={TERMINAL_LEFT + RELEASING.dx}
              cy={t.cy + RELEASING.dy}
              r={9}
              fill={color.surface}
              stroke={color.inkMuted}
            />
            {[-3.5, 0, 3.5].map((o) => (
              <circle
                key={o}
                cx={TERMINAL_LEFT + RELEASING.dx + o}
                cy={t.cy + RELEASING.dy + (o === 0 ? -2 : 2)}
                r={1.8}
                fill={t.molecule}
              />
            ))}
          </g>
        )}
        {/* Action potential arriving at the terminal */}
        {active && f < AP_END && (
          <circle cx={apX} cy={t.cy + 10} r={6} fill={color.series[0]} />
        )}
        {/* Receptors on the receiving neuron */}
        {RECEPTOR_OFFSETS.map((o) => (
          <rect
            key={o}
            x={RECEPTOR_X}
            y={t.cy + o - 5}
            width={6}
            height={10}
            rx={2}
            fill={active && bound ? t.molecule : color.border}
            stroke={color.inkMuted}
            strokeWidth={1}
          />
        ))}
      </g>
    );
  };

  const firedValue = deciding ? (fires ? "Yes" : "No") : EMPTY;

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <svg
          viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: "100%", height: "100%" }}
          role="img"
          aria-label={`${n} signals add up from ${REST_MV} mV to ${fmt(total)} mV against a threshold of ${fmt(threshold)} mV; the neuron ${fires ? "fires" : "does not fire"}`}
        >
          {/* ---- Synapse ---- */}
          {/* Receiving neuron and its axon */}
          <rect
            x={AXON.x}
            y={AXON.y}
            width={AXON_END - AXON.x}
            height={AXON.height}
            rx={AXON.height / 2}
            fill={color.surfaceRaised}
            stroke={color.inkMuted}
          />
          <rect
            x={RECEIVER.x}
            y={RECEIVER.y}
            width={RECEIVER.width}
            height={RECEIVER.height}
            rx={24}
            fill={color.surfaceRaised}
            stroke={color.inkMuted}
            strokeWidth={1.5}
          />
          <text x={RECEIVER.x + RECEIVER.width / 2} y={RECEIVER.y + 26} textAnchor="middle" style={type.tick}>
            Receiving
          </text>
          <text x={RECEIVER.x + RECEIVER.width / 2} y={RECEIVER.y + 40} textAnchor="middle" style={type.tick}>
            neuron
          </text>
          <text
            x={RECEIVER.x + RECEIVER.width / 2}
            y={RECEIVER.y + RECEIVER.height / 2 + 6}
            textAnchor="middle"
            style={{
              fontFamily: font.data,
              fontSize: 16,
              fontWeight: 700,
              fill: color.series[0],
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {shown(current)} mV
          </text>
          <text
            x={(AXON.x + AXON_END) / 2}
            y={AXON.y - 10}
            textAnchor="middle"
            style={{ ...type.tick, fill: deciding && fires ? color.ink : color.inkMuted }}
          >
            {axonLabel}
          </text>
          {pulseOn && (
            <rect
              x={pulseX}
              y={AXON.y}
              width={PULSE_W}
              height={AXON.height}
              rx={AXON.height / 2}
              fill={color.series[0]}
            />
          )}

          <text x={(TERMINAL_RIGHT + RECEPTOR_X) / 2} y={(EXCITATORY.cy + INHIBITORY.cy) / 2 + 4} textAnchor="middle" style={type.tick}>
            Cleft
          </text>
          {drawTerminal(EXCITATORY)}
          {drawTerminal(INHIBITORY)}

          {/* Neurotransmitter molecules for the signal under way */}
          {particles.map((p, q) =>
            p ? (
              <circle key={q} cx={p.x} cy={p.y} r={3} fill={terminal.molecule} opacity={p.opacity} />
            ) : null
          )}

          {/* Link to the loop */}
          <text
            x={VIEW.width / 2}
            y={CHART_TOP - 2}
            textAnchor="middle"
            style={{ ...type.tick, fontSize: 12, fill: color.ink }}
          >
            {readout}
          </text>

          {/* ---- Membrane potential chart ---- */}
          <g>
            <defs>
              <clipPath id={clipId}>
                <rect x={CHART_PAD.left} y={CHART_PAD.top} width={sc.plotWidth} height={sc.plotHeight} />
              </clipPath>
            </defs>
            <rect
              x={CHART_PAD.left}
              y={CHART_PAD.top}
              width={sc.plotWidth}
              height={sc.plotHeight}
              fill={color.surfaceRaised}
              stroke={color.border}
              rx={4}
            />
            {ticks(span, 4).map((v) => (
              <line
                key={`grid-${v}`}
                x1={CHART_PAD.left}
                y1={sc.sy(v)}
                x2={CHART_PAD.left + sc.plotWidth}
                y2={sc.sy(v)}
                stroke={color.grid}
              />
            ))}

            {/* The step the loop is on */}
            {!finished && (
              <rect
                x={sx(deciding ? n : k)}
                y={CHART_PAD.top}
                width={sx(deciding ? n + DECISION_SLOTS : k + 1) - sx(deciding ? n : k)}
                height={sc.plotHeight}
                fill={color.accentSoft}
              />
            )}
            <text
              x={sx(n + DECISION_SLOTS / 2)}
              y={CHART_PAD.top + 14}
              textAnchor="middle"
              style={type.tick}
            >
              if
            </text>

            {/* Resting potential */}
            <line
              x1={CHART_PAD.left}
              y1={sy(REST_MV)}
              x2={CHART_PAD.left + sc.plotWidth}
              y2={sy(REST_MV)}
              stroke={color.inkMuted}
              strokeWidth={1}
            />
            <text x={CHART_PAD.left + 6} y={sy(REST_MV) - 5} style={type.tick}>
              rest
            </text>

            {/* Threshold */}
            <line
              x1={CHART_PAD.left}
              y1={sy(threshold)}
              x2={CHART_PAD.left + sc.plotWidth}
              y2={sy(threshold)}
              stroke={color.reference}
              strokeWidth={2}
              strokeDasharray="8 5"
            />
            <text
              x={CHART_PAD.left + 6}
              y={sy(threshold) - 6}
              style={{ ...type.tick, fill: color.reference }}
            >
              threshold
            </text>

            <g clipPath={`url(#${clipId})`}>
              <polyline
                points={tracePoints.join(" ")}
                fill="none"
                stroke={color.series[0]}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </g>
            {spikeClipped && (
              <text
                x={sx(n + 0.4) + 6}
                y={CHART_PAD.top + 30}
                style={{ ...type.tick, fill: color.series[0] }}
              >
                spike to +{SPIKE_PEAK_MV} mV
              </text>
            )}

            {/* Axes */}
            <line
              x1={CHART_PAD.left}
              y1={sc.sy(0)}
              x2={CHART_PAD.left + sc.plotWidth}
              y2={sc.sy(0)}
              stroke={color.axis}
            />
            <line
              x1={CHART_PAD.left}
              y1={CHART_PAD.top}
              x2={CHART_PAD.left}
              y2={sc.sy(0)}
              stroke={color.axis}
            />
            {signals.map((_, i) => (
              <text
                key={`xt-${i}`}
                x={sx(i + 0.5)}
                y={sc.sy(0) + 14}
                textAnchor="middle"
                style={{
                  ...type.tick,
                  fill: !deciding && i === k ? color.ink : color.inkMuted,
                  fontWeight: !deciding && i === k ? 700 : 400,
                }}
              >
                {i}
              </text>
            ))}
            {ticks(span, 4).map((v) => (
              <text
                key={`yt-${v}`}
                x={CHART_PAD.left - 8}
                y={sc.sy(v) + 4}
                textAnchor="end"
                style={type.tick}
              >
                {v + CHART_MIN_MV}
              </text>
            ))}
            <text
              x={CHART_PAD.left + sc.plotWidth / 2}
              y={VIEW.height - 2}
              textAnchor="middle"
              style={type.axisTitle}
            >
              Signal i
            </text>
            <text
              x={14}
              y={CHART_PAD.top + sc.plotHeight / 2}
              textAnchor="middle"
              transform={`rotate(-90, 14, ${CHART_PAD.top + sc.plotHeight / 2})`}
              style={type.axisTitle}
            >
              mV
            </text>
          </g>
        </svg>
      </PluginStage>

      <StatRow
        stats={[
          { label: "Signals", value: `${received} of ${n}` },
          {
            label: "Potential",
            value: `${shown(current)} mV`,
            color: color.series[0],
          },
          {
            label: "Threshold",
            value: `${fmt(threshold)} mV`,
            color: color.reference,
          },
          { label: "Fired", value: firedValue },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
