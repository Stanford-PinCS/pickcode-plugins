import { observer } from "mobx-react-lite";
import { VIEW } from "../../common/chart";
import {
  EMPTY,
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import { color, font, type } from "../../common/tokens";
import {
  easeInOut,
  progressBetween,
  useRunAnimation,
} from "../../common/useRunAnimation";
import instructions from "./instructions.md?raw";
import State from "./state";

/** The correct partner of each base. */
const PARTNER: Record<string, string> = { A: "T", T: "A", G: "C", C: "G" };
/** Hydrogen bonds holding each correct pair together: A-T has 2, G-C has 3. */
const BONDS: Record<string, number> = { A: 2, T: 2, G: 3, C: 3 };
const BASE_COLOR: Record<string, string> = {
  A: color.series[0],
  T: color.series[1],
  G: color.series[2],
  C: color.series[3],
};

// Layout, in VIEW units. Row labels sit left of the strands.
const LEFT = 106;
const RIGHT = 30;
const MAX_SLOT = 36;
const BLOCK_H = 26;
/** Centre line of the old (parent) strand once helicase has lifted it away. */
const LIFTED_Y = 64;
/** Centre line of the row paired with the template: old strand, then new. */
const PAIR_Y = 150;
const TEMPLATE_Y = 206;

// One base per step. Short strands go slower so each step can be followed.
const TOTAL_MS = 7000;
const MIN_STEP_MS = 170;
const MAX_STEP_MS = 650;
/** Part of each step the new nucleotide takes to drop into place. */
const PLACE_FRACTION = 0.55;

const smooth = (p: number) => p * p * (3 - 2 * p);

/** Sugar-phosphate backbone through the given block centres. */
function backbone(points: { x: number; y: number }[]): string {
  return points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

const Component = observer(({ state }: { state: State }) => {
  const run = state.run;
  const n = run?.templateStrand.length ?? 0;
  const stepMs = Math.min(MAX_STEP_MS, Math.max(MIN_STEP_MS, TOTAL_MS / Math.max(n, 1)));
  const duration = n * stepMs;
  const elapsed = useRunAnimation(run, duration);

  if (!run || n === 0) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Press Run to copy your DNA strand at the replication fork." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const template = run.templateStrand;
  const fresh = run.newStrand;
  const isMatch = (j: number) => PARTNER[template[j]] === fresh[j];

  // Where the copy has got to: step k is under way, `frac` of the way through.
  const p = Math.min(elapsed / stepMs, n);
  const done = p >= n;
  const k = done ? n : Math.floor(p);
  const frac = done ? 1 : p - k;
  const placeProgress = done ? 1 : easeInOut(progressBetween(frac, 0, PLACE_FRACTION));
  const placed = done ? n : k + (frac >= PLACE_FRACTION ? 1 : 0);
  // Helicase works one base ahead of polymerase.
  const fork = p + 1;

  const slot = Math.min(MAX_SLOT, (VIEW.width - LEFT - RIGHT) / n);
  const blockW = slot * 0.8;
  const x0 = LEFT + (VIEW.width - LEFT - RIGHT - slot * n) / 2;
  const cx = (j: number) => x0 + slot * (j + 0.5);
  const letterSize = Math.min(14, slot * 0.6);
  const showEveryIndex = n <= 20;

  // How far each old-strand base has been lifted off the template (0 to 1).
  const lift = (j: number) => smooth(Math.min(Math.max((fork - j) / 1.6, 0), 1));
  const oldY = (j: number) => PAIR_Y - lift(j) * (PAIR_Y - LIFTED_Y);

  let mismatches = 0;
  let gcPairs = 0;
  for (let j = 0; j < placed; j++) {
    if (!isMatch(j)) mismatches++;
    if (template[j] === "G" || template[j] === "C") gcPairs++;
  }

  const block = (
    key: string,
    letter: string,
    x: number,
    y: number,
    flagged: boolean,
    opacity = 1
  ) => {
    const fill = BASE_COLOR[letter];
    const isFlagged = flagged || !fill;
    return (
      <g key={key} opacity={opacity}>
        <rect
          x={x - blockW / 2}
          y={y - BLOCK_H / 2}
          width={blockW}
          height={BLOCK_H}
          rx={Math.min(5, blockW / 4)}
          fill={isFlagged ? color.surfaceRaised : fill}
          stroke={isFlagged ? color.inkMuted : "none"}
          strokeWidth={1.5}
          strokeDasharray={isFlagged ? "3 2" : undefined}
        />
        <text
          x={x}
          y={y + letterSize * 0.36}
          textAnchor="middle"
          style={{
            fontFamily: font.data,
            fontSize: letterSize,
            fontWeight: 700,
            fill: isFlagged ? color.inkMuted : color.surface,
          }}
        >
          {letter}
        </text>
      </g>
    );
  };

  // Short rungs between paired blocks: one line per hydrogen bond.
  const rungs = (key: string, j: number, topY: number, opacity = 1) => {
    const bonds = BONDS[template[j]];
    const y1 = topY + BLOCK_H / 2;
    const y2 = TEMPLATE_Y - BLOCK_H / 2;
    return (
      <g key={key} opacity={opacity}>
        {Array.from({ length: bonds }, (_, b) => {
          const x = cx(j) + (b - (bonds - 1) / 2) * Math.min(6, blockW / bonds);
          return (
            <line
              key={b}
              x1={x}
              y1={y1 + 2}
              x2={x}
              y2={y2 - 2}
              stroke={color.inkMuted}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          );
        })}
      </g>
    );
  };

  const templateTop = TEMPLATE_Y + BLOCK_H / 2;
  const helicaseX = Math.min(x0 + slot * fork, cx(n - 1) + slot / 2);
  const helicaseLabelLeft = helicaseX > VIEW.width - 80;
  const current = Math.min(k, n - 1);
  const currentX = cx(current);

  // The line under the fork that links the picture back to the loop.
  const pairText = (j: number) =>
    `templateStrand[${j}] is "${template[j]}"  →  newStrand[${j}] is "${fresh[j]}"`;
  const readout = done
    ? mismatches === 0
      ? `Done: ${n} bases copied. Each copy = 1 old strand + 1 new strand.`
      : `Done: ${n} bases copied, ${mismatches} mismatched.`
    : frac >= PLACE_FRACTION
      ? pairText(k) + (isMatch(k) ? "" : "  (mismatch)")
      : `templateStrand[${k}] is "${template[k]}"  →  ...`;

  const legend: { label: string; fill: string | null }[] = [
    { label: "A", fill: BASE_COLOR.A },
    { label: "T", fill: BASE_COLOR.T },
    { label: "G", fill: BASE_COLOR.G },
    { label: "C", fill: BASE_COLOR.C },
    { label: "Mismatch", fill: null },
  ];

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <svg
          viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: "100%", height: "100%" }}
          role="img"
          aria-label={`Replication fork copying the template strand ${template}: ${placed} of ${n} bases copied, ${mismatches} mismatched`}
        >
          {/* Current-step column: the base the loop's index i is on. */}
          {!done && (
            <rect
              x={currentX - slot / 2}
              y={PAIR_Y - BLOCK_H / 2 - 8}
              width={slot}
              height={TEMPLATE_Y - PAIR_Y + BLOCK_H + 16}
              rx={4}
              fill={color.accentSoft}
            />
          )}

          {/* Row labels */}
          <text x={8} y={LIFTED_Y + 4} style={type.tick}>
            Old strand
          </text>
          <text x={8} y={PAIR_Y + 4} style={type.tick}>
            New strand
          </text>
          <text x={8} y={TEMPLATE_Y + 4} style={type.tick}>
            Template
          </text>

          {/* Backbones */}
          <polyline
            points={backbone(
              Array.from(template, (_, j) => ({
                x: cx(j),
                y: oldY(j) - BLOCK_H / 2 - 3,
              }))
            )}
            fill="none"
            stroke={color.border}
            strokeWidth={4}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {placed > 0 && (
            <line
              x1={cx(0) - blockW / 2}
              y1={PAIR_Y - BLOCK_H / 2 - 3}
              x2={cx(placed - 1) + blockW / 2}
              y2={PAIR_Y - BLOCK_H / 2 - 3}
              stroke={color.border}
              strokeWidth={4}
              strokeLinecap="round"
            />
          )}
          <line
            x1={cx(0) - blockW / 2}
            y1={templateTop + 3}
            x2={cx(n - 1) + blockW / 2}
            y2={templateTop + 3}
            stroke={color.border}
            strokeWidth={4}
            strokeLinecap="round"
          />

          {/* Strand ends. The new strand grows 5' to 3', reading the template 3' to 5'. */}
          <text x={cx(0) - slot / 2 - 6} y={oldY(0) + 4} textAnchor="end" style={type.tick}>
            5'
          </text>
          <text
            x={cx(n - 1) + slot / 2 + 4}
            y={oldY(n - 1) + 4}
            style={type.tick}
          >
            3'
          </text>
          <text x={cx(0) - slot / 2 - 6} y={TEMPLATE_Y + 4} textAnchor="end" style={type.tick}>
            3'
          </text>
          <text x={cx(n - 1) + slot / 2 + 4} y={TEMPLATE_Y + 4} style={type.tick}>
            5'
          </text>
          {placed > 0 && (
            <text x={cx(0) - slot / 2 - 6} y={PAIR_Y + 4} textAnchor="end" style={type.tick}>
              5'
            </text>
          )}
          {done && (
            <text x={cx(n - 1) + slot / 2 + 4} y={PAIR_Y + 4} style={type.tick}>
              3'
            </text>
          )}

          {/* Old strand still zipped to the template, with its bonds. */}
          {Array.from(template, (base, j) => {
            const l = lift(j);
            return (
              <g key={`old-${j}`}>
                {l < 0.02 && rungs(`old-rung-${j}`, j, PAIR_Y)}
                {block(`old-block-${j}`, PARTNER[base], cx(j), oldY(j), false)}
              </g>
            );
          })}

          {/* New strand: placed bases, then the one polymerase is adding now. */}
          {Array.from(template, (_, j) => {
            if (j > k || j >= n) return null;
            const entering = j === k && !done;
            const t = entering ? placeProgress : 1;
            const letter = fresh[j];
            const match = isMatch(j);
            const y = PAIR_Y - (1 - t) * 28;
            return (
              <g key={`new-${j}`}>
                {match && t >= 1 && rungs(`new-rung-${j}`, j, PAIR_Y)}
                {block(`new-block-${j}`, letter, cx(j), y, !match, 0.25 + 0.75 * t)}
              </g>
            );
          })}

          {/* Template strand */}
          {Array.from(template, (base, j) =>
            block(`template-${j}`, base, cx(j), TEMPLATE_Y, false)
          )}

          {/* Loop index under each template base */}
          {Array.from(template, (_, j) =>
            showEveryIndex || j % 5 === 0 || j === current ? (
              <text
                key={`index-${j}`}
                x={cx(j)}
                y={templateTop + 20}
                textAnchor="middle"
                style={{
                  ...type.tick,
                  fill: !done && j === current ? color.ink : color.inkMuted,
                  fontWeight: !done && j === current ? 700 : 400,
                }}
              >
                {j}
              </text>
            ) : null
          )}
          <text x={8} y={templateTop + 20} style={type.tick}>
            Index i
          </text>

          {/* Helicase unzips just ahead of polymerase. */}
          {!done && (
            <g>
              <circle
                cx={helicaseX}
                cy={PAIR_Y - BLOCK_H / 2 - 16}
                r={8}
                fill={color.surfaceRaised}
                stroke={color.inkMuted}
                strokeWidth={1.5}
              />
              <text
                x={helicaseLabelLeft ? helicaseX - 12 : helicaseX + 12}
                y={PAIR_Y - BLOCK_H / 2 - 24}
                textAnchor={helicaseLabelLeft ? "end" : "start"}
                style={type.tick}
              >
                Helicase
              </text>
            </g>
          )}

          {/* DNA polymerase clamps the base it is copying. */}
          {!done && (
            <g>
              <rect
                x={currentX - slot / 2 - 2}
                y={PAIR_Y - BLOCK_H / 2 - 6}
                width={slot + 4}
                height={TEMPLATE_Y - PAIR_Y + BLOCK_H + 12}
                rx={10}
                fill="none"
                stroke={color.ink}
                strokeWidth={2}
              />
              <text
                x={currentX}
                y={templateTop + 38}
                textAnchor="middle"
                style={{ ...type.tick, fill: color.ink, fontWeight: 700 }}
              >
                i = {current}
              </text>
              <text
                x={currentX}
                y={templateTop + 52}
                textAnchor="middle"
                style={type.tick}
              >
                Polymerase
              </text>
            </g>
          )}

          <text
            x={VIEW.width / 2}
            y={318}
            textAnchor="middle"
            style={{ ...type.tick, fontSize: 12, fill: color.ink }}
          >
            {readout}
          </text>

          {/* Legend */}
          <g transform={`translate(${VIEW.width / 2 - 150}, 350)`}>
            {legend.map((item, index) => {
              const x = index * 52;
              return (
                <g key={item.label}>
                  <rect
                    x={x}
                    y={-10}
                    width={12}
                    height={12}
                    rx={2}
                    fill={item.fill ?? color.surfaceRaised}
                    stroke={item.fill ? "none" : color.inkMuted}
                    strokeDasharray={item.fill ? undefined : "3 2"}
                  />
                  <text x={x + 17} y={0} style={type.tick}>
                    {item.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </PluginStage>

      <StatRow
        stats={[
          { label: "Bases Copied", value: `${placed} of ${n}` },
          { label: "Mismatches", value: String(mismatches) },
          { label: "GC Pairs", value: placed > 0 ? String(gcPairs) : EMPTY },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
