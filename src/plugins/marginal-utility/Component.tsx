import { observer } from "mobx-react-lite";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { color } from "../../common/tokens";
import { PluginStage, PluginSurface } from "../../common/PluginSurface";
import instructions from "./instructions.md?raw";
import State, {
  APPLE_PRICE,
  APPLE_START_MU,
  APPLE_MU_STEP,
  BANANA_PRICE,
  BANANA_START_MU,
  BANANA_MU_STEP,
  BUDGET,
  OPTIMAL_UTILITY,
  Choice,
  totalUtilityFor,
} from "./state";

/* ───────── Theme (inline — Tailwind v4 drops arbitrary values) ───────── */

const ink = "#4a2a38";
const muted = "#9c8378";
const good = "#2f8a5b";
const bad = "#c24a42";
const gold = "#c98a1f";
const greenTint = "#e9f3ec";
const redTint = "#f8eae8";
const goldTint = "#fbf1de";
const basketBg = "#faf1ea";
const basketBorder = "#e2cfc4";

const appleAccent = "#d9483c";
const appleTint = "#fbebe9";
const bananaAccent = "#c98a1f";
const bananaTint = "#faf1de";

// Shared scale for the two "value meter" bars, so a longer bar always
// means a genuinely better ratio, not just a bigger number on its own axis.
const RATIO_SCALE_MAX =
  Math.max(APPLE_START_MU / APPLE_PRICE, BANANA_START_MU / BANANA_PRICE) * 1.1;

/* ───────── Fit-to-container hook ───────── */

/**
 * Scales `contentRef` down so it always fits inside `stageRef` without
 * scrolling. Caps at 1 and re-measures on any size change (including the
 * basket growing as choices come in).
 */
const useFitScale = (
  stageRef: React.RefObject<HTMLDivElement | null>,
  contentRef: React.RefObject<HTMLDivElement | null>
): number => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const stage = stageRef.current;
    const content = contentRef.current;
    if (!stage || !content) return;

    const fit = () => {
      const availW = stage.clientWidth;
      const availH = stage.clientHeight;
      // offsetWidth/Height are layout sizes, unaffected by the transform.
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
  }, [stageRef, contentRef]);

  return scale;
};

/* ───────── Small building blocks ───────── */

const ValueMeter = ({
  value,
  fillColor,
}: {
  value: number;
  fillColor: string;
}) => {
  const pct = Math.max(0, Math.min(100, (value / RATIO_SCALE_MAX) * 100));
  return (
    <div
      style={{
        width: "100%",
        height: 8,
        borderRadius: 999,
        backgroundColor: "rgba(74, 42, 56, 0.08)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          backgroundColor: fillColor,
          borderRadius: 999,
          transition: "width 350ms ease",
        }}
      />
    </div>
  );
};

const BudgetBar = ({ spent, budget }: { spent: number; budget: number }) => {
  const pct = Math.max(0, Math.min(100, (spent / budget) * 100));
  const barColor = pct >= 100 ? bad : pct >= 70 ? gold : good;
  return (
    <div
      style={{
        width: "100%",
        height: 14,
        borderRadius: 999,
        backgroundColor: "#efe1d3",
        border: `1px solid ${basketBorder}`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          backgroundColor: barColor,
          borderRadius: 999,
          transition: "width 400ms ease, background-color 400ms ease",
        }}
      />
    </div>
  );
};

/* ───────── Info card (Apple or Banana) ───────── */

const InfoCard = ({
  title,
  emoji,
  price,
  mu,
  ratio,
  accent,
  accentTint,
  isHighlighted,
  isPulsing,
  isCorrect,
  isAffordable,
  isBestValue,
}: {
  title: string;
  emoji: string;
  price: number;
  mu: number;
  ratio: number;
  accent: string;
  accentTint: string;
  isHighlighted: boolean;
  isPulsing: boolean;
  isCorrect: boolean | null;
  isAffordable: boolean;
  isBestValue: boolean;
}) => {
  let border: string = `2px solid ${color.border}`;
  let bg: string = color.surfaceRaised;
  if (isHighlighted && isCorrect === true) {
    border = `3px solid ${good}`;
    bg = greenTint;
  } else if (isHighlighted && isCorrect === false) {
    border = `3px dashed ${bad}`;
    bg = redTint;
  }

  return (
    <div
      className="relative rounded-2xl p-3.5 transition-all duration-300"
      style={{
        width: 220,
        flexShrink: 0,
        backgroundColor: bg,
        border,
        boxShadow: "0 2px 6px rgba(74, 42, 56, 0.08)",
        opacity: isAffordable ? 1 : 0.55,
        animation: isPulsing ? "cardPulse 0.5s ease-out" : undefined,
      }}
    >
      {/* Corner badge: live "best value" crown, or the correct/incorrect verdict */}
      {isHighlighted ? (
        <div
          className="absolute flex items-center justify-center"
          style={{
            top: -14,
            right: -10,
            width: 32,
            height: 32,
            borderRadius: "50%",
            backgroundColor: isCorrect ? good : bad,
            color: "white",
            fontSize: 16,
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            animation: "popIn 0.35s ease-out",
          }}
        >
          {isCorrect ? "✓" : "✕"}
        </div>
      ) : (
        isBestValue &&
        isAffordable && (
          <div
            className="absolute font-semibold"
            style={{
              top: -12,
              right: -8,
              fontSize: 11,
              padding: "3px 8px",
              borderRadius: 999,
              backgroundColor: gold,
              color: "white",
              boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
              whiteSpace: "nowrap",
            }}
          >
            👑 Best value
          </div>
        )
      )}

      <div className="flex items-center gap-2.5 mb-2.5">
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 44,
            height: 44,
            fontSize: 26,
            backgroundColor: accentTint,
            flexShrink: 0,
          }}
        >
          {emoji}
        </div>
        <div>
          <h3
            className="text-base font-bold leading-tight"
            style={{ color: ink }}
          >
            {title}
          </h3>
          <p className="text-xs" style={{ color: muted }}>
            ${price} each
          </p>
        </div>
      </div>

      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs" style={{ color: muted }}>
          Marginal utility
        </span>
        <span className="text-sm font-semibold" style={{ color: ink }}>
          {mu}
        </span>
      </div>

      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs" style={{ color: muted }}>
          Value (MU ÷ price)
        </span>
        <span className="text-sm font-bold" style={{ color: accent }}>
          {ratio.toFixed(1)}
        </span>
      </div>
      <ValueMeter value={ratio} fillColor={accent} />

      {!isAffordable && (
        <p
          className="text-xs font-semibold mt-2 text-center"
          style={{ color: bad }}
        >
          💸 Sold out — not enough money left
        </p>
      )}
    </div>
  );
};

/* ───────── Main component ───────── */

const Component = observer(({ state }: { state: State | undefined }) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const fitScale = useFitScale(stageRef, contentRef);

  // Store not just the choice, but also whether it was correct.
  const [visibleChoices, setVisibleChoices] = useState<
    { choice: Choice; isCorrect: boolean }[]
  >([]);
  const [highlightedItem, setHighlightedItem] = useState<{
    choice: Choice;
    isCorrect: boolean;
  } | null>(null);
  const [pulsingChoice, setPulsingChoice] = useState<Choice | null>(null);

  const isAnimating = useRef(false);

  const incomingChoices = state?.choices || [];

  const {
    appleCount,
    bananaCount,
    appleMU,
    bananaMU,
    appleMUP,
    bananaMUP,
    totalCost,
    canAffordApple,
    canAffordBanana,
    isShoppingDone,
    totalUtility,
  } = useMemo(() => {
    const appleCount = visibleChoices.filter(
      (item) => item.choice === "apple"
    ).length;
    const bananaCount = visibleChoices.filter(
      (item) => item.choice === "banana"
    ).length;
    const appleMU = APPLE_START_MU - APPLE_MU_STEP * appleCount;
    const bananaMU = BANANA_START_MU - BANANA_MU_STEP * bananaCount;
    const appleMUP = appleMU / APPLE_PRICE;
    const bananaMUP = bananaMU / BANANA_PRICE;
    const totalCost = appleCount * APPLE_PRICE + bananaCount * BANANA_PRICE;
    const remainingBudget = BUDGET - totalCost;
    const canAffordApple = remainingBudget >= APPLE_PRICE;
    const canAffordBanana = remainingBudget >= BANANA_PRICE;
    const totalUtility =
      totalUtilityFor(APPLE_START_MU, APPLE_MU_STEP, appleCount) +
      totalUtilityFor(BANANA_START_MU, BANANA_MU_STEP, bananaCount);
    return {
      appleCount,
      bananaCount,
      appleMU,
      bananaMU,
      appleMUP,
      bananaMUP,
      totalCost,
      remainingBudget,
      canAffordApple,
      canAffordBanana,
      isShoppingDone: !canAffordApple && !canAffordBanana,
      totalUtility,
    };
  }, [visibleChoices]);

  useEffect(() => {
    const processNextChoice = async () => {
      if (incomingChoices.length <= visibleChoices.length) {
        isAnimating.current = false;
        return;
      }

      const nextChoice = incomingChoices[visibleChoices.length];
      const isCorrect =
        nextChoice === "apple" ? appleMUP >= bananaMUP : bananaMUP >= appleMUP;

      setHighlightedItem({ choice: nextChoice, isCorrect });
      setVisibleChoices((prev) => [...prev, { choice: nextChoice, isCorrect }]);
      setPulsingChoice(nextChoice);

      setTimeout(() => setPulsingChoice(null), 500);
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setHighlightedItem(null);
      isAnimating.current = false;
    };

    // Reset.
    if (incomingChoices.length === 0 && visibleChoices.length > 0) {
      isAnimating.current = false;
      setVisibleChoices([]);
      setHighlightedItem(null);
      setPulsingChoice(null);
      return;
    }

    if (
      !isAnimating.current &&
      incomingChoices.length > visibleChoices.length
    ) {
      isAnimating.current = true;
      processNextChoice();
    }
  }, [
    incomingChoices.length,
    visibleChoices.length,
    isAnimating.current,
    appleMUP,
    bananaMUP,
  ]);

  // Live "smart pick" indicator — only meaningful among fruits you can
  // still afford, and hidden mid-reveal so it doesn't fight the ✓/✕ badge.
  const appleIsBestValue =
    canAffordApple && (appleMUP >= bananaMUP || !canAffordBanana);
  const bananaIsBestValue =
    canAffordBanana && (bananaMUP >= appleMUP || !canAffordApple);

  // Only show the "trip's over" summary once the last pick has finished
  // animating, so it doesn't compete with the highlighted card.
  const showDoneBanner = isShoppingDone && !highlightedItem;
  const utilityPct = OPTIMAL_UTILITY > 0 ? totalUtility / OPTIMAL_UTILITY : 1;
  const stars = utilityPct >= 0.999 ? 3 : utilityPct >= 0.85 ? 2 : 1;

  return (
    <>
      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.3) rotate(-8deg); opacity: 0; }
          60% { transform: scale(1.15) rotate(4deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes cardPulse {
          0% { transform: scale(1); }
          40% { transform: scale(0.94); }
          70% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
      `}</style>
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
              <div
                style={{
                  width: 464,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                {/* Fruit cards */}
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    width: "100%",
                    justifyContent: "center",
                    paddingTop: 14,
                  }}
                >
                  <InfoCard
                    title={"Apple #" + (appleCount + 1)}
                    emoji="🍎"
                    price={APPLE_PRICE}
                    mu={appleMU}
                    ratio={appleMUP}
                    accent={appleAccent}
                    accentTint={appleTint}
                    isHighlighted={highlightedItem?.choice === "apple"}
                    isPulsing={pulsingChoice === "apple"}
                    isCorrect={
                      highlightedItem?.choice === "apple"
                        ? highlightedItem.isCorrect
                        : null
                    }
                    isAffordable={canAffordApple}
                    isBestValue={appleIsBestValue}
                  />
                  <InfoCard
                    title={"Banana #" + (bananaCount + 1)}
                    emoji="🍌"
                    price={BANANA_PRICE}
                    mu={bananaMU}
                    ratio={bananaMUP}
                    accent={bananaAccent}
                    accentTint={bananaTint}
                    isHighlighted={highlightedItem?.choice === "banana"}
                    isPulsing={pulsingChoice === "banana"}
                    isCorrect={
                      highlightedItem?.choice === "banana"
                        ? highlightedItem.isCorrect
                        : null
                    }
                    isAffordable={canAffordBanana}
                    isBestValue={bananaIsBestValue}
                  />
                </div>

                {/* Basket */}
                <div
                  className="rounded-2xl p-3.5"
                  style={{
                    width: "100%",
                    backgroundColor: color.surfaceRaised,
                    border: `1px solid ${color.border}`,
                    boxShadow: "0 2px 6px rgba(74, 42, 56, 0.08)",
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className="text-base font-bold flex items-center gap-1.5"
                      style={{ color: ink }}
                    >
                      <span style={{ fontSize: 18 }}>🛒</span> Your Basket
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: ink }}
                    >
                      ${totalCost}{" "}
                      <span className="font-normal" style={{ color: muted }}>
                        / ${BUDGET}
                      </span>
                    </span>
                  </div>

                  <BudgetBar spent={totalCost} budget={BUDGET} />

                  <div
                    className="flex flex-wrap gap-2 justify-center items-center p-2.5 rounded-xl mt-2.5"
                    style={{
                      minHeight: "4.5rem",
                      backgroundColor: basketBg,
                      border: `2px dashed ${basketBorder}`,
                    }}
                  >
                    {visibleChoices.length > 0 ? (
                      visibleChoices.map((item, index) => (
                        <span
                          key={index}
                          className="relative text-3xl rounded-xl p-1 flex items-center justify-center"
                          style={{
                            border: item.isCorrect
                              ? `2px solid ${good}`
                              : `2px dashed ${bad}`,
                            backgroundColor: item.isCorrect
                              ? greenTint
                              : redTint,
                            animation:
                              index === visibleChoices.length - 1
                                ? "popIn 0.45s ease-out"
                                : undefined,
                          }}
                        >
                          {item.choice === "apple" ? "🍎" : "🍌"}
                          <span
                            className="absolute flex items-center justify-center font-bold"
                            style={{
                              bottom: -6,
                              right: -6,
                              width: 16,
                              height: 16,
                              fontSize: 10,
                              borderRadius: "50%",
                              backgroundColor: item.isCorrect ? good : bad,
                              color: "white",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                            }}
                          >
                            {item.isCorrect ? "✓" : "✕"}
                          </span>
                        </span>
                      ))
                    ) : (
                      <p style={{ color: muted }}>
                        Your basket is empty — call{" "}
                        <code style={{ color: ink }}>optimize(choose)</code> to
                        start shopping!
                      </p>
                    )}
                  </div>
                </div>

                {/* Error feedback from state (invalid return value, or a pick that doesn't fit the budget) */}
                {state?.error && (
                  <div
                    className="rounded-xl px-3 py-2 w-full text-center font-medium"
                    style={{
                      backgroundColor: redTint,
                      border: `2px solid ${bad}`,
                      color: bad,
                    }}
                  >
                    🤔 {state.error}
                  </div>
                )}

                {/* Shopping-trip-complete summary */}
                {showDoneBanner && (
                  <div
                    className="rounded-2xl px-4 py-3 w-full text-center"
                    style={{
                      backgroundColor: goldTint,
                      border: `2px solid ${gold}`,
                      color: ink,
                    }}
                  >
                    <p style={{ fontSize: 24, letterSpacing: 2 }}>
                      {"⭐".repeat(stars)}
                      {"☆".repeat(3 - stars)}
                    </p>
                    <p className="font-bold text-base">
                      Shopping trip complete!
                    </p>
                    <p className="text-sm mt-0.5">
                      You spent ${totalCost} of ${BUDGET} and earned{" "}
                      <strong>{totalUtility}</strong> total utility (
                      {appleCount} 🍎 + {bananaCount} 🍌).
                    </p>
                    <p className="text-xs mt-1" style={{ color: muted }}>
                      Best possible: {OPTIMAL_UTILITY}
                      {stars === 3
                        ? " — you nailed it! 🎉"
                        : " — pick the higher value every round to reach it."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </PluginStage>
      </PluginSurface>
    </>
  );
});

export default Component;
