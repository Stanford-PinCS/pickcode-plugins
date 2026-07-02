// Spring Lab — canvas renderer. MobX observer + RAF loop.
// Visual style strictly mirrors momentum-2d:
//   - black bg #000
//   - top-left monospace HUD
//   - faint gray grid rgba(148,163,184,0.18)
//   - object glow shadowBlur:18, warm #fbbf24bb
//   - red dashed reference line rgba(239,68,68,0.55)
//   - all canvas 2D, no SVG/DOM physics
//   - dt clamped via Math.min(dt, 0.05)
// Per the user's directive in Checkpoint 3 follow-up: NO right-corner DATA panel.

import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { getSnapshotAtTime } from "./springLabCore";
import { SpringLabState } from "./state";

// --- Visual constants ---
const CANVAS_W = 700;
const CANVAS_H = 400;
const DEFAULT_CANVAS_DISPLAY_SIZE = { width: CANVAS_W, height: CANVAS_H };
const PX_PER_METER = 600; // 1 m → 600 px
const SPRING_X = CANVAS_W / 2; // = 350
const COLOR_BG = "#000";
const COLOR_REF = "rgba(239,68,68,0.55)";
const COLOR_GLOW = "#fbbf24bb";
const COLOR_MASS_FILL = "#fbbf24";
const COLOR_SPRING = "#fde68a";
const COLOR_HUD = "#fbbf24";
const COLOR_HUD_DIM = "#94a3b8";

// Mini-chart (below HUD stats, same left margin)
// Y-axis: spring extension from the natural-length endpoint, in canvas px.
// Zero line = spring natural end = (0.05 + 0.30) m × PX_PER_METER = 210 px.
// Different masses have different equilibrium depths → visually distinct wave centers.
// X-axis: normalised to 2T per wave (each wave fills chart width in 2 periods).
const CHART_X = 40;               // left gutter reserved for y-axis labels
const CHART_W = CANVAS_W - CHART_X;
// Fixed time-to-pixel scale: 10 seconds fills the chart width.
const CHART_PX_PER_SEC = CHART_W / 10;
// Fixed vertical span, anchored at the natural-length y position.
const CHART_ZERO_Y = Math.round((0.05 + 0.30) * PX_PER_METER); // 210 px — spring natural end
const CHART_TOP = CHART_ZERO_Y - 10;    // 200 px  — a sliver above zero for the border
const CHART_BOTTOM = 376;               // fixed bottom; leaves room for period tick labels below

// Color palette — one per successive mass run
const WAVE_COLORS = [
  "#60a5fa", // blue
  "#34d399", // green
  "#f472b6", // pink
  "#a78bfa", // purple
  "#fb923c", // orange
  "#22d3ee", // cyan
  "#facc15", // yellow
];

type WaveRecord = {
  mass: number;
  period: number;
  amplitude: number;
  equilibriumYPx: number; // canvas y of this mass's equilibrium = CHART_ZERO_Y + x_eq*PX_PER_METER
  color: string;
};

type Props = {
  state: SpringLabState;
};

// Survives module re-evaluations (student code re-runs) by living on window.
declare global { interface Window { __shmWaveHistory?: WaveRecord[] } }
if (!window.__shmWaveHistory) window.__shmWaveHistory = [];
const _waveHistory: WaveRecord[] = window.__shmWaveHistory;

const Component = observer(function Component({ state }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const stateRef = useRef(state);
  const [canvasDisplaySize, setCanvasDisplaySize] = useState(
    DEFAULT_CANVAS_DISPLAY_SIZE
  );

  stateRef.current = state;

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      html,
      body,
      #root {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        overflow: hidden;
        background: ${COLOR_BG};
      }

      * {
        box-sizing: border-box;
      }
    `;
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, []);

  useEffect(() => {
    const updateCanvasSize = () => {
      const container = containerRef.current;
      if (!container) return;

      const { width, height } = container.getBoundingClientRect();
      const scale = Math.min(width / CANVAS_W, height / CANVAS_H);
      if (!Number.isFinite(scale) || scale <= 0) return;

      const nextSize = {
        width: Math.max(1, Math.floor(CANVAS_W * scale)),
        height: Math.max(1, Math.floor(CANVAS_H * scale)),
      };

      setCanvasDisplaySize((currentSize) =>
        currentSize.width === nextSize.width &&
        currentSize.height === nextSize.height
          ? currentSize
          : nextSize
      );
    };

    updateCanvasSize();

    const observer =
      "ResizeObserver" in window
        ? new ResizeObserver(updateCanvasSize)
        : null;
    if (observer && containerRef.current) {
      observer.observe(containerRef.current);
    }
    window.addEventListener("resize", updateCanvasSize);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, []);

  // When animation begins, register a wave record for this mass.
  // If this exact mass has been run before, reuse its slot (same color, no duplicate).
  useEffect(() => {
    if (state.phase === "playing" && state.model && state.derived) {
      const activeMass = state.model.inputs.activeMass;
      const existing   = _waveHistory.findIndex(
        (w) => Math.abs(w.mass - activeMass) < 1e-9
      );
      if (existing !== -1) return; // already tracked — replay without adding
      const snap       = getSnapshotAtTime(state.model.inputs, state.derived, 0);
      const colorIndex = _waveHistory.length;
      _waveHistory.push({
        mass: activeMass,
        period: snap.hudPeriod,
        amplitude: state.derived.amplitude,
        equilibriumYPx: snap.equilibriumY * PX_PER_METER,
        color: WAVE_COLORS[colorIndex % WAVE_COLORS.length],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  // RAF loop: advance simTime, render.
  useEffect(() => {
    function tick(ts: number) {
      const last = lastTsRef.current;
      lastTsRef.current = ts;
      if (last != null) {
        const dt = Math.min((ts - last) / 1000, 0.05);
        stateRef.current.advanceTime(dt);
      }
      render();
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function render() {
    const currentState = stateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);


    if (!currentState.model || !currentState.derived) {
      drawWaveChart(ctx, currentState);
      drawIdleHud(ctx);
      drawLegend(ctx);
      return;
    }

    const snap = getSnapshotAtTime(
      currentState.model.inputs,
      currentState.derived,
      currentState.simTime
    );

    const supportY      = snap.springTopY    * PX_PER_METER;
    const massYPx       = snap.massY         * PX_PER_METER;
    const equilibriumYPx = snap.equilibriumY * PX_PER_METER;

    // Wave chart (left column, below HUD stats)
    drawWaveChart(ctx, currentState);

    const waves = _waveHistory;

    // Full-width equilibrium lines for every historical mass.
    // Latest wave → red; earlier waves → their wave colour (semi-transparent).
    // Drawn before the spring apparatus so the spring renders on top.
    if ((currentState.model.display.showEquilibriumLine ?? true) && waves.length > 0) {
      ctx.save();
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      ctx.font = "10px ui-monospace,Menlo,monospace";
      for (let i = 0; i < waves.length; i++) {
        const wave     = waves[i];
        const isLatest = i === waves.length - 1;
        ctx.strokeStyle = wave.color;
        ctx.globalAlpha = isLatest ? 0.85 : 0.38;
        ctx.beginPath();
        ctx.moveTo(CHART_X, wave.equilibriumYPx);
        ctx.lineTo(CANVAS_W, wave.equilibriumYPx);
        ctx.stroke();
        // Mass label at right edge
        ctx.setLineDash([]);
        ctx.fillStyle   = wave.color;
        ctx.globalAlpha = 1.0;
        ctx.font        = "bold 13px ui-monospace,Menlo,monospace";
        ctx.textAlign   = "right";
        ctx.fillText(`${(wave.mass * 1000).toFixed(0)}g`, CANVAS_W - 20, wave.equilibriumYPx - 3);
        ctx.setLineDash([6, 6]);
      }
      ctx.restore();
    }

    // Support beam
    ctx.fillStyle = "#475569";
    ctx.fillRect(SPRING_X - 80, supportY - 8, 160, 8);
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1;
    for (let i = -70; i <= 70; i += 10) {
      ctx.beginPath();
      ctx.moveTo(SPRING_X + i, supportY - 8);
      ctx.lineTo(SPRING_X + i - 4, supportY - 14);
      ctx.stroke();
    }

    // Spring
    drawSpring(ctx, SPRING_X, supportY, massYPx - 24);

    // Mass block
    ctx.save();
    ctx.shadowBlur = 18;
    ctx.shadowColor = COLOR_GLOW;
    ctx.fillStyle = COLOR_MASS_FILL;
    ctx.fillRect(SPRING_X - 28, massYPx - 24, 56, 48);
    ctx.restore();
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(SPRING_X - 28, massYPx - 24, 56, 48);

    // Horizontal dashed connector: wave tip → block center (drawn on top of block).
    // waveTipY = equilibriumYPx + displacement × PX_PER_METER = massYPx  (same scale)
    // so the line is always perfectly horizontal.
    if (waves.length > 0 && currentState.phase === "playing") {
      const wave = waves[waves.length - 1];
      const waveTipX = CHART_X + Math.min(currentState.simTime * CHART_PX_PER_SEC, CHART_W);
      ctx.save();
      ctx.strokeStyle = wave.color;
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.9;
      ctx.shadowBlur = 6;
      ctx.shadowColor = wave.color;
      ctx.beginPath();
      ctx.moveTo(waveTipX, massYPx);
      ctx.lineTo(SPRING_X, massYPx);
      ctx.stroke();

      // Dot at block center
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(SPRING_X, massYPx, 5, 0, Math.PI * 2);
      ctx.fillStyle = wave.color;
      ctx.fill();
      ctx.restore();
    }

    drawHud(ctx, currentState, snap);
    drawLegend(ctx);
  }

  // ---------------------------------------------------------------------------
  // Mini waveform chart
  //
  // Each wave is drawn centred at its own equilibriumYPx (= CHART_ZERO_Y + x_eq·px).
  // Heavier masses → larger x_eq → lower centre in chart.
  // The y-scale equals PX_PER_METER, so wave tip y == massYPx (enables horizontal
  // dashed connector to the block).
  // ---------------------------------------------------------------------------
  function drawWaveChart(ctx: CanvasRenderingContext2D, s: SpringLabState) {
    const waves = _waveHistory;
    const cx = CHART_X;
    const cw = CHART_W;
    const cy = CHART_TOP;
    const ch = CHART_BOTTOM - CHART_TOP;



    // Chart background + border
    ctx.fillStyle = "rgba(15,23,42,0.55)";
    ctx.fillRect(cx, cy, cw, ch);
    ctx.strokeStyle = "rgba(148,163,184,0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(cx, cy, cw, ch);

    // Natural-length reference line — full canvas width, same style as equilibrium lines
    ctx.strokeStyle = "rgba(148,163,184,0.5)";
    ctx.setLineDash([3, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(CHART_X, CHART_ZERO_Y);
    ctx.lineTo(CANVAS_W, CHART_ZERO_Y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 11px ui-monospace,Menlo,monospace";
    ctx.textAlign = "right";
    ctx.fillText("natural length", CANVAS_W - 20, CHART_ZERO_Y - 4);

    // Y-axis: spring extension x measured from the natural-length endpoint, in metres.
    // Matches x_eq / x_now shown in the HUD (positive = spring stretched downward).
    {
      ctx.save();
      ctx.font = "bold 10px ui-monospace,Menlo,monospace";
      ctx.fillStyle = "#94a3b8";
      ctx.strokeStyle = "rgba(148,163,184,0.45)";
      ctx.lineWidth = 1;
      // Tick marks every 0.05 m — line extends right from chart left border
      for (let i = 0; i <= 5; i++) {
        const xM = i * 0.05;
        const ty = CHART_ZERO_Y + xM * PX_PER_METER;
        if (ty < CHART_TOP || ty > CHART_BOTTOM) continue;
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.moveTo(cx, ty);
        ctx.lineTo(cx + 6, ty);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.textAlign = "right";
        ctx.fillText(xM.toFixed(2) + "m", cx - 2, ty + 3);
      }
      ctx.restore();
    }

    // Time axis — always visible, tick mark + second label every 1 s.
    ctx.save();
    ctx.font = "bold 10px ui-monospace,Menlo,monospace";
    ctx.strokeStyle = "rgba(148,163,184,0.45)";
    ctx.lineWidth = 1;
    for (let s = 0; s <= 10; s++) {
      const tx = cx + s * CHART_PX_PER_SEC;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.moveTo(tx, CHART_BOTTOM);
      ctx.lineTo(tx, CHART_BOTTOM + 5);
      ctx.stroke();
      if (s < 10) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#94a3b8";
        ctx.textAlign = s === 0 ? "left" : "center";
        ctx.fillText(s === 0 ? "0" : `${s}s`, tx, CHART_BOTTOM + 14);
      }
    }

    ctx.restore();

    if (waves.length === 0) {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "11px ui-monospace,Menlo,monospace";
      ctx.textAlign = "center";
      ctx.fillText("awaiting run()", cx + cw / 2, CHART_ZERO_Y + 40);
      return;
    }

    const isPlaying = s.phase === "playing";
    const simTime   = s.simTime;

    // Clip all wave drawing to the chart box
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx, cy, cw, ch);
    ctx.clip();

    for (let i = 0; i < waves.length; i++) {
      const wave          = waves[i];
      const isCurrentWave = i === waves.length - 1 && isPlaying;
      const drawUpTo      = isCurrentWave ? simTime : cw / CHART_PX_PER_SEC;

      const omega    = (2 * Math.PI) / wave.period;
      const pixelEnd = Math.floor(Math.min(drawUpTo * CHART_PX_PER_SEC, cw));

      ctx.save();
      if (isCurrentWave) { ctx.shadowBlur = 5; ctx.shadowColor = wave.color; }
      ctx.strokeStyle  = wave.color;
      ctx.lineWidth    = isCurrentWave ? 2 : 1.5;
      ctx.globalAlpha  = isCurrentWave ? 1.0 : 0.75;

      ctx.beginPath();
      for (let px = 0; px <= pixelEnd; px++) {
        const t            = px / CHART_PX_PER_SEC;
        const displacement = wave.amplitude * Math.cos(omega * t);
        // Positive displacement = block below equilibrium = higher canvas y.
        // Y-scale identical to spring animation → wave tip y == massYPx.
        const screenY = wave.equilibriumYPx + displacement * PX_PER_METER;
        if (px === 0) ctx.moveTo(cx + px, screenY);
        else          ctx.lineTo(cx + px, screenY);
      }
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore(); // end chart clip
  }

  function drawLegend(ctx: CanvasRenderingContext2D) {
    const waves = _waveHistory;
    if (waves.length === 0) return;
    ctx.font = "bold 11px ui-monospace,Menlo,monospace";
    ctx.textAlign = "left";
    let ly = 116;
    for (const wave of waves) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = wave.color;
      ctx.fillRect(16, ly - 8, 8, 8);
      ctx.fillStyle = "#e2e8f0";
      ctx.fillText(`${(wave.mass * 1000).toFixed(0)}g`, 28, ly);
      ly += 17;
    }
  }

  function drawSpring(ctx: CanvasRenderingContext2D, x: number, yTop: number, yBottom: number) {
    const segments = 18;
    const segLen   = (yBottom - yTop) / segments;
    const amp      = 14;
    ctx.save();
    ctx.shadowBlur  = 12;
    ctx.shadowColor = "rgba(253,230,138,0.5)";
    ctx.strokeStyle = COLOR_SPRING;
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(x, yTop);
    for (let i = 1; i <= segments; i++) {
      const y    = yTop + i * segLen;
      const sign = i % 2 === 0 ? 1 : -1;
      ctx.lineTo(x + sign * amp, y - segLen / 2);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawIdleHud(ctx: CanvasRenderingContext2D) {
    const supportY   = 0.05 * PX_PER_METER;
    const naturalEndY = (0.05 + 0.30) * PX_PER_METER;

    ctx.fillStyle = "#475569";
    ctx.fillRect(SPRING_X - 80, supportY - 8, 160, 8);
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1;
    for (let i = -70; i <= 70; i += 10) {
      ctx.beginPath();
      ctx.moveTo(SPRING_X + i, supportY - 8);
      ctx.lineTo(SPRING_X + i - 4, supportY - 14);
      ctx.stroke();
    }
    drawSpring(ctx, SPRING_X, supportY, naturalEndY);
    ctx.strokeStyle = "rgba(253,230,138,0.45)";
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(SPRING_X - 18, naturalEndY);
    ctx.lineTo(SPRING_X + 18, naturalEndY);
    ctx.stroke();

    ctx.fillStyle = COLOR_HUD_DIM;
    ctx.font      = "12px ui-monospace,Menlo,monospace";
    ctx.textAlign = "left";
    ctx.fillText("SPRING LAB · waiting for run()", 16, 24);
  }

  function drawHud(
    ctx: CanvasRenderingContext2D,
    s: SpringLabState,
    snap: ReturnType<typeof getSnapshotAtTime>
  ) {
    const lines: Array<[string, string, string]> = [];
    const method = s.model!.inputs.method;
    const m      = s.model!.inputs.activeMass;

    lines.push(["SPRING LAB", method.toUpperCase(), COLOR_HUD]);
    lines.push(["m         ", `${m.toFixed(3)} kg`,  COLOR_HUD_DIM]);

    if (method === "static") {
      const xEq = snap.equilibriumY - snap.naturalEndY;
      lines.push(["x_eq      ", `${xEq.toFixed(4)} m`,                          COLOR_HUD_DIM]);
      lines.push(["x_now     ", `${(snap.massY - snap.naturalEndY).toFixed(4)} m`, COLOR_HUD_DIM]);
    } else {
      lines.push(["T (sim)   ", `${snap.hudPeriod.toFixed(3)} s`, COLOR_HUD_DIM]);
    }


    lines.push(["rows      ", `${s.derived!.rowCount}`,      COLOR_HUD_DIM]);

    ctx.font      = "12px ui-monospace,Menlo,monospace";
    ctx.textAlign = "left";
    let y = 22;
    for (const [label, value, color] of lines) {
      ctx.fillStyle = color;
      ctx.fillText(`${label} ${value}`, 16, y);
      y += 18;
    }
  }

  // Stop when the waveform reaches the right edge of the canvas (10 s).
  useEffect(() => {
    if (state.phase !== "playing") return;
    if (state.simTime >= CANVAS_W / CHART_PX_PER_SEC) state.finish();
  }, [state.simTime, state.phase]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: COLOR_BG,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 0,
      }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{
          display: "block",
          width: canvasDisplaySize.width,
          height: canvasDisplaySize.height,
          maxWidth: "100%",
          maxHeight: "100%",
          flex: "0 0 auto",
          borderRadius: 8,
        }}
      />
    </div>
  );
});

export default Component;
