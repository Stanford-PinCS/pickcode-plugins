import { observer } from "mobx-react-lite";
import { useId } from "react";
import { PAD, VIEW, makeScales, ticks } from "../../common/chart";
import {
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import { color, type } from "../../common/tokens";
import instructions from "./instructions.md?raw";
import type { Line } from "./messages";
import State from "./state";

const BASE_SUPPLY: Line = {
  start: { x: -0.8, y: -0.8 },
  end: { x: 0.8, y: 0.8 },
};

const BASE_DEMAND: Line = {
  start: { x: -0.8, y: 0.8 },
  end: { x: 0.8, y: -0.8 },
};

function calculateIntersection(line1: Line, line2: Line) {
  const denominator =
    (line1.start.x - line1.end.x) * (line2.start.y - line2.end.y) -
    (line1.start.y - line1.end.y) * (line2.start.x - line2.end.x);

  if (Math.abs(denominator) < 0.001) return null;

  const determinant1 =
    line1.start.x * line1.end.y - line1.start.y * line1.end.x;
  const determinant2 =
    line2.start.x * line2.end.y - line2.start.y * line2.end.x;

  return {
    x:
      (determinant1 * (line2.start.x - line2.end.x) -
        (line1.start.x - line1.end.x) * determinant2) /
      denominator,
    y:
      (determinant1 * (line2.start.y - line2.end.y) -
        (line1.start.y - line1.end.y) * determinant2) /
      denominator,
  };
}

const Component = observer(({ state }: { state: State }) => {
  const clipId = `market-plot-${useId().replace(/:/g, "")}`;
  const scales = makeScales(2, 2);
  const supply = state.lines[0] ?? BASE_SUPPLY;
  const demand = state.lines[1] ?? BASE_DEMAND;
  const equilibrium = state.helper
    ? calculateIntersection(supply, demand)
    : null;

  const toChartPoint = ({ x, y }: { x: number; y: number }) => ({
    x: scales.sx(x + 1),
    y: scales.sy(y + 1),
  });

  const drawCurve = (
    line: Line,
    stroke: string,
    dashed = false,
    key?: string
  ) => {
    const start = toChartPoint(line.start);
    const end = toChartPoint(line.end);

    return (
      <line
        key={key}
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={stroke}
        strokeWidth={2.5}
        strokeDasharray={dashed ? "8 5" : undefined}
        strokeLinecap="round"
      />
    );
  };

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <svg
          viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: "100%", height: "100%" }}
          role="img"
          aria-label="Supply and demand graph"
        >
          <defs>
            <clipPath id={clipId}>
              <rect
                x={PAD.left}
                y={PAD.top}
                width={scales.plotWidth}
                height={scales.plotHeight}
              />
            </clipPath>
          </defs>

          <rect
            x={PAD.left}
            y={PAD.top}
            width={scales.plotWidth}
            height={scales.plotHeight}
            fill={color.surfaceRaised}
            stroke={color.border}
            rx={4}
          />

          {ticks(2, 4).map((value) => (
            <g key={`grid-${value}`}>
              <line
                x1={scales.sx(value)}
                y1={PAD.top}
                x2={scales.sx(value)}
                y2={PAD.top + scales.plotHeight}
                stroke={color.grid}
              />
              <line
                x1={PAD.left}
                y1={scales.sy(value)}
                x2={PAD.left + scales.plotWidth}
                y2={scales.sy(value)}
                stroke={color.grid}
              />
            </g>
          ))}

          <g clipPath={`url(#${clipId})`}>
            {drawCurve(BASE_SUPPLY, color.series[0])}
            {drawCurve(BASE_DEMAND, color.series[1])}

            {state.lines.map((line, index) =>
              drawCurve(
                line,
                index === 0 ? color.series[0] : color.series[1],
                true,
                `shifted-${index}`
              )
            )}

            {state.points.map((point, index) => {
              const plotted = toChartPoint({
                x: point.quantity,
                y: point.price,
              });

              return (
                <g key={`point-${index}`}>
                  <line
                    x1={PAD.left}
                    y1={plotted.y}
                    x2={plotted.x}
                    y2={plotted.y}
                    stroke={color.reference}
                    strokeDasharray="5 4"
                  />
                  <line
                    x1={plotted.x}
                    y1={scales.sy(0)}
                    x2={plotted.x}
                    y2={plotted.y}
                    stroke={color.reference}
                    strokeDasharray="5 4"
                  />
                  <circle
                    cx={plotted.x}
                    cy={plotted.y}
                    r={4.5}
                    fill={color.reference}
                    stroke={color.surfaceRaised}
                    strokeWidth={1.5}
                  />
                </g>
              );
            })}

            {equilibrium && (
              <g>
                <line
                  x1={PAD.left}
                  y1={scales.sy(equilibrium.y + 1)}
                  x2={scales.sx(equilibrium.x + 1)}
                  y2={scales.sy(equilibrium.y + 1)}
                  stroke={color.axis}
                  strokeDasharray="6 5"
                />
                <line
                  x1={scales.sx(equilibrium.x + 1)}
                  y1={scales.sy(0)}
                  x2={scales.sx(equilibrium.x + 1)}
                  y2={scales.sy(equilibrium.y + 1)}
                  stroke={color.axis}
                  strokeDasharray="6 5"
                />
                <circle
                  cx={scales.sx(equilibrium.x + 1)}
                  cy={scales.sy(equilibrium.y + 1)}
                  r={5}
                  fill={color.axis}
                  stroke={color.surfaceRaised}
                  strokeWidth={1.5}
                />
              </g>
            )}
          </g>

          <line
            x1={PAD.left}
            y1={scales.sy(0)}
            x2={PAD.left + scales.plotWidth}
            y2={scales.sy(0)}
            stroke={color.axis}
          />
          <line
            x1={PAD.left}
            y1={PAD.top}
            x2={PAD.left}
            y2={scales.sy(0)}
            stroke={color.axis}
          />

          {ticks(2, 4).map((value) => (
            <g key={`tick-${value}`}>
              <text
                x={scales.sx(value)}
                y={scales.sy(0) + 20}
                textAnchor="middle"
                style={type.tick}
              >
                {value.toFixed(1)}
              </text>
              <text
                x={PAD.left - 8}
                y={scales.sy(value) + 4}
                textAnchor="end"
                style={type.tick}
              >
                {value.toFixed(1)}
              </text>
            </g>
          ))}

          <text
            x={PAD.left + scales.plotWidth / 2}
            y={VIEW.height - 8}
            textAnchor="middle"
            style={type.axisTitle}
          >
            Quantity
          </text>
          <text
            x={14}
            y={PAD.top + scales.plotHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90, 14, ${PAD.top + scales.plotHeight / 2})`}
            style={type.axisTitle}
          >
            Price
          </text>

          <text
            x={scales.sx(1.8)}
            y={PAD.top - 7}
            textAnchor="end"
            style={{ ...type.axisTitle, fill: color.series[0] }}
          >
            Supply
          </text>
          <text
            x={scales.sx(0.2)}
            y={PAD.top - 7}
            textAnchor="start"
            style={{ ...type.axisTitle, fill: color.series[1] }}
          >
            Demand
          </text>
        </svg>
      </PluginStage>

      <StatRow
        stats={[
          {
            label: "Market Points",
            value: String(state.pointsCount),
          },
          {
            label: "Supply",
            value: state.lines.length >= 1 ? "Shifted" : "Base",
            color: color.series[0],
          },
          {
            label: "Demand",
            value: state.lines.length >= 2 ? "Shifted" : "Base",
            color: color.series[1],
          },
          {
            label: "Equilibrium",
            value: equilibrium
              ? `Q ${Math.max(0, equilibrium.x + 1).toFixed(2)} · P ${Math.max(
                  0,
                  equilibrium.y + 1
                ).toFixed(2)}`
              : "Hidden",
            color: color.reference,
          },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
