import { observer } from "mobx-react-lite";
import State from "./state";

function niceStep(max: number): number {
    const rough = max / 5;
    const mag = Math.pow(10, Math.floor(Math.log10(rough)));
    const options = [1, 2, 5, 10].map((m) => m * mag);
    return options.find((s) => s >= rough) ?? mag * 10;
}

const Component = observer(({ state }: { state: State | undefined }) => {
    const points = state?.points ?? [];
    const target = state?.target ?? 0.5;
    const n = points.length;
    const finalProportion = n > 0 ? points[n - 1] : 0;

    const vw = 540;
    const vh = 380;
    const pad = { top: 24, right: 24, bottom: 48, left: 56 };
    const plotW = vw - pad.left - pad.right;
    const plotH = vh - pad.top - pad.bottom;

    const xMax = Math.max(n, 10);
    const yMin = 0;
    const yMax = 1;

    const sx = (x: number) => pad.left + (x / xMax) * plotW;
    const sy = (y: number) =>
        pad.top + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

    const linePoints = points
        .map((y, i) => `${sx(i + 1)},${sy(y)}`)
        .join(" ");

    const xStep = niceStep(xMax);
    const xTicks: number[] = [];
    for (let v = 0; v <= xMax; v += xStep) xTicks.push(v);

    const yTicks = [0, 0.25, 0.5, 0.75, 1.0];

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
                }}
            >
                Coin Flip Simulation
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

                    {yTicks.map((v) => (
                        <line
                            key={`gy-${v}`}
                            x1={pad.left}
                            y1={sy(v)}
                            x2={pad.left + plotW}
                            y2={sy(v)}
                            stroke="rgba(255,255,255,0.06)"
                        />
                    ))}

                    {n > 0 && (
                        <line
                            x1={pad.left}
                            y1={sy(target)}
                            x2={pad.left + plotW}
                            y2={sy(target)}
                            stroke="#fb8c00"
                            strokeWidth="2"
                            strokeDasharray="8 4"
                            opacity={0.8}
                        />
                    )}

                    {n > 0 && (
                        <text
                            x={pad.left + plotW + 4}
                            y={sy(target) + 4}
                            fill="#fb8c00"
                            fontSize="11"
                            fontWeight="600"
                        >
                            {target}
                        </text>
                    )}

                    {n > 0 && (
                        <polyline
                            points={linePoints}
                            fill="none"
                            stroke="#4fc3f7"
                            strokeWidth="2"
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

                    {xTicks.map((v) => (
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
                                fontSize="12"
                                textAnchor="middle"
                            >
                                {v}
                            </text>
                        </g>
                    ))}
                    {yTicks.map((v) => (
                        <g key={`yt-${v}`}>
                            <line
                                x1={pad.left - 5}
                                y1={sy(v)}
                                x2={pad.left}
                                y2={sy(v)}
                                stroke="#8899aa"
                            />
                            <text
                                x={pad.left - 10}
                                y={sy(v) + 4}
                                fill="#99aabb"
                                fontSize="12"
                                textAnchor="end"
                            >
                                {v.toFixed(2)}
                            </text>
                        </g>
                    ))}

                    <text
                        x={pad.left + plotW / 2}
                        y={sy(0) + 42}
                        fill="#99aabb"
                        fontSize="13"
                        fontWeight="600"
                        textAnchor="middle"
                    >
                        Number of Flips
                    </text>
                    <text
                        x={14}
                        y={pad.top + plotH / 2}
                        fill="#99aabb"
                        fontSize="13"
                        fontWeight="600"
                        textAnchor="middle"
                        transform={`rotate(-90, 14, ${pad.top + plotH / 2})`}
                    >
                        Proportion Heads
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
                <StatBlock label="Total Flips" value={String(n)} />
                <StatBlock
                    label="Final Proportion"
                    value={n > 0 ? finalProportion.toFixed(4) : "—"}
                    highlight
                />
                <StatBlock
                    label="Target"
                    value={target.toFixed(2)}
                    muted
                />
                <StatBlock
                    label="Error"
                    value={
                        n > 0
                            ? Math.abs(finalProportion - target).toFixed(4)
                            : "—"
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
