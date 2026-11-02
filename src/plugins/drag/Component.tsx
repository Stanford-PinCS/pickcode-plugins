import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { color, font, radius } from "../../common/tokens";
import { ticks } from "../../common/chart";
import {
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
  EMPTY,
} from "../../common/PluginSurface";
import State from "./state";
import type { Position } from "./messages";
import instructions from "./instructions.md?raw";

// Room around the flight, in CSS pixels: legend on top, distance labels below.
const PAD = { top: 52, right: 24, bottom: 34, left: 24 };
// The view never zooms in closer than this many meters, so a short flight
// doesn't fill the pane with one huge dot.
const MIN_WIDTH_M = 20;
const MIN_HEIGHT_M = 10;

/** Where a path crosses the ground (y = 0), found between its last two points. */
function landingX(path: Position[]): number | null {
  if (path.length < 2) return null;
  const a = path[path.length - 2];
  const b = path[path.length - 1];
  if (b.y >= 0) return null;
  if (a.y <= 0) return b.x;
  return a.x + ((b.x - a.x) * a.y) / (a.y - b.y);
}

const meters = (x: number | null) => (x === null ? EMPTY : `${x.toFixed(1)} m`);

const Component = observer(({ state }: { state: State }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const hasData = state.actualPath.length > 0 || state.predictedPath.length > 0;

  // Track the container's size so the drawing refits when the pane resizes.
  useEffect(() => {
    const container = canvasRef.current?.parentElement;
    if (!container) return;
    const measure = () =>
      setSize({ w: container.clientWidth, h: container.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [hasData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.w === 0 || size.h === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { w, h } = size;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(w * dpr)) canvas.width = Math.round(w * dpr);
    if (canvas.height !== Math.round(h * dpr))
      canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Fit both paths, with x and y on the same scale so the arc keeps its
    // true shape. Paths only grow during a run, so the view only zooms out.
    const all = [...state.predictedPath, ...state.actualPath];
    const xMin = Math.min(0, ...all.map((p) => p.x));
    const xMax = Math.max(xMin + MIN_WIDTH_M, ...all.map((p) => p.x));
    const yMax = Math.max(MIN_HEIGHT_M, ...all.map((p) => p.y));
    const plotW = Math.max(w - PAD.left - PAD.right, 1);
    const plotH = Math.max(h - PAD.top - PAD.bottom, 1);
    const scale = Math.min(plotW / (xMax - xMin), plotH / yMax);
    const groundY = PAD.top + yMax * scale;
    const toX = (x: number) => PAD.left + (x - xMin) * scale;
    const toY = (y: number) => groundY - y * scale;

    // Ground, with distance labels in meters.
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(w, groundY);
    ctx.strokeStyle = color.axis;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = `11px ${font.data}`;
    ctx.fillStyle = color.inkMuted;
    ctx.textAlign = "center";
    for (const t of ticks(xMax)) {
      const x = toX(t);
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x, groundY + 4);
      ctx.strokeStyle = color.axis;
      ctx.stroke();
      ctx.fillText(`${t} m`, x, groundY + 17);
    }

    // Predicted path: amber dots, one per prediction step.
    ctx.fillStyle = color.reference;
    for (const pos of state.predictedPath) {
      ctx.beginPath();
      ctx.arc(toX(pos.x), toY(Math.max(pos.y, 0)), 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Actual path: a solid pink line.
    ctx.beginPath();
    ctx.strokeStyle = color.series[0];
    ctx.lineWidth = 2.5;
    state.actualPath.forEach((pos, index) => {
      const x = toX(pos.x);
      const y = toY(Math.max(pos.y, 0));
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // The ball, on the actual path.
    if (state.actualPath.length > 0) {
      ctx.beginPath();
      ctx.arc(
        toX(state.ballPosition.x),
        toY(Math.max(state.ballPosition.y, 0)),
        6,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = color.series[0];
      ctx.fill();
    }

    // Legend
    ctx.textAlign = "left";
    ctx.font = `600 12px ${font.ui}`;
    ctx.fillStyle = color.reference;
    ctx.beginPath();
    ctx.arc(18, 18, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText("Your prediction", 28, 22);
    ctx.strokeStyle = color.series[0];
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(12, 36);
    ctx.lineTo(24, 36);
    ctx.stroke();
    ctx.fillStyle = color.series[0];
    ctx.fillText("Actual flight", 28, 40);
  }, [
    state.predictedPath,
    state.actualPath,
    state.ballPosition,
    state.isComplete,
    state.currentAnimation,
    size,
  ]);

  if (!hasData) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Run your code to launch the ball and compare your predicted path to its actual flight." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const predictionDone =
    state.currentAnimation === "actual" || state.isComplete;
  const predictedLanding = predictionDone
    ? landingX(state.predictedPath)
    : null;
  const actualLanding = state.isComplete ? landingX(state.actualPath) : null;

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <div
          style={{
            width: "100%",
            height: "100%",
            minHeight: 0,
            background: color.surfaceRaised,
            border: `1px solid ${color.border}`,
            borderRadius: radius.md,
            overflow: "hidden",
          }}
        >
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={`Ball flight: predicted landing ${meters(predictedLanding)}, actual landing ${meters(actualLanding)}`}
            style={{ display: "block", width: "100%", height: "100%" }}
          />
        </div>
      </PluginStage>

      <StatRow
        stats={[
          {
            label: "Predicted Landing",
            value: meters(predictedLanding),
            color: color.reference,
          },
          {
            label: "Actual Landing",
            value: meters(actualLanding),
            color: color.series[0],
          },
          {
            label: "Status",
            value: state.error
              ? "Error"
              : state.isComplete
                ? "Complete"
                : "Running",
          },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
