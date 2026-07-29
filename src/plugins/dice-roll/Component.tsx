import { observer } from "mobx-react-lite";
import { color } from "../../common/tokens";
import { PAD, VIEW, makeScales, niceStep, ticks } from "../../common/chart";
import {
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import State from "./state";
import instructions from "./instructions.md?raw";

const Component = observer(({ state }: { state: State }) => {
  const percentages = state.percentages ?? [];
  const numSides = percentages.length;

  if (numSides === 0) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Roll the dice to see the distribution." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const maxPercent = Math.max(...percentages);
  const step = niceStep(maxPercent, 4);
  const yMax = Math.ceil(maxPercent / step) * step; // round the max UP to a whole number of steps
  const scales = makeScales(numSides + 1, yMax, VIEW, PAD);

  const mostCommonFace = percentages.indexOf(Math.max(...percentages)) + 1;

  const expectedPercent = 100 / numSides;
  const maxDeviation = Math.max(
    ...percentages.map((percentage) => Math.abs(percentage - expectedPercent))
  );

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

          {percentages.map((percentage, index) => {
            const x1 = scales.sx(index + 0.7);
            const x2 = scales.sx(index + 1.3);
            const y = scales.sy(percentage);

            return (
              <rect
                key={`bar-${index}`}
                x={x1}
                y={y}
                width={x2 - x1}
                height={scales.sy(0) - y}
                fill={color.series[index % color.series.length]}
              />
            );
          })}

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
          {
            label: "Most Common",
            value: `Face ${mostCommonFace}`,
            color: color.series[0],
          },
          {
            label: "Max Deviation",
            value: `${maxDeviation.toFixed(1)}%`,
          },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
