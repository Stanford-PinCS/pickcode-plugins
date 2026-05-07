import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import State from "./state";
import {
    getSnapshotAtTime,
    magnitude,
} from "./momentumCore";
import type { BodySnapshot } from "./momentumCore";
import type { OverlayPoint, Vec2 } from "./messages";

const DESIGN_STAGE_WIDTH = 900;
const DESIGN_STAGE_HEIGHT = 680;
const STAGE_MARGIN = 4;
const BODY_RENDER_SCALE = 0.82;

type StageRect = {
    width: number;
    height: number;
    left: number;
    top: number;
};

const getStageRect = (
    containerWidth: number,
    containerHeight: number,
    margin: number
): StageRect => {
    const availableWidth = Math.max(containerWidth - margin * 2, 1);
    const availableHeight = Math.max(containerHeight - margin * 2, 1);
    const scale = Math.min(
        availableWidth / DESIGN_STAGE_WIDTH,
        availableHeight / DESIGN_STAGE_HEIGHT
    );
    const width = Math.max(1, Math.floor(DESIGN_STAGE_WIDTH * scale));
    const height = Math.max(1, Math.floor(DESIGN_STAGE_HEIGHT * scale));

    return {
        width,
        height,
        left: Math.max(Math.floor((containerWidth - width) / 2), 0),
        top: Math.max(Math.floor((containerHeight - height) / 2), 0),
    };
};

const formatScalar = (value: number, digits = 2) =>
    Number.isFinite(value) ? value.toFixed(digits) : "0.00";

const formatVector = (vector: Vec2, digits = 1) =>
    `(${formatScalar(vector.x, digits)}, ${formatScalar(vector.y, digits)})`;

const formatPercent = (value: number, digits = 1) =>
    `${(Number.isFinite(value) ? value * 100 : 0).toFixed(digits)}%`;

const kineticEnergyFromSpeed = (mass: number, speed: number) =>
    0.5 * mass * speed * speed;

const sumVectors = (left: Vec2, right: Vec2): Vec2 => ({
    x: left.x + right.x,
    y: left.y + right.y,
});

const scaleVector = (vector: Vec2, factor: number): Vec2 => ({
    x: vector.x * factor,
    y: vector.y * factor,
});

const subtractVectors = (left: Vec2, right: Vec2): Vec2 => ({
    x: left.x - right.x,
    y: left.y - right.y,
});

const dotVector = (left: Vec2, right: Vec2) =>
    left.x * right.x + left.y * right.y;


const lerpScalar = (start: number, end: number, amount: number) =>
    start + (end - start) * amount;

const lerpVector = (start: Vec2, end: Vec2, amount: number): Vec2 => ({
    x: lerpScalar(start.x, end.x, amount),
    y: lerpScalar(start.y, end.y, amount),
});

const projectPointOntoLine = (
    point: Vec2,
    linePoint: Vec2,
    lineDirection: Vec2
): Vec2 => {
    const normalizedDirection = normalizeVector(lineDirection, { x: 1, y: 0 });
    const offset = subtractVectors(point, linePoint);
    const projectedDistance = dotVector(offset, normalizedDirection);

    return sumVectors(
        linePoint,
        scaleVector(normalizedDirection, projectedDistance)
    );
};

const divideVector = (vector: Vec2, divisor: number): Vec2 =>
    Math.abs(divisor) > 1e-6
        ? scaleVector(vector, 1 / divisor)
        : { x: 0, y: 0 };

const centerOfMassPosition = (
    bodies: Array<{ mass: number; position: Vec2 }>
): Vec2 => {
    const totalMass = bodies.reduce((sum, body) => sum + body.mass, 0);

    if (totalMass <= 1e-6) {
        return { x: 0, y: 0 };
    }

    const weightedPosition = bodies.reduce(
        (sum, body) => ({
            x: sum.x + body.position.x * body.mass,
            y: sum.y + body.position.y * body.mass,
        }),
        { x: 0, y: 0 }
    );

    return divideVector(weightedPosition, totalMass);
};

const normalizeVector = (vector: Vec2, fallback: Vec2): Vec2 => {
    const length = magnitude(vector);

    if (length < 1e-6) {
        return fallback;
    }

    return {
        x: vector.x / length,
        y: vector.y / length,
    };
};

type BodyDeformation = {
    normal: Vec2;
    normalScale: number;
    tangentScale: number;
};
const drawArrow = (
    ctx: CanvasRenderingContext2D,
    start: Vec2,
    vector: Vec2,
    color: string,
    lineWidth = 3
) => {
    const length = magnitude(vector);

    if (length < 1) {
        return;
    }

    const end = sumVectors(start, vector);
    const headLength = Math.max(10, Math.min(18, length * 0.25));
    const angle = Math.atan2(vector.y, vector.x);

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = color;
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
    ctx.fillStyle = color;
    ctx.fill();
};

const drawBody = (
    ctx: CanvasRenderingContext2D,
    body: BodySnapshot,
    center: Vec2,
    radius: number,
    velocityVector: Vec2,
    deformation?: BodyDeformation
) => {
    const squishNormal = normalizeVector(
        deformation?.normal ?? { x: 1, y: 0 },
        { x: 1, y: 0 }
    );
    const squishAngle = Math.atan2(squishNormal.y, squishNormal.x);
    const normalScale = deformation?.normalScale ?? 1;
    const tangentScale = deformation?.tangentScale ?? 1;

    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(squishAngle);
    ctx.scale(normalScale, tangentScale);

    ctx.shadowColor = body.color;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = body.color + "bb";
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    ctx.stroke();

    ctx.restore();

    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.font = "500 13px 'Segoe UI', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(body.label, center.x, center.y);
    ctx.restore();

    const vLen = magnitude(velocityVector);
    if (vLen > 0) {
        const dir = { x: velocityVector.x / vLen, y: velocityVector.y / vLen };
        const edgeStart = { x: center.x + dir.x * radius, y: center.y + dir.y * radius };
        const edgeVector = { x: velocityVector.x - dir.x * radius, y: velocityVector.y - dir.y * radius };
        if (magnitude(edgeVector) > 1) drawArrow(ctx, edgeStart, edgeVector, body.color);
    }
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
    ctx.strokeStyle = "rgba(226, 232, 240, 0.42)";
    ctx.fillStyle = "rgba(148, 163, 184, 0.92)";
    ctx.lineWidth = 1;
    ctx.font = `${Math.max(8, Math.min(10, Math.round(scale * 16)))}px Consolas, Monaco, monospace`;
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
    color: string,
    dash: number[] = [12, 8],
    alpha = 0.35
) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.setLineDash(dash);
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = color;
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
    ctx.fillStyle = point.color ?? "#f8fafc";
    ctx.globalAlpha = 0.95;
    ctx.fill();

    ctx.restore();
};

const normalizeAngleDelta = (angle: number) => {
    let normalizedAngle = angle;

    while (normalizedAngle <= -Math.PI) {
        normalizedAngle += Math.PI * 2;
    }

    while (normalizedAngle > Math.PI) {
        normalizedAngle -= Math.PI * 2;
    }

    return normalizedAngle;
};


const getAdaptiveAxisStep = (scale: number) => {
    const targetPixelsPerTick = 88;
    const candidateSteps = [40, 80, 120, 160, 200, 240, 320, 400, 480, 640];

    return (
        candidateSteps.find((step) => step * scale >= targetPixelsPerTick) ??
        candidateSteps[candidateSteps.length - 1]
    );
};

const Component = observer(({ state }: { state: State | undefined }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | undefined>(undefined);
    const previousFrameTimeRef = useRef<number | undefined>(undefined);
    const [dashboardOpen, setDashboardOpen] = useState(false);
    const [stageRect, setStageRect] = useState<StageRect>({
        width: DESIGN_STAGE_WIDTH,
        height: DESIGN_STAGE_HEIGHT,
        left: 0,
        top: 0,
    });

    const snapshot = state
        ? getSnapshotAtTime(state.inputs, state.derived, state.elapsedTime)
        : null;
    const currentTotalMomentum = snapshot
        ? sumVectors(snapshot.bodies[0].momentum, snapshot.bodies[1].momentum)
        : null;
    const currentTotalKineticEnergy = snapshot
        ? snapshot.bodies.reduce(
              (sum, body) => sum + kineticEnergyFromSpeed(body.mass, body.speed),
              0
          )
        : null;
    const currentCenterOfMassPosition = snapshot
        ? centerOfMassPosition(snapshot.bodies)
        : null;
    const currentCenterOfMassVelocity =
        state && currentTotalMomentum
            ? divideVector(currentTotalMomentum, state.derived.totalMass)
            : null;
    const initialCenterOfMassPosition = state
        ? centerOfMassPosition(state.inputs.bodies)
        : null;
    const collisionDeformation = null;
    const phaseLabel = !state ? "loading" : snapshot?.phase ?? "loading";

    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        const updateStageRect = () => {
            const bounds = container.getBoundingClientRect();
            const nextRect = getStageRect(bounds.width, bounds.height, STAGE_MARGIN);

            setStageRect((currentRect) => {
                if (
                    currentRect.width === nextRect.width &&
                    currentRect.height === nextRect.height &&
                    currentRect.left === nextRect.left &&
                    currentRect.top === nextRect.top
                ) {
                    return currentRect;
                }

                return nextRect;
            });
        };

        updateStageRect();

        const observer = new ResizeObserver(updateStageRect);
        observer.observe(container);

        return () => {
            observer.disconnect();
        };
    }, []);

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

    useEffect(() => {
        if (!state || !snapshot) {
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        const ctx = canvas.getContext("2d");
        if (!ctx) {
            return;
        }

        const bounds = canvas.getBoundingClientRect();
        const width = Math.max(1, Math.floor(bounds.width));
        const height = Math.max(1, Math.floor(bounds.height));

        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }

        const sceneHorizontalPadding = 8;
        const hudInsetX = Math.max(10, Math.min(16, Math.round(width * 0.018)));
        const hudInsetY = Math.max(10, Math.min(16, Math.round(height * 0.02)));
        const hudStatusFontSize = width < 520 ? 11 : 12;
        const hudPositionFontSize = width < 520 ? 9 : 11;
        const hudLineHeight = width < 520 ? 16 : 18;
        const hudGap = width < 520 ? 10 : 12;
        const statsReserveWidth = Math.max(108, Math.min(168, width * 0.22));
        const statusText = `${phaseLabel} | t=${formatScalar(state.elapsedTime, 2)}s`;
        const positionTexts = snapshot.bodies.map(
            (body) =>
                `${body.label}(${formatScalar(body.position.x, 0)},${formatScalar(body.position.y, 0)})`
        );

        ctx.font = `${hudStatusFontSize}px Consolas, Monaco, monospace`;
        const statusWidth = ctx.measureText(statusText).width;

        ctx.font = `${hudPositionFontSize}px Consolas, Monaco, monospace`;
        const positionsWidth = positionTexts.reduce(
            (sum, text) => sum + ctx.measureText(text).width,
            0
        ) + hudGap * Math.max(positionTexts.length - 1, 0);
        const positionsInline =
            hudInsetX +
                statusWidth +
                20 +
                positionsWidth <=
            width - hudInsetX - statsReserveWidth;
        const sceneTopPadding =
            hudInsetY + hudLineHeight * (positionsInline ? 1 : 2) + 12;
        const sceneBottomPadding = 8;
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

        const background = ctx.createLinearGradient(0, 0, width, height);
        background.addColorStop(0, "#000000");
        background.addColorStop(1, "#000000");
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, width, height);

        for (let x = 0; x <= state.inputs.width; x += 80) {
            const xPosition = offsetX + x * sceneScale;
            ctx.beginPath();
            ctx.moveTo(xPosition, offsetY);
            ctx.lineTo(xPosition, offsetY + scaledSceneHeight);
            ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        for (let y = 0; y <= state.inputs.height; y += 80) {
            const yPosition = axisOrigin.y - y * sceneScale;
            ctx.beginPath();
            ctx.moveTo(offsetX, yPosition);
            ctx.lineTo(offsetX + scaledSceneWidth, yPosition);
            ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        drawArrow(
            ctx,
            axisOrigin,
            { x: Math.max(scaledSceneWidth - 14, 0), y: 0 },
            "rgba(226, 232, 240, 0.48)",
            2
        );
        drawArrow(
            ctx,
            axisOrigin,
            { x: 0, y: -Math.max(scaledSceneHeight - 14, 0) },
            "rgba(226, 232, 240, 0.48)",
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

        ctx.fillStyle = "rgba(226, 232, 240, 0.92)";
        ctx.font = "11px Consolas, Monaco, monospace";
        ctx.textAlign = "left";
        ctx.fillText("0", axisOrigin.x + 6, axisOrigin.y - 8);
        ctx.fillText("x", axisOrigin.x + scaledSceneWidth - 12, axisOrigin.y - 8);
        ctx.fillText("y", axisOrigin.x + 8, axisOrigin.y - scaledSceneHeight + 14);

        state.displayOptions.points.forEach((point) => {
            drawOverlayPoint(ctx, point, toCanvas(point));
        });

        if (state.displayOptions.showGuides) {
            const hasCollided = state.derived.collisionTime !== null &&
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
                    "#facc15",
                    [10, 8],
                    0.52
                );
            }

            if (visualCollisionVertex) {

            }
        }

        if (state.derived.collisionPoint || visualCollisionVertex) {
            const collisionPoint = visualCollisionVertex ?? toCanvas(state.derived.collisionPoint!);
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
                ctx.arc(collisionPoint.x, collisionPoint.y, 6 + flashAmount * 14, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${0.18 + flashAmount * 0.42})`;
                ctx.fill();
            }

            const afterCollision = state.derived.collisionTime !== null &&
                state.elapsedTime >= state.derived.collisionTime;
            if (afterCollision) {
                const s = 5;
                ctx.save();
                ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
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

        const renderedBodies = snapshot.bodies
            .map((body, index) => ({
                body,
                index,
                derivedBody: state.derived.bodies[index],
            }))
            .sort((left, right) => left.index - right.index);

        renderedBodies.forEach(({ body, derivedBody }) => {
            const displayPosition = body.position;
            const center = toCanvas(displayPosition);
            const radius = body.radius * sceneScale * BODY_RENDER_SCALE;
            const velocityMagnitude = magnitude(body.velocity);
            const arrowCanvasLength =
                velocityMagnitude <= 0
                    ? 0
                    : Math.max(32, Math.min(110, velocityMagnitude * sceneScale * 0.28));
            const arrowScale = velocityMagnitude <= 0 ? 0 : arrowCanvasLength / velocityMagnitude;

            ctx.save();
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.6;
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
                scaleVector(toCanvasVector(body.velocity), arrowScale),
                collisionDeformation ?? undefined
            );
        });

        if (currentCenterOfMassPosition && initialCenterOfMassPosition) {
            const currentCenterModel = currentCenterOfMassPosition;
            const currentCenter = toCanvas(currentCenterModel);


            ctx.beginPath();
            ctx.arc(currentCenter.x, currentCenter.y, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(250, 204, 21, 0.95)";
            ctx.fill();

            ctx.fillStyle = "rgba(254, 249, 195, 0.98)";
            ctx.font = "700 11px 'Segoe UI', system-ui, sans-serif";
            ctx.textAlign = "left";
            ctx.fillText("CM", currentCenter.x + 12, currentCenter.y - 10);
        }

        ctx.fillStyle = "rgba(148, 163, 184, 0.95)";
        ctx.font = `${hudStatusFontSize}px Consolas, Monaco, monospace`;
        const statusY = hudInsetY + hudStatusFontSize;

        ctx.textAlign = "left";
        ctx.fillText(statusText, hudInsetX, statusY);

        ctx.font = `${hudPositionFontSize}px Consolas, Monaco, monospace`;
        const positionsY = positionsInline
            ? statusY
            : statusY + hudLineHeight;
        let currentX = positionsInline ? hudInsetX + statusWidth + 20 : hudInsetX;

        snapshot.bodies.forEach((body, index) => {
            const positionText = positionTexts[index];

            ctx.fillStyle = body.color;
            ctx.fillText(positionText, currentX, positionsY);

            currentX += ctx.measureText(positionText).width + hudGap;
        });
    }, [state, snapshot, phaseLabel, collisionDeformation]);

    if (!state || !snapshot || !currentTotalMomentum) {
        return null;
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100%",
                minHeight: 0,
                background: "#000000",
                color: "#e2e8f0",
                overflow: "hidden",
                fontFamily: "'Segoe UI', system-ui, sans-serif",
            }}
        >
            <div
                style={{
                    position: "absolute",
                    left: stageRect.left,
                    top: stageRect.top,
                    width: stageRect.width,
                    height: stageRect.height,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                }}
            >
                <div
                    style={{
                        flex: 1,
                        minHeight: 0,
                        padding: "4px",
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "block",
                        }}
                    />
                </div>

                <button
                    type="button"
                    aria-expanded={dashboardOpen}
                    onClick={() => setDashboardOpen((open) => !open)}
                    style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        zIndex: 3,
                        padding: "6px 9px",
                        borderRadius: 999,
                        border: "1px solid rgba(148, 163, 184, 0.18)",
                        background: dashboardOpen
                            ? "rgba(30, 41, 59, 0.46)"
                            : "rgba(15, 23, 42, 0.28)",
                        color: "rgba(226, 232, 240, 0.88)",
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        boxShadow: "0 6px 14px rgba(2, 6, 23, 0.08)",
                        backdropFilter: "blur(10px)",
                    }}
                >
                    {dashboardOpen ? "Close" : "Stats"}
                </button>

                {dashboardOpen && (
                    <div
                        style={{
                            position: "absolute",
                            top: 52,
                            right: 10,
                            zIndex: 2,
                            width: "min(380px, calc(100% - 20px))",
                            maxHeight: "calc(100% - 62px)",
                            padding: "14px 16px 16px",
                            border: "1px solid rgba(248, 250, 252, 0.08)",
                            borderRadius: 16,
                            background: "rgba(2, 6, 23, 0.24)",
                            overflowY: "auto",
                            boxShadow: "0 12px 24px rgba(2, 6, 23, 0.08)",
                            backdropFilter: "blur(26px) saturate(150%)",
                        }}
                    >
                        <div
                            style={{
                                marginBottom: 12,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 10,
                                    letterSpacing: "0.14em",
                                    textTransform: "uppercase",
                                    color: "rgba(191, 219, 254, 0.68)",
                                    marginBottom: 4,
                                }}
                            >
                                Analysis
                            </div>
                            <div
                                style={{
                                    fontSize: 11,
                                    lineHeight: 1.5,
                                    color: "rgba(248, 250, 252, 0.86)",
                                    fontFamily: "Consolas, Monaco, monospace",
                                }}
                            >
                                {phaseLabel} | collision {state.derived.collisionOccurs ? "yes" : "no"} | friction {state.derived.frictionMode}
                            </div>
                            <div
                                style={{
                                    fontSize: 11,
                                    lineHeight: 1.45,
                                    color: "rgba(191, 219, 254, 0.74)",
                                    fontFamily: "Consolas, Monaco, monospace",
                                }}
                            >
                                t = {formatScalar(state.elapsedTime, 2)} s
                            </div>
                        </div>

                        <OverlaySection title="System" accent="#f8fafc">
                            <ComparisonBlock
                                title="Momentum"
                                accent="#60a5fa"
                                beforeValue={formatVector(state.derived.totalMomentumBefore)}
                                afterValue={formatVector(state.derived.totalMomentumAfter)}
                            />
                            <ComparisonBlock
                                title="Energy"
                                accent="#fbbf24"
                                beforeValue={`${formatScalar(
                                    state.derived.totalKineticEnergyBefore
                                )} J`}
                                afterValue={`${formatScalar(
                                    state.derived.totalKineticEnergyAfter
                                )} J`}
                                note={`loss ${formatPercent(
                                    state.derived.fractionalKineticEnergyLoss
                                )}`}
                            />
                            <ComparisonBlock
                                title="Center of Mass"
                                accent="#86efac"
                                beforeValue={formatVector(
                                    state.derived.centerOfMassVelocityBefore
                                )}
                                afterValue={formatVector(
                                    state.derived.centerOfMassVelocityAfter
                                )}
                                note={`now ${formatVector(
                                    currentCenterOfMassVelocity ?? { x: 0, y: 0 }
                                )}`}
                            />
                            <DataRows
                                rows={[
                                    {
                                        label: "Total mass",
                                        value: `${formatScalar(state.derived.totalMass)} kg`,
                                    },
                                    {
                                        label: "P now",
                                        value: formatVector(currentTotalMomentum),
                                    },
                                    {
                                        label: "KE now",
                                        value: `${formatScalar(currentTotalKineticEnergy ?? 0)} J`,
                                    },
                                ]}
                            />
                        </OverlaySection>

                        <OverlaySection title="Contact" accent="#fbbf24">
                            <DataRows
                                rows={[
                                    {
                                        label: "Restitution",
                                        value: formatScalar(state.inputs.restitution),
                                    },
                                    {
                                        label: "Friction",
                                        value: formatScalar(state.inputs.friction),
                                    },
                                    {
                                        label: "Collision time",
                                        value:
                                            state.derived.collisionTime === null
                                                ? "none"
                                                : `${formatScalar(
                                                      state.derived.collisionTime
                                                  )} s`,
                                    },
                                    {
                                        label: "Normal J",
                                        value: `${formatScalar(state.derived.impulse)} N·s`,
                                    },
                                    {
                                        label: "Tangential J",
                                        value: `${formatScalar(
                                            state.derived.tangentialImpulse
                                        )} N·s`,
                                    },
                                ]}
                            />
                        </OverlaySection>

                        {state.derived.bodies.map((body, index) => {
                            const currentBody = snapshot.bodies[index];

                            return (
                                <OverlaySection
                                    key={body.label}
                                    title={`Body ${body.label}`}
                                    accent={body.color}
                                >
                                    <DataRows
                                        rows={[
                                            {
                                                label: "Mass",
                                                value: `${formatScalar(body.mass)} kg`,
                                            },
                                            {
                                                label: "Radius",
                                                value: `${formatScalar(body.radius, 0)} px`,
                                            },
                                            {
                                                label: "Position",
                                                value: formatVector(currentBody.position),
                                            },
                                            {
                                                label: "Velocity",
                                                value: formatVector(currentBody.velocity),
                                            },
                                            {
                                                label: "Speed",
                                                value: `${formatScalar(currentBody.speed)} px/s`,
                                            },
                                            {
                                                label: "Momentum",
                                                value: formatVector(currentBody.momentum),
                                            },
                                            {
                                                label: "KE before",
                                                value: `${formatScalar(body.kineticEnergyBefore)} J`,
                                            },
                                            {
                                                label: "KE after",
                                                value: `${formatScalar(body.kineticEnergyAfter)} J`,
                                            },
                                        ]}
                                        valueColor={body.color}
                                    />
                                </OverlaySection>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
});

function OverlaySection({
    title,
    accent,
    children,
}: {
    title: string;
    accent: string;
    children: React.ReactNode;
}) {
    return (
        <div
            style={{
                paddingTop: 12,
                marginTop: 12,
                borderTop: "1px solid rgba(248, 250, 252, 0.06)",
            }}
        >
            <div
                style={{
                    fontSize: 11,
                    fontWeight: 600,
                    lineHeight: 1.2,
                    color: accent,
                    opacity: 0.82,
                    marginBottom: 9,
                }}
            >
                {title}
            </div>
            {children}
        </div>
    );
}

function ComparisonBlock({
    title,
    accent,
    beforeValue,
    afterValue,
    note,
}: {
    title: string;
    accent: string;
    beforeValue: string;
    afterValue: string;
    note?: string;
}) {
    return (
        <div
            style={{
                marginBottom: 12,
            }}
        >
            <div
                style={{
                    fontSize: 10,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: accent,
                    opacity: 0.78,
                    marginBottom: 5,
                }}
            >
                {title}
            </div>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "70px 1fr",
                    rowGap: 4,
                    columnGap: 10,
                }}
            >
                <span
                    style={{
                        fontSize: 10,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                            color: "rgba(191, 219, 254, 0.62)",
                    }}
                >
                    Before
                </span>
                <span
                    style={{
                            fontSize: 14,
                            fontWeight: 650,
                        lineHeight: 1.25,
                            color: "rgba(248, 250, 252, 0.9)",
                        fontFamily: "Consolas, Monaco, monospace",
                    }}
                >
                    {beforeValue}
                </span>
                <span
                    style={{
                        fontSize: 10,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                            color: "rgba(191, 219, 254, 0.62)",
                    }}
                >
                    After
                </span>
                <span
                    style={{
                            fontSize: 14,
                            fontWeight: 650,
                        lineHeight: 1.25,
                        color: accent,
                            opacity: 0.9,
                        fontFamily: "Consolas, Monaco, monospace",
                    }}
                >
                    {afterValue}
                </span>
                {note && (
                    <>
                        <span
                            style={{
                                fontSize: 10,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                color: "rgba(191, 219, 254, 0.62)",
                            }}
                        >
                            Note
                        </span>
                        <span
                            style={{
                                fontSize: 12,
                                lineHeight: 1.35,
                                color: "rgba(248, 250, 252, 0.8)",
                                fontFamily: "Consolas, Monaco, monospace",
                            }}
                        >
                            {note}
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}

function DataRows({
    rows,
    valueColor,
}: {
    rows: Array<{ label: string; value: string }>;
    valueColor?: string;
}) {
    return (
        <div
            style={{
                display: "grid",
                gap: 6,
            }}
        >
            {rows.map((row) => (
                <div
                    key={row.label}
                    style={{
                        display: "grid",
                        gridTemplateColumns: "auto 1fr",
                        columnGap: 10,
                        alignItems: "start",
                    }}
                >
                    <span
                        style={{
                            fontSize: 10,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: "rgba(191, 219, 254, 0.56)",
                        }}
                    >
                        {row.label}
                    </span>
                    <span
                        style={{
                            justifySelf: "end",
                            fontSize: 12,
                            fontWeight: 650,
                            lineHeight: 1.3,
                            color: valueColor ?? "rgba(248, 250, 252, 0.88)",
                            fontFamily: "Consolas, Monaco, monospace",
                            textAlign: "right",
                            textShadow: "0 0 8px rgba(15, 23, 42, 0.18)",
                        }}
                    >
                        {row.value}
                    </span>
                </div>
            ))}
        </div>
    );
}

export default Component;