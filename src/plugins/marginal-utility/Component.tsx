import { observer } from "mobx-react-lite";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { color } from "../../common/tokens";
import { PluginStage, PluginSurface } from "../../common/PluginSurface";
import instructions from "./instructions.md?raw";
import State from "./state";

/* ───────── Theme (inline — Tailwind v4 drops arbitrary values) ───────── */

const ink = "#4a2a38";
const muted = "#9c8378";
const good = "#2f8a5b";
const bad = "#c24a42";
const greenTint = "#e9f3ec";
const redTint = "#f8eae8";
const basketBg = "#faf1ea";
const basketBorder = "#e2cfc4";

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

/* ───────── Info card (Apple or Banana) ───────── */

const InfoCard = ({
  title,
  emoji,
  data,
  isHighlighted,
  isPulsing,
  isCorrect,
}: {
  title: string;
  emoji: string;
  data: { label: string; value: string | number }[];
  isHighlighted: boolean;
  isPulsing: boolean;
  isCorrect: boolean | null;
}) => {
  let border: string = `1px solid ${color.border}`;
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
      className="p-4 rounded-lg transition-all duration-300"
      style={{
        width: 220,
        flexShrink: 0,
        backgroundColor: bg,
        border,
        boxShadow: "0 1px 3px rgba(74, 42, 56, 0.06)",
        transform: isPulsing ? "scale(0.95)" : "none",
      }}
    >
      <h3
        className="text-lg font-semibold mb-1.5 flex items-center gap-1"
        style={{ color: ink }}
      >
        <span>{emoji}</span>
        <span>{title}</span>
      </h3>
      <table className="w-full text-left">
        <tbody>
          {data.map(({ label, value }, index) => (
            <tr
              key={index}
              style={{
                borderBottom:
                  index < data.length - 1
                    ? `1px solid ${color.border}`
                    : "none",
              }}
            >
              <td className="py-1 pr-2" style={{ color: muted }}>
                {label}:
              </td>
              <td className="py-1 pl-2 font-medium" style={{ color: ink }}>
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
    { choice: string; isCorrect: boolean }[]
  >([]);
  const [highlightedItem, setHighlightedItem] = useState<{
    choice: string;
    isCorrect: boolean;
  } | null>(null);
  const [pulsingChoice, setPulsingChoice] = useState<string | null>(null);

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
  } = useMemo(() => {
    const appleCount = visibleChoices.filter(
      (item) => item.choice === "apple"
    ).length;
    const bananaCount = visibleChoices.filter(
      (item) => item.choice === "banana"
    ).length;
    const applePrice = 2;
    const bananaPrice = 1;
    const appleMU = 30 - 10 * appleCount;
    const bananaMU = 20 - 5 * bananaCount;
    const appleMUP = appleMU / applePrice;
    const bananaMUP = bananaMU / bananaPrice;
    const totalCost = appleCount * applePrice + bananaCount * bananaPrice;
    return {
      appleCount,
      bananaCount,
      appleMU,
      bananaMU,
      appleMUP,
      bananaMUP,
      totalCost,
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

  const appleData = [
    { label: "Price", value: `$2` },
    { label: "Marginal Utility", value: appleMU },
    { label: "MU/Price Ratio", value: appleMUP.toFixed(1) },
  ];

  const bananaData = [
    { label: "Price", value: `$1` },
    { label: "Marginal Utility", value: bananaMU },
    { label: "MU/Price Ratio", value: bananaMUP.toFixed(1) },
  ];

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
                }}
              >
                <InfoCard
                  title={"Apple #" + (appleCount + 1)}
                  emoji="🍎"
                  data={appleData}
                  isHighlighted={highlightedItem?.choice === "apple"}
                  isPulsing={pulsingChoice === "apple"}
                  isCorrect={
                    highlightedItem?.choice === "apple"
                      ? highlightedItem.isCorrect
                      : null
                  }
                />
                <InfoCard
                  title={"Banana #" + (bananaCount + 1)}
                  emoji="🍌"
                  data={bananaData}
                  isHighlighted={highlightedItem?.choice === "banana"}
                  isPulsing={pulsingChoice === "banana"}
                  isCorrect={
                    highlightedItem?.choice === "banana"
                      ? highlightedItem.isCorrect
                      : null
                  }
                />
              </div>

              {/* Basket */}
              <div
                className="rounded-lg p-3"
                style={{
                  width: "100%",
                  backgroundColor: color.surfaceRaised,
                  border: `1px solid ${color.border}`,
                  boxShadow: "0 1px 3px rgba(74, 42, 56, 0.06)",
                }}
              >
                <p
                  className="text-lg font-semibold px-1 pb-1"
                  style={{ color: ink }}
                >
                  Basket Cost: ${totalCost}
                  <span className="font-normal" style={{ color: muted }}>
                    {" "}
                    / Budget: $7
                  </span>
                </p>
                <div
                  className="flex flex-wrap gap-2 justify-center items-center p-2 rounded-lg"
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
                        className="text-3xl rounded-lg p-0.5 transition-colors"
                        style={{
                          border: item.isCorrect
                            ? `2px solid ${good}`
                            : `2px dashed ${bad}`,
                          backgroundColor: item.isCorrect ? greenTint : redTint,
                        }}
                      >
                        {item.choice === "apple" ? "🍎" : "🍌"}
                      </span>
                    ))
                  ) : (
                    <p style={{ color: muted }}>Your basket is empty.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </PluginStage>
    </PluginSurface>
  );
});

export default Component;
