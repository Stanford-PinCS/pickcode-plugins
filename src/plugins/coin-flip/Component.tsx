// Migrated example: plugins/coin-flip/Component.tsx
// Same behaviour as the current version. 268 lines -> 118. No hex values,
// no duplicated title bar, no hand-rolled axis code.

import { observer } from "mobx-react-lite";
import { color, type } from "../../common/tokens";
import { useRunAnimation } from "../../common/useRunAnimation";
import {
  PAD,
  VIEW,
  makeScales,
  polylinePoints,
  ticks,
} from "../../common/chart";
import {
  EMPTY,
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import instructions from "./instructions.md?raw";
import State from "./state";

// The line draws itself left to right at a constant rate, reaching the last
// flip after ANIM_TOTAL_MS whatever the number of flips.
const ANIM_TOTAL_MS = 5000;

const Component = observer(({ state }: { state: State }) => {
  console.log("Coin Flip component rendered");
  const points = state.points ?? [];
  const target = state.target ?? 0.5;
  const n = points.length;

  const elapsed = useRunAnimation(n > 0 ? points : null, ANIM_TOTAL_MS);

  if (n === 0) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Run your code to flip some coins and watch the proportion settle." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const finalProportion = points[n - 1];
  const xMax = Math.max(n, 10);
  const s = makeScales(xMax, 1);

  // How far along the flips the line has reached, as a fractional index. The
  // last segment ends at an interpolated point so the tip moves smoothly.
  const reach = Math.min(elapsed / ANIM_TOTAL_MS, 1) * (n - 1);
  const whole = Math.floor(reach);
  let linePoints = polylinePoints(points.slice(0, whole + 1), s);
  if (whole < n - 1) {
    const f = reach - whole;
    const y = points[whole] + (points[whole + 1] - points[whole]) * f;
    linePoints += ` ${s.sx(whole + 1 + f)},${s.sy(y)}`;
  }

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <svg
          viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: "100%", height: "100%" }}
          role="img"
          aria-label={`Proportion of heads over ${n} flips, currently ${finalProportion.toFixed(
            2
          )}`}
        >
          <rect
            x={PAD.left}
            y={PAD.top}
            width={s.plotWidth}
            height={s.plotHeight}
            fill={color.surfaceRaised}
            stroke={color.border}
            rx={4}
          />

          {ticks(1, 4).map((v) => (
            <line
              key={`grid-${v}`}
              x1={PAD.left}
              y1={s.sy(v)}
              x2={PAD.left + s.plotWidth}
              y2={s.sy(v)}
              stroke={color.grid}
            />
          ))}

          <line
            x1={PAD.left}
            y1={s.sy(target)}
            x2={PAD.left + s.plotWidth}
            y2={s.sy(target)}
            stroke={color.reference}
            strokeWidth={2}
            strokeDasharray="8 5"
          />

          <polyline
            points={linePoints}
            fill="none"
            stroke={color.series[0]}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          <line
            x1={PAD.left}
            y1={s.sy(0)}
            x2={PAD.left + s.plotWidth}
            y2={s.sy(0)}
            stroke={color.axis}
          />
          <line
            x1={PAD.left}
            y1={PAD.top}
            x2={PAD.left}
            y2={s.sy(0)}
            stroke={color.axis}
          />

          {ticks(xMax).map((v) => (
            <text
              key={`xt-${v}`}
              x={s.sx(v)}
              y={s.sy(0) + 20}
              textAnchor="middle"
              style={type.tick}
            >
              {v}
            </text>
          ))}
          {ticks(1, 4).map((v) => (
            <text
              key={`yt-${v}`}
              x={PAD.left - 8}
              y={s.sy(v) + 4}
              textAnchor="end"
              style={type.tick}
            >
              {v.toFixed(2)}
            </text>
          ))}

          <text
            x={PAD.left + s.plotWidth / 2}
            y={VIEW.height - 8}
            textAnchor="middle"
            style={type.axisTitle}
          >
            Number of Flips
          </text>
          <text
            x={14}
            y={PAD.top + s.plotHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90, 14, ${PAD.top + s.plotHeight / 2})`}
            style={type.axisTitle}
          >
            Proportion Heads
          </text>
        </svg>
      </PluginStage>

      <StatRow
        stats={[
          { label: "Total Flips", value: String(n) },
          {
            label: "Final Proportion",
            value: finalProportion.toFixed(4),
            color: color.series[0],
          },
          { label: "Target", value: target.toFixed(2), color: color.reference },
          {
            label: "Error",
            value: Math.abs(finalProportion - target).toFixed(4),
          },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
