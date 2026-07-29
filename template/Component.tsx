// Imports are written for src/plugins/<name>/, where this file gets copied.
// They will show as unresolved here. That is expected — do not "fix" them.
// (There is expected to be error lines under "../../common/[blank]")

import { observer } from "mobx-react-lite";
import { color, type } from "../../common/tokens";
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
import State from "./state";
import instructions from "./instructions.md?raw";

/**
 * Presentation only. No simulation logic, no message handling, no data
 * transformation beyond what's needed to draw. If you find yourself computing
 * something a student could ask about, it belongs in state.ts.
 *
 * Every color and size comes from tokens or chart helpers. No raw hex.
 */
const Component = observer(({ state }: { state: State }) => {
  const values = state.values;
  const reference = state.reference;
  const n = values.length;

  if (n === 0) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Run your code to see the results plotted here." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const xMax = Math.max(n, 10);
  const yMax = 1;
  const s = makeScales(xMax, yMax);
  const latest = values[n - 1];

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <svg
          viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: "100%", height: "100%" }}
          role="img"
          aria-label={`Line chart of ${n} values, most recent ${latest.toFixed(
            2
          )}`}
        >
          {/* Plot area */}
          <rect
            x={PAD.left}
            y={PAD.top}
            width={s.plotWidth}
            height={s.plotHeight}
            fill={color.surfaceRaised}
            stroke={color.border}
            rx={4}
          />

          {/* Horizontal gridlines */}
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

          {/* Reference line, if the student set one */}
          {reference !== null && (
            <line
              x1={PAD.left}
              y1={s.sy(reference)}
              x2={PAD.left + s.plotWidth}
              y2={s.sy(reference)}
              stroke={color.reference}
              strokeWidth={2}
              strokeDasharray="8 5"
            />
          )}

          {/* The data */}
          <polyline
            points={polylinePoints(values, s)}
            fill="none"
            stroke={color.series[0]}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Axes */}
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
          {ticks(yMax, 4).map((v) => (
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
            {/* TODO: name your x axis in the student's language */}
            Step
          </text>
          <text
            x={14}
            y={PAD.top + s.plotHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90, 14, ${PAD.top + s.plotHeight / 2})`}
            style={type.axisTitle}
          >
            {/* TODO: name your y axis */}
            Value
          </text>
        </svg>
      </PluginStage>

      <StatRow
        stats={[
          { label: "Steps", value: String(n) },
          {
            label: "Latest",
            value: latest.toFixed(4),
            color: color.series[0],
          },
          {
            label: "Reference",
            value: reference === null ? EMPTY : reference.toFixed(2),
            color: color.reference,
          },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
