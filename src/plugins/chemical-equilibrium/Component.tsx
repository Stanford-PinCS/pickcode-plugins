import { observer } from "mobx-react-lite";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { PAD, VIEW, makeScales, niceStep, ticks } from "../../common/chart";
import {
  EMPTY,
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import { color, font, type } from "../../common/tokens";
import { useRunAnimation } from "../../common/useRunAnimation";
import instructions from "./instructions.md?raw";
import State, { type Direction, type ReactionRun } from "./state";

/* ───────── Colors ───────── */

// NO2 is the product the forward reaction makes, so it takes the primary
// series color. A forward pass makes pink, a reverse pass makes teal.
const NO2_COLOR = color.series[0];
const N2O4_COLOR = color.series[1];

const DIRECTION_LABEL: Record<Direction, string> = {
  forward: "→ forward",
  reverse: "← reverse",
  equilibrium: "⇌ equilibrium",
};
const DIRECTION_COLOR: Record<Direction, string> = {
  forward: NO2_COLOR,
  reverse: N2O4_COLOR,
  equilibrium: color.ink,
};

/* ───────── Timing ───────── */

// The whole replay takes about REPLAY_MS, one frame per loop pass, but a pass
// never flashes by faster than MIN_FRAME_MS or lingers longer than MAX_FRAME_MS.
const REPLAY_MS = 6000;
const MIN_FRAME_MS = 110;
const MAX_FRAME_MS = 320;
// The starting mixture, and the moment N2O4 is added, hold a little longer.
const START_HOLD_MS = 700;
const ADD_HOLD_MS = 1000;
// After the run, one N2O4 splits while two NO2 join every SWAP_MS:
// the reaction keeps going both ways at equal rates (dynamic equilibrium).
const SWAP_MS = 900;

/** When each frame appears, in ms after the run starts, plus the total. */
function frameSchedule(run: ReactionRun) {
  const n = run.n2o4.length;
  const frameMs = Math.min(
    MAX_FRAME_MS,
    Math.max(MIN_FRAME_MS, REPLAY_MS / Math.max(1, n - 1))
  );
  const starts: number[] = [];
  let t = 0;
  for (let i = 0; i < n; i++) {
    starts.push(t);
    t += i === 0 ? START_HOLD_MS : i === run.addAt ? ADD_HOLD_MS : frameMs;
  }
  // The run counts as finished as soon as the last frame is up.
  return { starts, total: starts[n - 1] };
}

const quotient = (n2o4: number, no2: number) =>
  n2o4 > 0 ? (no2 * no2) / n2o4 : Infinity;

const formatQ = (q: number) =>
  !Number.isFinite(q) ? "∞" : q >= 10 ? q.toFixed(1) : q.toFixed(3);

const formatM = (c: number) => `${c.toFixed(3)} M`;

/* ───────── Particles ───────── */

interface Particle {
  id: number;
  kind: "dimer" | "mono";
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  /** 1 right after the particle forms, fading to 0. */
  flash: number;
}

const BOX = { x: 12, y: 56, width: 360, height: 274 };
const R = 5;
const MARGIN = R * 2.2;
// At most this many N2O4-equivalents are drawn, so the box never crowds.
const MAX_UNITS = 40;

const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

function makeParticle(
  id: number,
  kind: Particle["kind"],
  flash: number,
  at?: { x: number; y: number }
): Particle {
  return {
    id,
    kind,
    x: at ? at.x : rand(MARGIN, BOX.width - MARGIN),
    y: at ? at.y : rand(MARGIN, BOX.height - MARGIN),
    vx: rand(-1, 1),
    vy: rand(-1, 1),
    angle: rand(0, Math.PI),
    spin: rand(-0.03, 0.03),
    flash,
  };
}

/** How many N2O4 pairs and NO2 singles to draw for one frame. */
function particleTargets(run: ReactionRun, frame: number, unit: number) {
  const n2o4 = run.n2o4[frame];
  const no2 = run.no2[frame];
  const units = Math.round((n2o4 + no2 / 2) / unit);
  const dimers = Math.min(units, Math.round(n2o4 / unit));
  return { dimers, monos: 2 * (units - dimers) };
}

/**
 * Turns the particles into the target counts the way the reaction would:
 * a forward step splits N2O4 pairs into two NO2, a reverse step joins two
 * NO2 into a pair, and added N2O4 drops in as new pairs.
 */
function reconcile(
  previous: Particle[],
  target: { dimers: number; monos: number },
  nextId: () => number
): Particle[] {
  let list = [...previous];
  const count = (kind: Particle["kind"]) =>
    list.filter((p) => p.kind === kind).length;
  const pick = (kind: Particle["kind"]) => {
    const matches = list.filter((p) => p.kind === kind);
    return matches[Math.floor(Math.random() * matches.length)];
  };

  let dimerGap = target.dimers - count("dimer");
  let monoGap = target.monos - count("mono");

  // Forward: N2O4 -> 2 NO2.
  while (dimerGap < 0 && monoGap >= 2) {
    const d = pick("dimer");
    list = list.filter((p) => p !== d);
    list.push(
      makeParticle(nextId(), "mono", 1, { x: d.x - R, y: d.y }),
      makeParticle(nextId(), "mono", 1, { x: d.x + R, y: d.y })
    );
    dimerGap++;
    monoGap -= 2;
  }

  // Reverse: 2 NO2 -> N2O4. Join a single with its nearest neighbor.
  while (dimerGap > 0 && monoGap <= -2 && count("mono") >= 2) {
    const a = pick("mono");
    let b: Particle | undefined;
    for (const p of list) {
      if (p.kind !== "mono" || p === a) continue;
      if (!b || Math.hypot(p.x - a.x, p.y - a.y) < Math.hypot(b.x - a.x, b.y - a.y)) b = p;
    }
    if (!b) break;
    const partner = b;
    list = list.filter((p) => p !== a && p !== partner);
    list.push(
      makeParticle(nextId(), "dimer", 1, {
        x: (a.x + partner.x) / 2,
        y: (a.y + partner.y) / 2,
      })
    );
    dimerGap--;
    monoGap += 2;
  }

  // Anything left over is material added or rounded away.
  for (; dimerGap > 0; dimerGap--) list.push(makeParticle(nextId(), "dimer", 1));
  for (; monoGap > 0; monoGap--) list.push(makeParticle(nextId(), "mono", 1));
  for (; dimerGap < 0; dimerGap++) {
    const d = pick("dimer");
    list = list.filter((p) => p !== d);
  }
  for (; monoGap < 0; monoGap++) {
    const m = pick("mono");
    list = list.filter((p) => p !== m);
  }
  return list;
}

/** One split and one join at the same moment: net change zero. */
function swapBothWays(previous: Particle[], nextId: () => number): Particle[] {
  const dimers = previous.filter((p) => p.kind === "dimer").length;
  const monos = previous.length - dimers;
  if (dimers < 1 || monos < 2) return previous;
  const joined = reconcile(previous, { dimers: dimers + 1, monos: monos - 2 }, nextId);
  return reconcile(joined, { dimers, monos }, nextId);
}

function moveParticles(list: Particle[], dt: number, move: boolean): Particle[] {
  return list.map((p) => {
    const flash = Math.max(0, p.flash - dt * 1.6);
    if (!move) return { ...p, flash };
    let { x, y, vx, vy } = p;
    x += vx;
    y += vy;
    if (x < MARGIN) {
      x = MARGIN;
      vx = Math.abs(vx);
    }
    if (x > BOX.width - MARGIN) {
      x = BOX.width - MARGIN;
      vx = -Math.abs(vx);
    }
    if (y < MARGIN) {
      y = MARGIN;
      vy = Math.abs(vy);
    }
    if (y > BOX.height - MARGIN) {
      y = BOX.height - MARGIN;
      vy = -Math.abs(vy);
    }
    vx += (Math.random() - 0.5) * 0.2;
    vy += (Math.random() - 0.5) * 0.2;
    const speed = Math.hypot(vx, vy);
    if (speed > 1.6) {
      vx = (vx / speed) * 1.6;
      vy = (vy / speed) * 1.6;
    }
    return { ...p, x, y, vx, vy, angle: p.angle + p.spin, flash };
  });
}

/* ───────── Concentration chart ───────── */

const ConcentrationChart = ({
  run,
  frame,
  passAt,
}: {
  run: ReactionRun;
  frame: number;
  passAt: (i: number) => number;
}) => {
  const clipId = `equilibrium-plot-${useId().replace(/:/g, "")}`;
  const n = run.n2o4.length;
  const lastPass = passAt(n - 1);
  // Axes are sized for the whole run, so they hold still while the lines grow.
  const xMax = Math.max(10, lastPass);
  const highest = Math.max(...run.n2o4, ...run.no2) * 1.15;
  const yStep = niceStep(highest, 4);
  const yMax = Math.max(yStep, Math.ceil(highest / yStep) * yStep);
  const s = makeScales(xMax, yMax);

  const line = (values: number[]) =>
    values
      .slice(0, frame + 1)
      .map((v, i) => `${s.sx(passAt(i)).toFixed(1)},${s.sy(v).toFixed(1)}`)
      .join(" ");

  const x = s.sx(passAt(frame));
  const showAdd = run.addAt >= 0 && frame >= run.addAt;
  const addX = run.addAt >= 0 ? s.sx(passAt(run.addAt)) : 0;
  const legendX = PAD.left + s.plotWidth - 132;

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
      role="img"
      aria-label={`Concentrations after ${passAt(frame)} loop passes: N2O4 ${run.n2o4[
        frame
      ].toFixed(3)} M, NO2 ${run.no2[frame].toFixed(3)} M`}
    >
      <defs>
        <clipPath id={clipId}>
          {/* Padded so the current-pass dots aren't cut off at the edges. */}
          <rect
            x={PAD.left - 6}
            y={PAD.top - 6}
            width={s.plotWidth + 12}
            height={s.plotHeight + 12}
          />
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
      {ticks(yMax, 4).map((v) => (
        <line
          key={`grid-${v}`}
          x1={PAD.left}
          y1={s.sy(v)}
          x2={PAD.left + s.plotWidth}
          y2={s.sy(v)}
          stroke={color.grid}
        />
      ))}

      {showAdd && (
        <g>
          <line
            x1={addX}
            y1={PAD.top}
            x2={addX}
            y2={s.sy(0)}
            stroke={color.inkMuted}
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
          <text x={addX + 5} y={s.sy(0) - 8} style={type.tick}>
            N₂O₄ added
          </text>
        </g>
      )}

      {/* Current loop pass. */}
      <line x1={x} y1={PAD.top} x2={x} y2={s.sy(0)} stroke={color.border} strokeWidth={2} />

      <g clipPath={`url(#${clipId})`}>
        {[
          { values: run.n2o4, stroke: N2O4_COLOR },
          { values: run.no2, stroke: NO2_COLOR },
        ].map(({ values, stroke }) => (
          <g key={stroke}>
            {frame > 0 && (
              <polyline
                points={line(values)}
                fill="none"
                stroke={stroke}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}
            <circle
              cx={x}
              cy={s.sy(values[frame])}
              r={4.5}
              fill={stroke}
              stroke={color.surfaceRaised}
              strokeWidth={1.5}
            />
          </g>
        ))}
      </g>

      <line x1={PAD.left} y1={s.sy(0)} x2={PAD.left + s.plotWidth} y2={s.sy(0)} stroke={color.axis} />
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={s.sy(0)} stroke={color.axis} />

      {ticks(xMax).map((v) => (
        <text key={`xt-${v}`} x={s.sx(v)} y={s.sy(0) + 20} textAnchor="middle" style={type.tick}>
          {v}
        </text>
      ))}
      {ticks(yMax, 4).map((v) => (
        <text
          key={`yt-${v}`}
          x={PAD.left - 8}
          y={s.sy(v) + 4}
          textAnchor="end"
          style={type.tick}
        >
          {Number(v.toFixed(2))}
        </text>
      ))}

      <text
        x={PAD.left + s.plotWidth / 2}
        y={VIEW.height - 8}
        textAnchor="middle"
        style={type.axisTitle}
      >
        Loop pass
      </text>
      <text
        x={14}
        y={PAD.top + s.plotHeight / 2}
        textAnchor="middle"
        transform={`rotate(-90, 14, ${PAD.top + s.plotHeight / 2})`}
        style={type.axisTitle}
      >
        Concentration (M)
      </text>

      {/* Legend with the current concentrations. */}
      <rect
        x={legendX - 8}
        y={PAD.top + 8}
        width={136}
        height={44}
        rx={4}
        fill={color.surfaceRaised}
        stroke={color.border}
      />
      {[
        { label: "N₂O₄", value: run.n2o4[frame], fill: N2O4_COLOR },
        { label: "NO₂", value: run.no2[frame], fill: NO2_COLOR },
      ].map(({ label, value, fill }, row) => (
        <g key={label} transform={`translate(${legendX}, ${PAD.top + 24 + row * 18})`}>
          <circle cx={4} cy={-4} r={4} fill={fill} />
          <text x={14} y={0} style={{ ...type.tick, fill: color.ink, fontFamily: font.ui }}>
            {label}
          </text>
          <text
            x={120}
            y={0}
            textAnchor="end"
            style={{ ...type.tick, fill: color.ink, fontVariantNumeric: "tabular-nums" }}
          >
            {formatM(value)}
          </text>
        </g>
      ))}
    </svg>
  );
};

/* ───────── Container + Q gauge ───────── */

const GAUGE = { x: 424, width: 16, top: 66, bottom: 318 };

const ReactorView = ({
  run,
  frame,
  done,
  pass,
  particles,
}: {
  run: ReactionRun;
  frame: number;
  done: boolean;
  pass: number;
  particles: Particle[];
}) => {
  const q = quotient(run.n2o4[frame], run.no2[frame]);
  const answer = run.answers[frame];
  const stoppedByLimit = done && answer !== "equilibrium";

  // Gauge runs from 0 up past the largest finite Q of the run.
  const finiteQs = run.n2o4
    .map((a, i) => quotient(a, run.no2[i]))
    .filter((v) => Number.isFinite(v));
  const qMax = Math.max(run.K * 2, ...finiteQs) * 1.1;
  const gy = (v: number) =>
    GAUGE.bottom - (Math.min(v, qMax) / qMax) * (GAUGE.bottom - GAUGE.top);
  const qY = Number.isFinite(q) ? gy(q) : GAUGE.top;
  const kY = gy(run.K);

  let title: string;
  let detail: string;
  if (!done) {
    title = frame === run.addAt ? "N₂O₄ added" : `Pass ${pass}`;
    detail = `chooseDirection returned "${answer}"`;
  } else {
    title = `Stopped after ${pass} ${pass === 1 ? "pass" : "passes"}`;
    const close = Number.isFinite(q) && Math.abs(q - run.K) <= run.K * 0.05;
    detail = close
      ? "Q ≈ K: at equilibrium"
      : q > run.K
        ? "Q > K: not at equilibrium yet"
        : "Q < K: not at equilibrium yet";
  }

  const dimers = particles.filter((p) => p.kind === "dimer").length;

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
      role="img"
      aria-label={`Container with ${dimers} N2O4 and ${
        particles.length - dimers
      } NO2 particles. Q is ${formatQ(q)} and K is ${run.K}.`}
    >
      {/* Loop marker: which pass, and the direction chooseDirection chose. */}
      <text
        x={BOX.x}
        y={24}
        style={{ fontFamily: font.ui, fontSize: 16, fontWeight: 600, fill: color.ink }}
      >
        {title}
      </text>
      <text
        x={BOX.x + BOX.width}
        y={24}
        textAnchor="end"
        style={{
          fontFamily: font.data,
          fontSize: 16,
          fontWeight: 600,
          fill: stoppedByLimit ? color.inkMuted : DIRECTION_COLOR[answer],
        }}
      >
        {stoppedByLimit ? `${run.stepLimit}-pass limit` : DIRECTION_LABEL[answer]}
      </text>
      <text x={BOX.x} y={44} style={type.tick}>
        {detail}
      </text>

      <rect
        x={BOX.x}
        y={BOX.y}
        width={BOX.width}
        height={BOX.height}
        fill={color.surfaceRaised}
        stroke={color.border}
        rx={4}
      />
      <g transform={`translate(${BOX.x}, ${BOX.y})`}>
        {particles.map((p) => {
          const ring = p.flash > 0 ? color.ink : "none";
          if (p.kind === "mono") {
            return (
              <circle
                key={p.id}
                cx={p.x}
                cy={p.y}
                r={R}
                fill={NO2_COLOR}
                stroke={ring}
                strokeWidth={1.5}
                strokeOpacity={p.flash}
              />
            );
          }
          const dx = Math.cos(p.angle) * R * 0.9;
          const dy = Math.sin(p.angle) * R * 0.9;
          return (
            <g key={p.id} stroke={ring} strokeWidth={1.5} strokeOpacity={p.flash}>
              <circle cx={p.x - dx} cy={p.y - dy} r={R} fill={N2O4_COLOR} />
              <circle cx={p.x + dx} cy={p.y + dy} r={R} fill={N2O4_COLOR} />
            </g>
          );
        })}
      </g>

      {/* Q gauge with K as the dashed reference line. */}
      <rect
        x={GAUGE.x}
        y={GAUGE.top}
        width={GAUGE.width}
        height={GAUGE.bottom - GAUGE.top}
        fill={color.surfaceRaised}
        stroke={color.border}
        rx={3}
      />
      <rect
        x={GAUGE.x}
        y={qY}
        width={GAUGE.width}
        height={GAUGE.bottom - qY}
        fill={color.inkMuted}
        opacity={0.3}
        rx={3}
      />
      <line
        x1={GAUGE.x - 14}
        y1={kY}
        x2={GAUGE.x + GAUGE.width + 14}
        y2={kY}
        stroke={color.reference}
        strokeWidth={2}
        strokeDasharray="6 4"
      />
      <text
        x={GAUGE.x - 18}
        y={kY + 4}
        textAnchor="end"
        style={{ ...type.tick, fill: color.reference, fontWeight: 600 }}
      >
        K
      </text>
      <line
        x1={GAUGE.x - 4}
        y1={qY}
        x2={GAUGE.x + GAUGE.width + 4}
        y2={qY}
        stroke={color.ink}
        strokeWidth={2.5}
      />
      <path
        d={`M ${GAUGE.x + GAUGE.width + 6} ${qY} l 8 -5 v 10 z`}
        fill={color.ink}
      />
      <text
        x={GAUGE.x + GAUGE.width + 18}
        y={qY + 4}
        style={{ ...type.tick, fill: color.ink, fontWeight: 600 }}
      >
        Q
      </text>
      <text
        x={GAUGE.x + GAUGE.width / 2}
        y={GAUGE.bottom + 16}
        textAnchor="middle"
        style={type.tick}
      >
        0
      </text>

      {/* Legend for the box, and the gauge caption. */}
      <text x={BOX.x + BOX.width / 2} y={356} textAnchor="middle" style={type.tick}>
        <tspan fill={N2O4_COLOR}>●●</tspan>
        <tspan> N₂O₄</tspan>
        <tspan dx={16} fill={NO2_COLOR}>
          ●
        </tspan>
        <tspan> NO₂</tspan>
      </text>
      <text
        x={GAUGE.x + GAUGE.width / 2}
        y={356}
        textAnchor="middle"
        style={type.axisTitle}
      >
        Q vs K
      </text>
    </svg>
  );
};

/* ───────── Plugin ───────── */

const Component = observer(({ state }: { state: State }) => {
  const run = state.run;

  const schedule = useMemo(() => (run ? frameSchedule(run) : null), [run]);
  const elapsed = useRunAnimation(run, schedule?.total ?? 0);

  let frame = 0;
  if (run && schedule) {
    while (frame + 1 < run.n2o4.length && schedule.starts[frame + 1] <= elapsed) frame++;
  }
  const done = !!run && !!schedule && elapsed >= schedule.total;

  const passAt = (i: number) =>
    run && run.addAt >= 0 && i >= run.addAt ? i - 1 : i;

  // Each N2O4-equivalent drawn stands for `unit` mol/L.
  const unit = useMemo(() => {
    if (!run) return 1;
    const most = Math.max(...run.n2o4.map((a, i) => a + run.no2[i] / 2));
    return Math.max(0.025, most / MAX_UNITS);
  }, [run]);

  const [particles, setParticles] = useState<Particle[]>([]);
  const idRef = useRef(0);
  const nextId = () => idRef.current++;
  const shownRun = useRef<ReactionRun | null>(null);

  // A new run starts from a fresh box; a new frame reacts the box toward it.
  useEffect(() => {
    if (!run) {
      shownRun.current = null;
      setParticles([]);
      return;
    }
    const target = particleTargets(run, frame, unit);
    if (shownRun.current !== run) {
      shownRun.current = run;
      setParticles([
        ...Array.from({ length: target.dimers }, () => makeParticle(nextId(), "dimer", 0)),
        ...Array.from({ length: target.monos }, () => makeParticle(nextId(), "mono", 0)),
      ]);
    } else {
      setParticles((previous) => reconcile(previous, target, nextId));
    }
  }, [run, frame, unit]);

  // Particles drift; once the run is over, one split and one join keep
  // happening together, because equilibrium is dynamic.
  const doneRef = useRef(done);
  doneRef.current = done;
  useEffect(() => {
    const move = !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let last = 0;
    let sinceSwap = 0;
    let raf = 0;
    const animate = (time: number) => {
      const dt = last ? Math.min((time - last) / 1000, 0.1) : 0.016;
      last = time;
      sinceSwap += dt * 1000;
      const swap = move && doneRef.current && sinceSwap >= SWAP_MS;
      if (swap) sinceSwap = 0;
      setParticles((previous) =>
        moveParticles(swap ? swapBothWays(previous, nextId) : previous, dt, move)
      );
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!run) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Press Run to start the reaction and watch it shift toward equilibrium." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const q = quotient(run.n2o4[frame], run.no2[frame]);
  const answer = run.answers[frame];
  const pass = passAt(frame);

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
          <div style={{ minWidth: 0, minHeight: 0, overflow: "hidden" }}>
            <ConcentrationChart run={run} frame={frame} passAt={passAt} />
          </div>
          <div style={{ minWidth: 0, minHeight: 0, overflow: "hidden" }}>
            <ReactorView
              run={run}
              frame={frame}
              done={done}
              pass={pass}
              particles={particles}
            />
          </div>
        </div>
      </PluginStage>

      <StatRow
        stats={[
          { label: "Pass", value: String(pass) },
          {
            label: "Direction",
            value: answer ? DIRECTION_LABEL[answer] : EMPTY,
            color: answer ? DIRECTION_COLOR[answer] : undefined,
          },
          { label: "Q", value: formatQ(q) },
          { label: "K", value: String(run.K), color: color.reference },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
