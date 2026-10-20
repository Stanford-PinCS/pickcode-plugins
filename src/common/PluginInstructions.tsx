import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { color, font, radius, space } from "./tokens";
import { parseStepBody, parseSteps } from "../common/instructionSteps";
import { QuestionCard } from "./QuestionCard";
import { openArticleFromFrame } from "./keyterms/openArticle";
import { readTermsBlock } from "./keyterms/termsBlock";
import { remarkTerms } from "./keyterms/remarkTerms";
import { TermLayer } from "./keyterms/TermLayer";

/**
 * The instruction band at the top of every plugin pane.
 *
 * Shows one step at a time so the height stays fixed and the visualization
 * below never has to be resized or scrolled past. Steps come from the `##`
 * headings in the plugin's instructions.md, and a step may embed a
 * multiple-choice <Question> block, which renders as a QuestionCard.
 *
 * The only place instruction styling lives. Don't style instructions
 * inside a plugin.
 */

// The band does not grow with its content: a step with three paragraphs must
// not shove the visualization down the pane. It starts at this height and only
// changes when the reader drags the divider under it.
const DEFAULT_BAND_HEIGHT = 220;

// Below this the step heading and the Next button start colliding.
const MIN_BAND_HEIGHT = 128;

// Always leave this much for whatever the plugin draws. Dragging the divider
// to the floor of the pane would hide the thing the instructions are about.
const MIN_STAGE_HEIGHT = 140;

// How far one arrow-key press moves the divider.
const KEYBOARD_STEP = 16;

const STEP_KEY = "pincs-instructions-step";
const HEIGHT_KEY = "pincs-instructions-height";

// sessionStorage throws (not just returns empty) on the opaque origin of a
// sandbox="allow-scripts"-only iframe, which is exactly how PinCS renders
// plugin bundles. Both accessors below fall back to unpersisted state there.
function readStored(key: string, fallback: number): number {
  try {
    const saved = sessionStorage.getItem(key);
    if (!saved) return fallback;
    const n = parseInt(saved, 10);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key: string, value: number): void {
  try {
    sessionStorage.setItem(key, String(value));
  } catch {
    // Unavailable in this context, so the value just won't persist.
  }
}

const markdownComponents = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p style={{ margin: `0 0 ${space.sm}px` }}>{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul style={{ margin: `0 0 ${space.sm}px`, paddingLeft: 18 }}>{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol style={{ margin: `0 0 ${space.sm}px`, paddingLeft: 18 }}>{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li style={{ margin: "2px 0" }}>{children}</li>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code
      style={{
        fontFamily: font.data,
        fontSize: 12.5,
        background: color.surface,
        border: `1px solid ${color.border}`,
        borderRadius: radius.sm,
        padding: "1px 5px",
      }}
    >
      {children}
    </code>
  ),
  a: ({ children, href }: { children?: React.ReactNode; href?: string }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{ color: color.accent }}
    >
      {children}
    </a>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <table
      style={{ borderCollapse: "collapse", width: "100%", fontSize: 12.5 }}
    >
      {children}
    </table>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th
      style={{
        textAlign: "left",
        padding: "3px 8px 3px 0",
        borderBottom: `1px solid ${color.border}`,
        fontWeight: 600,
      }}
    >
      {children}
    </th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td
      style={{
        padding: "3px 8px 3px 0",
        borderBottom: `1px solid ${color.border}`,
      }}
    >
      {children}
    </td>
  ),
};

function NavButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 26,
        height: 26,
        borderRadius: "50%",
        border: `1px solid ${color.border}`,
        background: color.surface,
        color: color.inkMuted,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        fontSize: 13,
        lineHeight: 1,
      }}
    >
      ‹
    </button>
  );
}

export function PluginInstructions({ markdown }: { markdown: string }) {
  // The key terms written in Plugin Studio are stored after the instructions; students only see the instructions.
  const { body, terms } = useMemo(() => readTermsBlock(markdown), [markdown]);
  const steps = parseSteps(body);
  const [index, setIndex] = useState(() => readStored(STEP_KEY, 0));
  const remarkPlugins = useMemo(() => [remarkGfm, remarkTerms(terms)], [terms]);

  const goTo = (i: number) => {
    setIndex(i);
    writeStored(STEP_KEY, i);
  };

  // --- Resizable band -----------------------------------------------------
  const sectionRef = useRef<HTMLElement | null>(null);

  /**
   * Reports the active step to the host page.
   *
   * Instruction progress used to be measured by the site's MarkdownRenderer,
   * which counts <Slide> elements. Plugins moved to plain `##` steps rendered
   * here, inside the plugin iframe, so that counter saw nothing and the
   * `slide_time` analytics event stopped firing on 2026-08-07 — which is why
   * the class-session report's Progress column reads as empty.
   *
   * The iframe is sandboxed without allow-same-origin, so it cannot call the
   * analytics client itself. It posts the step instead and the host turns that
   * into `slide_time` (see StandaloneCodeOutput / StudioCodeOutput).
   */
  useEffect(() => {
    if (steps.length === 0) return;
    try {
      window.parent.postMessage(
        {
          type: "instructions-step",
          stepIndex: Math.min(index, steps.length - 1),
          totalSteps: steps.length,
        },
        "*"
      );
    } catch {
      // No parent, or it rejected the message: progress just goes unreported.
    }
  }, [index, steps.length]);

  const [height, setHeight] = useState(() =>
    readStored(HEIGHT_KEY, DEFAULT_BAND_HEIGHT)
  );
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);

  // The upper bound depends on how tall the pane is right now, which is not
  // known until the section is in the document, so this reads layout rather
  // than trusting a stored number. A height saved on a tall window would
  // otherwise leave no stage at all on a short one.
  const clampHeight = useCallback((next: number) => {
    const parent = sectionRef.current?.parentElement;
    const available = parent?.getBoundingClientRect().height ?? 0;
    const max =
      available > 0
        ? Math.max(MIN_BAND_HEIGHT, available - MIN_STAGE_HEIGHT)
        : Number.POSITIVE_INFINITY;
    return Math.round(Math.min(Math.max(next, MIN_BAND_HEIGHT), max));
  }, []);

  // Re-clamp whenever the pane changes size: entering Focus Mode, dragging the
  // studio's own vertical divider, or just resizing the window.
  useEffect(() => {
    const parent = sectionRef.current?.parentElement;
    if (!parent) return;
    const reclamp = () => setHeight((h) => clampHeight(h));
    reclamp();
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(reclamp) : null;
    ro?.observe(parent);
    return () => ro?.disconnect();
  }, [clampHeight]);

  const commitHeight = (next: number) => {
    const clamped = clampHeight(next);
    setHeight(clamped);
    writeStored(HEIGHT_KEY, clamped);
    return clamped;
  };

  const onHandlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only the primary button, and never a second drag on top of a live one.
    if (e.button !== 0 || dragRef.current) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startY: e.clientY, startHeight: height };
    setDragging(true);
  };

  const onHandlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    setHeight(clampHeight(drag.startHeight + (e.clientY - drag.startY)));
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    writeStored(HEIGHT_KEY, height);
  };

  const onHandleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      commitHeight(height - KEYBOARD_STEP);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      commitHeight(height + KEYBOARD_STEP);
    } else if (e.key === "Home" || e.key === "Enter") {
      e.preventDefault();
      commitHeight(DEFAULT_BAND_HEIGHT);
    }
  };

  if (steps.length === 0) return null;

  const safeIndex = Math.min(index, steps.length - 1);
  const step = steps[safeIndex];
  const isFirst = safeIndex === 0;
  const isLast = safeIndex === steps.length - 1;

  return (
    <section
      ref={sectionRef}
      aria-label="Instructions"
      style={{
        flex: "0 0 auto",
        height,
        minHeight: MIN_BAND_HEIGHT,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: color.surfaceRaised,
        // Text selection would otherwise follow the pointer across the step
        // body while the divider is being dragged.
        userSelect: dragging ? "none" : undefined,
      }}
    >
      {terms.length > 0 && <TermLayer openArticle={openArticleFromFrame} />}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: `${space.md}px ${space.lg}px 0`,
          fontFamily: font.ui,
          fontSize: 15,
          lineHeight: 1.5,
          color: color.ink,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: color.inkMuted,
            marginBottom: 4,
          }}
        >
          Step {safeIndex + 1} of {steps.length}
        </div>

        <h2
          style={{ fontSize: 18, fontWeight: 700, margin: `0 0 ${space.sm}px` }}
        >
          {step.title}
        </h2>

        {parseStepBody(step.body).map((segment, i) =>
          segment.kind === "question" ? (
            <QuestionCard
              key={i}
              question={segment.question}
              // Keyed by position so an answered question stays answered when
              // the student pages away from the step and comes back.
              storageKey={`pincs-question-${safeIndex}-${i}`}
            />
          ) : (
            <ReactMarkdown
              key={i}
              remarkPlugins={remarkPlugins}
              components={markdownComponents}
            >
              {segment.markdown}
            </ReactMarkdown>
          )
        )}
      </div>

      <div
        style={{
          flex: "0 0 auto",
          display: "flex",
          alignItems: "center",
          gap: space.md,
          padding: `${space.sm}px ${space.lg}px ${space.md}px`,
        }}
      >
        <NavButton
          label="Previous step"
          onClick={() => goTo(safeIndex - 1)}
          disabled={isFirst}
        />

        <div style={{ display: "flex", gap: 5, flex: 1 }} aria-hidden="true">
          {steps.map((s, i) => (
            <span
              key={s.title || i}
              style={{
                height: 4,
                flex: 1,
                maxWidth: 22,
                borderRadius: 2,
                background: i <= safeIndex ? color.accent : color.border,
              }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => goTo(safeIndex + 1)}
          disabled={isLast}
          style={{
            border: "none",
            borderRadius: 13,
            padding: "5px 14px",
            background: isLast ? color.border : color.accent,
            color: isLast ? color.inkMuted : color.surfaceRaised,
            fontFamily: font.ui,
            fontSize: 12.5,
            fontWeight: 600,
            cursor: isLast ? "default" : "pointer",
          }}
        >
          Next ›
        </button>
      </div>

      {/* Divider between the instructions and whatever the plugin draws.
          Doubles as the section's bottom border, so the band keeps its edge
          whether or not anyone ever touches it. */}
      <div
        role="separator"
        aria-label="Resize instructions"
        aria-orientation="horizontal"
        aria-valuenow={Math.round(height)}
        aria-valuemin={MIN_BAND_HEIGHT}
        tabIndex={0}
        onPointerDown={onHandlePointerDown}
        onPointerMove={onHandlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onHandleKeyDown}
        onDoubleClick={() => commitHeight(DEFAULT_BAND_HEIGHT)}
        title="Drag to resize. Double-click to reset."
        style={{
          flex: "0 0 auto",
          height: 9,
          cursor: "row-resize",
          background: dragging ? color.border : color.surfaceRaised,
          borderTop: `1px solid ${color.border}`,
          borderBottom: `1px solid ${color.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // The pointer must not be handed to the text above mid-drag.
          touchAction: "none",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 34,
            height: 3,
            borderRadius: 2,
            background: dragging ? color.accent : color.border,
          }}
        />
      </div>
    </section>
  );
}
