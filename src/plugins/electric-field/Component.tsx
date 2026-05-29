import { observer } from "mobx-react-lite";
import React, { useMemo } from "react";
import State, { Particle } from "./state";

// ─── Constants ────────────────────────────────────────────────────────────────

const CANVAS_W = 480;
const CANVAS_H = 360;
const GRID_COLS = 20;
const GRID_ROWS = 15;
const ARROW_BASE_LENGTH = 20;
const PARTICLE_RADIUS = 18;
const K = 1;

// ─── Electric field helpers ───────────────────────────────────────────────────

interface Vec2 { x: number; y: number }

function computeField(px: number, py: number, particles: Particle[]): Vec2 {
    let ex = 0;
    let ey = 0;
    for (const p of particles) {
        const dx = px - p.x * CANVAS_W;
        const dy = py - p.y * CANVAS_H;
        const r2 = dx * dx + dy * dy;
        if (r2 < 1) continue;
        const r = Math.sqrt(r2);
        const mag = (K * p.q) / r2;
        ex += mag * (dx / r);
        ey += mag * (dy / r);
    }
    return { x: ex, y: ey };
}

// ─── Field arrows ─────────────────────────────────────────────────────────────

function fieldArrows(particles: Particle[]): React.ReactElement[] {
    const arrows: React.ReactElement[] = [];
    const cellW = CANVAS_W / GRID_COLS;
    const cellH = CANVAS_H / GRID_ROWS;

    type Sample = { cx: number; cy: number; ex: number; ey: number; mag: number };
    const samples: Sample[] = [];

    for (let col = 0; col < GRID_COLS; col++) {
        for (let row = 0; row < GRID_ROWS; row++) {
            const cx = (col + 0.5) * cellW;
            const cy = (row + 0.5) * cellH;
            const e = computeField(cx, cy, particles);
            const mag = Math.sqrt(e.x * e.x + e.y * e.y);
            samples.push({ cx, cy, ex: e.x, ey: e.y, mag });
        }
    }

    const maxMag = Math.max(...samples.map((s) => s.mag), 1e-6);

    for (const { cx, cy, ex, ey, mag } of samples) {
        if (mag < 1e-8) continue;

        const tooClose = particles.some((p) => {
            const dx = cx - p.x * CANVAS_W;
            const dy = cy - p.y * CANVAS_H;
            return Math.sqrt(dx * dx + dy * dy) < PARTICLE_RADIUS + 6;
        });
        if (tooClose) continue;

        const norm = mag / maxMag;
        const len = ARROW_BASE_LENGTH * (0.4 + 0.6 * Math.pow(norm, 0.3));
        const nx = ex / mag;
        const ny = ey / mag;

        // Center the arrow on the grid point
        const x1 = cx - nx * len * 0.4;
        const y1 = cy - ny * len * 0.4;
        const x2 = cx + nx * len * 0.6;
        const y2 = cy + ny * len * 0.6;

        const t = Math.pow(norm, 0.4);
        const r = Math.round(50  + (220 - 50)  * t);
        const g = Math.round(100 + (50  - 100) * t);
        const b = Math.round(220 + (50  - 220) * t);
        const color = `rgb(${r},${g},${b})`;
        const opacity = 0.4 + 0.55 * norm;

        arrows.push(
            <line
                key={`${cx}-${cy}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={color}
                strokeWidth={1.8}
                strokeOpacity={opacity}
                markerEnd="url(#fieldArrow)"
            />
        );
    }

    return arrows;
}

// ─── Field line tracing ───────────────────────────────────────────────────────

function traceFieldLine(startX: number, startY: number, particles: Particle[]): string {
    const step = 3;
    const maxSteps = 400;
    let x = startX;
    let y = startY;
    const pts: [number, number][] = [[x, y]];

    for (let i = 0; i < maxSteps; i++) {
        const e = computeField(x, y, particles);
        const mag = Math.sqrt(e.x * e.x + e.y * e.y);
        if (mag < 1e-8) break;

        x += (e.x / mag) * step;
        y += (e.y / mag) * step;

        if (x < 0 || x > CANVAS_W || y < 0 || y > CANVAS_H) break;

        const hitSink = particles.some((p) => {
            if (p.q >= 0) return false;
            const dx = x - p.x * CANVAS_W;
            const dy = y - p.y * CANVAS_H;
            return Math.sqrt(dx * dx + dy * dy) < PARTICLE_RADIUS;
        });
        if (hitSink) break;

        pts.push([x, y]);
    }

    if (pts.length < 2) return "";
    return pts.map(([px, py], i) => `${i === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`).join(" ");
}

function buildFieldLines(particles: Particle[]): React.ReactElement[] {
    const lines: React.ReactElement[] = [];
    const positives = particles.filter((p) => p.q > 0);
    const LINES_PER_CHARGE = 16;

    for (const p of positives) {
        const cx = p.x * CANVAS_W;
        const cy = p.y * CANVAS_H;
        for (let i = 0; i < LINES_PER_CHARGE; i++) {
            const angle = (2 * Math.PI * i) / LINES_PER_CHARGE;
            const sx = cx + Math.cos(angle) * (PARTICLE_RADIUS + 2);
            const sy = cy + Math.sin(angle) * (PARTICLE_RADIUS + 2);
            const d = traceFieldLine(sx, sy, particles);
            if (d) {
                lines.push(
                    <path
                        key={`fl-${p.id}-${i}`}
                        d={d}
                        fill="none"
                        stroke="rgba(120,140,255,0.22)"
                        strokeWidth={1}
                    />
                );
            }
        }
    }
    return lines;
}

// ─── Charge label ─────────────────────────────────────────────────────────────

function chargeLabel(q: number): string {
    const sign = q > 0 ? "+" : "−";
    const mag = Math.abs(q);
    return mag === 1 ? sign : `${sign}${mag}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

const Component = observer(({ state }: { state: State | undefined }) => {
    const particles = state?.particles ?? [];
    const isEmpty = particles.length === 0;

    const arrows = useMemo(() => (isEmpty ? [] : fieldArrows(particles)), [particles]);
    const fieldLines = useMemo(() => (isEmpty ? [] : buildFieldLines(particles)), [particles]);

    return (
        <div
            style={{
                width: "100%",
                minHeight: "100%",
                display: "flex",
                flexDirection: "column",
                background: "linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%)",
                fontFamily: "'Georgia', serif",
                padding: "16px",
                boxSizing: "border-box",
                gap: "12px",
            }}
        >
            <div style={{ textAlign: "center" }}>
                <h2 style={{ margin: 0, fontSize: "18px", color: "#1e3a8a", fontWeight: "bold", letterSpacing: "0.02em" }}>
                    Electric Field Simulation
                </h2>
                <div style={{ margin: "4px 0 0", fontSize: "12px", color: "#475569", lineHeight: 1.8 }}>
                    {isEmpty ? (
                        <span>Use <code>createParticle(x, y, q)</code> to place charges</span>
                    ) : (
                        <span>
                            {particles.length} particle{particles.length !== 1 ? "s" : ""} ·{" "}
                            {particles.filter((p) => p.q > 0).length} positive · {particles.filter((p) => p.q < 0).length} negative
                        </span>
                    )}
                </div>
            </div>

            <div
                style={{
                    background: "white",
                    borderRadius: "12px",
                    padding: "12px",
                    boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                }}
            >
                {isEmpty ? (
                    <div
                        style={{
                            width: CANVAS_W,
                            height: CANVAS_H,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#94a3b8",
                            fontSize: "14px",
                            textAlign: "center",
                            borderRadius: "8px",
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                        }}
                    >
                        Add charged particles to see the electric field
                    </div>
                ) : (
                    <svg
                        width={CANVAS_W}
                        height={CANVAS_H}
                        style={{
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                            display: "block",
                            background: "#f8fafc",
                        }}
                    >
                        <defs>
                            <marker
                                id="fieldArrow"
                                viewBox="0 0 10 10"
                                refX="8"
                                refY="5"
                                markerWidth="5"
                                markerHeight="5"
                                orient="auto-start-reverse"
                            >
                                <path d="M2 2L8 5L2 8" fill="none" stroke="context-stroke" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </marker>
                        </defs>

                        {fieldLines}
                        {arrows}

                        {particles.map((p) => {
                            const cx = p.x * CANVAS_W;
                            const cy = p.y * CANVAS_H;
                            const isPos = p.q > 0;
                            const fill = isPos ? "#ef4444" : "#3b82f6";
                            const stroke = isPos ? "#991b1b" : "#1e3a8a";
                            const label = chargeLabel(p.q);
                            const fontSize = label.length > 2 ? 10 : 12;
                            return (
                                <g key={p.id}>
                                    <circle cx={cx} cy={cy} r={PARTICLE_RADIUS} fill={fill} stroke={stroke} strokeWidth={2} opacity={0.92} />
                                    <text
                                        x={cx} y={cy}
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                        fontSize={fontSize}
                                        fontWeight="bold"
                                        fill="white"
                                        style={{ userSelect: "none", pointerEvents: "none" }}
                                    >
                                        {label}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                )}

                <div style={{ display: "flex", gap: "20px", fontSize: "11px", color: "#64748b", flexWrap: "wrap", justifyContent: "center" }}>
                    <span>
                        <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#ef4444", marginRight: 4, verticalAlign: "middle" }} />
                        Positive charge
                    </span>
                    <span>
                        <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#3b82f6", marginRight: 4, verticalAlign: "middle" }} />
                        Negative charge
                    </span>
                    <span>
                        <span style={{ display: "inline-block", width: 24, height: 2, background: "linear-gradient(to right, #6464dc, #dc5050)", marginRight: 4, verticalAlign: "middle" }} />
                        Field direction
                    </span>
                </div>
            </div>
        </div>
    );
});

export default Component;