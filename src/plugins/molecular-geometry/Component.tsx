import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { VIEW } from "../../common/chart";
import {
  EMPTY,
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import {
  easeInOut,
  progressBetween,
  useRunAnimation,
} from "../../common/useRunAnimation";
import { color, font, type } from "../../common/tokens";
import instructions from "./instructions.md?raw";
import State, { Vec3, judgeShape, settledDirections } from "./state";

// The domains spring apart over SETTLE_MS, then getShape's answer appears.
const SETTLE_MS = 3200;
const LABEL_MS = 400;

const CENTER = { x: VIEW.width / 2, y: 196 };
const BOND_LENGTH = 118;
const LONE_PAIR_LENGTH = 80;
const ATOM_RADIUS = 17;
const CENTRAL_RADIUS = 22;

// View: turn about the vertical axis while settling, tilted slightly toward
// the viewer so the 3D arrangement reads on a flat screen.
const TURN_START = -28;
// Extra turn for shapes that read better from another side (water-like
// molecules: show both the bonds and the lone pairs at an angle).
const turnOffset = (bondingPairs: number, lonePairs: number) =>
  bondingPairs === 2 && lonePairs === 2 ? 18 : 0;
const TURN_SWEEP = 40;
const TILT = 22;

// The domains start bunched together near this direction, then repel apart.
const BUNCH_TOWARD: Vec3 = normalize([0.35, 0.5, 0.8]);

function normalize(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Great-circle interpolation; t above 1 overshoots a little past b. */
function slerp(a: Vec3, b: Vec3, t: number): Vec3 {
  const omega = Math.acos(Math.min(1, Math.max(-1, dot(a, b))));
  if (omega < 1e-4) return b;
  const sa = Math.sin((1 - t) * omega) / Math.sin(omega);
  const sb = Math.sin(t * omega) / Math.sin(omega);
  return normalize([
    a[0] * sa + b[0] * sb,
    a[1] * sa + b[1] * sb,
    a[2] * sa + b[2] * sb,
  ]);
}

/** Damped spring: quick spread, a small overshoot, then rest at 1. */
const settle = (p: number) =>
  p >= 1 ? 1 : 1 - Math.exp(-3.5 * p) * Math.cos(5 * p) * (1 - p);

/** Rotate into view space. Returns screen x/y (y down) and depth z (toward viewer). */
function project(v: Vec3, turnDeg: number) {
  const a = (turnDeg * Math.PI) / 180;
  const t = (TILT * Math.PI) / 180;
  const x1 = v[0] * Math.cos(a) + v[2] * Math.sin(a);
  const z1 = -v[0] * Math.sin(a) + v[2] * Math.cos(a);
  const y2 = v[1] * Math.cos(t) - z1 * Math.sin(t);
  const z2 = v[1] * Math.sin(t) + z1 * Math.cos(t);
  return { x: x1, y: -y2, z: z2 };
}

const angleBetween = (a: Vec3, b: Vec3) =>
  (Math.acos(Math.min(1, Math.max(-1, dot(a, b)))) * 180) / Math.PI;

const Component = observer(({ state }: { state: State }) => {
  const { bondingPairs, lonePairs, shape } = state;

  const directions = useMemo(
    () => (shape === null ? [] : settledDirections(bondingPairs, lonePairs)),
    [shape, bondingPairs, lonePairs]
  );
  const starts = useMemo(
    () =>
      directions.map((d) =>
        normalize([
          d[0] * 0.22 + BUNCH_TOWARD[0],
          d[1] * 0.22 + BUNCH_TOWARD[1],
          d[2] * 0.22 + BUNCH_TOWARD[2],
        ])
      ),
    [directions]
  );

  const elapsed = useRunAnimation(
    shape === null ? null : state,
    SETTLE_MS + LABEL_MS
  );

  if (shape === null) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Press Run to build a molecule and watch its electron domains push apart." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const p = progressBetween(elapsed, 0, SETTLE_MS);
  const settled = p >= 1;
  const labelIn = progressBetween(elapsed, SETTLE_MS, LABEL_MS);
  const turn =
    TURN_START + turnOffset(bondingPairs, lonePairs) + TURN_SWEEP * easeInOut(p);
  const now = directions.map((d, i) => slerp(starts[i], d, settle(p)));

  // Smallest angle between two bonds, measured from where the domains are now.
  const bonds = now.slice(lonePairs);
  let bondAngle = 180;
  for (let i = 0; i < bonds.length; i++) {
    for (let j = i + 1; j < bonds.length; j++) {
      bondAngle = Math.min(bondAngle, angleBetween(bonds[i], bonds[j]));
    }
  }

  const verdict = judgeShape(shape, bondingPairs, lonePairs);
  const domains = bondingPairs + lonePairs;

  // Draw far things first so near ones overlap them.
  const items = now
    .map((d, i) => ({ ...project(d, turn), lone: i < lonePairs, i }))
    .sort((a, b) => a.z - b.z);
  const depthScale = (z: number) => 1 + 0.16 * z;

  const renderItem = (it: (typeof items)[number]) => {
    const s = depthScale(it.z);
    if (it.lone) {
      // A lone pair: a lobe pointing out from the central atom, with its two electrons.
      const len2d = Math.hypot(it.x, it.y);
      const ux = len2d > 1e-3 ? it.x / len2d : 1;
      const uy = len2d > 1e-3 ? it.y / len2d : 0;
      // The lobe starts at the central atom's edge and is foreshortened
      // when it points toward or away from the viewer.
      const inner = CENTRAL_RADIUS - 4;
      const reach = LONE_PAIR_LENGTH * Math.max(len2d, 0.45);
      const mid = inner + reach / 2;
      const cx = CENTER.x + ux * mid;
      const cy = CENTER.y + uy * mid;
      const angle = (Math.atan2(uy, ux) * 180) / Math.PI;
      const ex = CENTER.x + ux * (inner + reach * 0.62);
      const ey = CENTER.y + uy * (inner + reach * 0.62);
      return (
        <g key={`d-${it.i}`}>
          <ellipse
            cx={cx}
            cy={cy}
            rx={Math.max(reach / 2, 15 * s)}
            ry={15 * s}
            transform={`rotate(${angle}, ${cx}, ${cy})`}
            fill={color.surfaceRaised}
            stroke={color.series[3]}
            strokeWidth={1.8}
          />
          {[-1, 1].map((side) => (
            <circle
              key={side}
              cx={ex - uy * side * 5 * s}
              cy={ey + ux * side * 5 * s}
              r={3 * s}
              fill={color.series[3]}
            />
          ))}
        </g>
      );
    }
    const ax = CENTER.x + it.x * BOND_LENGTH;
    const ay = CENTER.y + it.y * BOND_LENGTH;
    return (
      <g key={`d-${it.i}`}>
        <line
          x1={CENTER.x}
          y1={CENTER.y}
          x2={ax}
          y2={ay}
          stroke={color.inkMuted}
          strokeWidth={5 * s}
          strokeLinecap="round"
        />
        <circle
          cx={ax}
          cy={ay}
          r={ATOM_RADIUS * s}
          fill={color.series[1]}
          stroke={color.surface}
          strokeWidth={2}
        />
      </g>
    );
  };

  const verdictText =
    verdict === "match"
      ? `matches ${domains} domains with ${lonePairs} lone pair${lonePairs === 1 ? "" : "s"}`
      : verdict === "unknown"
      ? "getShape doesn't know this shape yet"
      : "doesn't match how the domains settled";
  const verdictColor =
    verdict === "match"
      ? color.series[1]
      : verdict === "unknown"
      ? color.inkMuted
      : color.reference;

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <svg
          viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: "100%", height: "100%" }}
          role="img"
          aria-label={`Central atom with ${bondingPairs} bonded atoms and ${lonePairs} lone pairs, smallest bond angle ${bondAngle.toFixed(1)} degrees. getShape returned ${shape}.`}
        >
          <rect
            x={8}
            y={4}
            width={VIEW.width - 16}
            height={VIEW.height - 30}
            fill={color.surfaceRaised}
            stroke={color.border}
            rx={4}
          />

          {/* What the code did: the call, then (once settled) its answer */}
          <text
            x={CENTER.x}
            y={30}
            textAnchor="middle"
            style={{
              fontFamily: font.data,
              fontSize: 14,
              fontWeight: 600,
              fill: color.ink,
            }}
          >
            {`getShape(${bondingPairs}, ${lonePairs})`}
            <tspan fill={color.inkMuted}>
              {settled ? " returned " : " ..."}
            </tspan>
            {settled && (
              <tspan
                fill={verdict === "unknown" ? color.inkMuted : color.series[0]}
                opacity={labelIn}
              >
                {`"${shape}"`}
              </tspan>
            )}
          </text>
          <text
            x={CENTER.x}
            y={50}
            textAnchor="middle"
            style={{ ...type.axisTitle, fill: settled ? verdictColor : color.inkMuted }}
            opacity={settled ? labelIn : 1}
          >
            {settled ? verdictText : "electron domains pushing apart"}
          </text>

          {items.filter((it) => it.z < 0).map(renderItem)}
          <circle
            cx={CENTER.x}
            cy={CENTER.y}
            r={CENTRAL_RADIUS}
            fill={color.ink}
            stroke={color.surface}
            strokeWidth={2}
          />
          {items.filter((it) => it.z >= 0).map(renderItem)}

          {/* Legend */}
          <text
            x={CENTER.x}
            y={VIEW.height - 8}
            textAnchor="middle"
            style={type.tick}
          >
            <tspan fill={color.ink}>●</tspan>
            <tspan> central atom</tspan>
            <tspan dx={14} fill={color.series[1]}>
              ●
            </tspan>
            <tspan> bonded atom</tspan>
            <tspan dx={14} fill={color.series[3]}>
              ●
            </tspan>
            <tspan> lone pair</tspan>
          </text>
        </svg>
      </PluginStage>

      <StatRow
        stats={[
          { label: "Domains", value: String(domains) },
          { label: "Lone Pairs", value: String(lonePairs), color: color.series[3] },
          {
            label: "Shape",
            value: settled ? shape : EMPTY,
            color: color.series[0],
          },
          { label: "Bond Angle", value: `${bondAngle.toFixed(1)}°` },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
