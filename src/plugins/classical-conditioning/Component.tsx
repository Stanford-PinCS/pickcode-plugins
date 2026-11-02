import { observer } from "mobx-react-lite";
import { useId } from "react";
import { PAD, VIEW, makeScales, ticks } from "../../common/chart";
import {
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import { progressBetween, useRunAnimation } from "../../common/useRunAnimation";
import { color, font, type } from "../../common/tokens";
import instructions from "./instructions.md?raw";
import State from "./state";

// One trial plays at a time. A short run plays slowly enough to follow each
// bell; a long run speeds up so the whole replay stays under ~10 seconds.
const RUN_MS = 9000;
const MAX_TRIAL_MS = 1100;
const MIN_TRIAL_MS = 110;
const MAX_STRENGTH = 100;

// Within one trial (0 to 1): the bell rings, the dog drools at the bell, then
// food arrives if this is a paired trial.
const BELL = { start: 0, length: 0.45 };
const DROOL = { start: 0.2, length: 0.45 };
const FOOD = { start: 0.5, length: 0.3 };

const panelStyle = { minWidth: 0, minHeight: 0, overflow: "hidden" } as const;

const LearningCurve = ({
  strengths,
  foodPresent,
  shown,
  current,
}: {
  strengths: number[];
  foodPresent: boolean[];
  /** How many trials have a point on the curve so far. */
  shown: number;
  /** The trial playing now, 1-based. */
  current: number;
}) => {
  const clipId = `cc-plot-${useId().replace(/:/g, "")}`;
  const n = strengths.length;
  const xMax = Math.max(n, 5);
  const s = makeScales(xMax, MAX_STRENGTH);
  const numPaired = foodPresent.filter(Boolean).length;
  const hasBellOnly = numPaired < n;

  // Trial 0 is the start: no link between bell and food yet.
  const points = [{ trial: 0, value: 0, food: true }].concat(
    strengths
      .slice(0, shown)
      .map((value, i) => ({ trial: i + 1, value, food: foodPresent[i] }))
  );
  const line = points
    .map((p) => `${s.sx(p.trial).toFixed(1)},${s.sy(p.value).toFixed(1)}`)
    .join(" ");
  const bandX = s.sx(numPaired + 0.5);

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
      role="img"
      aria-label={`Learning curve: response strength after ${shown} of ${n} trials, now ${(
        points[points.length - 1].value
      ).toFixed(1)} out of 100`}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={PAD.left} y={PAD.top - 8} width={s.plotWidth + 8} height={s.plotHeight + 16} />
        </clipPath>
      </defs>

      <rect
        x={PAD.left}
        y={PAD.top}
        width={s.plotWidth}
        height={s.plotHeight}
        fill={color.surfaceRaised}
        stroke={color.border}
        rx={4}
      />

      {/* Bell-only trials sit in a shaded band, so extinction reads as its own phase. */}
      {hasBellOnly && (
        <rect
          x={bandX}
          y={PAD.top}
          width={PAD.left + s.plotWidth - bandX}
          height={s.plotHeight}
          fill={color.grid}
        />
      )}

      {ticks(MAX_STRENGTH, 4).map((v) => (
        <line
          key={`grid-${v}`}
          x1={PAD.left}
          y1={s.sy(v)}
          x2={PAD.left + s.plotWidth}
          y2={s.sy(v)}
          stroke={color.grid}
        />
      ))}

      {hasBellOnly && (
        <>
          <text x={PAD.left + 4} y={PAD.top - 6} style={type.tick}>
            Bell + food
          </text>
          <text x={bandX + 4} y={PAD.top - 6} style={type.tick}>
            Bell only
          </text>
        </>
      )}

      {/* The most the dog can learn: the dashed reference line. */}
      <line
        x1={PAD.left}
        y1={s.sy(MAX_STRENGTH)}
        x2={PAD.left + s.plotWidth}
        y2={s.sy(MAX_STRENGTH)}
        stroke={color.reference}
        strokeWidth={2}
        strokeDasharray="8 5"
      />
      <text
        x={PAD.left + s.plotWidth - 6}
        y={s.sy(MAX_STRENGTH) + 16}
        textAnchor="end"
        style={{ ...type.tick, fill: color.reference }}
      >
        Max 100
      </text>

      {/* Current trial marker. */}
      {current > 0 && (
        <line
          x1={s.sx(current)}
          y1={PAD.top}
          x2={s.sx(current)}
          y2={s.sy(0)}
          stroke={color.inkMuted}
          strokeWidth={1.5}
          strokeDasharray="3 4"
        />
      )}

      <g clipPath={`url(#${clipId})`}>
        {points.length > 1 && (
          <polyline
            points={line}
            fill="none"
            stroke={color.series[0]}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {points.map((p) => (
          <circle
            key={p.trial}
            cx={s.sx(p.trial)}
            cy={s.sy(p.value)}
            r={p.trial === current && p.trial > 0 ? 6 : 4}
            fill={p.food ? color.series[0] : color.surfaceRaised}
            stroke={p.trial === current && p.trial > 0 ? color.ink : color.series[0]}
            strokeWidth={p.food ? 1.5 : 2}
          />
        ))}
      </g>

      <line x1={PAD.left} y1={s.sy(0)} x2={PAD.left + s.plotWidth} y2={s.sy(0)} stroke={color.axis} />
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={s.sy(0)} stroke={color.axis} />

      {ticks(xMax).map((v) => (
        <text key={`xt-${v}`} x={s.sx(v)} y={s.sy(0) + 20} textAnchor="middle" style={type.tick}>
          {v}
        </text>
      ))}
      {ticks(MAX_STRENGTH, 4).map((v) => (
        <text key={`yt-${v}`} x={PAD.left - 8} y={s.sy(v) + 4} textAnchor="end" style={type.tick}>
          {v}
        </text>
      ))}

      <text x={PAD.left + s.plotWidth / 2} y={VIEW.height - 8} textAnchor="middle" style={type.axisTitle}>
        Trial
      </text>
      <text
        x={14}
        y={PAD.top + s.plotHeight / 2}
        textAnchor="middle"
        transform={`rotate(-90, 14, ${PAD.top + s.plotHeight / 2})`}
        style={type.axisTitle}
      >
        Response Strength
      </text>
    </svg>
  );
};

// Scene layout, in the shared VIEW so both panels scale the same way.
const FLOOR_Y = 318;
const MOUTH = { x: 336, y: 206 };
const BELL_AT = { x: 418, y: 78 };
const BOWL_X = 420;
const TUBE = { x: 478, top: 132, width: 22 };
const TUBE_HEIGHT = FLOOR_Y - TUBE.top;
const DROPS = 4;
const KIBBLE = [-22, -11, 0, 11, 22];

const DogScene = ({
  trial,
  total,
  food,
  phase,
  drool,
}: {
  trial: number;
  total: number;
  food: boolean;
  /** Progress through the current trial, 0 to 1. */
  phase: number;
  /** The tube level shown now, 0 to 100. */
  drool: number;
}) => {
  const bellP = progressBetween(phase, BELL.start, BELL.length);
  const ringing = bellP > 0 && bellP < 1;
  const swing = ringing ? 16 * Math.sin(bellP * Math.PI * 8) * (1 - bellP) : 0;
  const foodP = food ? progressBetween(phase, FOOD.start, FOOD.length) : 0;
  const droolP = progressBetween(phase, DROOL.start, DROOL.length);
  const dropCount = Math.round((drool / MAX_STRENGTH) * DROPS);

  const line = { stroke: color.ink, strokeWidth: 2, strokeLinejoin: "round" as const };
  const fill = color.surfaceRaised;

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
      role="img"
      aria-label={`Trial ${trial} of ${total}: the bell rings${
        food ? " and food follows" : " with no food"
      }. The dog drools ${drool.toFixed(0)} out of 100 at the bell.`}
    >
      <rect
        x={PAD.left}
        y={PAD.top}
        width={VIEW.width - PAD.left - PAD.right}
        height={VIEW.height - PAD.top - PAD.bottom}
        fill={color.surfaceRaised}
        stroke={color.border}
        rx={4}
      />

      {/* Current step: which trial the loop is on. */}
      <text x={PAD.left + 12} y={PAD.top + 24} style={{ ...type.axisTitle, fill: color.ink }}>
        Trial{" "}
        <tspan style={{ fontFamily: font.data, fontVariantNumeric: "tabular-nums" }}>
          {trial} of {total}
        </tspan>
      </text>
      <text x={PAD.left + 12} y={PAD.top + 42} style={type.tick}>
        {food ? "Bell + food" : "Bell only"}
      </text>

      <line x1={PAD.left} y1={FLOOR_Y} x2={VIEW.width - PAD.right} y2={FLOOR_Y} stroke={color.border} strokeWidth={2} />

      {/* Bell on its bracket. It swings while it rings. */}
      <line x1={BELL_AT.x} y1={PAD.top} x2={BELL_AT.x} y2={BELL_AT.y - 22} stroke={color.inkMuted} strokeWidth={2} />
      <g transform={`translate(${BELL_AT.x}, ${BELL_AT.y}) rotate(${swing.toFixed(1)}, 0, -22)`}>
        <path d="M -20 16 Q -20 -20 0 -22 Q 20 -20 20 16 Z" fill={color.series[3]} {...line} />
        <rect x={-24} y={14} width={48} height={6} rx={3} fill={color.series[3]} {...line} />
        <circle cx={0} cy={25} r={5} fill={color.series[3]} {...line} />
      </g>
      {ringing &&
        [30, 42].map((r) => (
          <g key={r} stroke={color.series[3]} strokeWidth={2} fill="none" opacity={1 - bellP}>
            <path d={`M ${BELL_AT.x - r} ${BELL_AT.y - 12} q -8 12 0 24`} />
            <path d={`M ${BELL_AT.x + r} ${BELL_AT.y - 12} q 8 12 0 24`} />
          </g>
        ))}

      {/* Dog, sitting and facing the bowl. */}
      <path d="M 128 262 Q 92 246 100 212" fill="none" {...line} strokeLinecap="round" />
      <ellipse cx={162} cy={286} rx={42} ry={32} fill={fill} {...line} />
      <ellipse cx={205} cy={258} rx={74} ry={50} fill={fill} {...line} />
      <rect x={240} y={262} width={16} height={56} rx={6} fill={fill} {...line} />
      <rect x={262} y={262} width={16} height={56} rx={6} fill={fill} {...line} />
      <ellipse cx={262} cy={222} rx={22} ry={36} transform="rotate(35, 262, 222)" fill={fill} {...line} />
      <circle cx={288} cy={178} r={40} fill={fill} {...line} />
      <ellipse cx={322} cy={194} rx={30} ry={17} fill={fill} {...line} />
      <ellipse
        cx={264}
        cy={176}
        rx={13}
        ry={27}
        transform="rotate(18, 264, 176)"
        fill={color.border}
        {...line}
      />
      <circle cx={296} cy={166} r={4.5} fill={color.ink} />
      <circle cx={350} cy={187} r={6} fill={color.ink} />
      <path d="M 322 206 Q 330 212 340 205" fill="none" {...line} strokeLinecap="round" />

      {/* Drool at the bell: more drops for a stronger response. */}
      {droolP > 0 &&
        Array.from({ length: dropCount }, (_, i) => {
          const start = i / (DROPS + 1);
          const p = progressBetween(droolP, start, 0.55);
          if (p <= 0 || p >= 1) return null;
          const y = MOUTH.y + 6 + p * (FLOOR_Y - MOUTH.y - 12);
          return (
            <path
              key={i}
              d={`M ${MOUTH.x} ${y - 7} Q ${MOUTH.x + 5} ${y} ${MOUTH.x} ${y + 3} Q ${MOUTH.x - 5} ${y} ${MOUTH.x} ${y - 7} Z`}
              fill={color.series[1]}
            />
          );
        })}

      {/* Food bowl. Kibble drops in on paired trials. */}
      {foodP > 0 &&
        KIBBLE.map((dx, i) => {
          const p = progressBetween(foodP, i * 0.08, 0.6);
          if (p <= 0) return null;
          const y = 220 + p * (FLOOR_Y - 26 - 220);
          return <circle key={dx} cx={BOWL_X + dx} cy={y} r={6} fill={color.series[2]} stroke={color.ink} strokeWidth={1} />;
        })}
      <path
        d={`M ${BOWL_X - 40} ${FLOOR_Y - 22} L ${BOWL_X + 40} ${FLOOR_Y - 22} L ${BOWL_X + 30} ${FLOOR_Y} L ${BOWL_X - 30} ${FLOOR_Y} Z`}
        fill={fill}
        {...line}
      />

      {/* Drool tube: how strongly the dog responds to the bell on this trial. */}
      <rect
        x={TUBE.x}
        y={TUBE.top + TUBE_HEIGHT * (1 - drool / MAX_STRENGTH)}
        width={TUBE.width}
        height={(TUBE_HEIGHT * drool) / MAX_STRENGTH}
        fill={color.series[1]}
      />
      <rect x={TUBE.x} y={TUBE.top} width={TUBE.width} height={TUBE_HEIGHT} rx={4} fill="none" {...line} />
      {[0, 50, 100].map((v) => (
        <text
          key={v}
          x={TUBE.x - 6}
          y={TUBE.top + TUBE_HEIGHT * (1 - v / MAX_STRENGTH) + 4}
          textAnchor="end"
          style={type.tick}
        >
          {v}
        </text>
      ))}

      <text x={VIEW.width / 2} y={VIEW.height - 8} textAnchor="middle" style={type.tick}>
        <tspan fill={color.series[3]}>●</tspan>
        <tspan> Bell</tspan>
        <tspan dx={14} fill={color.series[2]}>●</tspan>
        <tspan> Food</tspan>
        <tspan dx={14} fill={color.series[1]}>●</tspan>
        <tspan> Drool at the bell</tspan>
      </text>
    </svg>
  );
};

const Component = observer(({ state }: { state: State }) => {
  const strengths = state.strengths ?? [];
  const foodPresent = state.foodPresent ?? [];
  const n = strengths.length;

  const trialMs = Math.min(MAX_TRIAL_MS, Math.max(MIN_TRIAL_MS, RUN_MS / Math.max(n, 1)));
  const duration = trialMs * n;
  const elapsed = useRunAnimation(n > 0 ? strengths : null, duration);

  if (n === 0) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Press Run to ring the bell and watch the dog learn, one trial at a time." />
        </PluginStage>
      </PluginSurface>
    );
  }

  // Which trial is playing, and how far into it.
  const finished = elapsed >= duration;
  const index = finished ? n - 1 : Math.min(n - 1, Math.floor(elapsed / trialMs));
  const phase = finished ? 1 : elapsed / trialMs - index;
  const trial = index + 1;
  const food = foodPresent[index] ?? true;

  // The tube moves from the last trial's strength to this one's while the dog
  // drools; the curve gets this trial's point once the drool has settled.
  const before = index > 0 ? strengths[index - 1] : 0;
  const after = strengths[index];
  const droolP = progressBetween(phase, DROOL.start, DROOL.length);
  const drool = before + (after - before) * droolP;
  const shown = droolP >= 1 ? trial : trial - 1;
  const shownStrength = shown > 0 ? strengths[shown - 1] : 0;

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <div
          style={{
            width: "100%",
            height: "100%",
            minHeight: 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))",
            gridAutoRows: "minmax(0, 1fr)",
            gap: 12,
            overflow: "hidden",
          }}
        >
          <div style={panelStyle}>
            <LearningCurve strengths={strengths} foodPresent={foodPresent} shown={shown} current={trial} />
          </div>
          <div style={panelStyle}>
            <DogScene trial={trial} total={n} food={food} phase={phase} drool={drool} />
          </div>
        </div>
      </PluginStage>

      <StatRow
        stats={[
          { label: "Trial", value: `${trial} / ${n}` },
          { label: "Phase", value: food ? "Acquisition" : "Extinction" },
          { label: "Strength", value: shownStrength.toFixed(1), color: color.series[0] },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
