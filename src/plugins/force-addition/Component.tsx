import { observer } from "mobx-react-lite";
import { color, type } from "../../common/tokens";
import {
  easeInOut,
  progressBetween,
  useRunAnimation,
} from "../../common/useRunAnimation";
import {
  EmptyState,
  PluginStage,
  PluginSurface,
} from "../../common/PluginSurface";
import instructions from "./instructions.md?raw";
import State, { ForceArrow } from "./state";

const VIEW = { width: 520, height: 400 };

// Animation, in ms. The forces grow out of the origin one at a time (sharing
// at most FORCES_MS between them). When the last arrow is the net force,
// copies of the others then slide tip to tail, and the net force grows from
// the origin to the end of that chain.
const FORCE_GROW_MS = 600;
const FORCES_MS = 2400;
const PAUSE_MS = 300;
const CHAIN_MS = 1000;
const NET_GROW_MS = 800;
// Opacity of the tip-to-tail copies, so they read as a construction.
const CHAIN_OPACITY = 0.45;

type Vec = { x: number; y: number };

/** One arrow to draw this frame, in chart units. */
type DrawnArrow = { from: Vec; to: Vec; color: string; opacity: number };

// Nearest "nice" grid step (1, 2, 5, x10^n) at or below the raw value.
const niceStep = (raw: number) => {
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
};

const Component = observer(({ state }: { state: State }) => {
  const forceArrows: ForceArrow[] = state?.forceArrows ?? [];

  // The last arrow is taken as the net force when it is the only one in its
  // color, as in drawForce(sumForces(forces), "green") after black forces.
  const last = forceArrows[forceArrows.length - 1];
  const hasNet =
    forceArrows.length >= 2 &&
    forceArrows.slice(0, -1).every((f) => f.color !== last.color);
  const forces = hasNet ? forceArrows.slice(0, -1) : forceArrows;

  const growMs = Math.min(FORCE_GROW_MS, FORCES_MS / Math.max(forces.length, 1));
  const chainStart = forces.length * growMs + PAUSE_MS;
  const netStart = chainStart + CHAIN_MS + PAUSE_MS;
  const totalMs = hasNet ? netStart + NET_GROW_MS : forces.length * growMs;
  const elapsed = useRunAnimation(
    forceArrows.length > 0 ? state : null,
    totalMs
  );

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
  // Where each force's tail sits in the tip-to-tail chain.
  const chainTails: Vec[] = [];
  let sum: Vec = { x: 0, y: 0 };
  for (const f of forces) {
    chainTails.push(sum);
    sum = { x: sum.x + f.x, y: sum.y + f.y };
  }
  const maxExtent = Math.max(
    10,
    ...forceArrows.map((f) => Math.max(Math.abs(f.x), Math.abs(f.y))),
    // The chain has to fit too.
    ...(hasNet ? chainTails.map((t) => Math.max(Math.abs(t.x), Math.abs(t.y))) : []),
    ...(hasNet ? [Math.abs(sum.x), Math.abs(sum.y)] : [])
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

  const drawn: DrawnArrow[] = [];
  const origin = { x: 0, y: 0 };
  forces.forEach((f, i) => {
    const p = progressBetween(elapsed, i * growMs, growMs);
    if (p > 0) {
      drawn.push({ from: origin, to: { x: f.x * p, y: f.y * p }, color: f.color, opacity: 1 });
    }
  });
  if (hasNet) {
    const slide = easeInOut(progressBetween(elapsed, chainStart, CHAIN_MS));
    if (elapsed >= chainStart) {
      forces.forEach((f, i) => {
        const tail = { x: chainTails[i].x * slide, y: chainTails[i].y * slide };
        drawn.push({
          from: tail,
          to: { x: tail.x + f.x, y: tail.y + f.y },
          color: f.color,
          opacity: CHAIN_OPACITY,
        });
      });
    }
    const p = progressBetween(elapsed, netStart, NET_GROW_MS);
    if (p > 0) {
      drawn.push({ from: origin, to: { x: last.x * p, y: last.y * p }, color: last.color, opacity: 1 });
    }
  }

  // Three points of a filled arrowhead sitting at the tip of a vector.
  const arrowPoints = (a: DrawnArrow) => {
    const tipX = px(a.to.x);
    const tipY = py(a.to.y);
    const dx = tipX - px(a.from.x);
    const dy = tipY - py(a.from.y);
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
          {drawn.map((a, i) => (
            <g key={i} opacity={a.opacity}>
              <line
                x1={px(a.from.x)}
                y1={py(a.from.y)}
                x2={px(a.to.x)}
                y2={py(a.to.y)}
                stroke={a.color}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
              <polygon points={arrowPoints(a)} fill={a.color} />
            </g>
          ))}
        </svg>
      </PluginStage>
    </PluginSurface>
  );
});

export default Component;
