// Imports are written for src/plugins/<n>/, where this file gets copied.
// They will show as unresolved here. That is expected — do not "fix" them.
// (There is expected to be error lines under "../../common/[blank]")

import { observer } from "mobx-react-lite";
import { color, type } from "../../common/tokens";
import { PAD, VIEW, makeScales, ticks } from "../../common/chart";
import {
  EMPTY,
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import instructions from "./instructions.md?raw";
import { State, FEATURE_MAX, LABELS, type Label, type Model } from "./state";

/**
 * Presentation only. No simulation logic, no message handling, no data
 * transformation beyond what's needed to draw. If you find yourself computing
 * something a student could ask about, it belongs in state.ts.
 *
 * Every color and size comes from tokens or chart helpers. No raw hex.
 */

/** The shared VIEW is split in two: samples on the left, the dataset on the right. */
const SPLIT = VIEW.width / 2;

/** The dataset plot is the standard plot, pushed into the right half. */
const PLOT_PAD = { ...PAD, left: SPLIT + PAD.left };
const SAMPLE_INSET = 26;
const CELL_MIN = 14;//sidelengths of cells
const CELL_MAX = 34;
const POINT_MIN = 4;//radius of an example
const POINT_MAX = 9;

function labelColor(label: Label): string {
  return color.series[LABELS.indexOf(label)] ?? color.inkMuted;
}

function boundaryEnds(m: Model, xMax: number, yMax: number) { // this just draws a line based on the model
  const { sizeWeight: a, roundnessWeight: b, bias: c } = m;
  const pts: { x: number; y: number }[] = [];
  const push = (x: number, y: number) => {
    const inside =
      x >= -1e-9 && x <= xMax + 1e-9 && y >= -1e-9 && y <= yMax + 1e-9;
    const dupe = pts.some((p) => Math.hypot(p.x - x, p.y - y) < 1e-6);
    if (inside && !dupe) pts.push({ x, y });
  };
  if (b !== 0) {
    push(0, -c / b);
    push(xMax, -(a * xMax + c) / b);
  }
  if (a !== 0) {
    push(-c / a, 0);
    push(-(b * yMax + c) / a, yMax);
  }
  return pts.length === 2 ? pts : null;
}

const Component = observer(({ state }: { state: State }) => {
  const cells = state.cells;
  const examples = state.example;
  const predictions = state.prediction;
  const n = cells.length;

  if (n === 0) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Run summonCells(10) to bring in some cells to observe." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const xMax = FEATURE_MAX;
  const yMax = FEATURE_MAX;
  const s = makeScales(xMax, yMax, VIEW, PLOT_PAD);
  const LEGEND_ROW = 16;
/** Legend sits above the x-axis, stacking upward from the bottom of the plot. */
  const LEGEND_TOP = s.sy(0) - LABELS.length * LEGEND_ROW + 70;

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <svg
          viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
          preserveAspectRatio="xMidYMid meet"
          style={{
            width: "100%",
            height: "100%",
            background: color.surfaceRaised,
            border: `1px solid ${color.border}`,
            borderRadius: 8,
            display: "block",
          }}
          role="img"
          aria-label={
            `${n} cells available to observe, ` +
            `${examples.length} recorded examples plotted by size and roundness, ` +
            `${predictions.length} predictions` +
            (state.modelShown && state.model
              ? ", with the model's dividing line shown"
              : "")
          }
        >
          {/* Left half: the sample tray. Cells vary in drawn size and corner
              roundness, sit where state placed them, and carry no class color. */}
          {cells.map((c) => {
            const side =
              CELL_MIN + (c.size / FEATURE_MAX) * (CELL_MAX - CELL_MIN);
            const cx =
              SAMPLE_INSET + c.x * (SPLIT - SAMPLE_INSET * 2);
            const cy =
              PAD.top +
              SAMPLE_INSET +
              c.y * (VIEW.height - PAD.top - PAD.bottom - SAMPLE_INSET * 2);
            const checked = state.checked.includes(c.target);
            const revealed = state.revealed.includes(c.target);
            return (
              <g key={`cell-${c.target}`}>
                {/* checkCell: a dashed ring around a cell being inspected. */}
                {checked && (
                  <g>
                    <rect
                      x={cx - 20}
                      y={cy + side / 2 + 7}
                      width={40}
                      height={18}
                      rx={4}
                      fill={color.surfaceRaised}
                      stroke={color.border}
                    />
                    <text
                      x={cx}
                      y={cy + side / 2 + 16}
                      textAnchor="middle"
                      dominantBaseline="central"
                      style={{ ...type.tick, fill: color.ink }}
                    >
                      {`${c.size}, ${c.roundness}`}
                    </text>
                  </g>
                )}
                <rect
                  x={cx - side / 2}
                  y={cy - side / 2}
                  width={side}
                  height={side}
                  rx={(side / 2) * (c.roundness / FEATURE_MAX)}
                  fill={color.accentSoft}
                  stroke={
                    revealed ? labelColor(c.cancerous ? LABELS[0] : LABELS[1]) : color.border
                  }
                  strokeWidth={revealed ? 2 : 1}
                />
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{ ...type.tick, fill: color.ink, fontWeight: 600,}}
                >
                  {c.target}
                </text>
              </g>
            );
          })}

          {/* Right half: plot area */}
          <rect
            x={s.pad.left}
            y={PAD.top}
            width={s.plotWidth}
            height={s.plotHeight}
            fill={color.surfaceRaised}
            stroke={color.border}
            rx={4}
          />

          {/* Horizontal gridlines */}
          {ticks(yMax).map((v) => (
            <line
              key={`grid-${v}`}
              x1={s.pad.left}
              y1={s.sy(v)}
              x2={s.pad.left + s.plotWidth}
              y2={s.sy(v)}
              stroke={color.grid}
            />
          ))}
          {/* showModel: the line where the classifier's score crosses zero. */}
            {state.modelShown && state.model && (() => {
              const ends = boundaryEnds(state.model, xMax, yMax);
              if (!ends) return null;
              return (
                <line
                  x1={s.sx(ends[0].x)}
                  y1={s.sy(ends[0].y)}
                  x2={s.sx(ends[1].x)}
                  y2={s.sy(ends[1].y)}
                  stroke={color.reference}
                  strokeWidth={2}
                />
              );
            })()}

          {/* Predicted cases, drawn at the cell's own features. Reference color,
              never a series color: a prediction must not look like a record. */}
          {predictions.map((p) => {
            const cell = cells.find((c) => c.target === p.target);
            if (!cell) return null;
            return (
              <circle
                key={`pred-${p.target}`}
                cx={s.sx(cell.size)}
                cy={s.sy(cell.roundness)}
                r={13}
                fill="none"
                stroke={labelColor(p.label)}
                strokeWidth={2}
                strokeDasharray="4 3"
              />
            );
          })}

          {/* The data: one point per recorded example, colored by the student's
              label. The hidden true class is never used here. */}
          {examples.map((e) => (
            <circle
              key={`ex-${e.target}`}
              cx={s.sx(e.size)}
              cy={s.sy(e.roundness)}
              r={POINT_MIN + (e.size / FEATURE_MAX) * (POINT_MAX - POINT_MIN)}
              fill={labelColor(e.label)}
            />
          ))}

          {/* Axes */}
          <line
            x1={s.pad.left}
            y1={s.sy(0)}
            x2={s.pad.left + s.plotWidth}
            y2={s.sy(0)}
            stroke={color.axis}
          />
          <line
            x1={s.pad.left}
            y1={PAD.top}
            x2={s.pad.left}
            y2={s.sy(0)}
            stroke={color.axis}
          />

          {ticks(xMax).map((v) => (
            <text
              key={`xt-${v}`}
              x={s.sx(v)}
              y={s.sy(0) + 20}
              textAnchor="middle"
              style={type.tick}
            >
              {v}
            </text>
          ))}
          {ticks(yMax).map((v) => (
            <text
              key={`yt-${v}`}
              x={s.pad.left - 8}
              y={s.sy(v) + 4}
              textAnchor="end"
              style={type.tick}
            >
              {v}
            </text>
          ))}

          <text
            x={SPLIT / 2}
            y={VIEW.height - 8}
            textAnchor="middle"
            style={type.axisTitle}
          >
            Available Cells
          </text>
          <text
            x={s.pad.left + s.plotWidth / 2}
            y={VIEW.height - 8}
            textAnchor="middle"
            style={type.axisTitle}
          >
            Size
          </text>
          <text
            x={SPLIT + 14}
            y={PAD.top + s.plotHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90, ${SPLIT + 14}, ${
              PAD.top + s.plotHeight / 2
            })`}
            style={type.axisTitle}
          >
            Roundness
          </text>
          {/* Legend. Anchored to the bottom of the plot, where no data sits. */}
          {LABELS.map((label, i) => (
            <g key={`legend-${label}`}>
              <circle
                cx={s.pad.left + 16 - 30}
                cy={LEGEND_TOP + i * LEGEND_ROW}
                r={5}
                fill={color.series[i]}
              />
              <text
                x={s.pad.left + 28 - 30}
                y={LEGEND_TOP + 4 + i * LEGEND_ROW}
                style={type.tick}
              >
                {label}
              </text>
            </g>
          ))}
          <circle
            cx={s.pad.left + 16 + 109}
            cy={LEGEND_TOP + LABELS.length * LEGEND_ROW - 16}
            r={6}
            fill="none"
            stroke={color.reference}
            strokeWidth={2}
            strokeDasharray="4 3"
          />
          <text
            x={s.pad.left + 28 + 109}
            y={LEGEND_TOP + 4 + LABELS.length * LEGEND_ROW - 16}
            style={type.tick}
          >
            prediction
          </text>
        </svg>
      </PluginStage>

      <StatRow
        stats={[
          { label: "Cells", value: String(n) },
          {
            label: "Examples",
            value: String(examples.length),
            color: color.series[0],
          },
          {
            label: "Predictions",
            value:
              predictions.length === 0 ? EMPTY : String(predictions.length),
            color: color.reference,
          },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
