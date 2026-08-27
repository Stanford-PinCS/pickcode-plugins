import { observer } from "mobx-react-lite";
import { useEffect, useReducer, useRef } from "react";
import { color } from "../../common/tokens";
import {
  EmptyState,
  PluginStage,
  PluginSurface,
} from "../../common/PluginSurface";
import instructions from "./instructions.md?raw";
import State from "./state";
import { getSnapshotAtTime, magnitude } from "./momentumCore";
import type { BodySnapshot } from "./momentumCore";
import type { OverlayPoint, Vec2 } from "./messages";

const BODY_RENDER_SCALE = 0.82;

/* ───────── Theme — shared with the other pincs.stanford.edu plugins ─────────
 * `ink`/`muted` and the cream/tan surface tones match the marginal-utility
 * and area-approximation plugins byte-for-byte. `accent` comes straight
 * from the shared token palette (color.series[0]) so it tracks the site's
 * real brand pink automatically. `gold` and `secondary` are the same
 * target/threshold gold and slate-teal seen across the other plugins'
 * screenshots — if common/tokens.ts exposes those as named series entries
 * instead, swap these two literals for the token reference.
 */

const ink = "#4a2a38";
const muted = "#9c8378";
const accent = color.series[0]; // primary pink/rose accent
const gold = "#c98a1f"; // target / threshold accent

const canvasBg = "#fdf8f2";
const canvasBgLow = "#faf1ea";
const canvasBorder = "#e7d9cd";
const gridLine = "rgba(74, 42, 56, 0.07)";
const axisLine = "rgba(74, 42, 56, 0.4)";
const axisLabel = "rgba(156, 131, 120, 0.95)";

/* ───────── Formatting ───────── */

const formatScalar = (value: number, digits = 2) =>
  Number.isFinite(value) ? value.toFixed(digits) : "0.00";

const formatVector = (vector: Vec2, digits = 1) =>
  `(${formatScalar(vector.x, digits)}, ${formatScalar(vector.y, digits)})`;

const formatPercent = (value: number, digits = 1) =>
  `${(Number.isFinite(value) ? value * 100 : 0).toFixed(digits)}%`;

/* ───────── Vector helpers ───────── */

const sumVectors = (left: Vec2, right: Vec2): Vec2 => ({
  x: left.x + right.x,
  y: left.y + right.y,
});

const scaleVector = (vector: Vec2, factor: number): Vec2 => ({
  x: vector.x * factor,
  y: vector.y * factor,
});

const divideVector = (vector: Vec2, divisor: number): Vec2 =>
  Math.abs(divisor) > 1e-6 ? scaleVector(vector, 1 / divisor) : { x: 0, y: 0 };

const centerOfMassPosition = (
  bodies: Array<{ mass: number; position: Vec2 }>
): Vec2 => {
  const totalMass = bodies.reduce((sum, body) => sum + body.mass, 0);
  if (totalMass <= 1e-6) return { x: 0, y: 0 };
  const weighted = bodies.reduce(
    (sum, body) => ({
      x: sum.x + body.position.x * body.mass,
      y: sum.y + body.position.y * body.mass,
    }),
    { x: 0, y: 0 }
  );
  return divideVector(weighted, totalMass);
};

/* ───────── Canvas drawing ───────── */

const drawArrow = (
  ctx: CanvasRenderingContext2D,
  start: Vec2,
  vector: Vec2,
  strokeColor: string,
  lineWidth = 3
) => {
  const length = magnitude(vector);
  if (length < 1) return;

  const end = sumVectors(start, vector);
  const headLength = Math.max(10, Math.min(18, length * 0.25));
  const angle = Math.atan2(vector.y, vector.x);

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(
    end.x - headLength * Math.cos(angle - Math.PI / 6),
    end.y - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    end.x - headLength * Math.cos(angle + Math.PI / 6),
    end.y - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fillStyle = strokeColor;
  ctx.fill();
};

const drawBody = (
  ctx: CanvasRenderingContext2D,
  body: BodySnapshot,
  center: Vec2,
  radius: number,
  velocityVector: Vec2
) => {
  ctx.save();
  ctx.translate(center.x, center.y);

  // Soft drop shadow instead of a neon glow — reads correctly on a light card.
  ctx.shadowColor = "rgba(74, 42, 56, 0.22)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 2;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = body.color;
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
  ctx.font = "600 13px 'Segoe UI', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(body.label, center.x, center.y);
  ctx.restore();

  const vLen = magnitude(velocityVector);
  if (vLen > 0) {
    const dir = { x: velocityVector.x / vLen, y: velocityVector.y / vLen };
    const edgeStart = {
      x: center.x + dir.x * radius,
      y: center.y + dir.y * radius,
    };
    const edgeVector = {
      x: velocityVector.x - dir.x * radius,
      y: velocityVector.y - dir.y * radius,
    };
    if (magnitude(edgeVector) > 1)
      drawArrow(ctx, edgeStart, edgeVector, body.color);
  }
};

const getAdaptiveAxisStep = (scale: number) => {
  const targetPixelsPerTick = 88;
  const candidateSteps = [40, 80, 120, 160, 200, 240, 320, 400, 480, 640];
  return (
    candidateSteps.find((step) => step * scale >= targetPixelsPerTick) ??
    candidateSteps[candidateSteps.length - 1]
  );
};

const drawAxisTicks = (
  ctx: CanvasRenderingContext2D,
  origin: Vec2,
  width: number,
  height: number,
  scale: number,
  step = 160
) => {
  ctx.save();
  ctx.strokeStyle = "rgba(74, 42, 56, 0.22)";
  ctx.fillStyle = axisLabel;
  ctx.lineWidth = 1;
  ctx.font = `${Math.max(
    8,
    Math.min(10, Math.round(scale * 16))
  )}px Consolas, Monaco, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  for (let value = step; value < width; value += step) {
    const x = origin.x + value * scale;
    ctx.beginPath();
    ctx.moveTo(x, origin.y - 5);
    ctx.lineTo(x, origin.y + 5);
    ctx.stroke();
    ctx.fillText(`${value}`, x, origin.y + 16);
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  for (let value = step; value <= height; value += step) {
    const y = origin.y - value * scale;
    ctx.beginPath();
    ctx.moveTo(origin.x - 5, y);
    ctx.lineTo(origin.x + 5, y);
    ctx.stroke();
    ctx.fillText(`${value}`, origin.x + 10, y);
  }
  ctx.restore();
};

const drawGuideLine = (
  ctx: CanvasRenderingContext2D,
  start: Vec2,
  end: Vec2,
  strokeColor: string,
  dash: number[] = [10, 7],
  alpha = 0.45
) => {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.setLineDash(dash);
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  ctx.setLineDash([]);
};

const drawOverlayPoint = (
  ctx: CanvasRenderingContext2D,
  point: OverlayPoint,
  canvasPoint: Vec2
) => {
  ctx.save();
  ctx.beginPath();
  ctx.arc(canvasPoint.x, canvasPoint.y, point.radius ?? 4, 0, Math.PI * 2);
  ctx.fillStyle = point.color ?? ink;
  ctx.globalAlpha = 0.9;
  ctx.fill();
  ctx.restore();
};

/* ───────── Stat readout row ───────── */

const StatCell = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div style={{ textAlign: "center", minWidth: 92 }}>
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        color: muted,
        marginBottom: 4,
      }}
    >
      {label}
    </div>
    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace" }}>
      {children}
    </div>
  </div>
);

/* ───────── Main component ───────── */

const Component = observer(({ state }: { state: State | undefined }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const previousFrameTimeRef = useRef<number | undefined>(undefined);
  const [, bumpResize] = useReducer((x) => x + 1, 0);

  const snapshot = state
    ? getSnapshotAtTime(state.inputs, state.derived, state.elapsedTime)
    : null;
  const currentTotalMomentum = snapshot
    ? sumVectors(snapshot.bodies[0].momentum, snapshot.bodies[1].momentum)
    : null;
  const currentCenterOfMassPosition = snapshot
    ? centerOfMassPosition(snapshot.bodies)
    : null;
  const initialCenterOfMassPosition = state
    ? centerOfMassPosition(state.inputs.bodies)
    : null;
  const phaseLabel = !state ? "loading" : snapshot?.phase ?? "loading";

  // Redraw on container resize (drawing effect reads the live canvas size).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => bumpResize());
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Animation loop while running.
  useEffect(() => {
    if (!state || state.stage !== "running") {
      if (requestRef.current !== undefined) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = undefined;
      }
      previousFrameTimeRef.current = undefined;
      return;
    }

    const animate = (timestamp: number) => {
      const previousFrameTime = previousFrameTimeRef.current ?? timestamp;
      const deltaSeconds = Math.min(
        (timestamp - previousFrameTime) / 1000,
        0.05
      );
      const nextElapsedTime = Math.min(
        state.elapsedTime + deltaSeconds,
        state.derived.playbackDuration
      );

      state.setElapsedTime(nextElapsedTime);
      if (nextElapsedTime >= state.derived.playbackDuration) {
        state.completePlayback();
        previousFrameTimeRef.current = undefined;
        requestRef.current = undefined;
        return;
      }

      previousFrameTimeRef.current = timestamp;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current !== undefined) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = undefined;
      }
    };
  }, [state, state?.stage]);

  // Draw the scene.
  useEffect(() => {
    if (!state || !snapshot) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Render at native device-pixel density so lines, arcs, and text stay
    // crisp on Retina/high-DPI screens instead of looking soft or pixelated.
    const dpr = window.devicePixelRatio || 1;
    const bounds = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(bounds.width));
    const height = Math.max(1, Math.floor(bounds.height));
    const backingWidth = Math.max(1, Math.round(width * dpr));
    const backingHeight = Math.max(1, Math.round(height * dpr));
    if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
      canvas.width = backingWidth;
      canvas.height = backingHeight;
    }
    // All drawing below still happens in CSS-pixel coordinates (`width` /
    // `height`) — this transform maps them onto the higher-resolution
    // backing store. Reset every frame since canvas transforms persist.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const sceneHorizontalPadding = 10;
    const sceneTopPadding = 22;
    const sceneBottomPadding = 10;
    const sceneScale = Math.min(
      Math.max((width - sceneHorizontalPadding * 2) / state.inputs.width, 0.1),
      Math.max(
        (height - sceneTopPadding - sceneBottomPadding) / state.inputs.height,
        0.1
      )
    );
    const scaledSceneWidth = state.inputs.width * sceneScale;
    const scaledSceneHeight = state.inputs.height * sceneScale;
    const availableSceneWidth = width - sceneHorizontalPadding * 2;
    const availableSceneHeight = height - sceneTopPadding - sceneBottomPadding;
    const offsetX =
      sceneHorizontalPadding +
      Math.max((availableSceneWidth - scaledSceneWidth) / 2, 0);
    const offsetY =
      sceneTopPadding +
      Math.max((availableSceneHeight - scaledSceneHeight) / 2, 0);
    const toCanvas = (point: Vec2): Vec2 => ({
      x: offsetX + point.x * sceneScale,
      y: offsetY + scaledSceneHeight - point.y * sceneScale,
    });
    const toCanvasVector = (vector: Vec2): Vec2 => ({
      x: vector.x,
      y: -vector.y,
    });
    const axisOrigin = { x: offsetX, y: offsetY + scaledSceneHeight };
    const visualCollisionVertex = state.derived.collisionPoint
      ? toCanvas(state.derived.collisionPoint)
      : null;

    ctx.clearRect(0, 0, width, height);

    // Pale cream backdrop, matching the other plugins' plot surfaces.
    const background = ctx.createLinearGradient(0, 0, 0, height);
    background.addColorStop(0, canvasBg);
    background.addColorStop(1, canvasBgLow);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    for (let x = 0; x <= state.inputs.width; x += 80) {
      const xPosition = offsetX + x * sceneScale;
      ctx.beginPath();
      ctx.moveTo(xPosition, offsetY);
      ctx.lineTo(xPosition, offsetY + scaledSceneHeight);
      ctx.strokeStyle = gridLine;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    for (let y = 0; y <= state.inputs.height; y += 80) {
      const yPosition = axisOrigin.y - y * sceneScale;
      ctx.beginPath();
      ctx.moveTo(offsetX, yPosition);
      ctx.lineTo(offsetX + scaledSceneWidth, yPosition);
      ctx.strokeStyle = gridLine;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    drawArrow(
      ctx,
      axisOrigin,
      { x: Math.max(scaledSceneWidth - 14, 0), y: 0 },
      axisLine,
      2
    );
    drawArrow(
      ctx,
      axisOrigin,
      { x: 0, y: -Math.max(scaledSceneHeight - 14, 0) },
      axisLine,
      2
    );
    drawAxisTicks(
      ctx,
      axisOrigin,
      state.inputs.width,
      state.inputs.height,
      sceneScale,
      getAdaptiveAxisStep(sceneScale)
    );

    ctx.fillStyle = axisLabel;
    ctx.font = "11px Consolas, Monaco, monospace";
    ctx.textAlign = "left";
    ctx.fillText("0", axisOrigin.x + 6, axisOrigin.y - 8);
    ctx.fillText("x", axisOrigin.x + scaledSceneWidth - 12, axisOrigin.y - 8);
    ctx.fillText("y", axisOrigin.x + 8, axisOrigin.y - scaledSceneHeight + 14);

    state.displayOptions.points.forEach((point) => {
      drawOverlayPoint(ctx, point, toCanvas(point));
    });

    if (state.displayOptions.showGuides) {
      const hasCollided =
        state.derived.collisionTime !== null &&
        state.elapsedTime >= state.derived.collisionTime;

      state.derived.bodies.forEach((body, index) => {
        const preStart = toCanvas(body.initialPosition);
        const currentPos = toCanvas(snapshot.bodies[index].position);

        if (hasCollided && body.collisionPosition) {
          const collisionPos = toCanvas(body.collisionPosition);
          if (magnitude(body.initialVelocity) > 1e-6)
            drawGuideLine(ctx, preStart, collisionPos, body.color);
          if (magnitude(body.finalVelocity) > 1e-6)
            drawGuideLine(ctx, collisionPos, currentPos, body.color);
        } else if (magnitude(body.initialVelocity) > 1e-6) {
          drawGuideLine(ctx, preStart, currentPos, body.color);
        }
      });

      if (initialCenterOfMassPosition && currentCenterOfMassPosition) {
        drawGuideLine(
          ctx,
          toCanvas(initialCenterOfMassPosition),
          toCanvas(currentCenterOfMassPosition),
          gold,
          [10, 7],
          0.6
        );
      }
    }

    if (state.derived.collisionPoint || visualCollisionVertex) {
      const collisionPoint =
        visualCollisionVertex ?? toCanvas(state.derived.collisionPoint!);
      const flashWindow = 0.35;
      const flashAmount =
        state.derived.collisionTime === null
          ? 0
          : Math.max(
              0,
              1 -
                Math.abs(state.elapsedTime - state.derived.collisionTime) /
                  flashWindow
            );

      if (flashAmount > 0) {
        ctx.beginPath();
        ctx.arc(
          collisionPoint.x,
          collisionPoint.y,
          6 + flashAmount * 14,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(201, 88, 124, ${0.14 + flashAmount * 0.34})`;
        ctx.fill();
      }

      const afterCollision =
        state.derived.collisionTime !== null &&
        state.elapsedTime >= state.derived.collisionTime;
      if (afterCollision) {
        const s = 5;
        ctx.save();
        ctx.strokeStyle = "rgba(74, 42, 56, 0.75)";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(collisionPoint.x - s, collisionPoint.y - s);
        ctx.lineTo(collisionPoint.x + s, collisionPoint.y + s);
        ctx.moveTo(collisionPoint.x + s, collisionPoint.y - s);
        ctx.lineTo(collisionPoint.x - s, collisionPoint.y + s);
        ctx.stroke();
        ctx.restore();
      }
    }

    snapshot.bodies.forEach((body) => {
      const center = toCanvas(body.position);
      const radius = body.radius * sceneScale * BODY_RENDER_SCALE;
      const velocityMagnitude = magnitude(body.velocity);
      const arrowCanvasLength =
        velocityMagnitude <= 0
          ? 0
          : Math.max(32, Math.min(110, velocityMagnitude * sceneScale * 0.28));
      const arrowScale =
        velocityMagnitude <= 0 ? 0 : arrowCanvasLength / velocityMagnitude;

      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = body.color;
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(center.x, axisOrigin.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(axisOrigin.x, center.y);
      ctx.stroke();
      ctx.restore();

      drawBody(
        ctx,
        body,
        center,
        radius,
        scaleVector(toCanvasVector(body.velocity), arrowScale)
      );
    });

    if (currentCenterOfMassPosition && initialCenterOfMassPosition) {
      const currentCenter = toCanvas(currentCenterOfMassPosition);
      ctx.beginPath();
      ctx.arc(currentCenter.x, currentCenter.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = gold;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#fff";
      ctx.stroke();

      ctx.fillStyle = ink;
      ctx.font = "700 11px 'Segoe UI', system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("CM", currentCenter.x + 12, currentCenter.y - 10);
    }
  }, [state, snapshot, phaseLabel]);

  if (!state || !snapshot || !currentTotalMomentum) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Run your code to set up a collision and watch momentum play out." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const pBefore = state.derived.totalMomentumBefore;
  const pAfter = state.derived.totalMomentumAfter;
  const keLoss = state.derived.fractionalKineticEnergyLoss;
  const collisionOccurs = state.derived.collisionOccurs;

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            borderRadius: 14,
            border: `1px solid ${canvasBorder}`,
            backgroundColor: color.surfaceRaised,
            boxShadow: "0 2px 6px rgba(74, 42, 56, 0.08)",
            overflow: "hidden",
          }}
        >
          {/* Simulation viewport — light cream, same family as the other plugins' plots */}
          <div
            ref={containerRef}
            style={{
              flex: 1,
              minHeight: 0,
              position: "relative",
            }}
          >
            <canvas
              ref={canvasRef}
              style={{ width: "100%", height: "100%", display: "block" }}
            />
          </div>

          {/* Conservation readout — one card, divided by a rule, matching the site's stat-row style */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-start",
              justifyContent: "center",
              gap: "10px 28px",
              padding: "12px 16px",
              borderTop: `1px solid ${canvasBorder}`,
            }}
          >
            <StatCell label="Status">
              <span style={{ color: ink }}>{phaseLabel}</span>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 400,
                  color: muted,
                  marginTop: 2,
                }}
              >
                t = {formatScalar(state.elapsedTime, 2)}s
              </div>
            </StatCell>

            <StatCell label="Momentum (before → after)">
              <span style={{ color: ink }}>{formatVector(pBefore)}</span>
              <span style={{ color: muted }}> → </span>
              <span style={{ color: accent }}>{formatVector(pAfter)}</span>
            </StatCell>

            <StatCell label="KE lost">
              <span style={{ color: gold }}>{formatPercent(keLoss)}</span>
            </StatCell>

            <StatCell label="Collides?">
              <span style={{ color: collisionOccurs ? accent : muted }}>
                {collisionOccurs ? "Yes" : "No"}
              </span>
            </StatCell>
          </div>
        </div>
      </PluginStage>
    </PluginSurface>
  );
});

export default Component;
