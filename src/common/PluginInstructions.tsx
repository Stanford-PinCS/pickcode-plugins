import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { color, font, radius, space } from "./tokens";
import { parseSteps } from "../common/instructionSteps";

/**
 * The instruction band at the top of every plugin pane.
 *
 * Shows one step at a time so the height stays fixed and the visualization
 * below never has to be resized or scrolled past. Steps come from the `##`
 * headings in the plugin's instructions.md.
 *
 * The only place instruction styling lives. Don't style instructions
 * inside a plugin.
 */

/** Fixed so the visualization below doesn't jump between steps. */
const BAND_HEIGHT = 180;

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
  const steps = parseSteps(markdown);
  const [index, setIndex] = useState(() => {
    const saved = sessionStorage.getItem("pincs-instructions-step");
    return saved ? parseInt(saved, 10) : 0;
  });

  const goTo = (i: number) => {
    setIndex(i);
    sessionStorage.setItem("pincs-instructions-step", String(i));
  };

  if (steps.length === 0) return null;

  const safeIndex = Math.min(index, steps.length - 1);
  const step = steps[safeIndex];
  const isFirst = safeIndex === 0;
  const isLast = safeIndex === steps.length - 1;

  return (
    <section
      aria-label="Instructions"
      style={{
        flex: "0 0 auto",
        height: BAND_HEIGHT,
        minHeight: BAND_HEIGHT,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: color.surfaceRaised,
        borderBottom: `1px solid ${color.border}`,
      }}
    >
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

        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {step.body}
        </ReactMarkdown>
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
    </section>
  );
}
