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
// Rough spacing between equipotentials, as a fraction of the canvas's
// shorter side.
const POT_SPACING = 0.045;

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

// Field lines per unit of charge. Every charge, positive or negative, has
// this many lines per unit touching it, so the line count is proportional
// to the charge.
const LINES_PER_UNIT = 12;

const linesFor = (q: number) =>
  Math.max(1, Math.round(LINES_PER_UNIT * Math.abs(q)));

type FieldLine = {
  pts: [number, number][];
  /** Which way the field points relative to the order of `pts`. */
  dir: 1 | -1;
  /** The charge the line ran into, or null if it escaped to infinity. */
  end: Charge | null;
};

/**
 * Follows the field from (x, y) — along it for dir = 1, against it for
 * dir = -1 — until the line runs into a charge that absorbs it (a negative
 * one going forward, a positive one going back) or escapes to infinity.
 *
 * Lines are traced well past the canvas edge: a dipole's outer lines swing
 * out of view and come back to the other charge, and stopping at the edge
 * would cut them off.
 */
function traceFieldLine(
  x: number,
  y: number,
  dir: 1 | -1,
  charges: Charge[],
  w: number,
  h: number
): FieldLine {
  const escape = 25 * Math.max(w, h);
  const pts: [number, number][] = [[x, y]];
  for (let i = 0; i < 6000; i++) {
    // Steps stay short near charges, where the field bends sharply, and grow
    // far away, where it is nearly straight.
    let dMin = Infinity;
    for (const c of charges) dMin = Math.min(dMin, Math.hypot(x - c.cx, y - c.cy));
    const step = Math.min(40, Math.max(1.5, 0.03 * dMin));

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

    const sink = charges.find(
      (c) => c.q * dir < 0 && Math.hypot(x - c.cx, y - c.cy) < CHARGE_R
    );
    if (sink) return { pts, dir, end: sink };
    if (Math.hypot(x - w / 2, y - h / 2) > escape) break;
  }
  return { pts, dir, end: null };
}

const angleGap = (a: number, b: number) => {
  const d = Math.abs(a - b) % (2 * Math.PI);
  return Math.min(d, 2 * Math.PI - d);
};

/**
 * Every positive charge sends out its lines. Each negative charge then
 * counts the lines that arrived at it and, if it is still short of its share,
 * gets the rest traced back out from the widest gaps around it. Those come
 * in from infinity, like the extra lines of a net-negative arrangement do.
 */
function buildFieldLines(charges: Charge[], w: number, h: number): FieldLine[] {
  const lines: FieldLine[] = [];
  const arrivals = new Map<Charge, number[]>();

  for (const src of charges.filter((c) => c.q > 0)) {
    const count = linesFor(src.q);
    for (let i = 0; i < count; i++) {
      const angle = (2 * Math.PI * i) / count;
      const line = traceFieldLine(
        src.cx + Math.cos(angle) * (CHARGE_R + 1),
        src.cy + Math.sin(angle) * (CHARGE_R + 1),
        1,
        charges,
        w,
        h
      );
      lines.push(line);
      if (line.end) {
        const [ex, ey] = line.pts[line.pts.length - 1];
        const list = arrivals.get(line.end) ?? [];
        list.push(Math.atan2(ey - line.end.cy, ex - line.end.cx));
        arrivals.set(line.end, list);
      }
    }
  }

  for (const sink of charges.filter((c) => c.q < 0)) {
    const taken = arrivals.get(sink) ?? [];
    const missing = linesFor(sink.q) - taken.length;
    if (missing <= 0) continue;

    let angles: number[];
    if (taken.length === 0) {
      angles = Array.from({ length: missing }, (_, i) => (2 * Math.PI * i) / missing);
    } else {
      // Greedily take the direction farthest from every line already there.
      angles = [];
      const used = [...taken];
      for (let k = 0; k < missing; k++) {
        let best = 0;
        let bestGap = -1;
        for (let d = 0; d < 360; d++) {
          const a = (d * Math.PI) / 180;
          const gap = Math.min(...used.map((u) => angleGap(a, u)));
          if (gap > bestGap) {
            bestGap = gap;
            best = a;
          }
        }
        angles.push(best);
        used.push(best);
      }
    }

    for (const angle of angles) {
      lines.push(
        traceFieldLine(
          sink.cx + Math.cos(angle) * (CHARGE_R + 1),
          sink.cy + Math.sin(angle) * (CHARGE_R + 1),
          -1,
          charges,
          w,
          h
        )
      );
    }
  }
  return lines;
}

function drawFieldLines(
  ctx: CanvasRenderingContext2D,
  charges: Charge[],
  w: number,
  h: number
) {
  ctx.save();
  ctx.strokeStyle = FIELD_LINE_COLOR;
  ctx.fillStyle = FIELD_LINE_COLOR;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1.25;
  ctx.lineJoin = "round";

  for (const { pts, dir } of buildFieldLines(charges, w, h)) {
    if (pts.length < 2) continue;

    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1]);
    ctx.stroke();

    // One arrowhead, pointing the way the field points, halfway along the
    // longest stretch of the line that is on screen.
    let bestStart = 0;
    let bestLen = 0;
    let runStart = -1;
    for (let k = 0; k <= pts.length; k++) {
      const inside =
        k < pts.length &&
        pts[k][0] >= 0 &&
        pts[k][0] <= w &&
        pts[k][1] >= 0 &&
        pts[k][1] <= h;
      if (inside && runStart < 0) runStart = k;
      if (!inside && runStart >= 0) {
        if (k - runStart > bestLen) {
          bestLen = k - runStart;
          bestStart = runStart;
        }
        runStart = -1;
      }
    }
    if (bestLen < 20) continue;
    const mid = bestStart + Math.floor(bestLen / 2);
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

  // Levels are chosen from the potential actually on the canvas, so the
  // contours come out about evenly spaced everywhere, around one charge or
  // closing around several. Each sample counts in inverse proportion to its
  // distance from the nearest charge: around a lone charge that makes every
  // ring an equal share, so the rings are evenly spaced, and nowhere do the
  // levels bunch up the way fixed levels do where V passes through zero.
  const samples: { v: number; weight: number }[] = [];
  let total = 0;
  for (let j = 0; j <= ny; j++) {
    for (let i = 0; i <= nx; i++) {
      const x = off + i * POT_CELL;
      const y = off + j * POT_CELL;
      let dMin = Infinity;
      for (const c of charges) dMin = Math.min(dMin, Math.hypot(x - c.cx, y - c.cy));
      if (dMin < CHARGE_R) continue;
      samples.push({ v: v[j * cols + i], weight: 1 / dMin });
      total += 1 / dMin;
    }
  }
  samples.sort((a, b) => a.v - b.v);

  const spacing = POT_SPACING * Math.min(w, h);
  // Each sample stands for one cell of area, and a ring of width `spacing`
  // around a charge carries 2π·spacing of weight·area, so that many rings fit.
  const count = Math.max(
    1,
    Math.round((total * POT_CELL * POT_CELL) / (2 * Math.PI * spacing))
  );
  const levels: number[] = [];
  let acc = 0;
  let next = 1;
  for (let k = 0; k < samples.length - 1 && next <= count; k++) {
    acc += samples[k].weight;
    if (acc >= (next * total) / (count + 1)) {
      // Between two samples, so no grid point sits exactly on the level.
      levels.push((samples[k].v + samples[k + 1].v) / 2);
      next++;
    }
  }

  // Between opposite charges, the level nearest zero becomes exactly V = 0.
  if (charges.some((c) => c.q > 0) && charges.some((c) => c.q < 0) && levels.length) {
    let nearest = 0;
    for (let k = 1; k < levels.length; k++) {
      if (Math.abs(levels[k]) < Math.abs(levels[nearest])) nearest = k;
    }
    levels[nearest] = 0;
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
