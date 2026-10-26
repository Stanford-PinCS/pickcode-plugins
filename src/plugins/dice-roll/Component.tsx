import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { color } from "../../common/tokens";
import { PAD, VIEW, makeScales, niceStep, ticks } from "../../common/chart";
import {
  progressBetween,
  useRunAnimation,
} from "../../common/useRunAnimation";
import {
  EMPTY,
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import State from "./state";
import instructions from "./instructions.md?raw";

// The replay finishes within ANIM_TOTAL_MS. It starts at about one roll per
// FIRST_ROLL_MS so the first rolls can be followed, then speeds up.
const ANIM_TOTAL_MS = 5000;
const FIRST_ROLL_MS = 250;
// How long a bar stays outlined after a roll lands on it.
const FLASH_MS = 180;
// Without a recoverable roll count, the bars just grow over this long.
const GROW_MS = 1200;

/**
 * The plugin only receives the final percentages. They are count / total,
 * so the smallest total that turns every percentage back into a whole count
 * recovers the counts. Returns null when no total up to the limit fits
 * (values that didn't come from counting rolls).
 */
function recoverCounts(percentages: number[]): number[] | null {
  for (let total = 1; total <= 200000; total++) {
    const counts = percentages.map((p) => (p * total) / 100);
    if (counts.every((c) => Math.abs(c - Math.round(c)) < 1e-6)) {
      const rounded = counts.map(Math.round);
      if (rounded.reduce((a, b) => a + b, 0) === total) return rounded;
    }
  }
  return null;
}

/**
 * The rolls behind the counts, in random order. Given only the counts, every
 * order is equally likely, so this replay is statistically the same as the
 * real sequence of rolls.
 */
function shuffledRolls(counts: number[]): number[] {
  const rolls: number[] = [];
  counts.forEach((c, face) => {
    for (let i = 0; i < c; i++) rolls.push(face);
  });
  for (let i = rolls.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rolls[i], rolls[j]] = [rolls[j], rolls[i]];
  }
  return rolls;
}

const Component = observer(({ state }: { state: State }) => {
  const percentages = state.percentages ?? [];
  const numSides = percentages.length;
  const target = state.target ?? 0;

  const rolls = useMemo(() => {
    const counts = recoverCounts(percentages);
    return counts ? shuffledRolls(counts) : null;
  }, [percentages]);
  const totalRolls = rolls?.length ?? 0;

  // Roll k lands at ANIM_TOTAL_MS · (k / N)^a. The exponent puts the first
  // roll at FIRST_ROLL_MS, so a big N speeds up a lot and a small one stays
  // even (a ≤ 1 never slows down).
  const exponent =
    totalRolls > 1
      ? Math.min(
          1,
          Math.log(ANIM_TOTAL_MS / FIRST_ROLL_MS) / Math.log(totalRolls)
        )
      : 1;
  const duration = rolls ? ANIM_TOTAL_MS : GROW_MS;
  const elapsed = useRunAnimation(numSides > 0 ? percentages : null, duration);

  if (numSides === 0) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Roll the dice to see the distribution." />
        </PluginStage>
      </PluginSurface>
    );
  }

  // The axis is sized for the final chart, so it holds still while the bars
  // climb into it.
  const maxPercent = Math.max(...percentages, target);
  const step = niceStep(maxPercent, 4);
  const yMax = Math.ceil(maxPercent / step) * step; // round the max UP to a whole number of steps
  const scales = makeScales(numSides + 1, yMax, VIEW, PAD);

  // Bars stand at count-so-far / total, so each roll raises its face's bar by
  // one roll's worth and the last roll leaves exactly the final chart.
  let rolled = numSides;
  let heights = percentages;
  let flashFace = -1;
  if (rolls) {
    const progress = elapsed / ANIM_TOTAL_MS;
    rolled = Math.min(
      totalRolls,
      Math.floor(totalRolls * Math.pow(progress, 1 / exponent) + 1e-9)
    );
    const counts = new Array(numSides).fill(0);
    for (let i = 0; i < rolled; i++) counts[rolls[i]]++;
    heights = counts.map((c) => (c / totalRolls) * 100);

    // Outline the bar the latest roll landed on, while rolls are still slow
    // enough to see one at a time.
    if (rolled > 0 && rolled < totalRolls) {
      const landedAt =
        ANIM_TOTAL_MS * Math.pow(rolled / totalRolls, exponent);
      const nextAt =
        ANIM_TOTAL_MS * Math.pow((rolled + 1) / totalRolls, exponent);
      if (nextAt - landedAt > FLASH_MS && elapsed - landedAt < FLASH_MS) {
        flashFace = rolls[rolled - 1];
      }
    }
  } else {
    const p = progressBetween(elapsed, 0, GROW_MS);
    heights = percentages.map((h) => h * p);
  }

  // Stats describe the rolls so far: their own distribution, not the bars'
  // share of the final total.
  const rolledSum = heights.reduce((a, b) => a + b, 0);
  const shares = rolledSum > 0 ? heights.map((h) => (h / rolledSum) * 100) : [];
  const mostCommonFace = shares.length
    ? shares.indexOf(Math.max(...shares)) + 1
    : 0;

  const expectedPercent = 100 / numSides;
  const maxDeviation = shares.length
    ? Math.max(...shares.map((share) => Math.abs(share - expectedPercent)))
    : 0;

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <svg
          viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: "100%", height: "100%" }}
          role="img"
          aria-label={`Bar chart showing the distribution of a ${numSides}-sided die`}
        >
          <rect
            x={PAD.left}
            y={PAD.top}
            width={scales.plotWidth}
            height={scales.plotHeight}
            fill={color.surfaceRaised}
            stroke={color.border}
            rx={4}
          />

          {ticks(yMax, 4).map((value) => (
            <line
              key={`grid-${value}`}
              x1={PAD.left}
              y1={scales.sy(value)}
              x2={PAD.left + scales.plotWidth}
              y2={scales.sy(value)}
              stroke={color.grid}
            />
          ))}

          {heights.map((height, index) => {
            const x1 = scales.sx(index + 0.7);
            const x2 = scales.sx(index + 1.3);
            const y = scales.sy(height);

            return (
              <rect
                key={`bar-${index}`}
                x={x1}
                y={y}
                width={x2 - x1}
                height={scales.sy(0) - y}
                fill={color.series[index % color.series.length]}
                stroke={index === flashFace ? color.ink : "none"}
                strokeWidth={2}
              />
            );
          })}

          {target > 0 && (
            <line
              x1={PAD.left}
              y1={scales.sy(target)}
              x2={PAD.left + scales.plotWidth}
              y2={scales.sy(target)}
              stroke={color.reference}
              strokeWidth={2}
              strokeDasharray="8 5"
            />
          )}

          {/* X axis */}
          <line
            x1={PAD.left}
            y1={scales.sy(0)}
            x2={PAD.left + scales.plotWidth}
            y2={scales.sy(0)}
            stroke={color.axis}
          />

          {/* Y axis */}
          <line
            x1={PAD.left}
            y1={PAD.top}
            x2={PAD.left}
            y2={scales.sy(0)}
            stroke={color.axis}
          />

          {Array.from({ length: numSides }, (_, index) => {
            const face = index + 1;

            return (
              <text
                key={`xt-${face}`}
                x={scales.sx(face)}
                y={scales.sy(0) + 20}
                textAnchor="middle"
                style={{ fontSize: 11, fill: color.inkMuted }}
              >
                {face}
              </text>
            );
          })}

          {ticks(yMax, 4).map((value) => (
            <text
              key={`yt-${value}`}
              x={PAD.left - 8}
              y={scales.sy(value) + 4}
              textAnchor="end"
              style={{ fontSize: 11, fill: color.inkMuted }}
            >
              {value.toFixed(1)}%
            </text>
          ))}

          <text
            x={PAD.left + scales.plotWidth / 2}
            y={VIEW.height - 8}
            textAnchor="middle"
            style={{
              fontSize: 12,
              fontWeight: 600,
              fill: color.inkMuted,
            }}
          >
            Die Face
          </text>

          <text
            x={14}
            y={PAD.top + scales.plotHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90, 14, ${PAD.top + scales.plotHeight / 2})`}
            style={{
              fontSize: 12,
              fontWeight: 600,
              fill: color.inkMuted,
            }}
          >
            Frequency (%)
          </text>
        </svg>
      </PluginStage>

      <StatRow
        stats={[
          {
            label: "Number of Sides",
            value: String(numSides),
          },
          ...(rolls ? [{ label: "Rolls", value: String(rolled) }] : []),
          {
            label: "Most Common",
            value: mostCommonFace ? `Face ${mostCommonFace}` : EMPTY,
            color: color.series[0],
          },
          {
            label: "Max Deviation",
            value: shares.length ? `${maxDeviation.toFixed(1)}%` : EMPTY,
          },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
