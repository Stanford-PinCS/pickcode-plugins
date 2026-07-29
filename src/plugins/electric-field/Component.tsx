import { observer } from "mobx-react-lite";
import { useRef, useEffect, useState } from "react";
import { color, font } from "../../common/tokens";
import {
  EMPTY,
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import State from "./state";
import instructions from "./instructions.md?raw";

// Field-line sampling grid resolution.
const GRID = 22;
// A positive test charge for computing field direction/strength.
const K = 1;

const Component = observer(({ state }: { state: State }) => {
  const particles = state.particles ?? [];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 600, h: 460 });

  // Size the canvas to its container, DPR-aware for sharpness.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.parentElement;
    if (!container) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = container.clientWidth;
      const h = container.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      setSize({ w, h });
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [particles.length]);

  // Draw the field and charges.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { w, h } = size;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = color.surfaceRaised;
    ctx.fillRect(0, 0, w, h);

    // Field vectors on a grid.
    if (particles.length > 0) {
      for (let gx = 0; gx < GRID; gx++) {
        for (let gy = 0; gy < GRID; gy++) {
          const px = ((gx + 0.5) / GRID) * w;
          const py = ((gy + 0.5) / GRID) * h;

          let ex = 0;
          let ey = 0;
          for (const p of particles) {
            const cx = p.x * w;
            const cy = p.y * h;
            const dx = px - cx;
            const dy = py - cy;
            const r2 = dx * dx + dy * dy;
            if (r2 < 30) continue; // skip singularities near charges
            const r = Math.sqrt(r2);
            const e = (K * p.q) / r2;
            ex += (e * dx) / r;
            ey += (e * dy) / r;
          }

          const mag = Math.sqrt(ex * ex + ey * ey);
          if (mag < 1e-6) continue;

          // Arrow length scaled by (clamped) magnitude.
          const len = Math.min(14, 4 + mag * 400);
          const ux = ex / mag;
          const uy = ey / mag;

          const x1 = px - (ux * len) / 2;
          const y1 = py - (uy * len) / 2;
          const x2 = px + (ux * len) / 2;
          const y2 = py + (uy * len) / 2;

          ctx.strokeStyle = color.border;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          // Arrowhead
          const ah = 3;
          ctx.beginPath();
          ctx.moveTo(x2, y2);
          ctx.lineTo(x2 - ux * ah - uy * ah, y2 - uy * ah + ux * ah);
          ctx.moveTo(x2, y2);
          ctx.lineTo(x2 - ux * ah + uy * ah, y2 - uy * ah - ux * ah);
          ctx.stroke();
        }
      }
    }

    // Charges.
    for (const p of particles) {
      const cx = p.x * w;
      const cy = p.y * h;
      const positive = p.q >= 0;
      const fill = positive ? color.accent : "#2f7d8c";

      // Glow
      ctx.beginPath();
      ctx.arc(cx, cy, 16, 0, Math.PI * 2);
      ctx.fillStyle = positive
        ? "rgba(214,68,107,0.15)"
        : "rgba(47,125,140,0.15)";
      ctx.fill();

      // Body
      ctx.beginPath();
      ctx.arc(cx, cy, 11, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();

      // + / − sign
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy);
      ctx.lineTo(cx + 5, cy);
      if (positive) {
        ctx.moveTo(cx, cy - 5);
        ctx.lineTo(cx, cy + 5);
      }
      ctx.stroke();
    }
  }, [particles, size]);

  if (particles.length === 0) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Use createParticle(x, y, q) to place charges and see the electric field they create." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const positives = particles.filter((p) => p.q >= 0).length;
  const negatives = particles.length - positives;
  const netCharge = particles.reduce((sum, p) => sum + p.q, 0);

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            background: color.surfaceRaised,
            border: `1px solid ${color.border}`,
            borderRadius: 8,
            display: "block",
          }}
        />
      </PluginStage>

      <StatRow
        stats={[
          { label: "Charges", value: String(particles.length) },
          {
            label: "Positive",
            value: positives > 0 ? String(positives) : EMPTY,
            color: color.accent,
          },
          {
            label: "Negative",
            value: negatives > 0 ? String(negatives) : EMPTY,
            color: "#2f7d8c",
          },
          {
            label: "Net Charge",
            value: netCharge.toFixed(1),
          },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
