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
import State, { type Distribution } from "./state";

// Timeline of one run, in ms: the bars grow from left to right, then the simulation's marks jump around and settle as the sessions pile up, then the mean drops in and the standard deviation bracket opens out from it.
const BARS_MS = 1000;
const GROW_MS = 380;
const SIM_AT = 1000;
const SIM_MS = 1300;
const MEAN_AT = 2400;
const MEAN_MS = 300;
const SPREAD_AT = 2700;
const SPREAD_MS = 500;
const TOTAL_MS = SPREAD_AT + SPREAD_MS;

// Layout, in the shared VIEW. The mean and standard deviation sit in a band above the plot, so the bars never cover them.
const LEFT = 56;
const RIGHT = VIEW.width - 16;
const LEGEND_Y = 16;
const LABEL_Y = 38;
const BRACKET_Y = 50;
const CAP_HALF = 5;
const PLOT_TOP = 64;
const AXIS_Y = 300;
const HEIGHT = AXIS_Y + 56;
// Each bar fills this fraction of its slot. The gaps between bars show that X only takes whole-number values.
const BAR_FILL = 0.7;
// With more bars than this, there's no room to print each probability above its bar.
const MAX_LABELED_BARS = 13;
// Room kept above the tallest bar or mark for its label, in px.
const HEADROOM = 16;
// Rough width of one character of type.tick, for centering text whose width SVG can't tell us ahead of time.
const CHAR_W = 6.6;

/** A probability to three decimals, the way AP tables show them. */
const fmtP = (v: number) => v.toFixed(3);

/** Shows a number with at most two decimals and no trailing zeros. */
const fmt = (v: number) => String(Number(v.toFixed(2)));

/** "=" when the two-decimal value is exact, "≈" when it's rounded. */
const eq = (v: number) => (Number(v.toFixed(2)) === v ? "=" : "≈");

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

interface Axis {
  low: number;
  high: number;
  ticks: number[];
}

/** A probability axis from 0 (or below, if the student's code returned negative probabilities) up past the tallest bar or mark, on round tick steps, with room above the tallest for its label. */
function axisFor(min: number, max: number): Axis {
  const step = niceStep(Math.max(max - Math.min(0, min), 1e-9), 6);
  const low = Math.floor(Math.min(0, min) / step) * step;
  let high = Math.max(Math.ceil(max / step) * step, step);
  if (((high - max) / (high - low)) * (AXIS_Y - PLOT_TOP) < HEADROOM) high += step;
  const ticks: number[] = [];
  for (let v = low; v <= high + step * 1e-9; v += step) ticks.push(Number(v.toFixed(10)));
  return { low, high, ticks };
}

/** Which values of X get a label on the x-axis: every one for a few bars, round steps for many. */
function xTicksFor(n: number): number[] {
  const step = n <= 20 ? 1 : niceStep(n, 10);
  const out: number[] = [];
  for (let k = 0; k <= n; k += step) out.push(k);
  return out;
}

/** An X written below the line, for μ_X and σ_X. Shifts the text after it back up. */
function SubX({ after }: { after: string }) {
  return (
    <>
      <tspan dy={3} fontSize={8}>
        X
      </tspan>
      <tspan dy={-3}>{after}</tspan>
    </>
  );
}

function Plot({ d, t }: { d: Distribution; t: number }) {
  const { n, probabilities, simulated, snapshots } = d;
  const axis = axisFor(Math.min(...probabilities), Math.max(...probabilities, ...simulated));
  const slot = (RIGHT - LEFT) / (n + 1);
  const barW = slot * BAR_FILL;
  const markHalf = barW / 2 + Math.min(4, slot * 0.12);
  const sx = (x: number) => LEFT + (x + 0.5) * slot;
  const sy = (v: number) => AXIS_Y - ((v - axis.low) / (axis.high - axis.low)) * (AXIS_Y - PLOT_TOP);
  const zeroY = sy(0);
  const labeled = n + 1 <= MAX_LABELED_BARS;
  const growOf = (k: number) => easeInOut(progressBetween(t, (k / (n + 1)) * (BARS_MS - GROW_MS), GROW_MS));

  // The simulation's marks show the relative frequencies after more and more sessions, so they jump around at first and settle down.
  const simP = progressBetween(t, SIM_AT, SIM_MS);
  const snapshot = simP > 0 ? snapshots[Math.min(snapshots.length - 1, Math.floor(simP * snapshots.length))] : null;
  const sessionsShown = snapshot ? snapshot.sessions : 0;

  const meanP = progressBetween(t, MEAN_AT, MEAN_MS);
  const spreadP = easeInOut(progressBetween(t, SPREAD_AT, SPREAD_MS));
  const mu = d.binomialMean;
  const sigma = d.binomialSd;
  const muX = sx(mu);
  const spreadLeft = sx(clamp(mu - sigma * spreadP, -0.5, n + 0.5));
  const spreadRight = sx(clamp(mu + sigma * spreadP, -0.5, n + 0.5));

  const muText = ` = np ${eq(mu)} ${fmt(mu)}`;
  const sigmaText = ` = √(np(1 − p)) ${eq(sigma)} ${fmt(sigma)}`;
  const labelWidth = (2 + muText.length + 5 + sigmaText.length) * CHAR_W;
  const labelX = clamp(muX, LEFT + labelWidth / 2, RIGHT - labelWidth / 2);

  const legendCount = sessionsShown.toLocaleString("en-US");
  const legendWidth = (15 + 9 + 22 + d.sessions.toLocaleString("en-US").length) * CHAR_W + 28;

  const describeList = (values: readonly number[]) => values.map(fmtP).join(", ");
  const tallest = probabilities.indexOf(Math.max(...probabilities));
  const ariaLabel = labeled
    ? `Probability distribution of X, free throws made out of ${n} with p = ${d.p}. Your P(X = k) for k = 0 to ${n}: ${describeList(probabilities)}, adding up to ${fmtP(d.total)}. Relative frequencies from ${d.sessions} simulated sessions: ${describeList(simulated)}. Mean np = ${fmt(mu)}, standard deviation ${fmt(sigma)}.`
    : `Probability distribution of X, free throws made out of ${n} with p = ${d.p}. Your probabilities add up to ${fmtP(d.total)}, and the tallest is P(X = ${tallest}) = ${fmtP(probabilities[tallest])}. In ${d.sessions} simulated sessions the most common count was ${simulated.indexOf(Math.max(...simulated))}. Mean np = ${fmt(mu)}, standard deviation ${fmt(sigma)}.`;

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
      role="img"
      aria-label={ariaLabel}
    >
      <text x={VIEW.width / 2 - legendWidth / 2} y={LEGEND_Y} style={type.tick}>
        <tspan fill={color.series[0]}>■</tspan>
        <tspan> Your P(X = k)</tspan>
        <tspan dx={14} fill={color.series[1]}>¦</tspan>
        <tspan> μ</tspan>
        <SubX after=" ± σ" />
        <tspan dy={3} fontSize={8}>
          X
        </tspan>
        <tspan dx={14} dy={-3} fill={color.reference}>
          ¦
        </tspan>
        <tspan> Simulated sessions: {legendCount}</tspan>
      </text>

      {axis.ticks.map((v) => (
        <line key={`grid-${v}`} x1={LEFT} y1={sy(v)} x2={RIGHT} y2={sy(v)} stroke={color.grid} />
      ))}

      {/* One standard deviation either side of the mean, faint so the bars stay in front. */}
      {spreadP > 0 && sigma > 0 && (
        <g stroke={color.series[1]} strokeWidth={1} strokeDasharray="2 4" opacity={0.6 * spreadP}>
          <line x1={spreadLeft} y1={BRACKET_Y} x2={spreadLeft} y2={zeroY} />
          <line x1={spreadRight} y1={BRACKET_Y} x2={spreadRight} y2={zeroY} />
        </g>
      )}

      {/* The student's probabilities: each bar grows in turn, from k = 0 up to k = n. A bar under half a pixel tall isn't drawn, so probabilities that are practically 0 look the same everywhere. */}
      {probabilities.map((prob, k) => {
        const top = sy(prob * growOf(k));
        if (Math.abs(zeroY - top) < 0.5) return null;
        return (
          <rect key={`bar-${k}`} x={sx(k) - barW / 2} y={Math.min(top, zeroY)} width={barW} height={Math.abs(zeroY - top)} fill={color.series[0]} fillOpacity={0.3} stroke={color.series[0]} strokeWidth={1.5}>
            <title>{`P(X = ${k}) = ${fmtP(prob)}, simulated ${fmtP(simulated[k])}`}</title>
          </rect>
        );
      })}

      {meanP > 0 && <line x1={muX} y1={BRACKET_Y} x2={muX} y2={zeroY} stroke={color.series[1]} strokeWidth={2} strokeDasharray="6 4" opacity={meanP} />}

      {/* The simulation's relative frequencies, one dashed mark per value of X, a little wider than the bar so they show when they sit right on its top. A count no session reached gets no mark. */}
      {snapshot &&
        snapshot.relativeFrequencies.map((freq, k) =>
          freq > 0 ? (
            <line
              key={`sim-${k}`}
              x1={sx(k) - markHalf}
              y1={sy(Math.min(freq, axis.high))}
              x2={sx(k) + markHalf}
              y2={sy(Math.min(freq, axis.high))}
              stroke={color.reference}
              strokeWidth={2.5}
              strokeDasharray={barW > 16 ? "5 3" : "3 2"}
            />
          ) : null
        )}

      {/* Each probability over its bar, drawn last with an outline in the background color so the mean's line can't strike through it. It goes just above the bar, or above the simulation's mark when that sits right over the bar. */}
      {labeled &&
        probabilities.map((prob, k) => {
          const grow = growOf(k);
          if (grow <= 0) return null;
          const top = Math.min(sy(prob * grow), zeroY);
          const simY = sy(Math.min(simulated[k], axis.high));
          const labelY = (simY < top && top - simY < 14 ? simY : top) - 5;
          return (
            <text key={`label-${k}`} x={sx(k)} y={labelY} textAnchor="middle" opacity={grow} stroke={color.surface} strokeWidth={3} strokeLinejoin="round" paintOrder="stroke" style={{ ...type.tick, fontSize: 10 }}>
              {fmtP(prob)}
            </text>
          );
        })}

      {/* μ_X = np and σ_X = √(np(1 − p)): the mean's line, and a bracket one standard deviation either side of it. */}
      {meanP > 0 && (
        <g>
          {spreadP > 0 && (
            <g stroke={color.series[1]} strokeWidth={2}>
              <line x1={spreadLeft} y1={BRACKET_Y} x2={spreadRight} y2={BRACKET_Y} />
              <line x1={spreadLeft} y1={BRACKET_Y - CAP_HALF} x2={spreadLeft} y2={BRACKET_Y + CAP_HALF} />
              <line x1={spreadRight} y1={BRACKET_Y - CAP_HALF} x2={spreadRight} y2={BRACKET_Y + CAP_HALF} />
            </g>
          )}
          <text x={labelX} y={LABEL_Y} textAnchor="middle" style={{ ...type.tick, fill: color.series[1] }}>
            <tspan fillOpacity={meanP}>μ</tspan>
            <tspan dy={3} fontSize={8} fillOpacity={meanP}>
              X
            </tspan>
            <tspan dy={-3} fillOpacity={meanP}>
              {muText}
            </tspan>
            <tspan dx={CHAR_W * 3} fillOpacity={spreadP}>
              σ
            </tspan>
            <tspan dy={3} fontSize={8} fillOpacity={spreadP}>
              X
            </tspan>
            <tspan dy={-3} fillOpacity={spreadP}>
              {sigmaText}
            </tspan>
          </text>
        </g>
      )}

      <line x1={LEFT} y1={PLOT_TOP} x2={LEFT} y2={AXIS_Y} stroke={color.axis} />
      {axis.ticks.map((v) => (
        <g key={`ytick-${v}`}>
          <line x1={LEFT - 5} y1={sy(v)} x2={LEFT} y2={sy(v)} stroke={color.axis} />
          <text x={LEFT - 8} y={sy(v) + 4} textAnchor="end" style={type.tick}>
            {fmt(v)}
          </text>
        </g>
      ))}
      <text x={14} y={(PLOT_TOP + AXIS_Y) / 2} textAnchor="middle" transform={`rotate(-90 14 ${(PLOT_TOP + AXIS_Y) / 2})`} style={type.axisTitle}>
        Probability
      </text>

      <line x1={LEFT} y1={zeroY} x2={RIGHT} y2={zeroY} stroke={color.axis} />
      {xTicksFor(n).map((k) => (
        <g key={`xtick-${k}`}>
          <line x1={sx(k)} y1={AXIS_Y} x2={sx(k)} y2={AXIS_Y + 5} stroke={color.axis} />
          <text x={sx(k)} y={AXIS_Y + 18} textAnchor="middle" style={type.tick}>
            {k}
          </text>
        </g>
      ))}
      <text x={(LEFT + RIGHT) / 2} y={AXIS_Y + 44} textAnchor="middle" style={type.axisTitle}>
        X = Free Throws Made out of {n}
      </text>
    </svg>
  );
}

const Component = observer(({ state }: { state: State }) => {
  const d = state.distribution;
  const t = useRunAnimation(d, TOTAL_MS);

  if (!d) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Press Run to draw the probability distribution of the number of free throws made, next to a simulation of 10,000 sessions of shooting." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const barsShown = t >= BARS_MS;
  const simP = progressBetween(t, SIM_AT, SIM_MS);
  const snapshot = simP > 0 ? d.snapshots[Math.min(d.snapshots.length - 1, Math.floor(simP * d.snapshots.length))] : null;

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <Plot d={d} t={t} />
      </PluginStage>
      <StatRow
        stats={[
          { label: "Sum of P", value: barsShown ? fmtP(d.total) : EMPTY },
          { label: `P(X = ${d.centerK})`, value: barsShown ? fmtP(d.probabilities[d.centerK]) : EMPTY, color: color.series[0] },
          { label: "Simulated", value: snapshot ? fmtP(snapshot.relativeFrequencies[d.centerK]) : EMPTY, color: color.reference },
          { label: "Mean", value: barsShown ? fmt(d.mean) : EMPTY },
          { label: "SD", value: barsShown && Number.isFinite(d.sd) ? fmt(d.sd) : EMPTY },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
