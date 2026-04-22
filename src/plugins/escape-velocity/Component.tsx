import { useMemo, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import State from "./state";

const SVG_SIZE = 500;
const CENTER = SVG_SIZE / 2;
const ANIM_STEPS_PER_FRAME = 8;

const Component = observer(({ state }: { state: State | undefined }) => {
    const result = state?.result ?? null;

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

    const planetPos = result?.trajectory[animStep];
    const pathColor = result?.escapes ? "#f97316" : "#3b82f6";
    const statusLabel = result?.escapes ? "ESCAPING" : "BOUND";
    const statusColor = result?.escapes ? "#f97316" : "#3b82f6";

    // Prediction banner: what did the student's function say about this v0?
    let predictionText = "";
    let predictionColor = "#94a3b8";
    let outcomeText = "";
    let outcomeColor = "#94a3b8";

    if (result) {
        if (result.studentFormulaError) {
            predictionText = "Your formula: ERROR";
            predictionColor = "#ef4444";
        } else if (result.studentPrediction === true) {
            predictionText = "Your formula predicts: ESCAPING";
            predictionColor = "#f97316";
        } else if (result.studentPrediction === false) {
            predictionText = "Your formula predicts: BOUND";
            predictionColor = "#3b82f6";
        } else {
            predictionText = "Your formula returned an unexpected value";
            predictionColor = "#ef4444";
        }

        if (animDone && !result.studentFormulaError && result.studentPrediction !== null) {
            const correct = result.studentPrediction === result.escapes;
            outcomeText = correct ? "✓ Prediction confirmed!" : "✗ Prediction was wrong";
            outcomeColor = correct ? "#16a34a" : "#ef4444";
        }
    }

    return (
        <div
            style={{
                width: "100%",
                minHeight: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
                fontFamily: "sans-serif",
                padding: "16px",
                boxSizing: "border-box",
                gap: "12px",
            }}
        >
            {/* Prediction banner — shown as soon as result arrives, before animation */}
            {result && (
                <div
                    style={{
                        width: "100%",
                        maxWidth: `${SVG_SIZE}px`,
                        boxSizing: "border-box",
                        background: "#0f172a",
                        border: `1px solid ${predictionColor}`,
                        borderRadius: "10px",
                        padding: "10px 16px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <span style={{ fontSize: "13px", fontWeight: "bold", color: predictionColor }}>
                        {predictionText}
                    </span>
                    {outcomeText && (
                        <span style={{ fontSize: "13px", fontWeight: "bold", color: outcomeColor }}>
                            {outcomeText}
                        </span>
                    )}
                </div>
            )}

            {/* Canvas */}
            <div style={{ position: "relative" }}>
                <svg
                    width={SVG_SIZE}
                    height={SVG_SIZE}
                    style={{
                        borderRadius: "12px",
                        background: "#020617",
                        border: "1px solid #1e293b",
                        display: "block",
                        maxWidth: "100%",
                    }}
                >
                    {/* Central body glow */}
                    <circle cx={CENTER} cy={CENTER} r={22} fill="#fde68a" opacity={0.08} />
                    <circle cx={CENTER} cy={CENTER} r={16} fill="#fde68a" opacity={0.2} />
                    <circle cx={CENTER} cy={CENTER} r={10} fill="#fde68a" />

                    {/* Trail */}
                    {result && trailPoints && (
                        <polyline
                            points={trailPoints}
                            fill="none"
                            stroke={pathColor}
                            strokeWidth={2}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            opacity={0.5}
                        />
                    )}

                    {/* Planet */}
                    {result && planetPos && (
                        <>
                            <circle
                                cx={planetPos.x + CENTER}
                                cy={planetPos.y + CENTER}
                                r={9}
                                fill={pathColor}
                                opacity={0.25}
                            />
                            <circle
                                cx={planetPos.x + CENTER}
                                cy={planetPos.y + CENTER}
                                r={6}
                                fill={pathColor}
                            />
                        </>
                    )}

                    {/* Actual outcome label — only after animation completes */}
                    {result && animDone && (
                        <text
                            x={SVG_SIZE - 12}
                            y={24}
                            textAnchor="end"
                            fontSize={14}
                            fontWeight="bold"
                            fill={statusColor}
                            style={{ letterSpacing: "0.08em" }}
                        >
                            {statusLabel}
                        </text>
                    )}

                    {/* Placeholder */}
                    {!result && (
                        <text
                            x={CENTER}
                            y={CENTER}
                            textAnchor="middle"
                            fontSize={14}
                            fill="#475569"
                        >
                            Click run to launch the simulation.
                        </text>
                    )}
                </svg>
            </div>

            {/* Data panel */}
            <div
                style={{
                    background: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: "10px",
                    padding: "12px 20px",
                    width: "100%",
                    maxWidth: `${SVG_SIZE}px`,
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                }}
            >
                <DataRow label="Starting speed" value={result ? `v₀ = ${result.v0}` : "—"} />
                <DataRow
                    label="True escape velocity"
                    value={result ? `v_escape ≈ ${result.trueEscapeVelocity.toFixed(2)}` : "—"}
                />
            </div>
        </div>
    );
});

const DataRow = ({
    label,
    value,
    valueColor = "#e2e8f0",
}: {
    label: string;
    value: string;
    valueColor?: string;
}) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
        <span style={{ color: "#64748b" }}>{label}</span>
        <span style={{ color: valueColor, fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
);

export default Component;
