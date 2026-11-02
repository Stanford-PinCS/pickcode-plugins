import { observer } from "mobx-react-lite";
import { useId } from "react";
import { PAD, VIEW, makeScales, niceStep, ticks } from "../../common/chart";
import {
  EMPTY,
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import { useRunAnimation } from "../../common/useRunAnimation";
import { color, font, type } from "../../common/tokens";
import instructions from "./instructions.md?raw";
import State, { type Session } from "./state";

// Real milliseconds per simulated second: a 100-second session replays in 14 s.
const MS_PER_SECOND = 140;
// How long (simulated seconds) the lever stays down, a pellet falls, and the
// rat eats it.
const LEVER_DOWN_S = 0.35;
const PELLET_FALL_S = 0.6;
const PELLET_EAT_S = 1;

const panelStyle = { minWidth: 0, minHeight: 0, overflow: "hidden" } as const;

/** How many presses happened at or before time t. */
function pressesBy(times: number[], t: number): number {
  let lo = 0;
  let hi = times.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (times[mid] <= t) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

const CumulativeRecord = ({ session, now }: { session: Session; now: number }) => {
  const clipId = `rs-plot-${useId().replace(/:/g, "")}`;
  const { pressTimes, rewarded, foodOffAt, endAt } = session;
  const total = pressTimes.length;
  const step = niceStep(Math.max(total, 20), 4);
  const yMax = Math.ceil(Math.max(total, 20) / step) * step;
  const s = makeScales(endAt, yMax);
  const done = pressesBy(pressTimes, now);

  // A cumulative recorder's pen moves right with time and steps up one notch
  // per press, so the line is flat during a pause and steep during fast pressing.
  const pts: string[] = [`${s.sx(0)},${s.sy(0)}`];
  for (let i = 0; i < done; i++) {
    const x = s.sx(pressTimes[i]).toFixed(1);
    pts.push(`${x},${s.sy(i).toFixed(1)}`, `${x},${s.sy(i + 1).toFixed(1)}`);
  }
  pts.push(`${s.sx(now).toFixed(1)},${s.sy(done).toFixed(1)}`);
  const offX = s.sx(foodOffAt);

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
      role="img"
      aria-label={`Cumulative record: ${done} lever presses and ${rewarded
        .slice(0, done)
        .filter(Boolean).length} pellets after ${Math.floor(now)} seconds`}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={PAD.left} y={PAD.top - 8} width={s.plotWidth + 8} height={s.plotHeight + 8} />
        </clipPath>
      </defs>

      <rect x={PAD.left} y={PAD.top} width={s.plotWidth} height={s.plotHeight} fill={color.surfaceRaised} stroke={color.border} rx={4} />
      <rect x={offX} y={PAD.top} width={PAD.left + s.plotWidth - offX} height={s.plotHeight} fill={color.grid} />

      {ticks(yMax, 4).map((v) => (
        <line key={`grid-${v}`} x1={PAD.left} y1={s.sy(v)} x2={PAD.left + s.plotWidth} y2={s.sy(v)} stroke={color.grid} />
      ))}

      <text x={PAD.left + 4} y={PAD.top - 6} style={type.tick}>
        Food on
      </text>
      <text x={offX + 4} y={PAD.top - 6} style={type.tick}>
        Food off
      </text>

      <line x1={s.sx(now)} y1={PAD.top} x2={s.sx(now)} y2={s.sy(0)} stroke={color.inkMuted} strokeWidth={1.5} strokeDasharray="3 4" />

      <g clipPath={`url(#${clipId})`}>
        <polyline points={pts.join(" ")} fill="none" stroke={color.series[0]} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {/* Reinforcement marks: the pen ticks down where a press earned a pellet. */}
        {pressTimes.slice(0, done).map((t, i) =>
          rewarded[i] ? (
            <line
              key={i}
              x1={s.sx(t)}
              y1={s.sy(i + 1)}
              x2={s.sx(t) + 7}
              y2={s.sy(i + 1) + 10}
              stroke={color.series[2]}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          ) : null
        )}
        <circle cx={s.sx(now)} cy={s.sy(done)} r={5} fill={color.series[0]} stroke={color.ink} strokeWidth={1.5} />
      </g>

      <line x1={PAD.left} y1={s.sy(0)} x2={PAD.left + s.plotWidth} y2={s.sy(0)} stroke={color.axis} />
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={s.sy(0)} stroke={color.axis} />

      {ticks(endAt).map((v) => (
        <text key={`xt-${v}`} x={s.sx(v)} y={s.sy(0) + 20} textAnchor="middle" style={type.tick}>
          {v}
        </text>
      ))}
      {ticks(yMax, 4).map((v) => (
        <text key={`yt-${v}`} x={PAD.left - 8} y={s.sy(v) + 4} textAnchor="end" style={type.tick}>
          {v}
        </text>
      ))}

      <text x={PAD.left + s.plotWidth / 2} y={VIEW.height - 8} textAnchor="middle" style={type.axisTitle}>
        Time (seconds)
      </text>
      <text
        x={14}
        y={PAD.top + s.plotHeight / 2}
        textAnchor="middle"
        transform={`rotate(-90, 14, ${PAD.top + s.plotHeight / 2})`}
        style={type.axisTitle}
      >
        Total Presses
      </text>
    </svg>
  );
};

// Skinner box layout, in the shared VIEW.
const BOX = { left: 96, right: 470, top: 70, floor: 312 };
const LEVER = { x: BOX.left, y: 222, length: 46 };
const CHUTE_X = 134;
const TRAY = { x: 112, width: 52 };

const SkinnerBox = ({
  session,
  now,
  done,
}: {
  session: Session;
  now: number;
  done: number;
}) => {
  const { pressTimes, rewarded, foodOffAt } = session;
  const last = done > 0 ? pressTimes[done - 1] : -Infinity;
  const pressing = now - last < LEVER_DOWN_S;
  const foodOn = now < foodOffAt;

  // The latest pellet: falling, then in the tray until the rat eats it.
  let pelletAt = -Infinity;
  for (let i = done - 1; i >= 0 && pressTimes[i] > now - PELLET_FALL_S - PELLET_EAT_S; i--) {
    if (rewarded[i]) {
      pelletAt = pressTimes[i];
      break;
    }
  }
  const sincePellet = now - pelletAt;
  const fall = Math.min(1, sincePellet / PELLET_FALL_S);
  const pelletY = BOX.top + 30 + fall * (BOX.floor - 12 - BOX.top - 30);
  const eating = sincePellet >= PELLET_FALL_S;

  const line = { stroke: color.ink, strokeWidth: 2, strokeLinejoin: "round" as const };
  const fill = color.surfaceRaised;
  // The rat leans in to the lever on each press, and to the tray to eat.
  const lean = pressing ? -10 : eating ? -6 : 0;
  const lift = (pressing ? -8 : eating ? 6 : 0) - 10;

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
      role="img"
      aria-label={`Skinner box: ${done} presses so far, food ${foodOn ? "on" : "off"}`}
    >
      <rect x={PAD.left} y={PAD.top} width={VIEW.width - PAD.left - PAD.right} height={VIEW.height - PAD.top - PAD.bottom} fill={color.surfaceRaised} stroke={color.border} rx={4} />

      {/* Current step: which press the rat is on. */}
      <text x={PAD.left + 12} y={PAD.top + 24} style={{ ...type.axisTitle, fill: color.ink }}>
        Press{" "}
        <tspan style={{ fontFamily: font.data, fontVariantNumeric: "tabular-nums" }}>{done}</tspan>
      </text>
      <text x={PAD.left + 12} y={PAD.top + 42} style={type.tick}>
        {foodOn ? "Food on" : "Food off"}
      </text>

      {/* The box: back wall, floor, pellet chute and tray. */}
      <rect x={BOX.left} y={BOX.top} width={BOX.right - BOX.left} height={BOX.floor - BOX.top} fill="none" stroke={color.border} strokeWidth={3} />
      <rect x={CHUTE_X - 9} y={BOX.top} width={18} height={40} fill={foodOn ? color.surfaceRaised : color.grid} {...line} />
      {sincePellet < PELLET_FALL_S + PELLET_EAT_S && (
        <circle cx={CHUTE_X} cy={pelletY} r={7} fill={color.series[2]} stroke={color.ink} strokeWidth={1} />
      )}
      <path d={`M ${TRAY.x} ${BOX.floor - 18} L ${TRAY.x + TRAY.width} ${BOX.floor - 18} L ${TRAY.x + TRAY.width - 6} ${BOX.floor} L ${TRAY.x + 6} ${BOX.floor} Z`} fill="none" {...line} />

      {/* Lever on the wall. It dips on each press. */}
      <g transform={`rotate(${pressing ? 22 : 0}, ${LEVER.x}, ${LEVER.y})`}>
        <rect x={LEVER.x} y={LEVER.y - 5} width={LEVER.length} height={10} rx={4} fill={color.inkMuted} {...line} />
      </g>
      <circle cx={LEVER.x} cy={LEVER.y} r={6} fill={color.ink} />

      {/* Rat, facing the lever. */}
      <g transform={`translate(${lean}, ${lift})`}>
        <path d="M 330 292 Q 400 300 420 276 Q 432 262 446 270" fill="none" {...line} strokeLinecap="round" />
        <ellipse cx={268} cy={280} rx={68} ry={32} fill={fill} {...line} />
        <path d="M 214 262 Q 190 248 156 266 Q 150 272 158 276 Q 190 292 220 292 Z" fill={fill} {...line} />
        <ellipse cx={204} cy={250} rx={13} ry={15} fill={color.border} {...line} />
        <circle cx={182} cy={264} r={3.5} fill={color.ink} />
        <circle cx={155} cy={270} r={4} fill={color.ink} />
        <path d="M 222 304 l -4 9 M 300 306 l 4 7" {...line} strokeLinecap="round" />
        {pressing && <path d="M 196 286 Q 170 262 146 232" fill="none" {...line} strokeLinecap="round" />}
      </g>

      <text x={VIEW.width / 2} y={VIEW.height - 8} textAnchor="middle" style={type.tick}>
        <tspan fill={color.series[0]}>●</tspan>
        <tspan> Presses</tspan>
        <tspan dx={14} fill={color.series[2]}>●</tspan>
        <tspan> Pellet</tspan>
      </text>
    </svg>
  );
};

const Component = observer(({ state }: { state: State }) => {
  const session = state.session;
  const endAt = session?.endAt ?? 0;
  const elapsed = useRunAnimation(session, endAt * MS_PER_SECOND);

  if (!session) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Press Run to put a rat in the Skinner box with your reward rule." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const now = Math.min(endAt, elapsed / MS_PER_SECOND);
  const done = pressesBy(session.pressTimes, now);
  const pellets = session.rewarded.slice(0, done).filter(Boolean).length;
  const beforeOff = pressesBy(session.pressTimes, session.foodOffAt);

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
            <CumulativeRecord session={session} now={now} />
          </div>
          <div style={panelStyle}>
            <SkinnerBox session={session} now={now} done={done} />
          </div>
        </div>
      </PluginStage>

      <StatRow
        stats={[
          { label: "Time", value: `${Math.floor(now)} s` },
          { label: "Presses", value: String(done), color: color.series[0] },
          { label: "Pellets", value: String(pellets), color: color.series[2] },
          {
            label: "Extinction Presses",
            value: now >= session.foodOffAt ? String(done - beforeOff) : EMPTY,
          },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
