import { observer } from "mobx-react-lite";
import State from "./state";

const EXACT_AREA = 64 / 3;
const X_MIN = 0;
const X_MAX = 4;
const Y_MAX = 16;

const Component = observer(({ state }: { state: State | undefined }) => {
    const rects = state?.rects ?? [];
    const curveVisible = state?.curveVisible ?? false;
    const area = state?.area ?? 0;
    const n = rects.length;

    const vw = 520;
    const vh = 420;
    const pad = { top: 24, right: 24, bottom: 44, left: 52 };
    const plotW = vw - pad.left - pad.right;
    const plotH = vh - pad.top - pad.bottom;

    const sx = (x: number) =>
        pad.left + ((x - X_MIN) / (X_MAX - X_MIN)) * plotW;
    const sy = (y: number) => pad.top + plotH - (y / Y_MAX) * plotH;

    const curvePoints = curveVisible
        ? Array.from({ length: 201 }, (_, i) => {
              const x = (i / 200) * X_MAX;
              return `${sx(x)},${sy(Math.min(x * x, Y_MAX))}`;
          }).join(" ")
        : "";

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                width: "100%",
                background: "#101828",
                color: "#e0e0e0",
                fontFamily: "'Segoe UI', system-ui, sans-serif",
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    padding: "14px 20px 6px",
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#fff",
                    letterSpacing: "0.3px",
                }}
            >
                Riemann Sum: f(x) = x&sup2; on [0, 4]
            </div>

            <div
                style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "4px 12px",
                    minHeight: 0,
                }}
            >
                <svg
                    viewBox={`0 0 ${vw} ${vh}`}
                    style={{ width: "100%", height: "100%" }}
                    preserveAspectRatio="xMidYMid meet"
                >
                    <rect
                        x={pad.left}
                        y={pad.top}
                        width={plotW}
                        height={plotH}
                        fill="#1a2332"
                        rx="4"
                    />

                    {[4, 8, 12, 16].map((v) => (
                        <line
                            key={`gy-${v}`}
                            x1={pad.left}
                            y1={sy(v)}
                            x2={pad.left + plotW}
                            y2={sy(v)}
                            stroke="rgba(255,255,255,0.06)"
                        />
                    ))}
                    {[1, 2, 3, 4].map((v) => (
                        <line
                            key={`gx-${v}`}
                            x1={sx(v)}
                            y1={pad.top}
                            x2={sx(v)}
                            y2={pad.top + plotH}
                            stroke="rgba(255,255,255,0.06)"
                        />
                    ))}

                    {rects.map((r, i) => {
                        const h = Math.min(r.height, Y_MAX);
                        if (h <= 0) return null;
                        return (
                            <rect
                                key={i}
                                x={sx(r.x)}
                                y={sy(h)}
                                width={sx(r.x + r.width) - sx(r.x)}
                                height={sy(0) - sy(h)}
                                fill={r.color}
                                fillOpacity={0.45}
                                stroke={r.color}
                                strokeWidth={n > 40 ? 0.3 : 1}
                            />
                        );
                    })}

                    {curveVisible && (
                        <polyline
                            points={curvePoints}
                            fill="none"
                            stroke="#4fc3f7"
                            strokeWidth="2.5"
                            strokeLinejoin="round"
                        />
                    )}

                    <line
                        x1={pad.left}
                        y1={sy(0)}
                        x2={pad.left + plotW}
                        y2={sy(0)}
                        stroke="#8899aa"
                        strokeWidth="1.5"
                    />
                    <line
                        x1={pad.left}
                        y1={pad.top}
                        x2={pad.left}
                        y2={sy(0)}
                        stroke="#8899aa"
                        strokeWidth="1.5"
                    />

                    {[0, 1, 2, 3, 4].map((v) => (
                        <g key={`xt-${v}`}>
                            <line
                                x1={sx(v)}
                                y1={sy(0)}
                                x2={sx(v)}
                                y2={sy(0) + 6}
                                stroke="#8899aa"
                            />
                            <text
                                x={sx(v)}
                                y={sy(0) + 22}
                                fill="#99aabb"
                                fontSize="13"
                                textAnchor="middle"
                            >
                                {v}
                            </text>
                        </g>
                    ))}
                    {[0, 4, 8, 12, 16].map((v) => (
                        <g key={`yt-${v}`}>
                            <line
                                x1={pad.left - 6}
                                y1={sy(v)}
                                x2={pad.left}
                                y2={sy(v)}
                                stroke="#8899aa"
                            />
                            <text
                                x={pad.left - 12}
                                y={sy(v) + 4}
                                fill="#99aabb"
                                fontSize="13"
                                textAnchor="end"
                            >
                                {v}
                            </text>
                        </g>
                    ))}

                    <text
                        x={pad.left + plotW / 2}
                        y={sy(0) + 40}
                        fill="#99aabb"
                        fontSize="14"
                        textAnchor="middle"
                        fontWeight="600"
                    >
                        X
                    </text>
                    <text
                        x={14}
                        y={pad.top + plotH / 2}
                        fill="#99aabb"
                        fontSize="14"
                        textAnchor="middle"
                        fontWeight="600"
                        transform={`rotate(-90, 14, ${pad.top + plotH / 2})`}
                    >
                        Y
                    </text>
                </svg>
            </div>

            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "32px",
                    padding: "10px 20px 16px",
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    flexWrap: "wrap",
                }}
            >
                <StatBlock label="Rectangles (n)" value={String(n)} />
                <StatBlock
                    label="Approx. Area"
                    value={area ? area.toFixed(4) : "—"}
                    highlight
                />
                <StatBlock
                    label="Exact Area"
                    value={EXACT_AREA.toFixed(4)}
                    muted
                />
                <StatBlock
                    label="Error"
                    value={
                        area ? Math.abs(area - EXACT_AREA).toFixed(4) : "—"
                    }
                    muted
                />
            </div>
        </div>
    );
});

function StatBlock({
    label,
    value,
    muted,
    highlight,
}: {
    label: string;
    value: string;
    muted?: boolean;
    highlight?: boolean;
}) {
    return (
        <div style={{ textAlign: "center", minWidth: "90px" }}>
            <div
                style={{
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    color: muted ? "#556" : "#899",
                    marginBottom: "3px",
                }}
            >
                {label}
            </div>
            <div
                style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    color: highlight ? "#4fc3f7" : muted ? "#667" : "#e0e0e0",
                    fontVariantNumeric: "tabular-nums",
                }}
            >
                {value}
            </div>
        </div>
    );
}

export default Component;
