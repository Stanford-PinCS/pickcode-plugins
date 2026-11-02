import { observer } from "mobx-react-lite";
import { useId } from "react";
import { PAD, VIEW, makeScales, ticks } from "../../common/chart";
import {
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import { useRunAnimation } from "../../common/useRunAnimation";
import { color, type } from "../../common/tokens";
import instructions from "./instructions.md?raw";
import State, { type Memory } from "./state";

// The curve draws one day every DAY_MS.
const DAY_MS = 280;
// The chart is the standard VIEW; the calendar strip and legend sit below it.
const STRIP_Y = VIEW.height + 6;
const STRIP_H = 16;
const HEIGHT = VIEW.height + 66;

/** Retention at the start of each whole day (before that day's review). */
function startOfDay(memory: Memory): Map<number, number> {
  const out = new Map<number, number>();
  memory.days.forEach((d, i) => {
    if (Number.isInteger(d) && !out.has(d)) out.set(d, memory.retentions[i]);
  });
  return out;
}

const Component = observer(({ state }: { state: State }) => {
  const clipId = `fc-plot-${useId().replace(/:/g, "")}`;
  const memory = state.memory;
  const lastDay = memory ? memory.days[memory.days.length - 1] : 0;
  const elapsed = useRunAnimation(memory, lastDay * DAY_MS);

  if (!memory) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Press Run to watch your memory of a word list fade, day by day." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const { days, retentions, studyDays, threshold } = memory;
  const now = Math.min(lastDay, elapsed / DAY_MS);
  const today = Math.floor(now + 1e-9);
  const s = makeScales(lastDay, 100);

  // Everything up to now, in order. A review day has two points at the same
  // day, so the curve jumps straight up there.
  let shown = 0;
  while (shown < days.length && days[shown] <= now + 1e-9) shown++;
  const pts = days
    .slice(0, shown)
    .map((d, i) => `${s.sx(d).toFixed(1)},${s.sy(retentions[i] * 100).toFixed(1)}`)
    .join(" ");
  const current = retentions[Math.max(0, shown - 1)];

  const dayStart = startOfDay(memory);
  let remembered = 0;
  for (let d = 1; d <= today; d++) {
    if ((dayStart.get(d) ?? 0) >= threshold) remembered++;
  }
  const reviewsSoFar = studyDays.filter((d) => d <= today).length;
  const isStudy = (d: number) => d === 0 || studyDays.includes(d);
  const cell = (s.plotWidth / lastDay) * 0.8;

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <svg
          viewBox={`0 0 ${VIEW.width} ${HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: "100%", height: "100%" }}
          role="img"
          aria-label={`Forgetting curve: on day ${today} you remember ${Math.round(
            current * 100
          )}% of the words, after ${reviewsSoFar} reviews`}
        >
          <defs>
            <clipPath id={clipId}>
              <rect x={PAD.left - 4} y={PAD.top - 4} width={s.plotWidth + 8} height={s.plotHeight + 8} />
            </clipPath>
          </defs>

          <rect x={PAD.left} y={PAD.top} width={s.plotWidth} height={s.plotHeight} fill={color.surfaceRaised} stroke={color.border} rx={4} />

          {ticks(100, 5).map((v) => (
            <line key={`grid-${v}`} x1={PAD.left} y1={s.sy(v)} x2={PAD.left + s.plotWidth} y2={s.sy(v)} stroke={color.grid} />
          ))}

          {/* Review days reached so far. */}
          {studyDays
            .filter((d) => d <= now)
            .map((d) => (
              <line key={`rev-${d}`} x1={s.sx(d)} y1={PAD.top} x2={s.sx(d)} y2={s.sy(0)} stroke={color.series[1]} strokeWidth={1.5} opacity={0.6} />
            ))}

          {/* The "remembered" threshold. */}
          <line
            x1={PAD.left}
            y1={s.sy(threshold * 100)}
            x2={PAD.left + s.plotWidth}
            y2={s.sy(threshold * 100)}
            stroke={color.reference}
            strokeWidth={2}
            strokeDasharray="8 5"
          />
          <text x={PAD.left + s.plotWidth - 6} y={s.sy(threshold * 100) + 16} textAnchor="end" style={{ ...type.tick, fill: color.reference }}>
            Remembered
          </text>

          {/* Current day marker. */}
          <line x1={s.sx(now)} y1={PAD.top} x2={s.sx(now)} y2={s.sy(0)} stroke={color.inkMuted} strokeWidth={1.5} strokeDasharray="3 4" />

          <g clipPath={`url(#${clipId})`}>
            <polyline points={pts} fill="none" stroke={color.series[0]} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={s.sx(days[shown - 1])} cy={s.sy(current * 100)} r={5} fill={color.series[0]} stroke={color.ink} strokeWidth={1.5} />
          </g>

          <line x1={PAD.left} y1={s.sy(0)} x2={PAD.left + s.plotWidth} y2={s.sy(0)} stroke={color.axis} />
          <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={s.sy(0)} stroke={color.axis} />

          {ticks(lastDay).map((v) => (
            <text key={`xt-${v}`} x={s.sx(v)} y={s.sy(0) + 20} textAnchor="middle" style={type.tick}>
              {v}
            </text>
          ))}
          {ticks(100, 5).map((v) => (
            <text key={`yt-${v}`} x={PAD.left - 8} y={s.sy(v) + 4} textAnchor="end" style={type.tick}>
              {v}%
            </text>
          ))}

          <text x={PAD.left + s.plotWidth / 2} y={VIEW.height - 8} textAnchor="middle" style={type.axisTitle}>
            Day
          </text>
          <text
            x={14}
            y={PAD.top + s.plotHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90, 14, ${PAD.top + s.plotHeight / 2})`}
            style={type.axisTitle}
          >
            Words Remembered
          </text>

          {/* Calendar strip: one square per day. Teal squares are study days;
              the outlined square is today. */}
          {Array.from({ length: lastDay + 1 }, (_, d) => (
            <rect
              key={`day-${d}`}
              x={s.sx(d) - cell / 2}
              y={STRIP_Y}
              width={cell}
              height={STRIP_H}
              rx={2}
              fill={isStudy(d) ? color.series[1] : color.surfaceRaised}
              stroke={d === today ? color.ink : color.border}
              strokeWidth={d === today ? 2 : 1}
              opacity={d <= today ? 1 : 0.4}
            />
          ))}

          <text x={VIEW.width / 2} y={HEIGHT - 12} textAnchor="middle" style={type.tick}>
            <tspan fill={color.series[0]}>●</tspan>
            <tspan> Retention</tspan>
            <tspan dx={14} fill={color.series[1]}>■</tspan>
            <tspan> Study day</tspan>
          </text>
        </svg>
      </PluginStage>

      <StatRow
        stats={[
          { label: "Day", value: String(today) },
          { label: "Retention", value: `${Math.round(current * 100)}%`, color: color.series[0] },
          { label: "Reviews", value: String(reviewsSoFar), color: color.series[1] },
          { label: "Days Remembered", value: `${remembered} / ${today}` },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
