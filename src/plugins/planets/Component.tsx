import { observer } from "mobx-react-lite";
import { useEffect, useRef } from "react";
import { color, font } from "../../common/tokens";
import {
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import State from "./state";
import instructions from "./instructions.md?raw";

const SPACE_BG = "#0b1020";

const Component = observer(({ state }: { state: State }) => {
  const planets = state.planets ?? [];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef(0);
  const angleRef = useRef(0);
  // Fixed star positions so they don't twinkle/regenerate each frame.
  const starsRef = useRef<{ x: number; y: number; b: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.parentElement;
    if (!container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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

      if (
        canvas.width !== canvasWidth ||
        canvas.height !== canvasHeight ||
        starsRef.current.length === 0
      ) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        starsRef.current = Array.from({ length: 220 }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          b: 120 + Math.random() * 135,
        }));
      }

      // Draw using normal CSS-pixel coordinates while the backing canvas
      // uses the sharper Retina resolution.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cx = w / 2;
      const cy = h / 2;

      // Background
      ctx.fillStyle = SPACE_BG;
      ctx.fillRect(0, 0, w, h);

      // Stars
      for (const s of starsRef.current) {
        ctx.fillStyle = `rgb(${s.b},${s.b},${s.b})`;
        ctx.fillRect(s.x, s.y, 1.5, 1.5);
      }

      // Scale orbits to fit.
      const MAX_RADIUS = 2000;
      const MIN_ORBIT = 35;
      const usableRadius = Math.max(MIN_ORBIT, Math.min(w, h) / 2 - 20);
      // Sun
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.fillStyle = color.accent;
      ctx.shadowColor = color.accent;
      ctx.shadowBlur = 28;
      ctx.fill();
      ctx.shadowBlur = 0;

      const angle = angleRef.current;
      for (const planet of planets) {
        const normalizedRadius = Math.min(
          Math.max(planet.radius / MAX_RADIUS, 0),
          1
        );
        const orbit = MIN_ORBIT + normalizedRadius * (usableRadius - MIN_ORBIT);
        const dotR = Math.max(4, Math.min(16, (planet.size / 100) * 10));

        ctx.beginPath();
        ctx.arc(cx, cy, orbit, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.14)";
        ctx.lineWidth = 1;
        ctx.stroke();

        const px = cx + orbit * Math.cos((angle * planet.speed) / 10);
        const py = cy + orbit * Math.sin((angle * planet.speed) / 10);

        ctx.beginPath();
        ctx.arc(px, py, dotR, 0, Math.PI * 2);
        ctx.fillStyle = planet.color || color.series[0];
        ctx.fill();

        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.font = `13px ${font.ui}`;
        ctx.textAlign = "center";
        ctx.fillText(planet.name, px, py - dotR - 6);
      }

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

  const fastest = planets.reduce((a, b) => (b.speed > a.speed ? b : a));
  const farthest = planets.reduce((a, b) => (b.radius > a.radius ? b : a));

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <div
          style={{
            flex: 1,
            minHeight: 280,
            width: "100%",
            height: "100%",
            borderRadius: 8,
            overflow: "hidden",
            background: SPACE_BG,
            border: `1px solid ${color.border}`,
          }}
        >
          <canvas
            ref={canvasRef}
            style={{ display: "block", width: "100%", height: "100%" }}
          />
        </div>
      </PluginStage>

      <StatRow
        stats={[
          { label: "Planets", value: String(planets.length) },
          { label: "Fastest", value: fastest.name, color: color.accent },
          { label: "Farthest Out", value: farthest.name },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
