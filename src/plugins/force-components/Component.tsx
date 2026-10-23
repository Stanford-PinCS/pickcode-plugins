import { observer } from "mobx-react-lite";
import { color, type } from "../../common/tokens";
import {
  progressBetween,
  useRunAnimation,
} from "../../common/useRunAnimation";
import {
  EmptyState,
  PluginStage,
  PluginSurface,
} from "../../common/PluginSurface";
import instructions from "./instructions.md?raw";
import State from "./state";

const VIEW = { width: 520, height: 400 };

// Animation, in ms. Each vector grows out of the origin while it swings up
// from the +x axis to its angle, tracing the angle's arc. Then each pair of
// components is built: x along the x-axis, then y up to the vector's tip.
// Everything is sped up together if it would run past MAX_TOTAL_MS.
const VECTOR_MS = 1200;
const COMPONENT_MS = 800;
const PAUSE_MS = 250;
const MAX_TOTAL_MS = 5000;
const ANGLE_ARC_R = 30;

// Nearest "nice" grid step (1, 2, 5, x10^n) at or below the raw value.
const niceStep = (raw: number) => {
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
};

const Component = observer(({ state }: { state: State }) => {
  const vectors = state?.vectors ?? [];
  const components = state?.components ?? [];

  const naturalMs =
    vectors.length * VECTOR_MS +
    (vectors.length && components.length ? PAUSE_MS : 0) +
    components.length * 2 * COMPONENT_MS;
  const speed = Math.min(1, MAX_TOTAL_MS / Math.max(naturalMs, 1));
  const vectorMs = VECTOR_MS * speed;
  const componentMs = COMPONENT_MS * speed;
  const componentsStart =
    vectors.length * vectorMs + (vectors.length ? PAUSE_MS * speed : 0);
  const elapsed = useRunAnimation(
    vectors.length + components.length > 0 ? state : null,
    naturalMs * speed
  );

  if (vectors.length === 0 && components.length === 0) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Run your code to draw a vector and its components." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const cx = VIEW.width / 2;
  const cy = VIEW.height / 2;

  // magnitude/angle (degrees, CCW from +x) -> math-coord tip.
  const tipOf = (magnitude: number, degrees: number) => {
    const rad = (degrees * Math.PI) / 180;
    return { x: magnitude * Math.cos(rad), y: magnitude * Math.sin(rad) };
  };
  const vectorTips = vectors.map((v) => tipOf(v.magnitude, v.angle));

  // This frame's vectors: grown and swung `p` of the way.
  const shownVectors = vectors.map((v, i) => {
    const p = progressBetween(elapsed, i * vectorMs, vectorMs);
    return { p, angle: v.angle * p, tip: tipOf(v.magnitude * p, v.angle * p) };
  });
  // This frame's components: x grows first, then y.
  const shownComponents = components.map((c, i) => {
    const start = componentsStart + i * 2 * componentMs;
    return {
      x: c.xComponent * progressBetween(elapsed, start, componentMs),
      y: c.yComponent * progressBetween(elapsed, start + componentMs, componentMs),
      yStarted: elapsed > start + componentMs,
    };
  });

  // Frame the view so the largest feature reaches ~85% toward the nearer edge,
  // with a floor so tiny vectors don't zoom in absurdly. Equal x/y scale keeps
  // angles true.
  const extents = [10];
  vectorTips.forEach((p) => extents.push(Math.abs(p.x), Math.abs(p.y)));
  components.forEach((c) =>
    extents.push(Math.abs(c.xComponent), Math.abs(c.yComponent))
  );
  const maxExtent = Math.max(...extents);

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

  // Vector + its two components. These come from the shared qualitative palette;
  // the fallbacks keep it from breaking if color.series has fewer than 3 entries.
  const vectorColor = color.series[0];
  const xColor = color.series[1] ?? color.series[0];
  const yColor = color.series[2] ?? color.series[0];

  // Filled arrowhead at (x2,y2) pointing along the segment.
  const arrowHead = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const perpX = -uy;
    const perpY = ux;
    const ah = 11; // head length
    const aw = 5.5; // head half-width
    const bx = x2 - ah * ux;
    const by = y2 - ah * uy;
    return `${x2},${y2} ${bx + aw * perpX},${by + aw * perpY} ${
      bx - aw * perpX
    },${by - aw * perpY}`;
  };

  // The arc from the +x axis round to `degrees`, at ANGLE_ARC_R from the origin.
  const angleArc = (degrees: number) => {
    const clamped = Math.max(-359.9, Math.min(359.9, degrees));
    const rad = (clamped * Math.PI) / 180;
    const ex = cx + ANGLE_ARC_R * Math.cos(rad);
    const ey = cy - ANGLE_ARC_R * Math.sin(rad);
    const large = Math.abs(clamped) > 180 ? 1 : 0;
    // Screen y points down, so counterclockwise in math is sweep-flag 0.
    const sweep = clamped >= 0 ? 0 : 1;
    return `M ${cx + ANGLE_ARC_R} ${cy} A ${ANGLE_ARC_R} ${ANGLE_ARC_R} 0 ${large} ${sweep} ${ex} ${ey}`;
  };

  const legend: { label: string; color: string }[] = [];
  if (vectors.length) legend.push({ label: "Vector", color: vectorColor });
  if (components.length) {
    legend.push({ label: "x-component", color: xColor });
    legend.push({ label: "y-component", color: yColor });
  }

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <svg
          viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: "100%", height: "100%" }}
          role="img"
          aria-label={`Vector diagram with ${vectors.length} vectors and ${components.length} component pairs`}
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

          {/* Tick labels (skip 0 at the origin) */}
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

          {/* Components underneath (vector drawn on top) */}
          {shownComponents.map((c, i) => {
            const cornerX = px(c.x);
            const cornerY = py(0);
            const tipX = px(c.x);
            const tipY = py(c.y);
            return (
              <g key={`comp-${i}`}>
                {Math.abs(c.x) > 1e-9 && (
                  <>
                    <line
                      x1={cx}
                      y1={cy}
                      x2={cornerX}
                      y2={cornerY}
                      stroke={xColor}
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                    <polygon
                      points={arrowHead(cx, cy, cornerX, cornerY)}
                      fill={xColor}
                    />
                  </>
                )}
                {c.yStarted && Math.abs(c.y) > 1e-9 && (
                  <>
                    <line
                      x1={cornerX}
                      y1={cornerY}
                      x2={tipX}
                      y2={tipY}
                      stroke={yColor}
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                    <polygon
                      points={arrowHead(cornerX, cornerY, tipX, tipY)}
                      fill={yColor}
                    />
                  </>
                )}
              </g>
            );
          })}

          {/* Vectors */}
          {shownVectors.map(({ p, angle, tip }, i) =>
            p <= 0 ? null : (
              <g key={`vec-${i}`}>
                {Math.abs(angle) > 0.5 && (
                  <path
                    d={angleArc(angle)}
                    fill="none"
                    stroke={vectorColor}
                    strokeWidth={1.5}
                    opacity={0.6}
                  />
                )}
                <line
                  x1={cx}
                  y1={cy}
                  x2={px(tip.x)}
                  y2={py(tip.y)}
                  stroke={vectorColor}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
                <polygon
                  points={arrowHead(cx, cy, px(tip.x), py(tip.y))}
                  fill={vectorColor}
                />
              </g>
            )
          )}

          {/* Legend */}
          {legend.map((entry, i) => {
            const ly = 18 + i * 16;
            return (
              <g key={`leg-${i}`}>
                <line
                  x1={14}
                  y1={ly}
                  x2={30}
                  y2={ly}
                  stroke={entry.color}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
                <text x={36} y={ly + 4} style={type.tick}>
                  {entry.label}
                </text>
              </g>
            );
          })}
        </svg>
      </PluginStage>
    </PluginSurface>
  );
});

export default Component;
