import { observer } from "mobx-react-lite";
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
import State, { type BankSheet, type Chain } from "./state";

// Timeline of one run, in ms: Bank 1's T-account fades in and the dashed maximum sweeps across the new-money panel, then the banks' bars rise one at a time from left to right, and each bank's loan stacks onto the new money below it.
const SHEET_MS = 300;
const MAX_LINE_MS = 500;
const BANKS_AT = 450;
const BANK_EACH_MAX = 260;
const BANKS_MS_MAX = 2400;
const RISE_MS = 260;

// Layout, in the shared VIEW: the deposit panel on top and the new-money panel under it. They share the bank axis at the bottom, so each bank's two bars line up. Plot widens the left side when the dollar tick labels are long.
const HEIGHT = VIEW.height;
const RIGHT = VIEW.width - 12;
const TOP_Y = 12;
const TOP_ZERO = 158;
const BOTTOM_Y = 192;
const BOTTOM_ZERO = 318;
const BANK_LABEL_Y = BOTTOM_ZERO + 16;
const X_TITLE_Y = BOTTOM_ZERO + 42;
// The y-axis titles run up the left edge at this x and reach about 3 units right of it, so the tick labels start right of TICK_LABEL_MIN_X to stay clear of them.
const Y_TITLE_X = 14;
const TICK_LABEL_MIN_X = 26;
const MIN_LEFT = 56;
// Share of each bank's slot that its bars fill, and the fewest slots the bank axis has, so a short chain doesn't stretch one bar across the whole plot.
const BAR_SHARE = 0.7;
const MIN_SLOTS = 10;
// The dashed maximum sits at most this far up its panel, so its label fits above it.
const MAX_LINE_SHARE = 0.85;
// type.tick is a monospace face at 11px, so a label is about this wide per character.
const CHAR_W = 6.6;
// Bank 1's T-account in the top right corner: where its box starts, the distance between its rows, the padding inside it, the gap between a label and its value, and the size of a color swatch.
const SHEET_TOP = 4;
const SHEET_ROW = 14;
const SHEET_PAD = 8;
const SHEET_GAP = 10;
const SWATCH = 9;

// Each bank's bar stacks its loan at the bottom, then its excess reserves, then its required reserves on top: the same order as the rows of its T-account, read from the bottom up. The loan is the student's lending, so it gets the first series color, and the new money below uses it too.
const LOAN_FILL = color.series[0];
const REQUIRED_FILL = color.series[1];
const EXCESS_FILL = color.inkMuted;
const EXCESS_OPACITY = 0.35;
const EARLIER_OPACITY = 0.3;

/** Dollars with thousands separators, and cents only when they aren't zero: $800, $3,996.04. */
function money(v: number): string {
  const cents = Math.round(Math.abs(v) * 100);
  const dollars = String(Math.floor(cents / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const text = cents % 100 === 0 ? dollars : `${dollars}.${String(cents % 100).padStart(2, "0")}`;
  return `${v < 0 && cents > 0 ? "−" : ""}$${text}`;
}

/** A number with at most `digits` decimals and no trailing zeros. */
const fmt = (v: number, digits = 2) => String(Number(v.toFixed(digits)));

/** The maximum money multiplier as the dashed line's label multiplies by it: its value when that has at most two decimals, or else 1 ÷ the ratio, so the label's arithmetic stays exact. */
function multiplierTerm(chain: Chain): string {
  const m = chain.multiplier;
  return Math.abs(m - Number(m.toFixed(2))) < 1e-9 ? fmt(m) : `(1 ÷ ${fmt(chain.reserveRatio, 4)})`;
}

/** The dashed line's label: Bank 1's excess reserves times the maximum money multiplier. */
const maxLabel = (chain: Chain) => `Max: ${money(chain.firstExcess)} × ${multiplierTerm(chain)} = ${money(chain.maxNewMoney)}`;

/** Milliseconds between one bank's bars and the next, so a long chain still fits the timeline. */
const bankEach = (banks: number) => Math.min(BANK_EACH_MAX, BANKS_MS_MAX / Math.max(banks, 1));

/** When bank i's bars (counting from 0) finish rising. */
const bankDoneAt = (i: number, banks: number) => BANKS_AT + i * bankEach(banks) + RISE_MS;

interface Axis {
  end: number;
  ticks: number[];
}

/** A dollar axis from 0 up past `target`, on a round step. */
function dollarAxis(target: number, divisions: number): Axis {
  const top = Math.max(target, 1);
  const step = niceStep(top, divisions);
  const end = Math.max(Math.ceil(top / step - 1e-9), 1) * step;
  return { end, ticks: ticks(end, end / step) };
}

/** The left edge of both panels: far enough right that the longest dollar tick label clears the y-axis titles. */
function leftEdge(axes: Axis[]): number {
  const longest = Math.max(...axes.flatMap((axis) => axis.ticks.map((v) => money(v).length)));
  return Math.max(MIN_LEFT, TICK_LABEL_MIN_X + longest * CHAR_W + 8);
}

/** One SVG path of rectangles, given as [x, y, width, height], so hundreds of bars draw as one element. */
function rects(list: readonly (readonly [number, number, number, number])[]): string {
  return list
    .filter(([, , w, h]) => w > 0 && h > 0.01)
    .map(([x, y, w, h]) => `M${x.toFixed(2)},${y.toFixed(2)}h${w.toFixed(2)}v${h.toFixed(2)}h${(-w).toFixed(2)}z`)
    .join("");
}

/** The rows of a bank's T-account: its assets, top to bottom, and its one liability. */
function sheetRows(bank: BankSheet) {
  return {
    assets: [
      { label: "Required reserves", value: money(bank.required), fill: REQUIRED_FILL, opacity: 1 },
      { label: "Excess reserves", value: money(bank.excess), fill: EXCESS_FILL, opacity: EXCESS_OPACITY },
      { label: "Loans", value: money(bank.loan), fill: LOAN_FILL, opacity: 1 },
    ],
    liability: { label: "Demand deposits", value: money(bank.deposit) },
  };
}

/** The T-account's size and column positions, from the lengths of its labels and values. */
function sheetLayout(bank: BankSheet) {
  const { assets, liability } = sheetRows(bank);
  const valueW = Math.max(...assets.map((row) => row.value.length), liability.value.length) * CHAR_W;
  const assetsW = SWATCH + 5 + Math.max(...assets.map((row) => row.label.length)) * CHAR_W + SHEET_GAP + valueW;
  const liabilityW = liability.label.length * CHAR_W + SHEET_GAP + valueW;
  const width = SHEET_PAD + assetsW + 2 * SHEET_PAD + liabilityW + SHEET_PAD;
  const height = 2 * SHEET_ROW + 6 + assets.length * SHEET_ROW + 8;
  return { width, height, assetsW };
}

/** Bank 1's balance sheet as a T-account, the way AP draws one: assets on the left, liabilities on the right. Its color swatches double as the key for the bars. */
function TAccount({ bank, x, y, opacity }: { bank: BankSheet; x: number; y: number; opacity: number }) {
  const { assets, liability } = sheetRows(bank);
  const { width, height, assetsW } = sheetLayout(bank);
  const assetsLeft = x + SHEET_PAD;
  const assetsRight = assetsLeft + assetsW;
  const divider = assetsRight + SHEET_PAD;
  const liabilityLeft = divider + SHEET_PAD;
  const liabilityRight = x + width - SHEET_PAD;
  const titleY = y + SHEET_ROW;
  const headY = titleY + SHEET_ROW;
  const ruleY = headY + 5;
  const rowY = (i: number) => ruleY + SHEET_ROW * (i + 1);
  const valueStyle = { ...type.tick, fill: color.ink, fontWeight: 600 };
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={width} height={height} rx={4} fill={color.surfaceRaised} stroke={color.border} />
      <text x={divider} y={titleY} textAnchor="middle" style={{ ...type.axisTitle, fill: color.ink }}>
        Bank 1
      </text>
      <text x={(assetsLeft + assetsRight) / 2} y={headY} textAnchor="middle" style={{ ...type.tick, fill: color.ink }}>
        Assets
      </text>
      <text x={(liabilityLeft + liabilityRight) / 2} y={headY} textAnchor="middle" style={{ ...type.tick, fill: color.ink }}>
        Liabilities
      </text>
      <line x1={assetsLeft} y1={ruleY} x2={liabilityRight} y2={ruleY} stroke={color.inkMuted} />
      <line x1={divider} y1={ruleY} x2={divider} y2={y + height - 5} stroke={color.inkMuted} />
      {assets.map((row, i) => (
        <g key={row.label}>
          <rect x={assetsLeft} y={rowY(i) - SWATCH + 1} width={SWATCH} height={SWATCH} fill={row.fill} fillOpacity={row.opacity} />
          <text x={assetsLeft + SWATCH + 5} y={rowY(i)} style={type.tick}>
            {row.label}
          </text>
          <text x={assetsRight} y={rowY(i)} textAnchor="end" style={valueStyle}>
            {row.value}
          </text>
        </g>
      ))}
      <text x={liabilityLeft} y={rowY(0)} style={type.tick}>
        {liability.label}
      </text>
      <text x={liabilityRight} y={rowY(0)} textAnchor="end" style={valueStyle}>
        {liability.value}
      </text>
    </g>
  );
}

function Plot({ chain, t }: { chain: Chain; t: number }) {
  const { banks } = chain;
  const n = banks.length;
  const first = banks[0];
  const slots = Math.max(n, MIN_SLOTS);

  // The new-money axis fits the maximum, with room above the dashed line for its label. The new money never passes the maximum, because no bank lends more than its excess reserves.
  const bottomAxis = dollarAxis(Math.max(chain.maxNewMoney / MAX_LINE_SHARE, chain.newMoney, first.deposit * 0.25), 6);

  // The deposit axis fits Bank 1's deposit, the largest: each later deposit is the loan before it, and no loan is more than its bank's deposit. Bars that pass under the T-account have to stay below it, so when one would reach it, the axis goes higher.
  const sheet = sheetLayout(first);
  const sheetX = RIGHT - sheet.width;
  const sheetBottom = SHEET_TOP + sheet.height;
  let topAxis = dollarAxis(first.deposit, 5);
  let left = leftEdge([topAxis, bottomAxis]);
  const slotW = (RIGHT - left) / slots;
  const under = banks.filter((_, i) => left + (i + 1) * slotW > sheetX - 2).map((b) => b.deposit);
  const room = (TOP_ZERO - sheetBottom - 4) / (TOP_ZERO - TOP_Y);
  const tallestUnder = Math.max(0, ...under);
  if (tallestUnder > topAxis.end * room) {
    topAxis = dollarAxis(tallestUnder / room, 5);
    left = leftEdge([topAxis, bottomAxis]);
  }

  const view = { width: VIEW.width, height: HEIGHT };
  const topPad: Padding = { top: TOP_Y, right: VIEW.width - RIGHT, bottom: HEIGHT - TOP_ZERO, left };
  const bottomPad: Padding = { top: BOTTOM_Y, right: VIEW.width - RIGHT, bottom: HEIGHT - BOTTOM_ZERO, left };
  const top = makeScales(slots, topAxis.end, view, topPad);
  const bottom = makeScales(slots, bottomAxis.end, view, bottomPad);
  const slot = top.plotWidth / slots;
  const barW = slot * BAR_SHARE;
  const barX = (i: number) => top.sx(i) + (slot - barW) / 2;

  const each = bankEach(n);
  const rise = (i: number) => easeInOut(progressBetween(t, BANKS_AT + i * each, RISE_MS));

  // Each bank's bar grows from the bottom; under it, the new money so far: the loans before this bank, lighter, with this bank's loan stacked on top.
  const loanBars: [number, number, number, number][] = [];
  const excessBars: [number, number, number, number][] = [];
  const requiredBars: [number, number, number, number][] = [];
  const earlierBars: [number, number, number, number][] = [];
  const newLoanBars: [number, number, number, number][] = [];
  banks.forEach((bank, i) => {
    const p = rise(i);
    if (p <= 0) return;
    const x = barX(i);
    let base = 0;
    for (const [value, list] of [
      [bank.loan, loanBars],
      [bank.excess, excessBars],
      [bank.required, requiredBars],
    ] as const) {
      const y0 = top.sy(base * p);
      const y1 = top.sy((base + value) * p);
      list.push([x, y1, barW, y0 - y1]);
      base += value;
    }
    const earlier = bank.newMoneySoFar - bank.loan;
    const yEarlier = bottom.sy(earlier);
    const yNow = bottom.sy(earlier + bank.loan * p);
    earlierBars.push([x, yEarlier, barW, BOTTOM_ZERO - yEarlier]);
    newLoanBars.push([x, yNow, barW, yEarlier - yNow]);
  });

  const lineP = easeInOut(progressBetween(t, 0, MAX_LINE_MS));
  const maxY = bottom.sy(chain.maxNewMoney);
  const sheetP = progressBetween(t, 0, SHEET_MS);

  // Bank numbers along the shared axis: bank 1, then every round step.
  const bankStep = niceStep(slots, 10);
  const bankTicks = [...new Set(ticks(slots, slots / bankStep).map((v) => Math.max(1, Math.round(v))))];

  const ariaLabel = [
    `A chain of ${n} bank${n === 1 ? "" : "s"} with a required reserve ratio of ${fmt(chain.reserveRatio, 4)}.`,
    `Bank 1's deposit is ${money(first.deposit)}: ${money(first.required)} of required reserves, ${money(first.excess)} of excess reserves and ${money(first.loan)} of loans.`,
    n > 1 ? "Each later bank's deposit is the loan of the bank before it." : "",
    `The loans add up to ${money(chain.newMoney)} of new money. The most the simple money multiplier predicts is ${money(chain.maxNewMoney)}.`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%" }}
      role="img"
      aria-label={ariaLabel}
    >
      {/* Grid lines and dollar ticks for both panels. */}
      {topAxis.ticks.map((v) => (
        <g key={`top-${v}`}>
          {v !== 0 && <line x1={left} y1={top.sy(v)} x2={RIGHT} y2={top.sy(v)} stroke={color.grid} />}
          <text x={left - 8} y={top.sy(v) + 4} textAnchor="end" style={type.tick}>
            {money(v)}
          </text>
        </g>
      ))}
      {bottomAxis.ticks.map((v) => (
        <g key={`bottom-${v}`}>
          {v !== 0 && <line x1={left} y1={bottom.sy(v)} x2={RIGHT} y2={bottom.sy(v)} stroke={color.grid} />}
          <text x={left - 8} y={bottom.sy(v) + 4} textAnchor="end" style={type.tick}>
            {money(v)}
          </text>
        </g>
      ))}

      {/* Each bank's new deposit, split into its loan, its excess reserves and its required reserves. */}
      <path d={rects(loanBars)} fill={LOAN_FILL} />
      <path d={rects(excessBars)} fill={EXCESS_FILL} fillOpacity={EXCESS_OPACITY} />
      <path d={rects(requiredBars)} fill={REQUIRED_FILL} />

      {/* The new money so far, after each bank's loan. */}
      <path d={rects(earlierBars)} fill={LOAN_FILL} fillOpacity={EARLIER_OPACITY} />
      <path d={rects(newLoanBars)} fill={LOAN_FILL} />

      {/* The most new money the simple money multiplier predicts. */}
      {lineP > 0 && (
        <g>
          <line x1={left} y1={maxY} x2={left + (RIGHT - left) * lineP} y2={maxY} stroke={color.reference} strokeWidth={2} strokeDasharray="7 5" />
          <text x={left + 4} y={maxY - 6} opacity={progressBetween(t, MAX_LINE_MS * 0.6, MAX_LINE_MS * 0.4)} style={{ ...type.tick, fill: color.reference, fontWeight: 600 }}>
            {maxLabel(chain)}
          </text>
        </g>
      )}

      <line x1={left} y1={TOP_ZERO} x2={RIGHT} y2={TOP_ZERO} stroke={color.axis} />
      <line x1={left} y1={TOP_Y} x2={left} y2={TOP_ZERO} stroke={color.axis} />
      <line x1={left} y1={BOTTOM_ZERO} x2={RIGHT} y2={BOTTOM_ZERO} stroke={color.axis} />
      <line x1={left} y1={BOTTOM_Y} x2={left} y2={BOTTOM_ZERO} stroke={color.axis} />

      {sheetP > 0 && <TAccount bank={first} x={sheetX} y={SHEET_TOP} opacity={sheetP} />}

      {/* Bank numbers under the bottom panel, at the middle of each bank's slot. */}
      {bankTicks.map((k) => (
        <g key={`bank-${k}`}>
          <line x1={bottom.sx(k - 0.5)} y1={BOTTOM_ZERO} x2={bottom.sx(k - 0.5)} y2={BOTTOM_ZERO + 4} stroke={color.axis} />
          <text x={bottom.sx(k - 0.5)} y={BANK_LABEL_Y} textAnchor="middle" style={type.tick}>
            {k}
          </text>
        </g>
      ))}
      <text x={(left + RIGHT) / 2} y={X_TITLE_Y} textAnchor="middle" style={type.axisTitle}>
        Bank
      </text>
      <text x={Y_TITLE_X} y={(TOP_Y + TOP_ZERO) / 2} textAnchor="middle" transform={`rotate(-90, ${Y_TITLE_X}, ${(TOP_Y + TOP_ZERO) / 2})`} style={type.axisTitle}>
        Deposit
      </text>
      <text x={Y_TITLE_X} y={(BOTTOM_Y + BOTTOM_ZERO) / 2} textAnchor="middle" transform={`rotate(-90, ${Y_TITLE_X}, ${(BOTTOM_Y + BOTTOM_ZERO) / 2})`} style={type.axisTitle}>
        New Money
      </text>
    </svg>
  );
}

const Component = observer(({ state }: { state: State }) => {
  const chain = state.chain;
  const n = chain ? chain.banks.length : 0;
  const doneAt = chain ? bankDoneAt(n - 1, n) : 0;
  const t = useRunAnimation(chain, doneAt);

  if (!chain) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Press Run to follow a new deposit from bank to bank and add up the new money the banks create by lending." />
        </PluginStage>
      </PluginSurface>
    );
  }

  // The banks whose bars have finished rising, and the new money their loans add up to. The most new money the simple money multiplier predicts is the dashed line's label, so the row leaves it out and stays short enough for a narrow pane.
  const banksShown = chain.banks.filter((_, i) => t >= bankDoneAt(i, n)).length;

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <Plot chain={chain} t={t} />
      </PluginStage>
      <StatRow
        stats={[
          { label: "Required Reserve Ratio", value: fmt(chain.reserveRatio, 4) },
          { label: "Max Multiplier", value: fmt(chain.multiplier) },
          { label: "Banks", value: banksShown > 0 ? String(banksShown) : EMPTY },
          { label: "New Money", value: banksShown > 0 ? money(chain.banks[banksShown - 1].newMoneySoFar) : EMPTY, color: color.series[0] },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
