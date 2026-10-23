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
// Drawn radius of a charge, in px. Field lines start and end on this circle.
const CHARGE_R = 11;
// Equipotential sampling cell, in px.
const POT_CELL = 6;
// Equipotentials are drawn where a lone unit charge's potential would be at
// these distances, as fractions of the canvas's shorter side.
const POT_RADII = [0.06, 0.1, 0.15, 0.22, 0.32, 0.46];

const FIELD_LINE_COLOR = color.ink;
const EQUIPOTENTIAL_COLOR = color.series[3];

type Charge = { cx: number; cy: number; q: number };

function fieldAt(x: number, y: number, charges: Charge[]): [number, number] {
  let ex = 0;
  let ey = 0;
  for (const c of charges) {
    const dx = x - c.cx;
    const dy = y - c.cy;
    const r2 = Math.max(dx * dx + dy * dy, 1);
    const r = Math.sqrt(r2);
    ex += (K * c.q * dx) / (r2 * r);
    ey += (K * c.q * dy) / (r2 * r);
  }
  return [ex, ey];
}

function potentialAt(x: number, y: number, charges: Charge[]): number {
  let v = 0;
  for (const c of charges) {
    v += (K * c.q) / Math.max(Math.hypot(x - c.cx, y - c.cy), 1);
  }
  return v;
}

/**
 * Follows the field from (x, y) — along it for dir = 1, against it for
 * dir = -1 — until the line leaves the canvas or runs into a charge that
 * absorbs it (a negative one going forward, a positive one going back).
 */
function traceFieldLine(
  x: number,
  y: number,
  dir: 1 | -1,
  charges: Charge[],
  w: number,
  h: number
): [number, number][] {
  const step = 2;
  const maxSteps = Math.ceil((4 * (w + h)) / step);
  const pts: [number, number][] = [[x, y]];
  for (let i = 0; i < maxSteps; i++) {
    // Midpoint (RK2) step, so lines curve smoothly instead of drifting.
    const [e1x, e1y] = fieldAt(x, y, charges);
    const m1 = Math.hypot(e1x, e1y);
    if (m1 < 1e-12) break;
    const mx = x + (dir * e1x * step) / (2 * m1);
    const my = y + (dir * e1y * step) / (2 * m1);
    const [e2x, e2y] = fieldAt(mx, my, charges);
    const m2 = Math.hypot(e2x, e2y);
    if (m2 < 1e-12) break;
    x += (dir * e2x * step) / m2;
    y += (dir * e2y * step) / m2;
    pts.push([x, y]);

    if (x < 0 || x > w || y < 0 || y > h) break;
    const absorbed = charges.some(
      (c) => c.q * dir < 0 && Math.hypot(x - c.cx, y - c.cy) < CHARGE_R
    );
    if (absorbed) break;
  }
  return pts;
}

function drawFieldLines(
  ctx: CanvasRenderingContext2D,
  charges: Charge[],
  w: number,
  h: number
) {
  // Lines leave positive charges. With only negative charges, trace back from
  // them instead so the field still shows. A charge gets lines in proportion
  // to its size, which is what makes a stronger charge look stronger.
  const hasPositive = charges.some((c) => c.q > 0);
  const dir: 1 | -1 = hasPositive ? 1 : -1;
  const sources = charges.filter((c) => (hasPositive ? c.q > 0 : c.q < 0));

  ctx.save();
  ctx.strokeStyle = FIELD_LINE_COLOR;
  ctx.fillStyle = FIELD_LINE_COLOR;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1.25;
  ctx.lineJoin = "round";

  for (const src of sources) {
    const count = Math.min(36, Math.max(6, Math.round(12 * Math.abs(src.q))));
    for (let i = 0; i < count; i++) {
      const angle = (2 * Math.PI * i) / count;
      const pts = traceFieldLine(
        src.cx + Math.cos(angle) * (CHARGE_R + 1),
        src.cy + Math.sin(angle) * (CHARGE_R + 1),
        dir,
        charges,
        w,
        h
      );
      if (pts.length < 2) continue;

      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1]);
      ctx.stroke();

      // One arrowhead halfway along, pointing the way the field points.
      if (pts.length < 20) continue;
      const mid = Math.floor(pts.length / 2);
      const [ax, ay] = pts[mid];
      let ux = (pts[mid + 1][0] - pts[mid - 1][0]) * dir;
      let uy = (pts[mid + 1][1] - pts[mid - 1][1]) * dir;
      const m = Math.hypot(ux, uy) || 1;
      ux /= m;
      uy /= m;
      const ah = 5;
      ctx.beginPath();
      ctx.moveTo(ax + ux * ah, ay + uy * ah);
      ctx.lineTo(ax - ux * ah - uy * ah * 0.7, ay - uy * ah + ux * ah * 0.7);
      ctx.lineTo(ax - ux * ah + uy * ah * 0.7, ay - uy * ah - ux * ah * 0.7);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawEquipotentials(
  ctx: CanvasRenderingContext2D,
  charges: Charge[],
  w: number,
  h: number
) {
  // The grid is shifted off round numbers. A symmetric layout puts V = 0
  // exactly on a row or column of samples otherwise, where rounding noise
  // flips the sign from sample to sample and the line comes out dashed.
  const off = -0.37 * POT_CELL;
  const nx = Math.ceil((w - off) / POT_CELL);
  const ny = Math.ceil((h - off) / POT_CELL);
  const cols = nx + 1;
  const v = new Float64Array(cols * (ny + 1));
  for (let j = 0; j <= ny; j++) {
    for (let i = 0; i <= nx; i++) {
      v[j * cols + i] = potentialAt(
        off + i * POT_CELL,
        off + j * POT_CELL,
        charges
      );
    }
  }

  const base = Math.min(w, h);
  const levels: number[] = [];
  for (const r of POT_RADII) levels.push(K / (r * base), -K / (r * base));
  // V = 0 only exists between charges of opposite sign.
  if (charges.some((c) => c.q > 0) && charges.some((c) => c.q < 0)) {
    levels.push(0);
  }

  ctx.save();
  ctx.strokeStyle = EQUIPOTENTIAL_COLOR;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1;

  // Marching squares: in each cell, join the points where the level crosses
  // the cell's edges.
  for (const level of levels) {
    ctx.beginPath();
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const x0 = off + i * POT_CELL;
        const y0 = off + j * POT_CELL;
        const a = v[j * cols + i] - level; // top-left
        const b = v[j * cols + i + 1] - level; // top-right
        const c = v[(j + 1) * cols + i + 1] - level; // bottom-right
        const d = v[(j + 1) * cols + i] - level; // bottom-left

        const cross = (p: number, q: number) => p * q < 0;
        const t = (p: number, q: number) => p / (p - q);
        const top = cross(a, b) ? [x0 + t(a, b) * POT_CELL, y0] : null;
        const right = cross(b, c)
          ? [x0 + POT_CELL, y0 + t(b, c) * POT_CELL]
          : null;
        const bottom = cross(d, c)
          ? [x0 + t(d, c) * POT_CELL, y0 + POT_CELL]
          : null;
        const left = cross(a, d) ? [x0, y0 + t(a, d) * POT_CELL] : null;

        const seg = (p: number[] | null, q: number[] | null) => {
          if (!p || !q) return;
          ctx.moveTo(p[0], p[1]);
          ctx.lineTo(q[0], q[1]);
        };

        if (top && right && bottom && left) {
          // Saddle: the cell's centre decides which corners are joined.
          const centre = (a + b + c + d) / 4;
          if (centre * a > 0) {
            seg(top, right);
            seg(bottom, left);
          } else {
            seg(top, left);
            seg(right, bottom);
          }
        } else {
          const hits = [top, right, bottom, left].filter(Boolean);
          if (hits.length === 2) seg(hits[0], hits[1]);
        }
      }
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawLegend(ctx: CanvasRenderingContext2D, h: number) {
  const items = [
    { label: "Field lines", stroke: FIELD_LINE_COLOR, alpha: 0.55, width: 1.25 },
    {
      label: "Equipotentials",
      stroke: EQUIPOTENTIAL_COLOR,
      alpha: 0.5,
      width: 1,
    },
  ];
  ctx.save();
  ctx.font = `11px ${font.ui}`;
  ctx.textBaseline = "middle";
  let x = 12;
  const y = h - 14;
  for (const item of items) {
    ctx.globalAlpha = item.alpha;
    ctx.strokeStyle = item.stroke;
    ctx.lineWidth = item.width * 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 18, y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = color.inkMuted;
    ctx.fillText(item.label, x + 24, y);
    x += 24 + ctx.measureText(item.label).width + 18;
  }
  ctx.restore();
}

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

    const charges: Charge[] = particles.map((p) => ({
      cx: p.x * w,
      cy: p.y * h,
      q: p.q,
    }));
    if (charges.length > 0) drawEquipotentials(ctx, charges, w, h);

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

    if (charges.length > 0) drawFieldLines(ctx, charges, w, h);

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
      ctx.arc(cx, cy, CHARGE_R, 0, Math.PI * 2);
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

    if (charges.length > 0) drawLegend(ctx, h);
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
