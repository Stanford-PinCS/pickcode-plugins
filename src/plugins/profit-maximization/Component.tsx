import { observer } from "mobx-react-lite";
import { useId } from "react";
import { VIEW, makeScales, niceStep, ticks, type Padding } from "../../common/chart";
import {
  EMPTY,
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import { easeInOut, progressBetween, useRunAnimation } from "../../common/useRunAnimation";
import { color, type } from "../../common/tokens";
import instructions from "./instructions.md?raw";
import State, { type Farm } from "./state";

// Timeline of one run, in ms: the cost curves draw in from left to right, then the student's marginal costs appear one crate at a time, the price line sweeps across, the output line drops with the profit or loss rectangle, and the labels fade in last.
const CURVES_MS = 700;
const MC_AT = 700;
const MC_MS = 1000;
const PRICE_AT = 1800;
const PRICE_MS = 400;
const OUTPUT_AT = 2300;
const OUTPUT_MS = 600;
const NOTE_AT = 2900;
const NOTE_MS = 300;
const TOTAL_MS = NOTE_AT + NOTE_MS;

// Layout, in the shared VIEW. The top padding holds the legend; the left holds the axis title, the dollar ticks and the price tag, which is wider than a tick.
const PAD: Padding = { top: 34, right: 22, bottom: 46, left: 72 };
const LEGEND_Y = 16;
const Y_TITLE_X = 12;
const DOT_R = 3.5;

// Colors: the student's marginal costs are the primary series, the correct ones the dashed reference, and the two average cost curves the next series colors. series[2] is skipped because it is the same amber as the reference.
const YOURS = color.series[0];
const ATC_COLOR = color.series[1];
const AVC_COLOR = color.series[3];

/** Shows dollars with no decimals for whole amounts and two otherwise, and a minus sign for a loss. */
function money(v: number): string {
  const cents = Math.round(Math.abs(v) * 100);
  const text = cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
  return `${v < 0 && cents > 0 ? "−" : ""}$${text}`;
}

/** "1 crate", "3 crates". */
const crates = (n: number) => `${n} crate${n === 1 ? "" : "s"}`;

/** Shows a tick value with at most two decimals and no trailing zeros. */
const fmt = (v: number) => String(Number(v.toFixed(2)));

/** The points of a polyline left of `upTo`, ending on an interpolated point so the line grows smoothly. */
function revealed(points: readonly [number, number][], upTo: number): string {
  const out: string[] = [];
  for (let i = 0; i < points.length; i++) {
    const [x, y] = points[i];
    if (x <= upTo) {
      out.push(`${x},${y}`);
      continue;
    }
    if (i > 0) {
      const [px, py] = points[i - 1];
      const f = (upTo - px) / (x - px);
      out.push(`${upTo},${py + (y - py) * f}`);
    }
    break;
  }
  return out.join(" ");
}

/** A small triangle at the edge of the plot marking a marginal cost too high (or too low) to show. */
function Caret({ x, y, up }: { x: number; y: number; up: boolean }) {
  const d = up ? -1 : 1;
  return <polygon points={`${x - 5},${y} ${x + 5},${y} ${x},${y + 7 * d}`} fill={YOURS} />;
}

/** Text with a halo in the surface color, so it stays readable where it crosses a line. */
function Label({ x, y, fill, anchor = "middle", children }: { x: number; y: number; fill: string; anchor?: "start" | "middle" | "end"; children: string }) {
  return (
    <text x={x} y={y} textAnchor={anchor} style={{ ...type.tick, fill, fontWeight: 600 }} stroke={color.surface} strokeWidth={3} paintOrder="stroke">
      {children}
    </text>
  );
}

function Plot({ farm, t }: { farm: Farm; t: number }) {
  const clipId = `farm-plot-${useId().replace(/:/g, "")}`;
  const { units, price, output, chosen } = farm;

  // The dollar axis starts at 0 and fits the correct cost curves and the price. The student's marginal costs don't stretch it, so a wrong one can't squash the picture; a value off the chart gets a caret at the edge instead.
  const highest = Math.max(price, ...farm.mc, ...farm.atc, ...farm.avc, 1);
  const yStep = niceStep(highest * 1.02, 6);
  const yMax = Math.ceil((highest * 1.02) / yStep) * yStep;
  const yTicks = ticks(yMax, yMax / yStep);
  const xStep = niceStep(units, Math.min(units, 10));
  const xTicks = ticks(units, units / xStep);
  const { sx, sy, plotWidth, plotHeight } = makeScales(units, yMax, VIEW, PAD);
  const left = PAD.left;
  const right = PAD.left + plotWidth;
  const top = PAD.top;
  const bottom = PAD.top + plotHeight;

  const at = (values: readonly number[]) => values.map((v, i) => [sx(i + 1), sy(v)] as [number, number]);
  const curvesX = left + (right - left) * easeInOut(progressBetween(t, 0, CURVES_MS));
  const mcP = progressBetween(t, MC_AT, MC_MS);
  const mcX = sx(1 + (units - 1) * mcP);
  const priceX = left + (right - left) * easeInOut(progressBetween(t, PRICE_AT, PRICE_MS));
  const outputP = progressBetween(t, OUTPUT_AT, OUTPUT_MS);
  const rectP = easeInOut(outputP);
  const noteP = progressBetween(t, NOTE_AT, NOTE_MS);

  const yours = at(farm.yourMc);
  const yoursShown = mcP > 0 ? yours.filter(([x]) => x <= mcX + 0.5) : [];
  const atcAt = (q: number) => farm.atc[q - 1];
  const avcAt = (q: number) => farm.avc[q - 1];
  const priceTagNear = (v: number) => Math.abs(sy(v) - sy(price)) < 12;

  // The profit or loss rectangle: output wide, from ATC to the price.
  const atcOut = output > 0 ? atcAt(output) : 0;
  const rectTop = sy(Math.max(price, atcOut));
  const rectBottom = sy(Math.min(price, atcOut));
  const rectRight = sx(0) + (sx(output) - sx(0)) * rectP;
  const isLoss = farm.profit < 0;
  const rectLabel = `${isLoss ? "Loss" : "Profit"} ${money(Math.abs(farm.profit))}`;
  const labelInside = rectBottom - rectTop >= 18;

  const avcChosen = chosen > 0 ? avcAt(chosen) : 0;
  // In the right half of the plot the AVC tag goes to the left of its dot, so it can't run past the right edge.
  const avcTagLeft = chosen > units / 2;
  const describe = farm.shutDown
    ? `Your chooseOutput chose ${crates(chosen)}, but the price, ${money(price)}, is below average variable cost there, ${money(avcChosen)}, so the farm shuts down: it grows 0 crates and its profit is ${money(farm.profit)}${farm.fixedCost > 0 ? ", a loss equal to its fixed cost" : ""}.`
    : `The farm grows ${crates(output)}, and its profit is ${money(farm.profit)}.`;

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
      role="img"
      aria-label={`Cost curves for a tomato farm growing 1 to ${units} crates a day: your marginal costs from ${money(Math.min(...farm.yourMc))} to ${money(Math.max(...farm.yourMc))}, average total cost from ${money(Math.min(...farm.atc))} to ${money(Math.max(...farm.atc))}, average variable cost from ${money(Math.min(...farm.avc))} to ${money(Math.max(...farm.avc))}, and the price, ${money(price)} a crate. ${describe}`}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={left} y={top} width={plotWidth} height={plotHeight} />
        </clipPath>
      </defs>

      <text x={VIEW.width / 2} y={LEGEND_Y} textAnchor="middle" style={type.tick}>
        <tspan fill={YOURS}>●</tspan>
        <tspan> Your MC</tspan>
        <tspan dx={12} fill={color.reference}>¦</tspan>
        <tspan> Correct MC</tspan>
        <tspan dx={12} fill={ATC_COLOR}>—</tspan>
        <tspan> ATC</tspan>
        <tspan dx={12} fill={AVC_COLOR}>—</tspan>
        <tspan> AVC</tspan>
        <tspan dx={12} fill={color.ink}>—</tspan>
        <tspan> D = MR</tspan>
      </text>

      {yTicks.map((v) => (
        <line key={`grid-${v}`} x1={left} y1={sy(v)} x2={right} y2={sy(v)} stroke={color.grid} />
      ))}

      <g clipPath={`url(#${clipId})`}>
        {/* Profit (price above ATC) or loss (price below ATC) at the output the farm grows. */}
        {output > 0 && outputP > 0 && rectTop !== rectBottom && (
          <rect x={sx(0)} y={rectTop} width={Math.max(rectRight - sx(0), 0)} height={rectBottom - rectTop} fill={color.accentSoft} stroke={YOURS} strokeWidth={1} strokeOpacity={0.5} />
        )}

        <polyline points={revealed(at(farm.atc), curvesX)} fill="none" stroke={ATC_COLOR} strokeWidth={2.5} strokeLinejoin="round" />
        <polyline points={revealed(at(farm.avc), curvesX)} fill="none" stroke={AVC_COLOR} strokeWidth={2.5} strokeLinejoin="round" />

        {/* The student's marginal costs: one dot per crate, joined in order. */}
        {yoursShown.length > 1 && <polyline points={yoursShown.map(([x, y]) => `${x},${y}`).join(" ")} fill="none" stroke={YOURS} strokeWidth={2.5} strokeLinejoin="round" />}
        {yoursShown.map(([x, y], i) => (
          <circle key={`mc-${i}`} cx={x} cy={y} r={DOT_R} fill={YOURS} stroke={color.surface} strokeWidth={1} />
        ))}

        {/* The correct marginal costs, thinner and on top so they show through when the student's line lies on them. */}
        <polyline points={revealed(at(farm.mc), curvesX)} fill="none" stroke={color.reference} strokeWidth={1.25} strokeDasharray="4 5" />

        {priceX > left && <line x1={left} y1={sy(price)} x2={priceX} y2={sy(price)} stroke={color.ink} strokeWidth={2} />}

        {output > 0 && outputP > 0 && (
          <g opacity={Math.min(outputP * 3, 1)}>
            <line x1={sx(output)} y1={sy(0)} x2={sx(output)} y2={rectTop} stroke={YOURS} strokeWidth={2} strokeDasharray="5 4" />
            <circle cx={sx(output)} cy={sy(atcAt(output))} r={4.5} fill={ATC_COLOR} stroke={color.surface} strokeWidth={1.5} />
            <circle cx={sx(output)} cy={sy(avcAt(output))} r={4.5} fill={AVC_COLOR} stroke={color.surface} strokeWidth={1.5} />
          </g>
        )}

        {/* When the farm shuts down, show where its loop stopped and the AVC it compared the price with. */}
        {farm.shutDown && outputP > 0 && (
          <g opacity={Math.min(outputP * 3, 1)}>
            <line x1={sx(chosen)} y1={sy(0)} x2={sx(chosen)} y2={sy(Math.max(avcChosen, price))} stroke={color.inkMuted} strokeWidth={1.5} strokeDasharray="3 4" />
            <circle cx={sx(chosen)} cy={sy(avcChosen)} r={4.5} fill={AVC_COLOR} stroke={color.surface} strokeWidth={1.5} />
          </g>
        )}
      </g>

      {/* Marginal costs off the top or bottom of the chart. */}
      {yoursShown.map(([x], i) =>
        farm.yourMc[i] > yMax ? <Caret key={`up-${i}`} x={x} y={top + 8} up /> : farm.yourMc[i] < 0 ? <Caret key={`down-${i}`} x={x} y={bottom - 8} up={false} /> : null
      )}

      {noteP > 0 && (
        <g opacity={noteP}>
          {output > 0 && rectRight > sx(0) && (
            <Label x={(sx(0) + sx(output)) / 2} y={labelInside ? (rectTop + rectBottom) / 2 + 4 : rectTop - 6} fill={YOURS}>
              {rectLabel}
            </Label>
          )}
          {farm.shutDown && (
            <>
              <Label x={sx(chosen) + (avcTagLeft ? -8 : 8)} y={sy(avcChosen) - 8} fill={AVC_COLOR} anchor={avcTagLeft ? "end" : "start"}>
                {`AVC ${money(avcChosen)}`}
              </Label>
              <Label x={(left + right) / 2} y={top + 16} fill={color.ink}>
                {"P < AVC, so the farm shuts down"}
              </Label>
            </>
          )}
        </g>
      )}

      <line x1={left} y1={bottom} x2={right} y2={bottom} stroke={color.axis} />
      <line x1={left} y1={top} x2={left} y2={bottom} stroke={color.axis} />
      {yTicks.map((v) => (
        <g key={`ytick-${v}`}>
          <line x1={left - 5} y1={sy(v)} x2={left} y2={sy(v)} stroke={color.axis} />
          {!(priceX > left && priceTagNear(v)) && (
            <text x={left - 8} y={sy(v) + 4} textAnchor="end" style={type.tick}>
              {fmt(v)}
            </text>
          )}
        </g>
      ))}
      {priceX > left && (
        <text x={left - 8} y={sy(price) + 4} textAnchor="end" style={{ ...type.tick, fill: color.ink, fontWeight: 600 }}>
          {`P = ${fmt(price)}`}
        </text>
      )}
      {xTicks.map((v) => {
        const isOutput = outputP > 0 && v === output;
        return (
          <g key={`xtick-${v}`}>
            <line x1={sx(v)} y1={bottom} x2={sx(v)} y2={bottom + 5} stroke={color.axis} />
            <text x={sx(v)} y={bottom + 18} textAnchor="middle" style={isOutput ? { ...type.tick, fill: YOURS, fontWeight: 700 } : type.tick}>
              {fmt(v)}
            </text>
          </g>
        );
      })}
      <text x={(left + right) / 2} y={VIEW.height - 8} textAnchor="middle" style={type.axisTitle}>
        Quantity (crates of tomatoes per day)
      </text>
      <text x={Y_TITLE_X} y={(top + bottom) / 2} textAnchor="middle" transform={`rotate(-90, ${Y_TITLE_X}, ${(top + bottom) / 2})`} style={type.axisTitle}>
        Price, Cost ($ per crate)
      </text>
    </svg>
  );
}

const Component = observer(({ state }: { state: State }) => {
  const farm = state.farm;
  const t = useRunAnimation(farm, TOTAL_MS);

  if (!farm) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Press Run to draw the tomato farm's cost curves and see how many crates it grows." />
        </PluginStage>
      </PluginSurface>
    );
  }

  // The bottom row describes the output the farm actually grows. With 0 crates there is no last crate and no cost per crate, so those show a dash.
  const shown = t >= OUTPUT_AT;
  const q = farm.output;
  const perCrate = (value: number) => (shown && q > 0 ? money(value) : EMPTY);

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <Plot farm={farm} t={t} />
      </PluginStage>
      <StatRow
        stats={[
          { label: "Output", value: shown ? String(q) : EMPTY },
          { label: "MC", value: perCrate(farm.yourMc[q - 1]), color: YOURS },
          { label: "ATC", value: perCrate(farm.atc[q - 1]), color: ATC_COLOR },
          { label: "AVC", value: perCrate(farm.avc[q - 1]), color: AVC_COLOR },
          { label: "Profit", value: shown ? money(farm.profit) : EMPTY },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
