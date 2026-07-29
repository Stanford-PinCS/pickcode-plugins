import { observer } from "mobx-react-lite";
import { useRef, useEffect, useState } from "react";
import { color } from "../../common/tokens";
import {
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
  EMPTY,
} from "../../common/PluginSurface";
import State from "./state";
import instructions from "./instructions.md?raw";

const Component = observer(({ state }: { state: State }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(10); // pixels per meter
  const [offsetX, setOffsetX] = useState(75);
  const [offsetY, setOffsetY] = useState(400);

  const hasData = state.actualPath.length > 0 || state.predictedPath.length > 0;

  // Size the canvas to its container.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.parentElement;
    if (!container) return;

    const setCanvasDimensions = () => {
      const dpr = window.devicePixelRatio || 1;
      const cssWidth = container.clientWidth;
      const cssHeight = container.clientHeight;

      // Backing store at device resolution...
      canvas.width = cssWidth * dpr;
      canvas.height = cssHeight * dpr;
      // ...displayed at CSS size.
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);

      setOffsetX(cssWidth / 4);
      setOffsetY((cssHeight * 3) / 4);
      setScale(Math.min(cssWidth / 50, cssHeight / 50));
    };

    setCanvasDimensions();
    window.addEventListener("resize", setCanvasDimensions);
    return () => window.removeEventListener("resize", setCanvasDimensions);
  }, [hasData]);

  // Draw whenever the paths or ball move.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ground line
    ctx.beginPath();
    ctx.moveTo(0, offsetY);
    ctx.lineTo(canvas.width, offsetY);
    ctx.strokeStyle = color.border;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Predicted path (dots) — reference tone
    ctx.fillStyle = color.reference;
    state.predictedPath.forEach((pos) => {
      const x = pos.x * scale + offsetX;
      const y = offsetY - pos.y * scale;
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Actual path (line) — series color
    ctx.beginPath();
    ctx.strokeStyle = color.series[0];
    ctx.lineWidth = 2.5;
    state.actualPath.forEach((pos, index) => {
      const x = pos.x * scale + offsetX;
      const y = offsetY - pos.y * scale;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Ball — accent
    ctx.beginPath();
    ctx.arc(
      state.ballPosition.x * scale + offsetX,
      offsetY - state.ballPosition.y * scale,
      9,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = color.accent;
    ctx.fill();

    // Legend
    ctx.font = "13px Avenir, Helvetica, sans-serif";
    ctx.fillStyle = color.reference;
    ctx.fillText("Predicted path", 12, 24);
    ctx.fillStyle = color.series[0];
    ctx.fillText("Actual path", 12, 44);

    if (state.error) {
      ctx.fillStyle = color.accent;
      ctx.fillText(`Error: ${state.error}`, 12, 64);
    }
  }, [
    state.predictedPath,
    state.actualPath,
    state.ballPosition,
    state.isComplete,
    state.error,
    state.currentAnimation,
    scale,
    offsetX,
    offsetY,
  ]);

  if (!hasData) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Run your code to launch the ball and compare your predicted path to its actual trajectory." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const predictedPoints = state.predictedPath.length;

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
          {
            label: "Predicted Points",
            value: predictedPoints > 0 ? String(predictedPoints) : EMPTY,
            color: color.reference,
          },
          {
            label: "Actual Points",
            value: String(state.actualPath.length),
            color: color.series[0],
          },
          {
            label: "Status",
            value: state.error
              ? "Error"
              : state.isComplete
              ? "Complete"
              : "Running",
            color: state.error ? color.accent : color.ink,
          },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
