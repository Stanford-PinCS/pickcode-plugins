import { observer } from "mobx-react-lite";
import { useEffect, useId, useRef, useState } from "react";
import { PAD, VIEW, makeScales, niceStep, ticks } from "../../common/chart";
import {
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import { useRunAnimation } from "../../common/useRunAnimation";
import { color, font, type } from "../../common/tokens";
import instructions from "./instructions.md?raw";
import State, { idealPressure, toKelvin } from "./state";

// The piston holds at the first volume for HOLD_MS, then takes STEP_MS per
// volume: it slides for the first MOVE_SHARE of the step and rests for the
// rest, so each reading can be seen.
const HOLD_MS = 1200;
const STEP_MS = 700;
const MOVE_SHARE = 0.35;

// Container layout, in the shared VIEW.
const CYL_LEFT = 36;
const CYL_TOP = 178;
const CYL_HEIGHT = 148;
const MAX_GAS_WIDTH = 440;
const PISTON_WIDTH = 12;
const PARTICLE_RADIUS = 3.5;
// Gauge.
const GAUGE_X = 128;
const GAUGE_Y = 142;
const GAUGE_R = 84;

// Particles: speed scales with the square root of the kelvin temperature.
const SPEED_AT_273K = 80; // px per second
const FLASH_SECONDS = 0.25;
const MAX_FLASHES = 220;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Flash {
  x: number;
  y: number;
  age: number;
}

/**
 * Moving gas particles that bounce off the container walls and the piston.
 * Restarts whenever `owner` (one run's result) changes. With
 * prefers-reduced-motion the particles are drawn but stay still.
 */
function useGas(owner: unknown, count: number, speed: number, gasWidth: number) {
  const widthRef = useRef(gasWidth);
  widthRef.current = gasWidth;
  const [frame, setFrame] = useState<{ particles: Particle[]; flashes: Flash[] }>(
    { particles: [], flashes: [] }
  );

  useEffect(() => {
    if (owner == null) return;
    const r = PARTICLE_RADIUS;
    let particles: Particle[] = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      // Real gas particles don't all share one speed; spread them around the average.
      const v = speed * (0.6 + Math.random() * 0.8);
      return {
        x: r + Math.random() * Math.max(widthRef.current - 2 * r, 0),
        y: r + Math.random() * (CYL_HEIGHT - 2 * r),
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v,
      };
    });
    let flashes: Flash[] = [];
    setFrame({ particles, flashes });

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const w = widthRef.current;
      flashes = flashes
        .map((f) => ({ ...f, age: f.age + dt }))
        .filter((f) => f.age < FLASH_SECONDS);
      const hit = (f: Flash) => {
        if (flashes.length < MAX_FLASHES) flashes.push(f);
      };
      particles = particles.map((p) => {
        let { x, y, vx, vy } = p;
        x += vx * dt;
        y += vy * dt;
        if (x < r) {
          x = r;
          vx = Math.abs(vx);
          hit({ x: 0, y, age: 0 });
        }
        if (x > w - r) {
          x = w - r;
          vx = -Math.abs(vx);
          hit({ x: w, y, age: 0 });
        }
        if (y < r) {
          y = r;
          vy = Math.abs(vy);
          hit({ x, y: 0, age: 0 });
        }
        if (y > CYL_HEIGHT - r) {
          y = CYL_HEIGHT - r;
          vy = -Math.abs(vy);
          hit({ x, y: CYL_HEIGHT, age: 0 });
        }
        return { x, y, vx, vy };
      });
      setFrame({ particles, flashes });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [owner, count, speed]);

  return frame;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Tick label without floating-point noise (0.30000000000000004 -> 0.3). */
const tickLabel = (v: number) => String(Number(v.toFixed(3)));

/** Point on the gauge arc for a value: 0 at the left end, `max` at the right. */
function gaugePoint(value: number, max: number, radius: number) {
  const f = Math.min(Math.max(value / max, 0), 1);
  const a = Math.PI - f * Math.PI;
  return { x: GAUGE_X + radius * Math.cos(a), y: GAUGE_Y - radius * Math.sin(a) };
}

const Component = observer(({ state }: { state: State }) => {
  const clipId = `gas-plot-${useId().replace(/:/g, "")}`;
  const { volumes, pressures, moles, celsius } = state;
  const steps = volumes.length;
  const hasRun = steps > 0;

  const duration = HOLD_MS + Math.max(steps - 1, 0) * STEP_MS;
  const elapsed = useRunAnimation(hasRun ? state : null, duration);

  // Where the sweep is: index of the step it has reached, and how far it has
  // slid toward the next one.
  const sinceHold = Math.max(elapsed - HOLD_MS, 0);
  const reached = hasRun ? Math.min(Math.floor(sinceHold / STEP_MS), steps - 1) : 0;
  const slide =
    reached >= steps - 1
      ? 0
      : Math.min((sinceHold - reached * STEP_MS) / (STEP_MS * MOVE_SHARE), 1);
  const next = Math.min(reached + 1, steps - 1);
  const volume = hasRun ? lerp(volumes[reached], volumes[next], slide) : 0;
  const pressure = hasRun ? lerp(pressures[reached], pressures[next], slide) : 0;

  const kelvin = toKelvin(celsius);
  const ideal = hasRun ? idealPressure(moles, volume, kelvin) : 0;

  const maxVolume = hasRun ? Math.max(...volumes) : 1;
  const gasWidth = (volume / maxVolume) * MAX_GAS_WIDTH;
  const particleCount = Math.round(Math.min(Math.max(moles * 36, 6), 180));
  const speed = SPEED_AT_273K * Math.sqrt(kelvin / 273.15);
  const gas = useGas(hasRun ? state : null, particleCount, speed, gasWidth);

  if (!hasRun) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Press Run to squeeze the gas and read its pressure." />
        </PluginStage>
      </PluginSurface>
    );
  }

  // One pressure scale for both the gauge and the graph, sized for the whole run.
  const idealAt = volumes.map((v) => idealPressure(moles, v, kelvin));
  const top = Math.max(...pressures, ...idealAt, 0.5);
  const yStep = niceStep(top, 4);
  const yMax = Math.ceil(top / yStep) * yStep;
  const xStep = niceStep(maxVolume, 5);
  const xMax = Math.ceil(maxVolume / xStep) * xStep;
  const s = makeScales(xMax, yMax);

  // Ideal gas law at the same volumes, drawn as a dashed reference. Using the
  // same points means a correct calculatePressure lies exactly on top of it.
  const curve = volumes
    .map((v, i) => `${s.sx(v).toFixed(1)},${s.sy(idealAt[i]).toFixed(1)}`)
    .join(" ");

  // The student's pressures so far, ending at the piston's current position.
  const drawn = volumes.slice(0, reached + 1).map((v, i) => ({ v, p: pressures[i] }));
  const linePoints = [...drawn, { v: volume, p: pressure }]
    .map(({ v, p }) => `${s.sx(v).toFixed(1)},${s.sy(p).toFixed(1)}`)
    .join(" ");

  const pistonX = CYL_LEFT + gasWidth;
  const needle = gaugePoint(pressure, yMax, GAUGE_R * 0.86);
  const refInner = gaugePoint(ideal, yMax, GAUGE_R * 0.62);
  const refOuter = gaugePoint(ideal, yMax, GAUGE_R);

  const panel = { minWidth: 0, minHeight: 0, overflow: "hidden" } as const;

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
          <div style={panel}>
            <svg
              viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
              preserveAspectRatio="xMidYMid meet"
              style={{ width: "100%", height: "100%" }}
              role="img"
              aria-label={`${moles} mol of gas at ${kelvin.toFixed(0)} K squeezed to ${volume.toFixed(1)} L. The gauge reads ${pressure.toFixed(2)} atm; the ideal gas law predicts ${ideal.toFixed(2)} atm.`}
            >
              {/* Pressure gauge */}
              <rect
                x={GAUGE_X - 5}
                y={GAUGE_Y}
                width={10}
                height={CYL_TOP - GAUGE_Y}
                fill={color.border}
              />
              <path
                d={`M ${GAUGE_X - GAUGE_R} ${GAUGE_Y} A ${GAUGE_R} ${GAUGE_R} 0 0 1 ${GAUGE_X + GAUGE_R} ${GAUGE_Y} Z`}
                fill={color.surfaceRaised}
                stroke={color.border}
                strokeWidth={2}
              />
              {ticks(yMax, 4).map((v) => {
                const a = gaugePoint(v, yMax, GAUGE_R * 0.86);
                const b = gaugePoint(v, yMax, GAUGE_R * 0.97);
                const t = gaugePoint(v, yMax, GAUGE_R * 0.72);
                return (
                  <g key={`gt-${v}`}>
                    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color.axis} strokeWidth={1.5} />
                    <text x={t.x} y={t.y + 4} textAnchor="middle" style={type.tick}>
                      {tickLabel(v)}
                    </text>
                  </g>
                );
              })}
              <line
                x1={refInner.x}
                y1={refInner.y}
                x2={refOuter.x}
                y2={refOuter.y}
                stroke={color.reference}
                strokeWidth={2.5}
                strokeDasharray="4 3"
              />
              <line
                x1={GAUGE_X}
                y1={GAUGE_Y}
                x2={needle.x}
                y2={needle.y}
                stroke={color.series[0]}
                strokeWidth={3}
                strokeLinecap="round"
              />
              <circle cx={GAUGE_X} cy={GAUGE_Y} r={5} fill={color.series[0]} />
              <text x={GAUGE_X + GAUGE_R + 14} y={GAUGE_Y - 22} style={type.axisTitle}>
                Pressure (atm)
              </text>
              <text
                x={GAUGE_X + GAUGE_R + 14}
                y={GAUGE_Y - 2}
                style={{
                  fontFamily: font.data,
                  fontSize: 18,
                  fontWeight: 600,
                  fontVariantNumeric: "tabular-nums",
                  fill: color.series[0],
                }}
              >
                {pressure.toFixed(2)}
              </text>

              {/* Container: gas on the left of the piston */}
              <rect
                x={CYL_LEFT}
                y={CYL_TOP}
                width={gasWidth}
                height={CYL_HEIGHT}
                fill={color.surfaceRaised}
              />
              <g transform={`translate(${CYL_LEFT}, ${CYL_TOP})`}>
                {gas.particles.map((p, i) => (
                  <circle
                    key={`p-${i}`}
                    cx={Math.min(p.x, gasWidth - PARTICLE_RADIUS)}
                    cy={p.y}
                    r={PARTICLE_RADIUS}
                    fill={color.series[1]}
                  />
                ))}
                {gas.flashes.map((f, i) => {
                  // A small ring that grows and fades where a particle hit the wall.
                  const life = f.age / FLASH_SECONDS;
                  return (
                    <circle
                      key={`f-${i}`}
                      cx={f.x}
                      cy={f.y}
                      r={3 + life * 7}
                      fill="none"
                      stroke={color.series[1]}
                      strokeWidth={2}
                      opacity={1 - life}
                    />
                  );
                })}
              </g>
              <path
                d={`M ${CYL_LEFT + MAX_GAS_WIDTH + PISTON_WIDTH + 8} ${CYL_TOP} L ${CYL_LEFT} ${CYL_TOP} L ${CYL_LEFT} ${CYL_TOP + CYL_HEIGHT} L ${CYL_LEFT + MAX_GAS_WIDTH + PISTON_WIDTH + 8} ${CYL_TOP + CYL_HEIGHT}`}
                fill="none"
                stroke={color.inkMuted}
                strokeWidth={3}
                strokeLinejoin="round"
              />
              {/* Piston and its rod */}
              <rect
                x={pistonX}
                y={CYL_TOP + CYL_HEIGHT / 2 - 6}
                width={VIEW.width - pistonX}
                height={12}
                fill={color.border}
              />
              <rect
                x={pistonX}
                y={CYL_TOP + 1.5}
                width={PISTON_WIDTH}
                height={CYL_HEIGHT - 3}
                fill={color.inkMuted}
                rx={2}
              />
              <text
                x={pistonX + PISTON_WIDTH / 2}
                y={CYL_TOP - 8}
                textAnchor="middle"
                style={{
                  fontFamily: font.data,
                  fontSize: 13,
                  fontWeight: 600,
                  fontVariantNumeric: "tabular-nums",
                  fill: color.ink,
                }}
              >
                {`${volume.toFixed(1)} L`}
              </text>

              <text x={VIEW.width / 2} y={VIEW.height - 12} textAnchor="middle" style={type.tick}>
                <tspan fill={color.series[1]}>●</tspan>
                <tspan> gas particle (flashes mark hits on the walls)</tspan>
              </text>
            </svg>
          </div>

          <div style={panel}>
            <svg
              viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
              preserveAspectRatio="xMidYMid meet"
              style={{ width: "100%", height: "100%" }}
              role="img"
              aria-label={`Pressure against volume: your calculatePressure gives ${pressure.toFixed(2)} atm at ${volume.toFixed(1)} L, the ideal gas law gives ${ideal.toFixed(2)} atm.`}
            >
              <defs>
                <clipPath id={clipId}>
                  <rect x={PAD.left} y={PAD.top} width={s.plotWidth} height={s.plotHeight} />
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
              <line
                x1={s.sx(volume)}
                y1={PAD.top}
                x2={s.sx(volume)}
                y2={s.sy(0)}
                stroke={color.grid}
                strokeWidth={2}
              />
              <g clipPath={`url(#${clipId})`}>
                <polyline
                  points={curve}
                  fill="none"
                  stroke={color.reference}
                  strokeWidth={2}
                  strokeDasharray="8 5"
                />
                <polyline
                  points={linePoints}
                  fill="none"
                  stroke={color.series[0]}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {drawn.map(({ v, p }) => (
                  <circle
                    key={`pt-${v}`}
                    cx={s.sx(v)}
                    cy={s.sy(p)}
                    r={3}
                    fill={color.series[0]}
                    stroke={color.surfaceRaised}
                    strokeWidth={1.2}
                  />
                ))}
                <circle
                  cx={s.sx(volume)}
                  cy={s.sy(pressure)}
                  r={7}
                  fill="none"
                  stroke={color.series[0]}
                  strokeWidth={2}
                />
              </g>
              <line x1={PAD.left} y1={s.sy(0)} x2={PAD.left + s.plotWidth} y2={s.sy(0)} stroke={color.axis} />
              <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={s.sy(0)} stroke={color.axis} />
              {ticks(xMax).map((v) => (
                <text key={`xt-${v}`} x={s.sx(v)} y={s.sy(0) + 20} textAnchor="middle" style={type.tick}>
                  {tickLabel(v)}
                </text>
              ))}
              {ticks(yMax, 4).map((v) => (
                <text key={`yt-${v}`} x={PAD.left - 8} y={s.sy(v) + 4} textAnchor="end" style={type.tick}>
                  {tickLabel(v)}
                </text>
              ))}
              <text
                x={PAD.left + s.plotWidth / 2}
                y={VIEW.height - 8}
                textAnchor="middle"
                style={type.axisTitle}
              >
                Volume (L)
              </text>
              <text
                x={14}
                y={PAD.top + s.plotHeight / 2}
                textAnchor="middle"
                transform={`rotate(-90, 14, ${PAD.top + s.plotHeight / 2})`}
                style={type.axisTitle}
              >
                Pressure (atm)
              </text>
            </svg>
          </div>
        </div>
      </PluginStage>

      <StatRow
        stats={[
          { label: "Volume", value: `${volume.toFixed(1)} L` },
          { label: "Pressure", value: `${pressure.toFixed(2)} atm`, color: color.series[0] },
          { label: "Ideal Gas Law", value: `${ideal.toFixed(2)} atm`, color: color.reference },
          { label: "Temperature", value: `${kelvin.toFixed(0)} K` },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
