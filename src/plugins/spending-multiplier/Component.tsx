import { observer } from "mobx-react-lite";
import { VIEW, makeScales, niceStep, ticks, type Padding } from "../../common/chart";
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
import State, { type Rounds } from "./state";

// Timeline of one run, in ms: the dashed prediction line sweeps across, then the rounds stack up one at a time, each block growing up from the total before it.
const LINE_MS = 500;
const ROUNDS_AT = 550;
const ROUND_EACH_MAX = 140;
const ROUNDS_MS_MAX = 2200;
const GROW_MS = 240;
const SETTLE_MS = 300;

// Layout, in the shared VIEW: a legend and the first rounds' values on top, the staircase, then the round numbers under the axis. Plot widens the left side for long tick labels and the right side for the prediction's label.
const PAD: Padding = { top: 52, right: 24, bottom: 50, left: 60 };
const PLOT_BOTTOM = VIEW.height - PAD.bottom;
const LEGEND_Y = 16;
const SEQUENCE_Y = 36;
const ROUND_ROW_Y = PLOT_BOTTOM + 17;
const AXIS_TITLE_Y = PLOT_BOTTOM + 40;
// The y-axis title runs up the left edge at this x and reaches about 3 units right of it, so the tick labels start right of TICK_LABEL_MIN_X to stay clear of it.
const Y_TITLE_X = 16;
const TICK_LABEL_MIN_X = 28;
// Share of each round's slot that its block fills.
const BAR_SHARE = 0.7;
// type.tick is a monospace face at 11px, so a label is about this wide per character.
const CHAR_W = 6.6;
// The line on top lists what the loop added in at most this many rounds.
const SEQUENCE_ROUNDS = 4;
// The MPC and MPS show up to this many decimals, so an MPC typed with 3 or 4 decimals shows exactly and the MPC and MPS shown add up to 1. Rounding still drops floating-point dust like 1 − 0.8 = 0.19999999999999996.
const SHARE_DIGITS = 4;

/** A number with at most `digits` decimals (2 unless asked), thousands separators and a real minus sign. */
function num(v: number, digits = 2): string {
  const rounded = Number(v.toFixed(digits));
  const text = Math.abs(rounded).toLocaleString("en-US", { maximumFractionDigits: digits });
  return `${rounded < 0 ? "−" : ""}${text}`;
}

/** Millions of dollars, short: $494.24M. */
function millions(v: number): string {
  const text = num(v);
  return text.startsWith("−") ? `−$${text.slice(1)}M` : `$${text}M`;
}

/** Millions of dollars with a + or − sign, for what a round added: +$80M. */
function signedMillions(v: number): string {
  const text = millions(v);
  return text.startsWith("−") ? text : `+${text}`;
}

/** Millions of dollars in words, for the aria-label: $494.24 million. */
function millionsLong(v: number): string {
  return `${millions(v).slice(0, -1)} million`;
}

/** Milliseconds between one round's block and the next, so a long run still fits the timeline. */
const roundEach = (n: number) => Math.min(ROUND_EACH_MAX, ROUNDS_MS_MAX / Math.max(n, 1));

/** When round i's block (counting from 0) starts growing. */
const roundStart = (i: number, n: number) => ROUNDS_AT + i * roundEach(n);

/** When the last block has finished growing: the moment the bottom row can show the total. */
const roundsDoneAt = (n: number) => roundStart(n - 1, n) + GROW_MS;

/** A dollar axis from 0 past the highest total and the prediction, on round steps, with a little headroom. */
function moneyAxis(top: number): { end: number; ticks: number[] } {
  const target = Math.max(top, 1) * 1.08;
  const step = niceStep(target, 6);
  // toPrecision drops floating-point dust like 1.2000000000000002, so ticks() lands on the same round steps.
  const end = Number((Math.ceil(target / step) * step).toPrecision(12));
  return { end, ticks: ticks(end, 6) };
}

/** The legend's two keys, laid out from their text widths and centered. */
function Legend() {
  const items = [
    { key: "block", text: "Added to the total each round", swatch: 16 },
    { key: "line", text: "Multiplier's prediction", swatch: 24 },
  ];
  const gap = 20;
  const total = items.reduce((sum, item) => sum + item.swatch + item.text.length * CHAR_W, 0) + gap * (items.length - 1);
  let x = (VIEW.width - total) / 2;
  return (
    <g>
      {items.map((item) => {
        const left = x;
        x += item.swatch + item.text.length * CHAR_W + gap;
        return (
          <g key={item.key}>
            {item.key === "block" && <rect x={left} y={LEGEND_Y - 9} width={11} height={11} fill={color.series[0]} />}
            {item.key === "line" && (
              <line x1={left} y1={LEGEND_Y - 3.5} x2={left + 19} y2={LEGEND_Y - 3.5} stroke={color.reference} strokeWidth={2.5} strokeDasharray="5 3" />
            )}
            <text x={left + item.swatch} y={LEGEND_Y} style={type.tick}>
              {item.text}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** The line under the legend: what the loop added in each of the first few rounds. Each value shows up when its block has landed, and the line keeps fewer rounds when they wouldn't fit across the view. */
function Sequence({ added, t }: { added: readonly number[]; t: number }) {
  const n = added.length;
  let count = Math.min(SEQUENCE_ROUNDS, n);
  const textFor = (k: number) => {
    const head = k === 1 ? "Round 1: " : `Rounds 1 to ${k}: `;
    const values = added.slice(0, k).map(signedMillions);
    return { head, values, more: k < n };
  };
  const widthOf = (k: number) => {
    const { head, values, more } = textFor(k);
    return (head.length + values.join(", ").length + (more ? 3 : 0)) * CHAR_W;
  };
  while (count > 1 && widthOf(count) > VIEW.width - 24) count--;
  const { head, values, more } = textFor(count);
  const left = (VIEW.width - widthOf(count)) / 2;
  const landed = (i: number) => progressBetween(t, roundStart(i, n) + GROW_MS * 0.6, GROW_MS * 0.4);
  return (
    <text x={left} y={SEQUENCE_Y} style={type.tick}>
      <tspan>{head}</tspan>
      {values.map((v, i) => (
        <tspan key={i} fill={color.series[0]} fillOpacity={landed(i)}>
          {v}
          <tspan fill={color.inkMuted}>{i < values.length - 1 ? ", " : ""}</tspan>
        </tspan>
      ))}
      {more && <tspan fillOpacity={landed(count)}>, …</tspan>}
    </text>
  );
}

function Plot({ rounds, t }: { rounds: Rounds; t: number }) {
  const { totals, added, predicted } = rounds;
  const n = totals.length;
  const axis = moneyAxis(Math.max(predicted, ...totals));
  const tickLabels = axis.ticks.map((v) => num(v));
  const predictedLabel = millions(predicted);
  // The tick labels end 8 units left of the axis, so a long one pushes the axis right until it clears the y-axis title. The prediction's label sits right of the plot, so a long one widens the right side.
  const longestTick = Math.max(...tickLabels.map((s) => s.length)) * CHAR_W;
  const pad: Padding = {
    ...PAD,
    left: Math.max(PAD.left, TICK_LABEL_MIN_X + longestTick + 8),
    right: Math.max(PAD.right, predictedLabel.length * CHAR_W + 14),
  };
  const scales = makeScales(n, axis.end, VIEW, pad);
  const sy = scales.sy;
  const slot = scales.plotWidth / n;
  const barWidth = slot * BAR_SHARE;
  const right = pad.left + scales.plotWidth;
  const zeroY = sy(0);

  // Round numbers under the axis: every round when they fit, otherwise round 1 and every 5th or 10th.
  const need = String(n).length * CHAR_W + 5;
  const every = [1, 5, 10].find((k) => (k === 1 ? slot : slot * (k - 1)) >= need) ?? 10;
  const labeled = (r: number) => r === 1 || r % every === 0;

  const lineP = easeInOut(progressBetween(t, 0, LINE_MS));
  const predictedY = sy(predicted);

  const policyText =
    rounds.policy === "spending" ? `${millionsLong(rounds.amount)} of new government spending` : `A ${millionsLong(rounds.amount)} tax cut`;
  const shownValues = added.slice(0, SEQUENCE_ROUNDS).map(millionsLong).join(", ");

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
      role="img"
      aria-label={`${policyText}, with an MPC of ${num(rounds.mpc, SHARE_DIGITS)}. Your loop's running total of the change in real GDP over ${n} round${n === 1 ? "" : "s"}: it added ${shownValues}${n > SEQUENCE_ROUNDS ? " and so on" : ""}, reaching ${millionsLong(rounds.total)}. The multiplier's prediction is ${millionsLong(predicted)}.`}
    >
      <Legend />
      <Sequence added={added} t={t} />

      {axis.ticks.map((v, i) => (
        <g key={`y-${v}`}>
          {v !== 0 && <line x1={pad.left} y1={sy(v)} x2={right} y2={sy(v)} stroke={color.grid} />}
          <text x={pad.left - 8} y={sy(v) + 4} textAnchor="end" style={type.tick}>
            {tickLabels[i]}
          </text>
        </g>
      ))}

      {/* One block per round: what the loop added that round, stacked on the total before it, so the top of the staircase is the running total. A dotted step joins each block to the next. */}
      {totals.map((total, i) => {
        const p = easeInOut(progressBetween(t, roundStart(i, n), GROW_MS));
        if (p <= 0) return null;
        const base = i > 0 ? totals[i - 1] : 0;
        const x = scales.sx(i) + (slot - barWidth) / 2;
        const baseY = sy(base);
        const topY = sy(base + (total - base) * p);
        const nextStarted = i < n - 1 && t > roundStart(i + 1, n);
        return (
          <g key={`round-${i}`}>
            {Math.abs(baseY - topY) > 0 && (
              <rect x={x} y={Math.min(baseY, topY)} width={barWidth} height={Math.abs(baseY - topY)} fill={color.series[0]} fillOpacity={0.85} />
            )}
            {/* The block's top edge, so a round that adds nothing still shows. */}
            <line x1={x} y1={topY} x2={x + barWidth} y2={topY} stroke={color.series[0]} strokeWidth={2} />
            {nextStarted && (
              <line x1={x + barWidth} y1={sy(total)} x2={scales.sx(i + 1) + (slot - barWidth) / 2} y2={sy(total)} stroke={color.inkMuted} strokeWidth={1} strokeDasharray="2 2" />
            )}
          </g>
        );
      })}

      {/* The multiplier's prediction for the total change in real GDP, with its value just right of the plot. */}
      {lineP > 0 && (
        <g>
          <line x1={pad.left} y1={predictedY} x2={pad.left + scales.plotWidth * lineP} y2={predictedY} stroke={color.reference} strokeWidth={2.5} strokeDasharray="8 5" />
          <text x={right + 6} y={predictedY + 4} opacity={progressBetween(t, LINE_MS * 0.6, LINE_MS * 0.4)} style={{ ...type.tick, fill: color.reference, fontWeight: 600 }}>
            {predictedLabel}
          </text>
        </g>
      )}

      <line x1={pad.left} y1={zeroY} x2={right} y2={zeroY} stroke={color.axis} />
      <line x1={pad.left} y1={PAD.top} x2={pad.left} y2={PLOT_BOTTOM} stroke={color.axis} />

      {totals.map((_, i) =>
        labeled(i + 1) ? (
          <text key={`r-${i}`} x={scales.sx(i + 0.5)} y={ROUND_ROW_Y} textAnchor="middle" style={type.tick}>
            {i + 1}
          </text>
        ) : null
      )}

      <text x={(pad.left + right) / 2} y={AXIS_TITLE_Y} textAnchor="middle" style={type.axisTitle}>
        Round
      </text>
      <text x={Y_TITLE_X} y={(PAD.top + PLOT_BOTTOM) / 2} textAnchor="middle" transform={`rotate(-90, ${Y_TITLE_X}, ${(PAD.top + PLOT_BOTTOM) / 2})`} style={type.axisTitle}>
        Change in Real GDP ($ millions)
      </text>
    </svg>
  );
}

const Component = observer(({ state }: { state: State }) => {
  const rounds = state.rounds;
  const doneAt = rounds ? roundsDoneAt(rounds.totals.length) : 0;
  const t = useRunAnimation(rounds, doneAt + SETTLE_MS);

  if (!rounds) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Press Run to follow each round of new spending and add up the total change in real GDP." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const spending = rounds.policy === "spending";

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <Plot rounds={rounds} t={t} />
      </PluginStage>
      <StatRow
        stats={[
          { label: spending ? "New Spending" : "Tax Cut", value: millions(rounds.amount) },
          { label: "MPC", value: num(rounds.mpc, SHARE_DIGITS) },
          { label: "MPS", value: num(rounds.mps, SHARE_DIGITS) },
          { label: spending ? "Multiplier" : "Tax Multiplier", value: t >= LINE_MS ? num(rounds.multiplier) : EMPTY, color: color.reference },
          { label: "Total", value: t >= doneAt ? millions(rounds.total) : EMPTY, color: color.series[0] },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
