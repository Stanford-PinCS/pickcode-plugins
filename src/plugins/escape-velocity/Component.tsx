import { useMemo, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
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

const SVG_SIZE = 460;
const CENTER = SVG_SIZE / 2;
const ANIM_STEPS_PER_FRAME = 8;

const Component = observer(({ state }: { state: State }) => {
  const result = state.result ?? null;

  // Animation state
  const [animStep, setAnimStep] = useState(0);
  const animStepRef = useRef(0);
  const animFrameRef = useRef(0);

  // Restart animation whenever a new result arrives
  useEffect(() => {
    cancelAnimationFrame(animFrameRef.current);
    animStepRef.current = 0;
    setAnimStep(0);

    if (!result || result.trajectory.length === 0) return;

    const total = result.trajectory.length;
    const animate = () => {
      animStepRef.current = Math.min(
        animStepRef.current + ANIM_STEPS_PER_FRAME,
        total - 1
      );
      setAnimStep(animStepRef.current);
      if (animStepRef.current < total - 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [result]);

  const animDone = result ? animStep >= result.trajectory.length - 1 : false;

  // Trail polyline up to current animation step
  const trailPoints = useMemo(() => {
    if (!result) return "";
    return result.trajectory
      .slice(0, animStep + 1)
      .map((p) => `${(p.x + CENTER).toFixed(1)},${(p.y + CENTER).toFixed(1)}`)
      .join(" ");
  }, [result, animStep]);

  if (!result) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Set a launch speed and run your code to launch the object and watch whether it escapes." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const planetPos = result.trajectory[animStep];
  // escaping = accent (pink), bound = the muted reference tone
  const pathColor = result.escapes ? color.accent : color.reference;
  const statusLabel = result.escapes ? "ESCAPING" : "BOUND";

  // Prediction banner: what did the student's function say about this v0?
  let predictionText = "";
  let predictionColor: string = color.inkMuted;
  let outcomeText = "";
  let outcomeColor: string = color.inkMuted;

  if (result.studentFormulaError) {
    predictionText = "Your formula: ERROR";
    predictionColor = color.accent;
  } else if (result.studentPrediction === true) {
    predictionText = "Your formula predicts: ESCAPING";
    predictionColor = color.accent;
  } else if (result.studentPrediction === false) {
    predictionText = "Your formula predicts: BOUND";
    predictionColor = color.reference;
  } else {
    predictionText = "Your formula returned an unexpected value";
    predictionColor = color.accent;
  }

  if (
    animDone &&
    !result.studentFormulaError &&
    result.studentPrediction !== null
  ) {
    const correct = result.studentPrediction === result.escapes;
    outcomeText = correct ? "Prediction confirmed" : "Prediction was wrong";
    outcomeColor = correct ? color.series[0] : color.accent;
  }

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
            gap: 12,
            width: "100%",
            height: "100%",
            minHeight: 0,
            boxSizing: "border-box",
            padding: "0 8px", // equal breathing room on both sides
          }}
        >
          {/* Orbit canvas — fills the left, stays square */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
            }}
          >
            <svg
              viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
              preserveAspectRatio="xMidYMid meet"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                borderRadius: 12,
                background: color.surfaceRaised,
                border: `1px solid ${color.border}`,
                display: "block",
              }}
              role="img"
              aria-label={`Orbit simulation, object is ${statusLabel.toLowerCase()}`}
            >
              {/* Central body */}
              <circle
                cx={CENTER}
                cy={CENTER}
                r={22}
                fill={color.accent}
                opacity={0.1}
              />
              <circle
                cx={CENTER}
                cy={CENTER}
                r={16}
                fill={color.accent}
                opacity={0.22}
              />
              <circle cx={CENTER} cy={CENTER} r={10} fill={color.accent} />

              {/* Trail */}
              {trailPoints && (
                <polyline
                  points={trailPoints}
                  fill="none"
                  stroke={pathColor}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  opacity={0.6}
                />
              )}

              {/* Moving object */}
              {planetPos && (
                <>
                  <circle
                    cx={planetPos.x + CENTER}
                    cy={planetPos.y + CENTER}
                    r={9}
                    fill={pathColor}
                    opacity={0.3}
                  />
                  <circle
                    cx={planetPos.x + CENTER}
                    cy={planetPos.y + CENTER}
                    r={6}
                    fill={pathColor}
                  />
                </>
              )}

              {/* Outcome label after animation */}
              {animDone && (
                <text
                  x={SVG_SIZE - 12}
                  y={24}
                  textAnchor="end"
                  fontSize={14}
                  fontWeight="bold"
                  fill={pathColor}
                  style={{ letterSpacing: "0.08em" }}
                >
                  {statusLabel}
                </text>
              )}
            </svg>
          </div>

          {/* Prediction panel — on the right, text centered */}
          <div
            style={{
              width: 200,
              flexShrink: 0,
              boxSizing: "border-box",
              background: color.surfaceRaised,
              border: `1px solid ${predictionColor}`,
              borderRadius: 12,
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              gap: 12,
              fontFamily: font.ui,
            }}
          >
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: predictionColor,
                lineHeight: 1.3,
              }}
            >
              {predictionText}
            </span>
            {outcomeText && (
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: outcomeColor,
                  lineHeight: 1.3,
                }}
              >
                {outcomeText}
              </span>
            )}
          </div>
        </div>
      </PluginStage>

      <StatRow
        stats={[
          { label: "Starting Speed", value: `v₀ = ${result.v0}` },
          {
            label: "True Escape Velocity",
            value: `≈ ${result.trueEscapeVelocity.toFixed(2)}`,
            color: color.accent,
          },
          {
            label: "Outcome",
            value: animDone ? statusLabel : EMPTY,
            color: pathColor,
          },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
