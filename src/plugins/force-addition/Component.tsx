import { observer } from "mobx-react-lite";
import { color, type } from "../../common/tokens";
import {
  EmptyState,
  PluginStage,
  PluginSurface,
} from "../../common/PluginSurface";
import instructions from "./instructions.md?raw";
import State, { ForceArrow } from "./state";

const VIEW = { width: 520, height: 400 };

// Nearest "nice" grid step (1, 2, 5, x10^n) at or below the raw value.
const niceStep = (raw: number) => {
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
};

const Component = observer(({ state }: { state: State }) => {
  const forceArrows: ForceArrow[] = state?.forceArrows ?? [];

  if (forceArrows.length === 0) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Run your code to add up the forces and draw them." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const cx = VIEW.width / 2;
  const cy = VIEW.height / 2;

  // Equal scale on both axes so vector angles stay true. Frame the view so the
  // longest arrow reaches ~85% toward the nearer edge, with a floor so a set of
  // tiny forces doesn't zoom in absurdly.
  const maxExtent = Math.max(
    10,
    ...forceArrows.map((f) => Math.max(Math.abs(f.x), Math.abs(f.y)))
  );
  const halfMin = Math.min(VIEW.width, VIEW.height) / 2;
  const scale = (halfMin * 0.85) / maxExtent;

  const px = (u: number) => cx + u * scale;
  const py = (u: number) => cy - u * scale;

  const gridUnit = niceStep(maxExtent / 4);
  const maxUnitsX = Math.floor(VIEW.width / 2 / scale / gridUnit) * gridUnit;
  const maxUnitsY = Math.floor(VIEW.height / 2 / scale / gridUnit) * gridUnit;

  const xLines: number[] = [];
  for (let u = -maxUnitsX; u <= maxUnitsX + 1e-9; u += gridUnit) xLines.push(u);
  const yLines: number[] = [];
  for (let u = -maxUnitsY; u <= maxUnitsY + 1e-9; u += gridUnit) yLines.push(u);

  // Three points of a filled arrowhead sitting at the tip of a force vector.
  const arrowPoints = (f: ForceArrow) => {
    const tipX = px(f.x);
    const tipY = py(f.y);
    const dx = tipX - cx;
    const dy = tipY - cy;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const perpX = -uy;
    const perpY = ux;
    const ah = 12; // arrowhead length
    const aw = 6; // arrowhead half-width
    const bx = tipX - ah * ux;
    const by = tipY - ah * uy;
    return `${tipX},${tipY} ${bx + aw * perpX},${by + aw * perpY} ${
      bx - aw * perpX
    },${by - aw * perpY}`;
  };

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <svg
          viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: "100%", height: "100%" }}
          role="img"
          aria-label={`Force diagram with ${forceArrows.length} vectors`}
        >
          <rect
            x={0}
            y={0}
            width={VIEW.width}
            height={VIEW.height}
            fill={color.surfaceRaised}
            stroke={color.border}
            rx={4}
          />

          {/* Grid */}
          {xLines.map((u) => (
            <line
              key={`gx-${u}`}
              x1={px(u)}
              y1={0}
              x2={px(u)}
              y2={VIEW.height}
              stroke={color.grid}
            />
          ))}
          {yLines.map((u) => (
            <line
              key={`gy-${u}`}
              x1={0}
              y1={py(u)}
              x2={VIEW.width}
              y2={py(u)}
              stroke={color.grid}
            />
          ))}

          {/* Axes */}
          <line
            x1={0}
            y1={cy}
            x2={VIEW.width}
            y2={cy}
            stroke={color.axis}
            strokeWidth={1.5}
          />
          <line
            x1={cx}
            y1={0}
            x2={cx}
            y2={VIEW.height}
            stroke={color.axis}
            strokeWidth={1.5}
          />

          {/* Tick labels (skip 0 to keep the origin clean) */}
          {xLines
            .filter((u) => Math.abs(u) > 1e-9)
            .map((u) => (
              <text
                key={`lx-${u}`}
                x={px(u)}
                y={cy + 16}
                textAnchor="middle"
                style={type.tick}
              >
                {u}
              </text>
            ))}
          {yLines
            .filter((u) => Math.abs(u) > 1e-9)
            .map((u) => (
              <text
                key={`ly-${u}`}
                x={cx - 8}
                y={py(u) + 4}
                textAnchor="end"
                style={type.tick}
              >
                {u}
              </text>
            ))}

          {/* Origin */}
          <circle cx={cx} cy={cy} r={3} fill={color.axis} />

          {/* Force vectors — the student's code decides colors, including the
              green net force from drawForce(sumForces(forces), "green"). */}
          {forceArrows.map((f, i) => (
            <g key={i}>
              <line
                x1={cx}
                y1={cy}
                x2={px(f.x)}
                y2={py(f.y)}
                stroke={f.color}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
              <polygon points={arrowPoints(f)} fill={f.color} />
            </g>
          ))}
        </svg>
      </PluginStage>
    </PluginSurface>
  );
});

export default Component;
