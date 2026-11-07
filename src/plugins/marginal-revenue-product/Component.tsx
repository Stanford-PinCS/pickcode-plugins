import { observer } from "mobx-react-lite";
import { VIEW, makeScales, niceStep, type Padding } from "../../common/chart";
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
import State, { type Hiring } from "./state";

// Timeline of one run, in ms: the MRP bars rise, the wage line sweeps across them, then the loop's hires turn pink one picker at a time.
const RISE_MS = 700;
const WAGE_AT = 600;
const WAGE_MS = 500;
const HIRE_AT = 1250;
const HIRE_EACH_MAX = 300;
const HIRES_MS_MAX = 2000;
const HIRE_FADE_MS = 160;
const SETTLE_MS = 400;

// Layout, in the shared VIEW: a legend on top, the bars, then each picker's number and MP under the axis. Plot widens the left side when the dollar tick labels are long.
const PAD: Padding = { top: 46, right: 26, bottom: 72, left: 64 };
const PLOT_BOTTOM = VIEW.height - PAD.bottom;
const LEGEND_Y = 16;
const PICKER_ROW_Y = PLOT_BOTTOM + 17;
const MP_ROW_Y = PLOT_BOTTOM + 33;
const AXIS_TITLE_Y = PLOT_BOTTOM + 58;
// The y-axis title runs up the left edge at this x and reaches about 3 units right of it, so the tick labels start right of TICK_LABEL_MIN_X to stay clear of it.
const Y_TITLE_X = 16;
const TICK_LABEL_MIN_X = 28;
// Share of each picker's slot that its bar fills.
const BAR_SHARE = 0.62;
// type.tick is a monospace face at 11px, so a label is about this wide per character, and reaches this far above and below its baseline.
const CHAR_W = 6.6;
const LABEL_ASCENT = 9;
const LABEL_DESCENT = 2;

/** Dollars, with cents only when they aren't zero: $60, $82.50, −$15. */
function money(v: number): string {
  const cents = Math.round(Math.abs(v) * 100);
  const text = cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
  return `${v < 0 && cents > 0 ? "−" : ""}$${text}`;
}

/** A number with at most two decimals and no trailing zeros, with a real minus sign. */
const fmt = (v: number) => String(Number(v.toFixed(2))).replace("-", "−");

/** Milliseconds between one hire and the next, so a long hiring run still fits the timeline. */
const hireEach = (hired: number) => Math.min(HIRE_EACH_MAX, HIRES_MS_MAX / Math.max(hired, 1));

/** When the last hire has finished turning pink: the moment the bottom row can show the loop's result. */
const hiresDoneAt = (hired: number) => HIRE_AT + (hired > 0 ? (hired - 1) * hireEach(hired) + HIRE_FADE_MS : 0);

interface Axis {
  start: number;
  end: number;
  ticks: number[];
}

/** A dollar axis from 0 (or below it, for a negative MRP) past the tallest bar and the wage, on round steps, with a tenth of headroom for the bar labels. */
function dollarAxis(values: readonly number[]): Axis {
  const top = Math.max(0, ...values);
  const bottom = Math.min(0, ...values);
  const step = niceStep(Math.max(top - bottom, 1), 3);
  const end = Math.max(Math.ceil((top * 1.1) / step), 1) * step;
  const start = Math.floor((bottom * 1.1) / step) * step;
  // The prefixes and showHiring keep the price, the wage and every total product within 1000000, so this never happens; it only stops an overflowed value from looping forever below.
  if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(step) || step <= 0) {
    return { start: 0, end: 1, ticks: [0, 1] };
  }
  const ticks: number[] = [];
  for (let v = start; v <= end + step * 1e-9; v += step) ticks.push(Number(v.toFixed(10)));
  return { start, end, ticks };
}

/** Where a bar's MRP label goes, given the top of the bar: above it (below it for a negative MRP), unless the wage line runs through that spot. A label above the bar sits between top − 14 and top − 3, so when the line runs through that band the label moves inside the bar, or above the line when the bar is too short to hold it. Returns the label's baseline and whether it's inside the bar. */
function mrpLabelPlace(value: number, top: number, zeroY: number, wageY: number): { y: number; inside: boolean } {
  const crossesWage = value >= 0 && wageY > top - 16 && wageY < top - 1;
  const inside = crossesWage && Math.abs(zeroY - top) >= 20;
  const y = inside ? top + 13 : crossesWage ? wageY - 5 : value >= 0 ? top - 5 : top + 13;
  return { y, inside };
}

/** The legend's three keys, laid out from their text widths and centered. */
function Legend() {
  const items = [
    { key: "hired", text: "MRP, hired", swatch: 16 },
    { key: "not", text: "MRP, not hired", swatch: 16 },
    { key: "wage", text: "Wage (MFC)", swatch: 24 },
  ];
  const gap = 20;
  const total = items.reduce((sum, item) => sum + item.swatch + item.text.length * CHAR_W, 0) + gap * (items.length - 1);
  let x = (VIEW.width - total) / 2;
  return (
    <g>
      {items.map((item) => {
        const left = x;
        x += item.swatch + item.text.length * CHAR_W + gap;
        return (
          <g key={item.key}>
            {item.key === "hired" && <rect x={left} y={LEGEND_Y - 9} width={11} height={11} fill={color.series[0]} />}
            {item.key === "not" && (
              <rect x={left + 0.5} y={LEGEND_Y - 8.5} width={10} height={10} fill={color.grid} stroke={color.inkMuted} strokeOpacity={0.6} />
            )}
            {item.key === "wage" && (
              <line x1={left} y1={LEGEND_Y - 3.5} x2={left + 19} y2={LEGEND_Y - 3.5} stroke={color.reference} strokeWidth={2.5} strokeDasharray="5 3" />
            )}
            <text x={left + item.swatch} y={LEGEND_Y} style={type.tick}>
              {item.text}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function Plot({ hiring, t }: { hiring: Hiring; t: number }) {
  const { mp, mrp, wage, hired } = hiring;
  const n = mrp.length;
  const axis = dollarAxis([...mrp, wage]);
  const tickLabels = axis.ticks.map(money);
  // The tick labels end 8 units left of the axis, so a long one pushes the axis right until it clears the y-axis title.
  const longestTick = Math.max(...tickLabels.map((s) => s.length)) * CHAR_W;
  const pad: Padding = { ...PAD, left: Math.max(PAD.left, TICK_LABEL_MIN_X + longestTick + 8) };
  const scales = makeScales(n, axis.end - axis.start, VIEW, pad);
  const sy = (v: number) => scales.sy(v - axis.start);
  const slot = scales.plotWidth / n;
  const barWidth = slot * BAR_SHARE;
  const right = pad.left + scales.plotWidth;

  // Labels that would crowd into the next slot are left off; the bars and the bottom row still carry the values.
  const mrpLabels = mrp.map(money);
  const mpLabels = mp.map(fmt);
  const fits = (labels: string[]) => Math.max(...labels.map((s) => s.length)) * CHAR_W + 4 <= slot;
  const showMrp = fits(mrpLabels);
  const showMp = fits(mpLabels);

  const rise = easeInOut(progressBetween(t, 0, RISE_MS));
  const wageP = easeInOut(progressBetween(t, WAGE_AT, WAGE_MS));
  const each = hireEach(hired);
  const wageY = sy(wage);
  const zeroY = sy(0);

  // The wage label sits above the right end of the wage line. When a bar's MRP label is in its way, the wage label moves up above it. The bars finish rising before the wage label appears, so their labels are checked where they end up, from the lowest up.
  const wageText = `Wage ${money(wage)}`;
  const wageRight = right - 2;
  const wageLeft = wageRight - wageText.length * CHAR_W;
  let wageBaseline = wageY - 7;
  if (showMrp) {
    const boxes = mrp
      .map((value, i) => {
        const cx = scales.sx(i + 0.5);
        const half = (mrpLabels[i].length * CHAR_W) / 2;
        const y = mrpLabelPlace(value, sy(value), zeroY, wageY).y;
        return { left: cx - half, right: cx + half, top: y - LABEL_ASCENT, bottom: y + LABEL_DESCENT };
      })
      .sort((a, b) => b.top - a.top);
    for (const box of boxes) {
      const overlaps = box.left < wageRight && box.right > wageLeft && box.top < wageBaseline + LABEL_DESCENT && box.bottom > wageBaseline - LABEL_ASCENT;
      if (overlaps) wageBaseline = box.top - LABEL_DESCENT - 3;
    }
  }
  // Never up into the legend.
  wageBaseline = Math.max(wageBaseline, LEGEND_Y + LABEL_DESCENT + LABEL_ASCENT + 6);

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
      role="img"
      aria-label={`Marginal revenue product of each picker, from picker 1 to picker ${n}: ${mrpLabels.join(", ")}. The market wage is ${money(wage)}. Your loop hired ${hired} picker${hired === 1 ? "" : "s"}.`}
    >
      <Legend />

      {axis.ticks.map((v, i) => (
        <g key={`y-${v}`}>
          {v !== 0 && <line x1={pad.left} y1={sy(v)} x2={right} y2={sy(v)} stroke={color.grid} />}
          <text x={pad.left - 8} y={sy(v) + 4} textAnchor="end" style={type.tick}>
            {tickLabels[i]}
          </text>
        </g>
      ))}

      {/* One bar per picker: its MRP, gray until the loop hires that picker, then pink. */}
      {mrp.map((value, i) => {
        const x = scales.sx(i) + (slot - barWidth) / 2;
        const top = sy(value * rise);
        const y = Math.min(top, zeroY);
        const h = Math.abs(zeroY - top);
        const hireP = i < hired ? progressBetween(t, HIRE_AT + i * each, HIRE_FADE_MS) : 0;
        const { y: labelY, inside } = mrpLabelPlace(value, top, zeroY, wageY);
        const labelFill = inside && hireP >= 1 ? color.surface : hireP >= 1 || inside ? color.ink : color.inkMuted;
        return (
          <g key={`bar-${i}`}>
            {h > 0 && <rect x={x} y={y} width={barWidth} height={h} fill={color.grid} stroke={color.inkMuted} strokeOpacity={0.6} />}
            {h > 0 && hireP > 0 && <rect x={x} y={y} width={barWidth} height={h} fill={color.series[0]} opacity={hireP} />}
            {/* The bar's top edge, so a $0 bar still shows which color it is. */}
            <line x1={x} y1={top} x2={x + barWidth} y2={top} stroke={color.inkMuted} strokeWidth={2} />
            {hireP > 0 && <line x1={x} y1={top} x2={x + barWidth} y2={top} stroke={color.series[0]} strokeWidth={2} opacity={hireP} />}
            {showMrp && rise > 0 && (
              <text x={x + barWidth / 2} y={labelY} textAnchor="middle" opacity={rise} style={{ ...type.tick, fill: labelFill }}>
                {mrpLabels[i]}
              </text>
            )}
          </g>
        );
      })}

      {/* The market wage: the marginal factor cost of every picker. */}
      {wageP > 0 && (
        <g>
          <line x1={pad.left} y1={wageY} x2={pad.left + scales.plotWidth * wageP} y2={wageY} stroke={color.reference} strokeWidth={2.5} strokeDasharray="8 5" />
          <text x={wageRight} y={wageBaseline} textAnchor="end" opacity={progressBetween(t, WAGE_AT + WAGE_MS * 0.6, WAGE_MS * 0.4)} style={{ ...type.tick, fill: color.reference, fontWeight: 600 }}>
            {wageText}
          </text>
        </g>
      )}

      <line x1={pad.left} y1={zeroY} x2={right} y2={zeroY} stroke={color.axis} />
      <line x1={pad.left} y1={PAD.top} x2={pad.left} y2={PLOT_BOTTOM} stroke={color.axis} />

      {/* Under the axis: each picker's number, then that picker's marginal product. */}
      <text x={pad.left - 8} y={PICKER_ROW_Y} textAnchor="end" style={type.tick}>
        Picker
      </text>
      {showMp && (
        <text x={pad.left - 8} y={MP_ROW_Y} textAnchor="end" style={type.tick}>
          MP
        </text>
      )}
      {mrp.map((_, i) => {
        const cx = scales.sx(i + 0.5);
        return (
          <g key={`row-${i}`}>
            <text x={cx} y={PICKER_ROW_Y} textAnchor="middle" style={type.tick}>
              {i + 1}
            </text>
            {showMp && (
              <text x={cx} y={MP_ROW_Y} textAnchor="middle" style={type.tick}>
                {mpLabels[i]}
              </text>
            )}
          </g>
        );
      })}

      {/* The CED's axis labels for a firm in a perfectly competitive factor market: Wage up the side, Quantity of Labor along the bottom. */}
      <text x={(pad.left + right) / 2} y={AXIS_TITLE_Y} textAnchor="middle" style={type.axisTitle}>
        Quantity of Labor
      </text>
      <text x={Y_TITLE_X} y={(PAD.top + PLOT_BOTTOM) / 2} textAnchor="middle" transform={`rotate(-90, ${Y_TITLE_X}, ${(PAD.top + PLOT_BOTTOM) / 2})`} style={type.axisTitle}>
        Wage
      </text>
    </svg>
  );
}

const Component = observer(({ state }: { state: State }) => {
  const hiring = state.hiring;
  const doneAt = hiring ? hiresDoneAt(hiring.hired) : 0;
  const t = useRunAnimation(hiring, doneAt + SETTLE_MS);

  if (!hiring) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Press Run to see how many pickers the orchard hires, with each picker's MRP and the market wage." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const done = t >= doneAt;
  const wageShown = t >= WAGE_AT + WAGE_MS;
  const shown = (v: number | null) => (done && v !== null ? money(v) : EMPTY);

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <Plot hiring={hiring} t={t} />
      </PluginStage>
      <StatRow
        stats={[
          { label: "Hired", value: done ? String(hiring.hired) : EMPTY, color: color.series[0] },
          { label: "Last MRP", value: shown(hiring.lastMRP) },
          { label: "Wage", value: wageShown ? money(hiring.wage) : EMPTY, color: color.reference },
          { label: "Next MRP", value: shown(hiring.nextMRP) },
          { label: "Revenue − Wages", value: shown(hiring.revenue - hiring.wages) },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
