import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { VIEW } from "../../common/chart";
import {
  EMPTY,
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import { useRunAnimation } from "../../common/useRunAnimation";
import { color, font, type } from "../../common/tokens";
import instructions from "./instructions.md?raw";
import State, {
  ELEMENT_SYMBOLS,
  SUBSHELLS,
  expandElectrons,
  orbitalSlot,
} from "./state";

// Timeline, in "units": each loop pass opens with PASS_GAP units (the pass
// marker moves to its subshell), then each electron takes one unit to land.
const PASS_GAP = 1.5;
// The whole replay aims for TOTAL_MS; small atoms go no faster than
// MAX_UNIT_MS per unit so each electron can be followed.
const TOTAL_MS = 8000;
const MAX_UNIT_MS = 320;

// Layout inside the shared VIEW.
const DIAGRAM_TOP = 12;
const DIAGRAM_BOTTOM = 292;
const LABEL_X = 68;
const BOXES_X = 80;
// Overflow electrons stop here so they never reach the pass marker.
const OVERFLOW_RIGHT = 330;
const CONFIG_Y = [322, 352];
const CONFIG_LEFT = 24;
const CONFIG_RIGHT = VIEW.width - 24;

interface Term {
  subshell: number;
  count: number;
}

/** An up or down arrow (one electron) centred on (cx, cy). */
function Arrow({
  cx,
  cy,
  length,
  up,
  stroke,
  opacity = 1,
}: {
  cx: number;
  cy: number;
  length: number;
  up: boolean;
  stroke: string;
  opacity?: number;
}) {
  const half = length / 2;
  const head = Math.max(3, length * 0.24);
  const tip = up ? cy - half : cy + half;
  const back = up ? tip + head : tip - head;
  return (
    <path
      d={`M ${cx} ${cy + (up ? half : -half)} L ${cx} ${tip} M ${cx - head * 0.8} ${back} L ${cx} ${tip} L ${cx + head * 0.8} ${back}`}
      fill="none"
      stroke={stroke}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
    />
  );
}

const Component = observer(({ state }: { state: State }) => {
  const atomicNumber = state.atomicNumber;
  const placements = state.placements;

  const electrons = useMemo(() => expandElectrons(placements), [placements]);

  // When each electron lands, in units, plus when each pass starts.
  const timeline = useMemo(() => {
    const passStart: number[] = [];
    const landAt: number[] = [];
    let t = 0;
    let e = 0;
    placements.forEach((p, pass) => {
      passStart.push(t);
      t += PASS_GAP;
      for (let k = 0; k < p.count; k++) {
        landAt[e + k] = t;
        t += 1;
      }
      e += p.count;
      if (pass === placements.length - 1) t += 0.5;
    });
    return { passStart, landAt, totalUnits: Math.max(t, 1) };
  }, [placements]);

  const unitMs = Math.min(MAX_UNIT_MS, TOTAL_MS / timeline.totalUnits);
  const duration = timeline.totalUnits * unitMs;
  const elapsed = useRunAnimation(
    atomicNumber === null ? null : placements,
    duration
  );

  if (atomicNumber === null) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Press Run to fill an atom's orbitals with electrons." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const done = elapsed >= duration;
  const nowUnits = done ? Infinity : elapsed / unitMs;

  // Which loop pass is running, and how far each electron has dropped in.
  let currentPass = -1;
  timeline.passStart.forEach((start, pass) => {
    if (nowUnits >= start) currentPass = pass;
  });
  const progressOf = (i: number) =>
    Math.min(Math.max(nowUnits - timeline.landAt[i], 0), 1);
  const shown = electrons.filter((_, i) => nowUnits >= timeline.landAt[i]);
  const shownCount = shown.length;

  // Per-subshell totals so far (the configuration string), in the order the
  // loop first reached each subshell.
  const terms: Term[] = [];
  shown.forEach((e) => {
    const term = terms.find((t) => t.subshell === e.subshell);
    if (term) term.count++;
    else terms.push({ subshell: e.subshell, count: 1 });
  });
  const overfilled = (t: Term) => t.count > SUBSHELLS[t.subshell].capacity;
  const anyOverflow = terms.some(overfilled);

  const currentSubshell =
    currentPass >= 0 && !done ? placements[currentPass].subshell : -1;

  // Valence electrons: those in the highest shell (largest n) reached so far.
  const maxN = Math.max(0, ...terms.map((t) => SUBSHELLS[t.subshell].n));
  const valence = terms
    .filter((t) => SUBSHELLS[t.subshell].n === maxN)
    .reduce((sum, t) => sum + t.count, 0);

  // Rows: every subshell from 1s up to one past the highest the loop used
  // (at least 1s, 2s, 2p), lowest energy at the bottom, centred vertically.
  const rowCount = Math.min(
    SUBSHELLS.length,
    Math.max(3, Math.max(0, ...placements.map((p) => p.subshell)) + 2)
  );
  const rowH = Math.min(44, (DIAGRAM_BOTTOM - DIAGRAM_TOP) / rowCount);
  const box = Math.min(30, rowH * 0.74);
  const rowsBottom =
    DIAGRAM_BOTTOM - (DIAGRAM_BOTTOM - DIAGRAM_TOP - rowCount * rowH) / 2;
  const rowY = (i: number) => rowsBottom - (i + 0.5) * rowH;
  const labelSize = Math.max(9, Math.min(14, rowH * 0.42));

  // Configuration string terms laid out left to right, wrapping once.
  const charW = 8.6;
  const supW = 6.4;
  let cx = CONFIG_LEFT;
  let line = 0;
  const placedTerms = terms.map((t) => {
    const name = SUBSHELLS[t.subshell].name;
    const width = name.length * charW + String(t.count).length * supW;
    if (cx + width > CONFIG_RIGHT && cx > CONFIG_LEFT) {
      line = Math.min(line + 1, CONFIG_Y.length - 1);
      cx = CONFIG_LEFT;
    }
    const placed = { ...t, x: cx, line, name };
    cx += width + 10;
    return placed;
  });
  const configText = terms
    .map((t) => `${SUBSHELLS[t.subshell].name}${t.count}`)
    .join(" ");

  const symbol = ELEMENT_SYMBOLS[atomicNumber - 1];

  // Dashed outline and note for electrons past a subshell's capacity.
  const overflowBox = (t: Term) => {
    const sub = SUBSHELLS[t.subshell];
    const extra = t.count - sub.capacity;
    const x0 = BOXES_X + (sub.capacity / 2) * box + 6;
    const width = Math.min(extra * box * 0.42 + 8, OVERFLOW_RIGHT - x0 + box * 0.3);
    const label = `${extra} extra, max ${sub.capacity}`;
    return { x0, width, label, end: x0 + width + 6 + label.length * 6.8 };
  };
  const currentTerm = terms.find((t) => t.subshell === currentSubshell);
  const markerX =
    currentSubshell < 0
      ? 0
      : currentTerm && overfilled(currentTerm)
      ? overflowBox(currentTerm).end + 12
      : BOXES_X + (SUBSHELLS[currentSubshell].capacity / 2) * box + 14;

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <svg
          viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: "100%", height: "100%" }}
          role="img"
          aria-label={`Orbital diagram for ${symbol}, ${shownCount} of ${atomicNumber} electrons placed: ${configText || "none yet"}`}
        >
          <rect
            x={8}
            y={4}
            width={VIEW.width - 16}
            height={DIAGRAM_BOTTOM - 4 + 4}
            fill={color.surfaceRaised}
            stroke={color.border}
            rx={4}
          />

          {/* Energy axis */}
          <line
            x1={18}
            y1={DIAGRAM_BOTTOM - 6}
            x2={18}
            y2={DIAGRAM_TOP + 6}
            stroke={color.axis}
            strokeWidth={1.5}
          />
          <path
            d={`M 13 ${DIAGRAM_TOP + 14} L 18 ${DIAGRAM_TOP + 4} L 23 ${DIAGRAM_TOP + 14}`}
            fill="none"
            stroke={color.axis}
            strokeWidth={1.5}
          />
          <text
            x={32}
            y={(DIAGRAM_TOP + DIAGRAM_BOTTOM) / 2}
            textAnchor="middle"
            transform={`rotate(-90, 32, ${(DIAGRAM_TOP + DIAGRAM_BOTTOM) / 2})`}
            style={type.axisTitle}
          >
            Energy
          </text>

          {Array.from({ length: rowCount }, (_, s) => {
            const sub = SUBSHELLS[s];
            const y = rowY(s);
            const orbitals = sub.capacity / 2;
            const isCurrent = s === currentSubshell;
            return (
              <g key={`row-${s}`}>
                {isCurrent && (
                  <rect
                    x={LABEL_X - 24}
                    y={y - box / 2 - 4}
                    width={BOXES_X - LABEL_X + 24 + orbitals * box + 8}
                    height={box + 8}
                    rx={6}
                    fill="none"
                    stroke={color.series[1]}
                    strokeWidth={2}
                  />
                )}
                <text
                  x={LABEL_X}
                  y={y + labelSize * 0.36}
                  textAnchor="end"
                  style={{
                    fontFamily: font.data,
                    fontSize: labelSize,
                    fontWeight: 600,
                    fill: isCurrent ? color.series[1] : color.ink,
                  }}
                >
                  {sub.name}
                </text>
                {Array.from({ length: orbitals }, (_, b) => (
                  <rect
                    key={`box-${s}-${b}`}
                    x={BOXES_X + b * box}
                    y={y - box / 2}
                    width={box}
                    height={box}
                    fill={color.surface}
                    stroke={color.inkMuted}
                    strokeWidth={1.2}
                  />
                ))}
              </g>
            );
          })}

          {/* Electrons, dropping into their boxes as they land */}
          {electrons.map((e, i) => {
            const p = progressOf(i);
            if (p <= 0) return null;
            const slot = orbitalSlot(e.subshell, e.indexInSubshell);
            const y = rowY(e.subshell) - (1 - p) * box * 0.6;
            const orbitals = SUBSHELLS[e.subshell].capacity / 2;
            if (slot.overflow) {
              const x = BOXES_X + orbitals * box + 14 + slot.box * box * 0.42;
              if (x > OVERFLOW_RIGHT) return null;
              return (
                <Arrow
                  key={`e-${i}`}
                  cx={x}
                  cy={y}
                  length={box * 0.66}
                  up
                  stroke={color.reference}
                  opacity={p}
                />
              );
            }
            const center = BOXES_X + slot.box * box + box / 2;
            return (
              <Arrow
                key={`e-${i}`}
                cx={center + (slot.spinUp ? -box * 0.17 : box * 0.17)}
                cy={y}
                length={box * 0.66}
                up={slot.spinUp}
                stroke={color.series[0]}
                opacity={p}
              />
            );
          })}

          {/* Overfilled subshells: dashed outline around the extra electrons */}
          {terms.filter(overfilled).map((t) => {
            const { x0, width, label } = overflowBox(t);
            const y = rowY(t.subshell);
            return (
              <g key={`over-${t.subshell}`}>
                <rect
                  x={x0}
                  y={y - box / 2}
                  width={width}
                  height={box}
                  rx={3}
                  fill="none"
                  stroke={color.reference}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                />
                <text
                  x={x0 + width + 6}
                  y={y + 4}
                  style={{ ...type.tick, fill: color.reference }}
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Current loop pass marker, just right of the row being filled */}
          {currentSubshell >= 0 && (
            <g>
              <path
                d={`M ${markerX} ${rowY(currentSubshell)} l 9 -6 l 0 12 z`}
                fill={color.series[1]}
              />
              <text
                x={markerX + 14}
                y={rowY(currentSubshell) + 4}
                style={{
                  fontFamily: font.ui,
                  fontSize: 12,
                  fontWeight: 600,
                  fill: color.series[1],
                }}
              >
                {`loop pass ${currentPass + 1}`}
              </text>
            </g>
          )}

          {/* Electron configuration, building as electrons land */}
          {placedTerms.length === 0 ? (
            <text x={CONFIG_LEFT} y={CONFIG_Y[0]} style={type.axisTitle}>
              No electrons placed yet
            </text>
          ) : (
            placedTerms.map((t) => (
              <text
                key={`term-${t.subshell}`}
                x={t.x}
                y={CONFIG_Y[t.line]}
                style={{
                  fontFamily: font.data,
                  fontSize: 14,
                  fontWeight: 600,
                  fontVariantNumeric: "tabular-nums",
                  fill: overfilled(t)
                    ? color.reference
                    : t.subshell === currentSubshell
                    ? color.series[1]
                    : color.ink,
                }}
              >
                {t.name}
                <tspan dy={-6} style={{ fontSize: 10 }}>
                  {t.count}
                </tspan>
              </text>
            ))
          )}
        </svg>
      </PluginStage>

      <StatRow
        stats={[
          { label: "Element", value: symbol },
          {
            label: "Loop Pass",
            value: currentPass >= 0 ? String(currentPass + 1) : EMPTY,
            color: color.series[1],
          },
          {
            label: "Electrons Left",
            value: String(atomicNumber - shownCount),
            color: color.series[0],
          },
          {
            label: "Valence",
            value: anyOverflow || shownCount === 0 ? EMPTY : String(valence),
          },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
