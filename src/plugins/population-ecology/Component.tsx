import { observer } from "mobx-react-lite";
import { useEffect, useId, useRef, useState } from "react";
import { PAD, VIEW, makeScales, ticks } from "../../common/chart";
import {
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import { color, type } from "../../common/tokens";
import instructions from "./instructions.md?raw";
import State from "./state";

interface Dot {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  newTimer: number;
}

const SIM_WIDTH = 400;
const SIM_HEIGHT = 300;
const DOT_RADIUS = 5;
const MAX_DISPLAY_DOTS = 10_000;

function createDot(id: number, isNew = false): Dot {
  return {
    id,
    x: DOT_RADIUS + Math.random() * (SIM_WIDTH - DOT_RADIUS * 2),
    y: DOT_RADIUS + Math.random() * (SIM_HEIGHT - DOT_RADIUS * 2),
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    newTimer: isNew ? 1 : 0,
  };
}

function stepDots(dots: Dot[], dt: number): Dot[] {
  return dots.map((dot) => {
    let { x, y, vx, vy, newTimer } = dot;

    x += vx;
    y += vy;

    if (x < DOT_RADIUS) {
      x = DOT_RADIUS;
      vx = Math.abs(vx);
    }
    if (x > SIM_WIDTH - DOT_RADIUS) {
      x = SIM_WIDTH - DOT_RADIUS;
      vx = -Math.abs(vx);
    }
    if (y < DOT_RADIUS) {
      y = DOT_RADIUS;
      vy = Math.abs(vy);
    }
    if (y > SIM_HEIGHT - DOT_RADIUS) {
      y = SIM_HEIGHT - DOT_RADIUS;
      vy = -Math.abs(vy);
    }

    vx += (Math.random() - 0.5) * 0.3;
    vy += (Math.random() - 0.5) * 0.3;

    const speed = Math.hypot(vx, vy);
    if (speed > 2.5) {
      vx = (vx / speed) * 2.5;
      vy = (vy / speed) * 2.5;
    }

    newTimer = Math.max(0, newTimer - dt * 2);
    return { ...dot, x, y, vx, vy, newTimer };
  });
}

const PopulationGraph = ({
  history,
  growthRate,
}: {
  history: { day: number; population: number }[];
  growthRate: number | null;
}) => {
  const clipId = `population-plot-${useId().replace(/:/g, "")}`;
  const orderedHistory = Array.from(
    new Map(
      history
        .filter(
          ({ day, population }) =>
            Number.isFinite(day) &&
            Number.isFinite(population) &&
            day >= 0 &&
            population >= 0
        )
        .map((record) => [record.day, record] as const)
    ).values()
  ).sort((a, b) => a.day - b.day);

  const maxDay = Math.max(10, ...orderedHistory.map(({ day }) => day));
  const maxPopulation = Math.max(
    10,
    Math.ceil(
      Math.max(...orderedHistory.map(({ population }) => population)) * 1.1
    )
  );
  const scales = makeScales(maxDay, maxPopulation);
  const points = orderedHistory
    .map(
      ({ day, population }) =>
        `${scales.sx(day).toFixed(1)},${scales.sy(population).toFixed(1)}`
    )
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
      role="img"
      aria-label="Population over time"
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

      {ticks(maxPopulation, 4).map((value) => (
        <line
          key={`grid-${value}`}
          x1={PAD.left}
          y1={scales.sy(value)}
          x2={PAD.left + scales.plotWidth}
          y2={scales.sy(value)}
          stroke={color.grid}
        />
      ))}

      <g clipPath={`url(#${clipId})`}>
        {orderedHistory.length > 1 && (
          <polyline
            points={points}
            fill="none"
            stroke={color.series[0]}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {orderedHistory.map(({ day, population }) => (
          <circle
            key={`${day}-${population}`}
            cx={scales.sx(day)}
            cy={scales.sy(population)}
            r={3.5}
            fill={color.series[0]}
            stroke={color.surfaceRaised}
            strokeWidth={1.5}
          />
        ))}
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

      {ticks(maxDay).map((value) => (
        <text
          key={`xt-${value}`}
          x={scales.sx(value)}
          y={scales.sy(0) + 20}
          textAnchor="middle"
          style={type.tick}
        >
          {value}
        </text>
      ))}
      {ticks(maxPopulation, 4).map((value) => (
        <text
          key={`yt-${value}`}
          x={PAD.left - 8}
          y={scales.sy(value) + 4}
          textAnchor="end"
          style={type.tick}
        >
          {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
        </text>
      ))}

      <text
        x={PAD.left + scales.plotWidth / 2}
        y={VIEW.height - 8}
        textAnchor="middle"
        style={type.axisTitle}
      >
        Day
      </text>
      <text
        x={14}
        y={PAD.top + scales.plotHeight / 2}
        textAnchor="middle"
        transform={`rotate(-90, 14, ${PAD.top + scales.plotHeight / 2})`}
        style={type.axisTitle}
      >
        Population
      </text>

      {growthRate !== null && (
        <text
          x={PAD.left + scales.plotWidth - 8}
          y={PAD.top + 18}
          textAnchor="end"
          style={type.tick}
          fill={color.reference}
        >
          r = {growthRate}
        </text>
      )}
    </svg>
  );
};

const Component = observer(({ state }: { state: State }) => {
  const [dots, setDots] = useState<Dot[]>([]);
  const animationFrame = useRef(0);
  const lastTime = useRef(0);
  const nextDotId = useRef(0);

  const population = state.currentPopulation ?? 0;
  const history = state.history ?? [];
  const config = state.config;

  useEffect(() => {
    const displayCount = Math.min(population, MAX_DISPLAY_DOTS);

    setDots((previous) => {
      if (displayCount > previous.length) {
        const additions = Array.from(
          { length: displayCount - previous.length },
          () => createDot(nextDotId.current++, true)
        );
        return [...previous, ...additions];
      }

      return displayCount < previous.length
        ? previous.slice(0, displayCount)
        : previous;
    });
  }, [population]);

  useEffect(() => {
    const animate = (time: number) => {
      const dt = lastTime.current
        ? Math.min((time - lastTime.current) / 1000, 0.1)
        : 0.016;
      lastTime.current = time;
      setDots((previous) => stepDots(previous, dt));
      animationFrame.current = requestAnimationFrame(animate);
    };

    animationFrame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame.current);
  }, []);

  if (!config) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Run your code to model a population and watch it change over time." />
        </PluginStage>
      </PluginSurface>
    );
  }

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <div
          style={{
            width: "100%",
            height: "100%",
            minHeight: 0,
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(320px, 100%), 1fr))",
            gridAutoRows: "minmax(0, 1fr)",
            gap: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              minWidth: 0,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <PopulationGraph history={history} growthRate={config.growthRate} />
          </div>

          <div
            style={{
              minWidth: 0,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              overflow: "hidden",
            }}
          >
            <svg
              viewBox={`0 0 ${SIM_WIDTH} ${SIM_HEIGHT}`}
              preserveAspectRatio="xMidYMid meet"
              style={{
                width: "100%",
                height: "auto",
                minHeight: 0,
                flex: 1,
                background: color.surfaceRaised,
                border: `1px solid ${color.border}`,
                borderRadius: 4,
              }}
              role="img"
              aria-label={`${Math.min(
                population,
                MAX_DISPLAY_DOTS
              ).toLocaleString()} organisms shown`}
            >
              {dots.map((dot) => (
                <circle
                  key={dot.id}
                  cx={dot.x}
                  cy={dot.y}
                  r={DOT_RADIUS}
                  fill={dot.newTimer > 0 ? color.series[1] : color.series[0]}
                  opacity={0.85 + dot.newTimer * 0.15}
                />
              ))}
            </svg>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                ...type.tick,
              }}
            >
              <span>
                <span style={{ color: color.series[0] }}>●</span> Existing
                organisms
              </span>
              <span>
                <span style={{ color: color.series[1] }}>●</span> Newly born
              </span>
              {population > MAX_DISPLAY_DOTS && (
                <span>
                  Showing {MAX_DISPLAY_DOTS.toLocaleString()} of{" "}
                  {population.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </PluginStage>

      <StatRow
        stats={[
          { label: "Day", value: String(state.currentDay) },
          {
            label: "Population",
            value: population.toLocaleString(),
            color: color.series[0],
          },
          {
            label: "Initial Size",
            value: config.initialSize.toLocaleString(),
          },
          {
            label: config.growthRate === null ? "Model" : "Growth Rate",
            value:
              config.growthRate === null ? "Custom" : String(config.growthRate),
            color: color.reference,
          },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
