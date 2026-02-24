import { observer } from "mobx-react-lite";
import React, { useEffect, useRef, useMemo, useState } from "react";
import State from "./state";

// ─── Dot Simulation ──────────────────────────────────────────────────────────

interface Dot {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    newTimer: number; // 1.0 = just born, 0.0 = fully settled
}

const SIM_WIDTH = 400;
const SIM_HEIGHT = 300;
const DOT_RADIUS = 5;
const MAX_DISPLAY_DOTS = 10000;

function createDot(id: number, isNew = false): Dot {
    return {
        id,
        x: DOT_RADIUS + Math.random() * (SIM_WIDTH - DOT_RADIUS * 2),
        y: DOT_RADIUS + Math.random() * (SIM_HEIGHT - DOT_RADIUS * 2),
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        newTimer: isNew ? 1.0 : 0,
    };
}

function stepDots(dots: Dot[], dt: number): Dot[] {
    return dots.map((dot) => {
        let { x, y, vx, vy, newTimer } = dot;
        x += vx;
        y += vy;
        if (x < DOT_RADIUS) { x = DOT_RADIUS; vx = Math.abs(vx); }
        if (x > SIM_WIDTH - DOT_RADIUS) { x = SIM_WIDTH - DOT_RADIUS; vx = -Math.abs(vx); }
        if (y < DOT_RADIUS) { y = DOT_RADIUS; vy = Math.abs(vy); }
        if (y > SIM_HEIGHT - DOT_RADIUS) { y = SIM_HEIGHT - DOT_RADIUS; vy = -Math.abs(vy); }
        vx += (Math.random() - 0.5) * 0.3;
        vy += (Math.random() - 0.5) * 0.3;
        const speed = Math.sqrt(vx * vx + vy * vy);
        if (speed > 2.5) { vx = (vx / speed) * 2.5; vy = (vy / speed) * 2.5; }
        newTimer = Math.max(0, newTimer - dt * 2);
        return { ...dot, x, y, vx, vy, newTimer };
    });
}

// Interpolate between green (t=0) and yellow (t=1)
function dotColor(t: number): string {
    const r = Math.round(22  + (234 - 22)  * t);
    const g = Math.round(163 + (179 - 163) * t);
    const b = Math.round(74  + (8   - 74)  * t);
    return `rgb(${r}, ${g}, ${b})`;
}

// ─── Population Graph ─────────────────────────────────────────────────────────

const PopulationGraph = ({
    history,
    growthRate,
}: {
    history: { day: number; population: number }[];
    growthRate: number | null;
}) => {
    const width = 380;
    const height = 220;
    const pad = { top: 20, right: 20, bottom: 40, left: 56 };
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;

    const maxDay = Math.max(10, history.length > 0 ? history[history.length - 1].day : 10);
    const rawMaxPop = Math.max(...history.map((h) => h.population), history[0]?.population ?? 10);

    const niceStep = (rawMax: number, targetTicks: number): number => {
        const rough = rawMax / targetTicks;
        const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
        const candidates = [1, 2, 2.5, 5, 10].map((c) => c * magnitude);
        return candidates.find((c) => c >= rough) ?? candidates[candidates.length - 1];
    };

    const yStep = niceStep(rawMaxPop, 5);
    const maxPop = Math.ceil((rawMaxPop * 1.1) / yStep) * yStep;
    const yTickValues: number[] = [];
    for (let v = 0; v <= maxPop; v += yStep) yTickValues.push(v);

    const toX = (d: number) => pad.left + (d / maxDay) * innerW;
    const toY = (p: number) => pad.top + innerH - (p / maxPop) * innerH;

    const polyline = history
        .map((h) => `${toX(h.day).toFixed(1)},${toY(h.population).toFixed(1)}`)
        .join(" ");

    const xStep = niceStep(maxDay, 10);
    const xTickValues: number[] = [];
    for (let v = 0; v <= maxDay; v += xStep) xTickValues.push(v);

    return (
        <svg width={width} height={height} style={{ overflow: "visible" }}>
            {yTickValues.map((v) => (
                <line key={v} x1={pad.left} x2={pad.left + innerW} y1={toY(v)} y2={toY(v)} stroke="#e2e8f0" strokeWidth={1} />
            ))}
            <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + innerH} stroke="#94a3b8" strokeWidth={1.5} />
            <line x1={pad.left} y1={pad.top + innerH} x2={pad.left + innerW} y2={pad.top + innerH} stroke="#94a3b8" strokeWidth={1.5} />
            {yTickValues.map((v) => (
                <text key={v} x={pad.left - 6} y={toY(v) + 4} textAnchor="end" fontSize={10} fill="#64748b">
                    {v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
                </text>
            ))}
            {xTickValues.map((v) => (
                <text key={v} x={toX(v)} y={pad.top + innerH + 16} textAnchor="middle" fontSize={10} fill="#64748b">
                    {v}
                </text>
            ))}
            <text x={pad.left + innerW / 2} y={height - 2} textAnchor="middle" fontSize={11} fill="#475569">
                Day
            </text>
            <text x={12} y={pad.top + innerH / 2} textAnchor="middle" fontSize={11} fill="#475569"
                transform={`rotate(-90, 12, ${pad.top + innerH / 2})`}>
                Population
            </text>
            {history.length > 1 && (
                <polyline points={polyline} fill="none" stroke="#16a34a" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            )}
            {history.map((h) => (
                <circle key={h.day} cx={toX(h.day)} cy={toY(h.population)} r={3.5} fill="#16a34a" stroke="white" strokeWidth={1.5} />
            ))}
            {growthRate !== null && (
                <text x={pad.left + innerW - 4} y={pad.top + 14} textAnchor="end" fontSize={10} fill="#0284c7" fontStyle="italic">
                    r = {growthRate}
                </text>
            )}
        </svg>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Component = observer(({ state }: { state: State | undefined }) => {
    const [dots, setDots] = useState<Dot[]>([]);
    const animFrameRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);
    const prevPopRef = useRef<number>(0);
    const dotIdCounter = useRef<number>(0);

    const population = state?.currentPopulation ?? 0;
    const history = state?.history ?? [];
    const config = state?.config;
    const currentDay = state?.currentDay ?? 0;

    useEffect(() => {
        const displayCount = Math.min(population, MAX_DISPLAY_DOTS);
        prevPopRef.current = population;

        if (displayCount === 0) {
            setDots([]);
            return;
        }

        setDots((prev) => {
            if (displayCount > prev.length) {
                const newDots: Dot[] = [];
                for (let i = prev.length; i < displayCount; i++) {
                    newDots.push(createDot(dotIdCounter.current++, true));
                }
                return [...prev, ...newDots];
            } else if (displayCount < prev.length) {
                return prev.slice(0, displayCount);
            }
            return prev;
        });
    }, [population]);

    useEffect(() => {
        const animate = (time: number) => {
            const dt = lastTimeRef.current ? Math.min((time - lastTimeRef.current) / 1000, 0.1) : 0.016;
            lastTimeRef.current = time;
            setDots((prev) => stepDots(prev, dt));
            animFrameRef.current = requestAnimationFrame(animate);
        };
        animFrameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animFrameRef.current);
    }, []);

    const isEmpty = !config;

    return (
        <div
            style={{
                width: "100%",
                minHeight: "100%",
                display: "flex",
                flexDirection: "column",
                background: "linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)",
                fontFamily: "'Georgia', serif",
                padding: "16px",
                boxSizing: "border-box",
                gap: "12px",
            }}
        >
            <div style={{ textAlign: "center" }}>
                <h2 style={{ margin: 0, fontSize: "18px", color: "#166534", fontWeight: "bold", letterSpacing: "0.02em" }}>
                    Population Ecology Simulation
                </h2>
                {config && (
                    <div style={{ margin: "4px 0 0", fontSize: "12px", color: "#475569", lineHeight: "1.8" }}>
                        <div>N₀ = {config.initialSize}</div>
                        {config.growthRate !== null ? (
                            <>
                                <div>r = {config.growthRate}</div>
                                <div>N(t) = N₀·e^(r·t)</div>
                            </>
                        ) : (
                            <div>Custom population schedule</div>
                        )}
                    </div>
                )}
            </div>

            {isEmpty ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: "14px", textAlign: "center" }}>
                    <div>
                        Click the play button to start the simulation!
                    </div>
                </div>
            ) : (
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
                    <div style={{ background: "white", borderRadius: "12px", padding: "12px", boxShadow: "0 1px 6px rgba(0,0,0,0.08)", flex: "1 1 380px", maxWidth: "420px" }}>
                        <div style={{ fontSize: "12px", fontWeight: "bold", color: "#475569", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            Population vs. Time Graph
                        </div>
                        <PopulationGraph history={history} growthRate={config.growthRate} />
                        <div style={{ display: "flex", gap: "16px", marginTop: "8px", fontSize: "12px", color: "#475569" }}>
                            <span>Day: <strong style={{ color: "#166534" }}>{currentDay}</strong></span>
                            <span>Population: <strong style={{ color: "#166534" }}>{population.toLocaleString()}</strong></span>
                        </div>
                    </div>

                    <div style={{ background: "white", borderRadius: "12px", padding: "12px", boxShadow: "0 1px 6px rgba(0,0,0,0.08)", flex: "1 1 380px", maxWidth: "420px" }}>
                        <div style={{ fontSize: "12px", fontWeight: "bold", color: "#475569", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            Live Simulation
                            {population > MAX_DISPLAY_DOTS && (
                                <span style={{ fontWeight: "normal", marginLeft: "6px", color: "#94a3b8" }}>
                                    (showing {MAX_DISPLAY_DOTS}/{population.toLocaleString()})
                                </span>
                            )}
                        </div>
                        <svg width={SIM_WIDTH} height={SIM_HEIGHT}
                            style={{ borderRadius: "8px", background: "#f8fafc", border: "1px solid #e2e8f0", display: "block" }}>
                            {dots.map((dot) => (
                                <circle
                                    key={dot.id}
                                    cx={dot.x}
                                    cy={dot.y}
                                    r={DOT_RADIUS}
                                    fill={dotColor(dot.newTimer)}
                                    opacity={0.85 + dot.newTimer * 0.15}
                                />
                            ))}
                        </svg>
                        <div style={{ marginTop: "6px", fontSize: "11px", color: "#94a3b8", display: "flex", gap: "12px" }}>
                            <span>🟢 Existing organisms</span>
                            <span>🟡 Newly born (this day)</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export default Component;