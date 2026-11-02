import { observer } from "mobx-react-lite";
import React, { useEffect, useRef, useState, type CSSProperties } from "react";
import { color, font, radius, space, type } from "../../common/tokens";
import {
  EMPTY,
  EmptyState,
  PluginStage,
  PluginSurface,
  StatRow,
} from "../../common/PluginSurface";
import {
  easeInOut,
  progressBetween,
  useRunAnimation,
} from "../../common/useRunAnimation";
import instructions from "./instructions.md?raw";
import State from "./state";

/* ───────── Timing ───────── */

// Reactants are used up first, ammonia counts up a little after, and the
// limiting reactant is marked once both have finished.
const ANIM_TOTAL_MS = 3000;
const CONSUME = { start: 200, length: 1800 };
const PRODUCE = { start: 700, length: 2000 };
const HIGHLIGHT_AT_MS = 2800;

/* ───────── Colors ───────── */

// NH₃ is what the reaction makes, so it takes the primary series color.
const NH3_COLOR = color.series[0];
const H2_COLOR = color.series[1];
const N2_COLOR = color.series[2];

/* ───────── Helpers ───────── */

/** Format a number to 2 dp, drop trailing zeros */
const fmt = (n: number): string => {
  if (Math.abs(n) < 0.005) return "0";
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
};

const prettyLimiting = (s: string): string => {
  if (!s) return EMPTY;
  switch (s.toLowerCase()) {
    case "h2":
      return "H₂";
    case "n2":
      return "N₂";
    case "none":
    case "neither":
      return "Neither";
    default:
      return s;
  }
};

const numberStyle: CSSProperties = {
  fontFamily: font.data,
  fontVariantNumeric: "tabular-nums",
};

/* ───────── Fit-to-container hook ───────── */

/**
 * Scales `contentRef` down so it always fits inside `stageRef` without
 * scrolling. Caps at 1 (never enlarges past natural size) and re-measures
 * whenever the stage or content changes size.
 */
const useFitScale = (
  stageRef: React.RefObject<HTMLDivElement | null>,
  contentRef: React.RefObject<HTMLDivElement | null>,
  deps: unknown[]
): number => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const stage = stageRef.current;
    const content = contentRef.current;
    if (!stage || !content) return;

    const fit = () => {
      const availW = stage.clientWidth;
      const availH = stage.clientHeight;
      // offsetWidth/Height are layout sizes, unaffected by the transform,
      // so measuring here never feeds back into the scale.
      const naturalW = content.offsetWidth;
      const naturalH = content.offsetHeight;
      if (!naturalW || !naturalH || !availW || !availH) return;
      const s = Math.min(
        1,
        (availW / naturalW) * 0.98,
        (availH / naturalH) * 0.98
      );
      setScale(s > 0 ? s : 1);
    };

    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    ro.observe(content);
    fit();
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return scale;
};

/* ───────── Pieces ───────── */

/** A bar showing `amount` out of `scaleMax`, in the gas's color. */
const AmountBar = ({
  amount,
  scaleMax,
  fill,
}: {
  amount: number;
  scaleMax: number;
  fill: string;
}) => (
  <div
    style={{
      height: 10,
      borderRadius: radius.sm,
      background: color.accentSoft,
      overflow: "hidden",
      margin: `${space.xs}px 0 ${space.sm}px`,
    }}
  >
    <div
      style={{
        width: `${scaleMax > 0 ? Math.max(0, Math.min(1, amount / scaleMax)) * 100 : 0}%`,
        height: "100%",
        background: fill,
      }}
    />
  </div>
);

const DataRow = ({
  label,
  value,
  hasBorder = true,
}: {
  label: string;
  value: string;
  hasBorder?: boolean;
}) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "5px 0",
      borderBottom: hasBorder ? `1px solid ${color.border}` : "none",
      fontSize: 13,
    }}
  >
    <span style={{ color: color.inkMuted }}>{label}</span>
    <span style={{ ...numberStyle, color: color.ink, fontWeight: 600 }}>
      {value}
    </span>
  </div>
);

const cardStyle = (highlight: boolean): CSSProperties => ({
  padding: space.md,
  borderRadius: radius.lg,
  background: highlight ? color.accentSoft : color.surfaceRaised,
  border: highlight ? `2px solid ${color.ink}` : `1px solid ${color.border}`,
  // Keep the size steady when the border thickens.
  margin: highlight ? 0 : 1,
});

const cardTitle: CSSProperties = {
  fontFamily: font.ui,
  fontSize: 15,
  fontWeight: 700,
  color: color.ink,
  marginBottom: space.xs,
};

const Badge = ({ children }: { children: React.ReactNode }) => (
  <span
    style={{
      ...type.label,
      display: "inline-block",
      fontSize: 10,
      color: color.surface,
      background: color.ink,
      padding: "2px 8px",
      borderRadius: 999,
      marginBottom: space.xs,
    }}
  >
    {children}
  </span>
);

const ReactantCard = ({
  title,
  barColor,
  input,
  consumed,
  scaleMax,
  isLimiting,
}: {
  title: string;
  barColor: string;
  input: number;
  consumed: number;
  scaleMax: number;
  isLimiting: boolean;
}) => (
  <div style={{ ...cardStyle(isLimiting), width: 185, flexShrink: 0 }}>
    <div style={cardTitle}>{title}</div>
    {isLimiting && <Badge>Limiting reactant</Badge>}
    <AmountBar amount={input - consumed} scaleMax={scaleMax} fill={barColor} />
    <DataRow label="Start" value={`${fmt(input)} mol`} />
    <DataRow label="Used" value={`${fmt(consumed)} mol`} />
    <DataRow
      label="Left"
      value={`${fmt(input - consumed)} mol`}
      hasBorder={false}
    />
  </div>
);

const AnswerRow = ({
  label,
  answer,
  correct,
}: {
  label: string;
  answer: string;
  correct: boolean;
}) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: space.md,
      padding: `${space.xs}px ${space.sm}px`,
      borderRadius: radius.sm,
      background: correct ? color.positiveSoft : color.negativeSoft,
      fontSize: 13,
    }}
  >
    <span style={{ color: color.inkMuted }}>{label}</span>
    <span
      style={{
        ...numberStyle,
        fontWeight: 600,
        color: correct ? color.positive : color.negative,
      }}
    >
      {answer} · {correct ? "correct" : "not quite"}
    </span>
  </div>
);

const ProductCard = ({
  nh3,
  scaleMax,
  studentNh3,
  studentLimiting,
  nh3Correct,
  limitingCorrect,
  showAnswer,
}: {
  nh3: number;
  scaleMax: number;
  studentNh3: number;
  studentLimiting: string;
  nh3Correct: boolean | null;
  limitingCorrect: boolean | null;
  showAnswer: boolean;
}) => (
  <div style={{ ...cardStyle(false), width: 300 }}>
    <div style={cardTitle}>NH₃ (Ammonia)</div>
    <div
      style={{
        ...numberStyle,
        fontSize: 28,
        fontWeight: 700,
        color: NH3_COLOR,
      }}
    >
      {fmt(nh3)} mol
    </div>
    <AmountBar amount={nh3} scaleMax={scaleMax} fill={NH3_COLOR} />

    {showAnswer && (nh3Correct !== null || limitingCorrect !== null) && (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: space.xs,
          paddingTop: space.sm,
          borderTop: `1px solid ${color.border}`,
        }}
      >
        <div style={{ ...type.label, fontSize: 10 }}>Your answer</div>
        {limitingCorrect !== null && (
          <AnswerRow
            label="Limiting"
            answer={studentLimiting ? `"${studentLimiting}"` : EMPTY}
            correct={limitingCorrect}
          />
        )}
        {nh3Correct !== null && (
          <AnswerRow
            label="NH₃ made"
            answer={`${fmt(studentNh3)} mol`}
            correct={nh3Correct}
          />
        )}
      </div>
    )}
  </div>
);

const ConvergingArrow = () => (
  <svg width="150" height="40" viewBox="0 0 180 52" aria-hidden="true">
    <line x1="50" y1="2" x2="90" y2="36" stroke={color.axis} strokeWidth="2.5" strokeLinecap="round" />
    <line x1="130" y1="2" x2="90" y2="36" stroke={color.axis} strokeWidth="2.5" strokeLinecap="round" />
    <polygon points="83,38 90,50 97,38" fill={color.axis} />
  </svg>
);

/* ───────── Main component ───────── */

const Component = observer(({ state }: { state: State | undefined }) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const runId = state?.run_id ?? 0;
  const inputN2 = state?.input_n2 ?? 0;
  const inputH2 = state?.input_h2 ?? 0;
  const trueNh3 = state?.true_nh3 ?? 0;
  const trueLimiting = state?.true_limiting ?? "";
  const n2Consumed = state?.n2_consumed ?? 0;
  const h2Consumed = state?.h2_consumed ?? 0;
  const studentNh3 = state?.student_nh3 ?? 0;
  const studentLimiting = state?.student_limiting ?? "";
  const nh3Correct = state?.nh3_correct ?? null;
  const limitingCorrect = state?.limiting_correct ?? null;

  // A new State arrives with every run, so the run's state owns its replay.
  const elapsed = useRunAnimation(runId > 0 ? state : null, ANIM_TOTAL_MS);
  const consumedP = easeInOut(
    progressBetween(elapsed, CONSUME.start, CONSUME.length)
  );
  const producedP = easeInOut(
    progressBetween(elapsed, PRODUCE.start, PRODUCE.length)
  );
  const finished = elapsed >= HIGHLIGHT_AT_MS;

  // Re-fit when the run changes (the "Your answer" block grows the content).
  const fitScale = useFitScale(stageRef, contentRef, [
    runId,
    finished,
    nh3Correct,
    limitingCorrect,
  ]);

  if (runId === 0) {
    return (
      <PluginSurface instructions={instructions}>
        <PluginStage>
          <EmptyState message="Run your code to react the gases and check your answer." />
        </PluginStage>
      </PluginSurface>
    );
  }

  const isH2Limiting = trueLimiting.toLowerCase() === "h2";
  const isN2Limiting = trueLimiting.toLowerCase() === "n2";
  // One scale for every bar, so the bars compare amounts fairly.
  const scaleMax = Math.max(inputH2, inputN2, trueNh3);

  const h2Used = h2Consumed * consumedP;
  const n2Used = n2Consumed * consumedP;
  const nh3 = trueNh3 * producedP;

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <div
          ref={stageRef}
          role="img"
          aria-label={`${fmt(inputH2)} mol of hydrogen and ${fmt(
            inputN2
          )} mol of nitrogen react to make ${fmt(
            trueNh3
          )} mol of ammonia. Limiting reactant: ${prettyLimiting(trueLimiting)}.`}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* Scaled to always fit the stage — no scrolling. */}
          <div
            ref={contentRef}
            style={{
              transform: `scale(${fitScale})`,
              transformOrigin: "center center",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                fontFamily: font.ui,
              }}
            >
              <div
                style={{
                  ...numberStyle,
                  fontSize: 16,
                  fontWeight: 600,
                  color: color.inkMuted,
                  marginBottom: space.md,
                }}
              >
                N₂ + 3H₂ → 2NH₃
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: space.md,
                }}
              >
                <ReactantCard
                  title="H₂ (Hydrogen)"
                  barColor={H2_COLOR}
                  input={inputH2}
                  consumed={h2Used}
                  scaleMax={scaleMax}
                  isLimiting={finished && isH2Limiting}
                />
                <span
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: color.inkMuted,
                    userSelect: "none",
                  }}
                >
                  +
                </span>
                <ReactantCard
                  title="N₂ (Nitrogen)"
                  barColor={N2_COLOR}
                  input={inputN2}
                  consumed={n2Used}
                  scaleMax={scaleMax}
                  isLimiting={finished && isN2Limiting}
                />
              </div>

              <ConvergingArrow />

              <ProductCard
                nh3={nh3}
                scaleMax={scaleMax}
                studentNh3={studentNh3}
                studentLimiting={studentLimiting}
                nh3Correct={nh3Correct}
                limitingCorrect={limitingCorrect}
                showAnswer={finished}
              />
            </div>
          </div>
        </div>
      </PluginStage>
      <StatRow
        stats={[
          { label: "H₂ left", value: `${fmt(inputH2 - h2Used)} mol`, color: H2_COLOR },
          { label: "N₂ left", value: `${fmt(inputN2 - n2Used)} mol`, color: N2_COLOR },
          { label: "NH₃ made", value: `${fmt(nh3)} mol`, color: NH3_COLOR },
          {
            label: "Limiting",
            value: finished ? prettyLimiting(trueLimiting) : EMPTY,
          },
        ]}
      />
    </PluginSurface>
  );
});

export default Component;
