import { observer } from "mobx-react-lite";
import { useEffect, useRef } from "react";
import { color, font, radius } from "../../common/tokens";
import {
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import State from "./state";
import type { Planet } from "./messages";
import instructions from "./instructions.md?raw";

// With prefers-reduced-motion the orbits are drawn once, frozen at this
// point in time, so planets with different speeds still sit apart.
const STILL_ANGLE = 3;
const MAX_RADIUS = 2000;
const MIN_ORBIT = 35;
const SUN_RADIUS = 18;

const planetColor = (planet: Planet, index: number) =>
  planet.color || color.series[index % color.series.length];

const Component = observer(({ state }: { state: State }) => {
  const planets = state.planets ?? [];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef(0);
  const angleRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.parentElement;
    if (!container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const still =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const draw = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;

      if (w === 0 || h === 0) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const canvasWidth = Math.round(w * dpr);
      const canvasHeight = Math.round(h * dpr);
      if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
      }

      // Draw in CSS pixels on a sharper, device-resolution backing canvas.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const usableRadius = Math.max(MIN_ORBIT, Math.min(w, h) / 2 - 24);

      // Sun
      ctx.beginPath();
      ctx.arc(cx, cy, SUN_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = color.reference;
      ctx.fill();

      const angle = still ? STILL_ANGLE : angleRef.current;
      planets.forEach((planet, index) => {
        const normalizedRadius = Math.min(
          Math.max(planet.radius / MAX_RADIUS, 0),
          1
        );
        const orbit = MIN_ORBIT + normalizedRadius * (usableRadius - MIN_ORBIT);
        const dotR = Math.max(4, Math.min(16, (planet.size / 100) * 10));

        ctx.beginPath();
        ctx.arc(cx, cy, orbit, 0, Math.PI * 2);
        ctx.strokeStyle = color.axis;
        ctx.lineWidth = 1;
        ctx.stroke();

        const px = cx + orbit * Math.cos((angle * planet.speed) / 10);
        const py = cy + orbit * Math.sin((angle * planet.speed) / 10);

        ctx.beginPath();
        ctx.arc(px, py, dotR, 0, Math.PI * 2);
        ctx.fillStyle = planetColor(planet, index);
        ctx.fill();

        ctx.fillStyle = color.ink;
        ctx.font = `600 12px ${font.ui}`;
        ctx.textAlign = "center";
        ctx.fillText(planet.name, px, py - dotR - 6);
      });

      if (still) return;
      angleRef.current += 0.01;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationRef.current);
  }, [planets]);

  if (planets.length === 0) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Run your code to add planets and watch them orbit the sun." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const fastestIndex = planets.reduce(
    (best, p, i) => (p.speed > planets[best].speed ? i : best),
    0
  );
  const farthestIndex = planets.reduce(
    (best, p, i) => (p.radius > planets[best].radius ? i : best),
    0
  );
  // When every planet has the same speed, no single planet is fastest.
  const speedsTied = planets.every((p) => p.speed === planets[0].speed);
  const summary = planets
    .map((p) => `${p.name} at radius ${p.radius}, speed ${p.speed.toFixed(1)}`)
    .join("; ");

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <div
          style={{
            flex: 1,
            minHeight: 280,
            width: "100%",
            height: "100%",
            borderRadius: radius.md,
            overflow: "hidden",
            background: color.surfaceRaised,
            border: `1px solid ${color.border}`,
          }}
        >
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={`${planets.length} planets orbiting the sun: ${summary}`}
            style={{ display: "block", width: "100%", height: "100%" }}
          />
        </div>
      </PluginStage>

      <StatRow
        stats={[
          { label: "Planets", value: String(planets.length) },
          {
            label: "Fastest",
            value: speedsTied ? "Tie" : planets[fastestIndex].name,
            color: speedsTied ? color.ink : planetColor(planets[fastestIndex], fastestIndex),
          },
          {
            label: "Farthest Out",
            value: planets[farthestIndex].name,
            color: planetColor(planets[farthestIndex], farthestIndex),
          },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
