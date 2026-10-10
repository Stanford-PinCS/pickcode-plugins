import { useState } from "react";
import { color, font, radius, space, type } from "./tokens";
import type { Question } from "./instructionSteps";

/**
 * A multiple-choice comprehension check, rendered from a <Question> block in
 * instructions.md. See instructionSteps.ts for the markdown syntax.
 *
 * Wrong answers are marked and the student keeps trying — nothing is scored
 * and nothing is reported, so guessing costs them nothing. The point is to
 * make them commit to a prediction before the explanation appears, which is
 * what turns reading into understanding.
 *
 * The only place question styling lives, exactly like PluginInstructions is
 * the only place instruction styling lives. Don't style questions in a plugin.
 */
/**
 * sessionStorage *throws* (rather than returning null) on the opaque origin of
 * a sandbox="allow-scripts" iframe, which is exactly how the PinCS site renders
 * plugin bundles — same reason PluginInstructions guards its own reads. An
 * unpersisted question still works; a thrown exception would blank the pane.
 */
function readSolvedIndex(storageKey?: string): number | null {
  if (!storageKey) return null;
  try {
    const saved = sessionStorage.getItem(storageKey);
    return saved === null ? null : parseInt(saved, 10);
  } catch {
    return null;
  }
}

function writeSolvedIndex(storageKey: string | undefined, index: number) {
  if (!storageKey) return;
  try {
    sessionStorage.setItem(storageKey, String(index));
  } catch {
    // Unavailable in this context — the answer just won't survive paging away.
  }
}

export function QuestionCard({
  question,
  /**
   * sessionStorage key for remembering a correct answer, so paging away from
   * a step and back doesn't blank out an answered question. Omit to keep the
   * card purely in-memory.
   */
  storageKey,
}: {
  question: Question;
  storageKey?: string;
}) {
  const [solvedIndex, setSolvedIndex] = useState<number | null>(() =>
    readSolvedIndex(storageKey)
  );
  const [wrongPicks, setWrongPicks] = useState<number[]>([]);

  const solved = solvedIndex !== null;

  const choose = (index: number) => {
    if (solved) return;
    if (question.options[index].correct) {
      setSolvedIndex(index);
      writeSolvedIndex(storageKey, index);
    } else if (!wrongPicks.includes(index)) {
      setWrongPicks([...wrongPicks, index]);
    }
  };

  return (
    <div
      style={{
        border: `1px solid ${color.border}`,
        borderRadius: radius.md,
        background: color.surface,
        padding: space.sm,
        marginBottom: space.sm,
      }}
    >
      <div style={{ ...type.label, marginBottom: space.xs }}>
        Check your understanding
      </div>

      <div
        style={{
          fontFamily: font.ui,
          fontSize: 14,
          fontWeight: 600,
          lineHeight: 1.4,
          marginBottom: space.sm,
        }}
      >
        {question.prompt}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: space.xs }}>
        {question.options.map((option, index) => {
          const isSolved = solvedIndex === index;
          const isWrong = wrongPicks.includes(index);
          return (
            <button
              key={option.text}
              type="button"
              onClick={() => choose(index)}
              disabled={solved || isWrong}
              aria-pressed={isSolved || isWrong}
              style={{
                textAlign: "left",
                fontFamily: font.ui,
                fontSize: 13,
                lineHeight: 1.35,
                padding: "5px 8px",
                borderRadius: radius.sm,
                cursor: solved || isWrong ? "default" : "pointer",
                border: `1px solid ${
                  isSolved
                    ? color.positive
                    : isWrong
                    ? color.negative
                    : color.border
                }`,
                background: isSolved
                  ? color.positiveSoft
                  : isWrong
                  ? color.negativeSoft
                  : color.surfaceRaised,
                color: isSolved
                  ? color.positive
                  : isWrong
                  ? color.negative
                  : color.ink,
              }}
            >
              {option.text}
            </button>
          );
        })}
      </div>

      {(solved || wrongPicks.length > 0) && (
        <div
          style={{
            fontFamily: font.ui,
            fontSize: 12.5,
            lineHeight: 1.4,
            marginTop: space.sm,
            color: solved ? color.positive : color.negative,
          }}
        >
          {solved ? (
            <>
              <strong>Correct.</strong>
              {question.explanation ? (
                <span style={{ color: color.ink }}> {question.explanation}</span>
              ) : null}
            </>
          ) : (
            "Not quite — try another."
          )}
        </div>
      )}
    </div>
  );
}
