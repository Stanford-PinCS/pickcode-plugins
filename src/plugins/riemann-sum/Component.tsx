import { observer } from "mobx-react-lite";
import { color } from "../../common/tokens";
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
const X_MIN = 0;
const X_MAX = 4;
const Y_MAX = 16;

const Component = observer(({ state }: { state: State }) => {
  const rects = state.rects ?? [];
  const curveVisible = state.curveVisible ?? false;
  const area = state.area ?? 0;
  const n = rects.length;

  const vw = 520;
  const vh = 420;
  const pad = { top: 24, right: 24, bottom: 44, left: 52 };
  const plotW = vw - pad.left - pad.right;
  const plotH = vh - pad.top - pad.bottom;

  const sx = (x: number) => pad.left + ((x - X_MIN) / (X_MAX - X_MIN)) * plotW;
  const sy = (y: number) => pad.top + plotH - (y / Y_MAX) * plotH;

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
          <EmptyState message="Run your code to approximate the area under f(x) = x² with Riemann rectangles." />
        </PluginStage>
      </PluginSurface>
    );
  }

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <svg
          viewBox={`0 0 ${vw} ${vh}`}
          style={{ width: "100%", height: "100%" }}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Riemann sum with ${n} rectangles`}
        >
          <rect
            x={pad.left}
            y={pad.top}
            width={plotW}
            height={plotH}
            fill={color.surfaceRaised}
            stroke={color.border}
            rx="4"
          />

          {[4, 8, 12, 16].map((v) => (
            <line
              key={`gy-${v}`}
              x1={pad.left}
              y1={sy(v)}
              x2={pad.left + plotW}
              y2={sy(v)}
              stroke={color.grid}
            />
          ))}
          {[1, 2, 3, 4].map((v) => (
            <line
              key={`gx-${v}`}
              x1={sx(v)}
              y1={pad.top}
              x2={sx(v)}
              y2={pad.top + plotH}
              stroke={color.grid}
            />
          ))}

          {rects.map((r, i) => {
            const h = Math.min(r.height, Y_MAX);
            if (h <= 0) return null;
            return (
              <rect
                key={i}
                x={sx(r.x)}
                y={sy(h)}
                width={sx(r.x + r.width) - sx(r.x)}
                height={sy(0) - sy(h)}
                fill={color.accent}
                fillOpacity={0.4}
                stroke={color.accent}
                strokeWidth={n > 40 ? 0.3 : 1}
              />
            );
          })}

          {curveVisible && (
            <polyline
              points={curvePoints}
              fill="none"
              stroke={color.series[1] ?? color.reference}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          )}

          <line
            x1={pad.left}
            y1={sy(0)}
            x2={pad.left + plotW}
            y2={sy(0)}
            stroke={color.axis}
            strokeWidth="1.5"
          />
          <line
            x1={pad.left}
            y1={pad.top}
            x2={pad.left}
            y2={sy(0)}
            stroke={color.axis}
            strokeWidth="1.5"
          />

          {[0, 1, 2, 3, 4].map((v) => (
            <g key={`xt-${v}`}>
              <line
                x1={sx(v)}
                y1={sy(0)}
                x2={sx(v)}
                y2={sy(0) + 6}
                stroke={color.axis}
              />
              <text
                x={sx(v)}
                y={sy(0) + 22}
                fill={color.inkMuted}
                fontSize="13"
                textAnchor="middle"
              >
                {v}
              </text>
            </g>
          ))}
          {[0, 4, 8, 12, 16].map((v) => (
            <g key={`yt-${v}`}>
              <line
                x1={pad.left - 6}
                y1={sy(v)}
                x2={pad.left}
                y2={sy(v)}
                stroke={color.axis}
              />
              <text
                x={pad.left - 12}
                y={sy(v) + 4}
                fill={color.inkMuted}
                fontSize="13"
                textAnchor="end"
              >
                {v}
              </text>
            </g>
          ))}

          <text
            x={pad.left + plotW / 2}
            y={sy(0) + 40}
            fill={color.inkMuted}
            fontSize="14"
            textAnchor="middle"
            fontWeight="600"
          >
            x
          </text>
          <text
            x={14}
            y={pad.top + plotH / 2}
            fill={color.inkMuted}
            fontSize="14"
            textAnchor="middle"
            fontWeight="600"
            transform={`rotate(-90, 14, ${pad.top + plotH / 2})`}
          >
            y
          </text>
        </svg>
      </PluginStage>

      <StatRow
        stats={[
          { label: "Rectangles (n)", value: String(n) },
          {
            label: "Approx. Area",
            value: area ? area.toFixed(4) : EMPTY,
            color: color.accent,
          },
          { label: "Exact Area", value: EXACT_AREA.toFixed(4) },
          {
            label: "Error",
            value: area ? Math.abs(area - EXACT_AREA).toFixed(4) : EMPTY,
          },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
