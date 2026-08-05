import { observer } from "mobx-react-lite";
import React, { useState, useEffect, useRef } from "react";
import { color } from "../../common/tokens";
import {
  EmptyState,
  PluginStage,
  PluginSurface,
} from "../../common/PluginSurface";
import instructions from "./instructions.md?raw";
import State from "./state";

/* ───────── Theme (inline — Tailwind v4 drops arbitrary values) ───────── */

const ink = "#4a2a38"; // headings / primary text
const muted = "#9c8378"; // labels / secondary text
const faint = "#cbb6ab"; // separators, the "+" sign
const good = "#2f8a5b"; // correct / remaining
const bad = "#c24a42"; // incorrect / depleted
const highlightBg = "#fbe7ee"; // blush fill for the limiting card
const accent = color.series[0]; // plum accent from the shared palette

/* ───────── Animated value hook ───────── */

/**
 * Smoothly animates a number from 0 to `target`.
 * When `resetKey` changes the animation replays from 0, even if `target`
 * is the same as last time (this is what makes re-pressing play work).
 */
const useAnimatedValue = (
  target: number,
  duration = 800,
  delay = 0,
  resetKey = 0
): number => {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    clearTimeout(timeoutRef.current);
    cancelAnimationFrame(rafRef.current);
    setDisplay(0);

    if (Math.abs(target) < 0.0001) return;

    timeoutRef.current = setTimeout(() => {
      const t0 = performance.now();
      const animate = (now: number) => {
        const t = Math.min((now - t0) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
        setDisplay(target * eased);
        if (t < 1) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          setDisplay(target);
        }
      };
      rafRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeoutRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, delay, resetKey]);

  return display;
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

/* ───────── Data row ───────── */

const DataRow = ({
  label,
  value,
  valueColor = ink,
  bold = false,
  hasBorder = true,
}: {
  label: string;
  value: string;
  valueColor?: string;
  bold?: boolean;
  hasBorder?: boolean;
}) => (
  <div
    className="flex justify-between items-center py-1.5"
    style={{
      borderBottom: hasBorder ? `1px solid ${color.border}` : "none",
    }}
  >
    <span className="text-sm" style={{ color: muted }}>
      {label}
    </span>
    <span
      className="text-sm"
      style={{ color: valueColor, fontWeight: bold ? 700 : 600 }}
    >
      {value}
    </span>
  </div>
);

/* ───────── Reactant card (H₂ or N₂) ───────── */

const ReactantCard = ({
  title,
  input,
  consumed,
  remaining,
  isLimiting,
  runId,
}: {
  title: string;
  input: number;
  consumed: number;
  remaining: number;
  isLimiting: boolean;
  runId: number;
}) => {
  const animConsumed = useAnimatedValue(consumed, 1800, 200, runId);
  const animRemaining = input - animConsumed;

  // Reveal the limiting highlight after NH₃ finishes counting (~2800ms).
  const [showHighlight, setShowHighlight] = useState(false);
  useEffect(() => {
    if (!isLimiting) {
      setShowHighlight(false);
      return;
    }
    setShowHighlight(false);
    const timer = setTimeout(() => setShowHighlight(true), 2800);
    return () => clearTimeout(timer);
  }, [runId, isLimiting]);

  const remainingColor = remaining <= 0 ? bad : good;

  return (
    <div
      className="p-3 rounded-xl transition-all duration-700"
      style={{
        width: 185,
        flexShrink: 0,
        backgroundColor: showHighlight ? highlightBg : color.surfaceRaised,
        border: showHighlight
          ? `2px solid ${accent}`
          : `1px solid ${color.border}`,
        boxShadow: "0 1px 3px rgba(74, 42, 56, 0.06)",
      }}
    >
      <h3 className="text-base font-bold mb-1" style={{ color: ink }}>
        {title}
      </h3>

      {isLimiting && showHighlight && (
        <span
          className="inline-block mb-2 px-2 py-0.5 font-bold uppercase rounded-full tracking-wide animate-fade-in"
          style={{ backgroundColor: accent, color: "#fff", fontSize: 10 }}
        >
          Limiting Reactant
        </span>
      )}

      <div className="mt-1">
        <DataRow label="Input" value={`${fmt(input)} mol`} />
        <DataRow label="Consumed" value={`${fmt(animConsumed)} mol`} />
        <DataRow
          label="Remaining"
          value={`${fmt(animRemaining)} mol`}
          valueColor={remainingColor}
          bold
          hasBorder={false}
        />
      </div>
    </div>
  );
};

/* ───────── Product card (NH₃) ───────── */

const ProductCard = ({
  trueNh3,
  trueLimiting,
  studentNh3,
  studentLimiting,
  nh3Correct,
  limitingCorrect,
  runId,
}: {
  trueNh3: number;
  trueLimiting: string;
  studentNh3: number;
  studentLimiting: string;
  nh3Correct: boolean | null;
  limitingCorrect: boolean | null;
  runId: number;
}) => {
  const animNh3 = useAnimatedValue(trueNh3, 2000, 700, runId);
  const hasStudentAnswer = nh3Correct !== null || limitingCorrect !== null;

  return (
    <div
      className="p-4 rounded-xl transition-all duration-300"
      style={{
        width: 300,
        backgroundColor: color.surfaceRaised,
        border: `1px solid ${color.border}`,
        boxShadow: "0 2px 6px rgba(74, 42, 56, 0.08)",
      }}
    >
      <h3 className="text-base font-bold mb-2" style={{ color: ink }}>
        NH₃ (Ammonia)
      </h3>

      <div className="mb-2">
        <div className="text-3xl font-extrabold" style={{ color: accent }}>
          {fmt(animNh3)} mol
        </div>
        <div className="text-sm mt-1" style={{ color: muted }}>
          Limiting reactant:{" "}
          <span className="font-semibold" style={{ color: accent }}>
            {prettyLimiting(trueLimiting)}
          </span>
        </div>
      </div>

      {hasStudentAnswer && (
        <div
          className="pt-2 mt-1"
          style={{ borderTop: `1px solid ${color.border}` }}
        >
          <div
            className="font-bold uppercase tracking-wide mb-1"
            style={{ color: faint, fontSize: 10 }}
          >
            Your Answer
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center py-1">
              <span className="text-sm" style={{ color: muted }}>
                NH₃ produced
              </span>
              <span
                className="text-sm font-semibold"
                style={{ color: nh3Correct ? good : bad }}
              >
                {studentNh3} mol {nh3Correct ? "✓" : "✗"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-sm" style={{ color: muted }}>
                Limiting
              </span>
              <span
                className="text-sm font-semibold"
                style={{ color: limitingCorrect ? good : bad }}
              >
                {studentLimiting || "—"} {limitingCorrect ? "✓" : "✗"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ───────── Helpers ───────── */

/** Format a number to 2 dp, drop trailing zeros */
const fmt = (n: number): string => {
  if (Math.abs(n) < 0.005) return "0";
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
};

const prettyLimiting = (s: string): string => {
  if (!s) return "—";
  switch (s.toLowerCase()) {
    case "h2":
      return "H₂";
    case "n2":
      return "N₂";
    case "none":
      return "Neither (exact ratio)";
    default:
      return s;
  }
};

/* ───────── Converging arrow SVG (with glow animation) ───────── */

const ConvergingArrow = ({ runId }: { runId: number }) => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (runId === 0) return;
    setActive(false);
    const timer = setTimeout(() => setActive(true), 60);
    return () => clearTimeout(timer);
  }, [runId]);

  const stroke = active ? accent : color.axis;
  const glow = active ? "drop-shadow(0 0 5px rgba(214, 68, 107, 0.5))" : "none";

  return (
    <svg
      width="150"
      height="40"
      viewBox="0 0 180 52"
      className="my-1"
      style={{
        filter: glow,
        transition: active ? "filter 600ms ease-out 300ms" : "filter 0ms",
      }}
      aria-hidden="true"
    >
      <line
        x1="50"
        y1="2"
        x2="90"
        y2="36"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{
          transition: active ? "stroke 600ms ease-out 300ms" : "stroke 0ms",
        }}
      />
      <line
        x1="130"
        y1="2"
        x2="90"
        y2="36"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{
          transition: active ? "stroke 600ms ease-out 300ms" : "stroke 0ms",
        }}
      />
      <polygon
        points="83,38 90,50 97,38"
        fill={stroke}
        style={{
          transition: active ? "fill 600ms ease-out 300ms" : "fill 0ms",
        }}
      />
    </svg>
  );
};

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
  const n2Remaining = state?.n2_remaining ?? 0;
  const h2Remaining = state?.h2_remaining ?? 0;
  const studentNh3 = state?.student_nh3 ?? 0;
  const studentLimiting = state?.student_limiting ?? "";
  const nh3Correct = state?.nh3_correct ?? null;
  const limitingCorrect = state?.limiting_correct ?? null;

  // Re-fit when the run changes (the "Your Answer" block grows the content).
  const fitScale = useFitScale(stageRef, contentRef, [
    runId,
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

  return (
    <PluginSurface instructions={instructions}>
      <PluginStage>
        <div
          ref={stageRef}
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
            <div className="flex flex-col items-center">
              {/* Equation header */}
              <div className="mb-3 text-center">
                <div
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: muted }}
                >
                  Haber Process
                </div>
                <div className="text-lg font-bold mt-1" style={{ color: ink }}>
                  N₂ + 3H₂ &rarr; 2NH₃
                </div>
              </div>

              {/* Reactant row */}
              <div className="flex flex-row items-center justify-center gap-3">
                <ReactantCard
                  title="H₂ (Hydrogen)"
                  input={inputH2}
                  consumed={h2Consumed}
                  remaining={h2Remaining}
                  isLimiting={isH2Limiting}
                  runId={runId}
                />
                <span
                  className="text-2xl font-bold select-none"
                  style={{ color: faint }}
                >
                  +
                </span>
                <ReactantCard
                  title="N₂ (Nitrogen)"
                  input={inputN2}
                  consumed={n2Consumed}
                  remaining={n2Remaining}
                  isLimiting={isN2Limiting}
                  runId={runId}
                />
              </div>

              <ConvergingArrow runId={runId} />

              <ProductCard
                trueNh3={trueNh3}
                trueLimiting={trueLimiting}
                studentNh3={studentNh3}
                studentLimiting={studentLimiting}
                nh3Correct={nh3Correct}
                limitingCorrect={limitingCorrect}
                runId={runId}
              />
            </div>
          </div>
        </div>
      </PluginStage>
    </PluginSurface>
  );
});

export default Component;
