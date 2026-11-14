import { observer } from "mobx-react-lite";
import { VIEW } from "../../common/chart";
import {
  EMPTY,
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import { easeInOut, progressBetween, useRunAnimation } from "../../common/useRunAnimation";
import { color, font, type } from "../../common/tokens";
import instructions from "./instructions.md?raw";
import State, { PRICES, cellPayoffs, otherPrice, type Cell, type Deal, type Game, type Price } from "./state";

// Timeline of one run, in ms: the matrix fades in, Gull's best responses are circled one column at a time, then Heron's one row at a time, then the dominant strategies are tagged, the Nash equilibrium cell lights up, and a deal, if there is one, gets its label and arrows last.
const GRID_MS = 400;
const GULL_AT = 450;
const HERON_AT = 1250;
const RING_GAP = 350;
const RING_MS = 300;
const TAGS_AT = 2050;
const TAGS_MS = 300;
const NASH_AT = 2350;
const NASH_MS = 400;
const DEAL_AT = 2850;
const DEAL_MS = 450;
const TOTAL_MS = DEAL_AT + DEAL_MS;

// Layout, in the shared VIEW width. Gull picks a row and Heron picks a column, the way the CED draws a payoff matrix: the row player's name on the left, the column player's on top.
const LEGEND_Y = 16;
const COLUMN_PLAYER_Y = 44;
const COLUMN_HEADER_Y = 66;
const COLUMN_TAG_Y = 84;
const GRID_TOP = 98;
const CELL_H = 96;
const GRID_LEFT = 160;
const CELL_W = 172;
const ROW_HEADER_X = GRID_LEFT - 14;
const ROW_PLAYER_X = 44;
const GRID_BOTTOM = GRID_TOP + 2 * CELL_H;
const CAPTION_Y = GRID_BOTTOM + 26;
const HEIGHT = CAPTION_Y + 14;
// Each cell shows Gull's payoff left of center and Heron's right of it.
const NUMBER_DX = 36;
// The widest a payoff is drawn, so its inner edge stays 4 px from the cell's center and clear of the comma there.
const NUMBER_MAX_W = 2 * (NUMBER_DX - 4);
const RING_RY = 21;
const RING_PAD = 5;
const TAG_W = 66;
const TAG_H = 18;

const PRICE_LABEL = ["High", "Low"] as const;

/** Shows a number with at most two decimals, no trailing zeros, and a true minus sign. */
const fmt = (v: number) => String(Number(v.toFixed(2))).replace("-", "−");

const pair = ([a, b]: readonly [number, number]) => `${fmt(a)}, ${fmt(b)}`;

const columnX = (h: Price) => GRID_LEFT + h * CELL_W;
const rowY = (g: Price) => GRID_TOP + g * CELL_H;
const centerX = (h: Price) => columnX(h) + CELL_W / 2;
const centerY = (g: Price) => rowY(g) + CELL_H / 2;

/** Font size and ring width for one payoff, so long numbers still fit their cell. A digit is about 0.6 of the font size wide, and a very long number shrinks until it's no wider than NUMBER_MAX_W. */
function numberStyle(label: string) {
  const size = Math.min(label.length <= 3 ? 24 : label.length <= 5 ? 19 : 14, NUMBER_MAX_W / (0.6 * label.length));
  return { size, rx: Math.max(RING_RY, (label.length * size * 0.6) / 2 + 7) };
}

/** Where Gull's (side 0) or Heron's (side 1) payoff sits in a cell. */
function numberAt([g, h]: Cell, side: 0 | 1) {
  return { x: centerX(h) + (side === 0 ? -NUMBER_DX : NUMBER_DX), y: centerY(g) };
}

/** The payoffs in the Nash equilibrium cell, both cells' payoffs when there are two, or None when there isn't one. */
function profitsText(game: Game, cells: readonly Cell[]) {
  if (cells.length === 0) return "None";
  return cells.map((c) => pair(cellPayoffs(game.gull, game.heron, c))).join(" or ");
}

const priceText = (p: Price | null) => (p === null ? "None" : PRICE_LABEL[p]);

function cellText(game: Game, c: Cell) {
  return `Gull ${PRICE_LABEL[c[0]]} and Heron ${PRICE_LABEL[c[1]]}, ${pair(cellPayoffs(game.gull, game.heron, c))}`;
}

/** An ellipse around one payoff: solid for the student's best response, dashed and a little larger for a correct one. */
function Ring({ cell, side, label, correct, p }: { cell: Cell; side: 0 | 1; label: string; correct: boolean; p: number }) {
  if (p <= 0) return null;
  const { x, y } = numberAt(cell, side);
  const { rx } = numberStyle(label);
  const grow = correct ? 1 : 0.6 + 0.4 * easeInOut(p);
  const pad = correct ? RING_PAD : 0;
  return (
    <ellipse
      cx={x}
      cy={y}
      rx={(rx + pad) * grow}
      ry={(RING_RY + pad) * grow}
      fill="none"
      stroke={correct ? color.reference : color.series[0]}
      strokeWidth={correct ? 1.8 : 2.5}
      strokeDasharray={correct ? "5 4" : undefined}
      opacity={p}
    />
  );
}

/** A "dominant" tag centered at (x, y): solid pink for the student's answer, a dashed amber outline for the correct one. */
function Tag({ x, y, yours, correct, p }: { x: number; y: number; yours: boolean; correct: boolean; p: number }) {
  if (p <= 0 || (!yours && !correct)) return null;
  return (
    <g opacity={p}>
      {yours && (
        <rect x={x - TAG_W / 2} y={y - TAG_H / 2} width={TAG_W} height={TAG_H} rx={TAG_H / 2} fill={color.accentSoft} stroke={color.series[0]} strokeWidth={1.5} />
      )}
      {correct && (
        <rect x={x - TAG_W / 2 - 4} y={y - TAG_H / 2 - 4} width={TAG_W + 8} height={TAG_H + 8} rx={TAG_H / 2 + 4} fill="none" stroke={color.reference} strokeWidth={1.5} strokeDasharray="4 3" />
      )}
      <text x={x} y={y + 4} textAnchor="middle" style={{ fontFamily: font.ui, fontSize: 11, fontWeight: 600, fill: yours ? color.series[0] : color.reference }}>
        dominant
      </text>
    </g>
  );
}

/** A rounded label with a white background, centered at (x, y), so it can sit on a line. */
function Pill({ x, y, text, stroke }: { x: number; y: number; text: string; stroke: string }) {
  const width = text.length * 7.4 + 12;
  return (
    <g>
      <rect x={x - width / 2} y={y - 9} width={width} height={18} rx={9} fill={color.surface} stroke={stroke} strokeWidth={1.5} />
      <text x={x} y={y + 4} textAnchor="middle" style={{ fontFamily: font.data, fontSize: 12, fontWeight: 600, fill: stroke }}>
        {text}
      </text>
    </g>
  );
}

/** An arrowhead at (x, y) pointing in direction (dx, dy). */
function Head({ x, y, dx, dy, stroke }: { x: number; y: number; dx: number; dy: number; stroke: string }) {
  const angle = Math.atan2(dy, dx);
  const wing = (side: number) => `${x - 8 * Math.cos(angle + side * 0.45)},${y - 8 * Math.sin(angle + side * 0.45)}`;
  return <polyline points={`${wing(1)} ${x},${y} ${wing(-1)}`} fill="none" stroke={stroke} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />;
}

/** The deal's label, and an arrow for each airline that would earn more by switching its own price while the other keeps the deal: from its payoff in the deal cell to its payoff after switching, labeled with the gain. */
function DealMarks({ deal, p }: { deal: Deal; p: number }) {
  if (p <= 0) return null;
  const [g, h] = deal.cell;
  const teal = color.series[1];
  const clear = RING_RY + RING_PAD + 3;

  // Gull switches rows, so its arrow runs straight up or down from its payoff to its payoff in the other row, across the border between the rows.
  const gullFrom = numberAt(deal.cell, 0);
  const gullTo = numberAt([otherPrice(g), h], 0);
  const down = gullTo.y > gullFrom.y ? 1 : -1;
  const gullStart = gullFrom.y + down * clear;
  const gullEnd = gullTo.y - down * clear;

  // Heron switches columns. Gull's payoff sits between Heron's two payoffs in a row, so Heron's arrow drops below the payoffs, runs along the bottom of the row and rises to Heron's payoff in the other column.
  const heronFrom = numberAt(deal.cell, 1);
  const heronTo = numberAt([g, otherPrice(h)], 1);
  const heronLow = heronFrom.y + clear + 8;

  return (
    <g opacity={easeInOut(p)}>
      {/* A little right of center, so it stays clear of Gull's gain label when Gull's arrow comes up from the bottom row. */}
      <Pill x={centerX(h) + 8} y={rowY(g) + 16} text="Deal" stroke={teal} />
      {deal.gains[0] > 0 && (
        <g>
          <line x1={gullFrom.x} y1={gullStart} x2={gullFrom.x} y2={gullEnd} stroke={teal} strokeWidth={2.5} strokeLinecap="round" />
          <Head x={gullFrom.x} y={gullEnd} dx={0} dy={down} stroke={teal} />
          <Pill x={gullFrom.x} y={GRID_TOP + CELL_H} text={`+${fmt(deal.gains[0])}`} stroke={teal} />
        </g>
      )}
      {deal.gains[1] > 0 && (
        <g>
          <polyline
            points={`${heronFrom.x},${heronFrom.y + clear} ${heronFrom.x},${heronLow} ${heronTo.x},${heronLow} ${heronTo.x},${heronTo.y + clear}`}
            fill="none"
            stroke={teal}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Head x={heronTo.x} y={heronTo.y + clear} dx={0} dy={-1} stroke={teal} />
          <Pill x={GRID_LEFT + CELL_W} y={heronLow} text={`+${fmt(deal.gains[1])}`} stroke={teal} />
        </g>
      )}
    </g>
  );
}

function Matrix({ game, deal, t }: { game: Game; deal: Deal | null; t: number }) {
  const { yours, correct } = game;
  const cells: Cell[] = PRICES.flatMap((g) => PRICES.map((h) => [g, h] as const));
  const gridP = progressBetween(t, 0, GRID_MS);
  const tagsP = progressBetween(t, TAGS_AT, TAGS_MS);
  const nashP = progressBetween(t, NASH_AT, NASH_MS);
  const dealP = deal ? progressBetween(t, DEAL_AT, DEAL_MS) : 0;
  const isNash = (list: readonly Cell[], [g, h]: Cell) => list.some(([a, b]) => a === g && b === h);

  const label = deal
    ? ` Deal: Gull ${PRICE_LABEL[deal.cell[0]]} and Heron ${PRICE_LABEL[deal.cell[1]]}, ${pair(deal.profits)}; switching alone would change Gull's profit by ${fmt(deal.gains[0])} and Heron's by ${fmt(deal.gains[1])}.`
    : "";
  const ariaLabel =
    `Payoff matrix of monthly profit in thousands of dollars, Gull's first and Heron's second: ${cells.map((c) => cellText(game, c)).join("; ")}. ` +
    `Your best responses give dominant strategies Gull ${priceText(yours.gullDominant).toLowerCase()} and Heron ${priceText(yours.heronDominant).toLowerCase()}, ` +
    `and Nash equilibrium ${yours.nash.length === 0 ? "none" : yours.nash.map((c) => cellText(game, c)).join(" or ")}.` +
    label;

  return (
    <svg viewBox={`0 0 ${VIEW.width} ${HEIGHT}`} preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%" }} role="img" aria-label={ariaLabel}>
      <text x={VIEW.width / 2} y={LEGEND_Y} textAnchor="middle" style={type.tick}>
        <tspan fill={color.series[0]}>○</tspan>
        <tspan> Your best responses</tspan>
        <tspan dx={14} fill={color.reference}>◌</tspan>
        <tspan> Correct</tspan>
        <tspan dx={14} fill={color.series[0]}>■</tspan>
        <tspan> Your Nash equilibrium</tspan>
        {deal && (
          <>
            <tspan dx={14} fill={color.series[1]}>□</tspan>
            <tspan> Deal</tspan>
          </>
        )}
      </text>

      <g opacity={gridP}>
        <text x={GRID_LEFT + CELL_W} y={COLUMN_PLAYER_Y} textAnchor="middle" style={{ ...type.axisTitle, fontSize: 13, fill: color.ink }}>
          Heron Air
        </text>
        <text x={ROW_PLAYER_X} y={centerY(1) - CELL_H / 2 + 4} textAnchor="middle" style={{ ...type.axisTitle, fontSize: 13, fill: color.ink }}>
          Gull Air
        </text>
        {PRICES.map((p) => (
          <g key={`headers-${p}`}>
            <text x={centerX(p)} y={COLUMN_HEADER_Y} textAnchor="middle" style={type.axisTitle}>
              {PRICE_LABEL[p]} price
            </text>
            <text x={ROW_HEADER_X} y={centerY(p) - 4} textAnchor="end" style={type.axisTitle}>
              {PRICE_LABEL[p]} price
            </text>
          </g>
        ))}

        {cells.map(([g, h]) => (
          <rect key={`cell-${g}-${h}`} x={columnX(h)} y={rowY(g)} width={CELL_W} height={CELL_H} fill={color.surfaceRaised} stroke={color.border} strokeWidth={1.5} />
        ))}
      </g>

      {/* The Nash equilibrium cells: the student's filled in pink, the correct ones outlined in dashed amber just outside them. */}
      {nashP > 0 &&
        cells.map((c) => (
          <g key={`nash-${c[0]}-${c[1]}`} opacity={nashP}>
            {isNash(yours.nash, c) && (
              <rect x={columnX(c[1]) + 6} y={rowY(c[0]) + 6} width={CELL_W - 12} height={CELL_H - 12} rx={8} fill={color.accentSoft} stroke={color.series[0]} strokeWidth={2.5} />
            )}
            {isNash(correct.nash, c) && (
              <rect x={columnX(c[1]) + 2} y={rowY(c[0]) + 2} width={CELL_W - 4} height={CELL_H - 4} rx={10} fill="none" stroke={color.reference} strokeWidth={2} strokeDasharray="7 5" />
            )}
          </g>
        ))}

      {/* The payoffs: Gull's left of the comma, Heron's right of it. */}
      <g opacity={gridP}>
        {cells.map((c) => {
          const payoffs = cellPayoffs(game.gull, game.heron, c);
          return (
            <g key={`payoffs-${c[0]}-${c[1]}`}>
              {([0, 1] as const).map((side) => {
                const text = fmt(payoffs[side]);
                const { x, y } = numberAt(c, side);
                return (
                  <text key={side} x={x} y={y + numberStyle(text).size * 0.35} textAnchor="middle" style={{ fontFamily: font.data, fontSize: numberStyle(text).size, fontWeight: 600, fill: color.ink }}>
                    {text}
                  </text>
                );
              })}
              <text x={centerX(c[1])} y={centerY(c[0]) + 8} textAnchor="middle" style={{ fontFamily: font.data, fontSize: 22, fill: color.inkMuted }}>
                ,
              </text>
            </g>
          );
        })}
      </g>

      {/* Gull's best responses, one column (one price of Heron's) at a time, then Heron's, one row at a time. */}
      {PRICES.map((h) => {
        const p = progressBetween(t, GULL_AT + h * RING_GAP, RING_MS);
        return PRICES.map((g) => {
          const text = fmt(game.gull[g][h]);
          return (
            <g key={`gull-${g}-${h}`}>
              {correct.gull[h].includes(g) && <Ring cell={[g, h]} side={0} label={text} correct p={p} />}
              {yours.gull[h].includes(g) && <Ring cell={[g, h]} side={0} label={text} correct={false} p={p} />}
            </g>
          );
        });
      })}
      {PRICES.map((g) => {
        const p = progressBetween(t, HERON_AT + g * RING_GAP, RING_MS);
        return PRICES.map((h) => {
          const text = fmt(game.heron[h][g]);
          return (
            <g key={`heron-${g}-${h}`}>
              {correct.heron[g].includes(h) && <Ring cell={[g, h]} side={1} label={text} correct p={p} />}
              {yours.heron[g].includes(h) && <Ring cell={[g, h]} side={1} label={text} correct={false} p={p} />}
            </g>
          );
        });
      })}

      {/* Dominant strategies: under Gull's row headers and Heron's column headers. */}
      {PRICES.map((p) => (
        <g key={`tags-${p}`}>
          <Tag x={ROW_HEADER_X - TAG_W / 2} y={centerY(p) + 14} yours={yours.gullDominant === p} correct={correct.gullDominant === p} p={tagsP} />
          <Tag x={centerX(p)} y={COLUMN_TAG_Y} yours={yours.heronDominant === p} correct={correct.heronDominant === p} p={tagsP} />
        </g>
      ))}

      {deal && <DealMarks deal={deal} p={dealP} />}

      <text x={GRID_LEFT + CELL_W} y={CAPTION_Y} textAnchor="middle" style={type.axisTitle}>
        Monthly profit, in thousands of dollars: Gull's first, Heron's second
      </text>
    </svg>
  );
}

const Component = observer(({ state }: { state: State }) => {
  const game = state.game;
  const deal = state.deal;
  const t = useRunAnimation(game, TOTAL_MS);

  if (!game) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Press Run to draw the payoff matrix of the two airlines' pricing game, with the prices your bestResponse function picks." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const { yours } = game;
  const dealShown = deal !== null && t >= DEAL_AT;

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <Matrix game={game} deal={deal} t={t} />
      </PluginStage>
      <StatRow
        stats={[
          { label: "Dominant", value: t >= TAGS_AT ? `${priceText(yours.gullDominant)}, ${priceText(yours.heronDominant)}` : EMPTY, color: color.series[0] },
          { label: "Nash profits", value: t >= NASH_AT ? profitsText(game, yours.nash) : EMPTY, color: color.series[0] },
          { label: "Deal profits", value: dealShown ? pair(deal.profits) : EMPTY, color: color.series[1] },
          { label: "Gain from switching", value: dealShown ? pair(deal.gains) : EMPTY, color: color.series[1] },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
