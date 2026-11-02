import { observer } from "mobx-react-lite";
import { PAD, VIEW, makeScales, ticks } from "../../common/chart";
import { color, type } from "../../common/tokens";
import { useRunAnimation } from "../../common/useRunAnimation";
import {
  EMPTY,
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import State from "./state";
import instructions from "./instructions.md?raw";

const EXACT_AREA = 64 / 3;
const X_MAX = 4;
const Y_MAX = 16;
// Above this many rectangles the sample dots would overlap into a smear.
const MAX_DOTS = 40;

// Rectangles rise one at a time, left to right, at a constant rate. Each gets
// an equal slice of ANIM_TOTAL_MS, so the whole sweep always takes that long.
const ANIM_TOTAL_MS = 5000;

const Component = observer(({ state }: { state: State }) => {
  const rects = state.rects ?? [];
  const curveVisible = state.curveVisible ?? false;
  const area = state.area ?? 0;
  const hasArea = state.hasArea ?? false;
  const n = rects.length;
  const elapsed = useRunAnimation(n > 0 ? state : null, ANIM_TOTAL_MS);

  // Zero-height rectangles (e.g. the left endpoint at x = 0) have nothing to
  // animate, so they don't get a time slot — otherwise the run opens on a pause.
  const slots: number[] = [];
  let visibleCount = 0;
  for (const r of rects) slots.push(r.height > 0 ? visibleCount++ : -1);
  const riseMs = ANIM_TOTAL_MS / Math.max(visibleCount, 1);

  const scales = makeScales(X_MAX, Y_MAX, VIEW, PAD);
  const { sx, sy } = scales;

  const curvePoints = curveVisible
    ? Array.from({ length: 201 }, (_, i) => {
        const x = (i / 200) * X_MAX;
        return `${sx(x)},${sy(Math.min(x * x, Y_MAX))}`;
      }).join(" ")
    : "";

  if (n === 0) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Run your code to fill the area under f(x) = x² with rectangles." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const error = Math.abs(area - EXACT_AREA);

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <svg
          viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
          style={{ width: "100%", height: "100%" }}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`${n} rectangles under the curve f(x) = x squared from x = 0 to 4${
            hasArea ? `, total area ${area.toFixed(2)}` : ""
          }`}
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

          {ticks(Y_MAX, 4).map((v) => (
            <line
              key={`gy-${v}`}
              x1={PAD.left}
              y1={sy(v)}
              x2={PAD.left + scales.plotWidth}
              y2={sy(v)}
              stroke={color.grid}
            />
          ))}
          {ticks(X_MAX, 4).map((v) => (
            <line
              key={`gx-${v}`}
              x1={sx(v)}
              y1={PAD.top}
              x2={sx(v)}
              y2={sy(0)}
              stroke={color.grid}
            />
          ))}

          {rects.map((r, i) => {
            const p = Math.min(
              Math.max((elapsed - slots[i] * riseMs) / riseMs, 0),
              1
            );
            const h = Math.min(r.height, Y_MAX) * p;
            if (h <= 0) return null;
            return (
              <rect
                key={i}
                x={sx(r.x)}
                y={sy(h)}
                width={sx(r.x + r.width) - sx(r.x)}
                height={sy(0) - sy(h)}
                fill={color.series[0]}
                fillOpacity={0.3}
                stroke={color.series[0]}
                strokeWidth={n > MAX_DOTS ? 0.3 : 1}
              />
            );
          })}

          {curveVisible && (
            <polyline
              points={curvePoints}
              fill="none"
              stroke={color.series[1]}
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
          )}

          {/* Where each rectangle touches the curve: the x whose x² is its
              height. Only drawn when that x is inside the rectangle, i.e. the
              rectangle really was sampled from f(x) = x². */}
          {n <= MAX_DOTS &&
            rects.map((r, i) => {
              // A flat rectangle has no rise; its dot shows from the start.
              const shownAt = slots[i] < 0 ? 0 : (slots[i] + 1) * riseMs;
              if (elapsed <= 0 || elapsed < shownAt) return null;
              const xs = Math.sqrt(r.height);
              if (xs < r.x - 1e-9 || xs > r.x + r.width + 1e-9) return null;
              if (r.height > Y_MAX) return null;
              return (
                <circle
                  key={`dot-${i}`}
                  cx={sx(xs)}
                  cy={sy(r.height)}
                  r={3.5}
                  fill={color.series[0]}
                  stroke={color.surfaceRaised}
                  strokeWidth={1.5}
                />
              );
            })}

          <line
            x1={PAD.left}
            y1={sy(0)}
            x2={PAD.left + scales.plotWidth}
            y2={sy(0)}
            stroke={color.axis}
          />
          <line
            x1={PAD.left}
            y1={PAD.top}
            x2={PAD.left}
            y2={sy(0)}
            stroke={color.axis}
          />

          {ticks(X_MAX, 4).map((v) => (
            <text
              key={`xt-${v}`}
              x={sx(v)}
              y={sy(0) + 20}
              textAnchor="middle"
              style={type.tick}
            >
              {v}
            </text>
          ))}
          {ticks(Y_MAX, 4).map((v) => (
            <text
              key={`yt-${v}`}
              x={PAD.left - 8}
              y={sy(v) + 4}
              textAnchor="end"
              style={type.tick}
            >
              {v}
            </text>
          ))}

          <text
            x={PAD.left + scales.plotWidth / 2}
            y={VIEW.height - 8}
            textAnchor="middle"
            style={type.axisTitle}
          >
            x
          </text>
          <text
            x={14}
            y={PAD.top + scales.plotHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90, 14, ${PAD.top + scales.plotHeight / 2})`}
            style={type.axisTitle}
          >
            f(x) = x²
          </text>
        </svg>
      </PluginStage>

      <StatRow
        stats={[
          { label: "Rectangles", value: String(n) },
          {
            label: "Approx. Area",
            value: hasArea ? area.toFixed(4) : EMPTY,
            color: color.series[0],
          },
          { label: "Exact Area", value: EXACT_AREA.toFixed(4) },
          {
            label: "Error",
            value: hasArea ? error.toFixed(4) : EMPTY,
          },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
