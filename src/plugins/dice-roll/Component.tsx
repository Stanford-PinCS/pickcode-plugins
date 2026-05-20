import { observer } from "mobx-react-lite";
import State from "./state";

const Component = observer(({ state }: { state: State | undefined }) => {
    const percentages = state?.percentages ?? [];
    const target = state?.target ?? 0;
    const numFaces = percentages.length;
    const maxPct = Math.max(
        ...percentages.map((p) => p),
        target + 5,
        30
    );
    const yMax = Math.ceil(maxPct / 5) * 5;

    const vw = 540;
    const vh = 380;
    const pad = { top: 24, right: 24, bottom: 48, left: 56 };
    const plotW = vw - pad.left - pad.right;
    const plotH = vh - pad.top - pad.bottom;

    const sy = (y: number) => pad.top + plotH - (y / yMax) * plotH;

    const barGap = 6;
    const totalGaps = numFaces > 0 ? (numFaces + 1) * barGap : 0;
    const barW = numFaces > 0 ? (plotW - totalGaps) / numFaces : 0;
    const barX = (i: number) => pad.left + barGap + i * (barW + barGap);

    const yStep = yMax <= 30 ? 5 : yMax <= 60 ? 10 : 20;
    const yTicks: number[] = [];
    for (let v = 0; v <= yMax; v += yStep) yTicks.push(v);

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
                Dice Roll Simulation
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

                    {target > 0 && (
                        <>
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
                            <text
                                x={pad.left + plotW + 4}
                                y={sy(target) + 4}
                                fill="#fb8c00"
                                fontSize="11"
                                fontWeight="600"
                            >
                                {target.toFixed(1)}%
                            </text>
                        </>
                    )}

                    {percentages.map((pct, i) => {
                        const h = sy(0) - sy(pct);
                        return (
                            <g key={i}>
                                <rect
                                    x={barX(i)}
                                    y={sy(pct)}
                                    width={barW}
                                    height={Math.max(h, 0)}
                                    fill="#4fc3f7"
                                    fillOpacity={0.6}
                                    stroke="#4fc3f7"
                                    rx="2"
                                />
                                <text
                                    x={barX(i) + barW / 2}
                                    y={sy(pct) - 6}
                                    fill="#99aabb"
                                    fontSize="11"
                                    textAnchor="middle"
                                >
                                    {pct.toFixed(1)}%
                                </text>
                            </g>
                        );
                    })}

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

                    {percentages.map((_, i) => (
                        <text
                            key={`xl-${i}`}
                            x={barX(i) + barW / 2}
                            y={sy(0) + 20}
                            fill="#99aabb"
                            fontSize="13"
                            fontWeight="600"
                            textAnchor="middle"
                        >
                            {i + 1}
                        </text>
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
                                {v}%
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
                        Die Face
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
                        Frequency (%)
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
                <StatBlock label="Faces" value={String(numFaces)} />
                <StatBlock
                    label="Expected"
                    value={target > 0 ? target.toFixed(1) + "%" : "—"}
                    muted
                />
                <StatBlock
                    label="Max Deviation"
                    value={
                        numFaces > 0
                            ? Math.max(
                                  ...percentages.map((p) =>
                                      Math.abs(p - target)
                                  )
                              ).toFixed(1) + "%"
                            : "—"
                    }
                    highlight
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
