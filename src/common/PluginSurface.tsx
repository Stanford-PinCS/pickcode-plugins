import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { color, font, radius, space, type } from "./tokens";
import { PluginInstructions } from "./PluginInstructions";

/**
 * The outer frame for every plugin pane.
 *
 * Deliberately has no title bar: the PinCS site already renders the plugin
 * name above this pane. A plugin that draws its own heading duplicates it.
 */
export function PluginSurface({
  instructions,
  children,
}: {
  instructions?: string;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // The embed iframe often paints its first frame before the parent has
    // given it a stable size and before Avenir / IBM Plex Mono finish loading.
    // That first frame is a partial paint, and nothing corrects it until a
    // reflow — which is why switching tabs or hitting Run makes it appear.
    // Force a genuine relayout + repaint of this subtree instead.
    const repaint = () => {
      const el = rootRef.current;
      if (!el) return;
      el.style.transform = "translateZ(0)"; // invisible, forces a paint layer
      void el.offsetHeight; // flush layout with it applied
      el.style.transform = ""; // and back — triggers a real repaint
    };

    // After the first layout pass has run...
    const raf = requestAnimationFrame(() => requestAnimationFrame(repaint));

    // ...and again once the custom fonts are ready, since they change metrics.
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) repaint();
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        minHeight: 0,
        background: color.surface,
        color: color.ink,
        fontFamily: font.ui,
        overflow: "hidden",
      }}
    >
      {instructions && <PluginInstructions markdown={instructions} />}
      {children}
    </div>
  );
}

/** The main visual area. Fills available space and centers its child. */
export function PluginStage({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: space.sm,
      }}
    >
      {children}
    </div>
  );
}

export interface Stat {
  label: string;
  /** Pre-formatted. Use `EMPTY` for "no data yet" so the dash is consistent. */
  value: string;
  /** Defaults to ink. Pass a `color.series[n]` to tie a stat to its line. */
  color?: string;
}

/** Placeholder for a statistic that has no value yet. */
export const EMPTY = "—";

// StatRow at full size. A narrow pane draws the whole row smaller by one factor, so these only show as-is when there's room.
// "large" is for a plugin whose numbers are the point of the readout, not a footnote to the chart; it uses the type tokens at their own size.
const STAT_SIZES = {
  default: { label: 9, value: 13, gap: 16, padY: space.xs, padX: space.md },
  large: {
    label: type.label.fontSize,
    value: type.value.fontSize,
    gap: space.xl,
    padY: space.lg,
    padX: space.lg,
  },
} as const;

/**
 * Footer row of numeric readouts, pinned below the stage.
 *
 * Always one line. When the stats are wider than the pane (a lesson gives the plugin about half of a narrow column), the whole row, text and spacing alike, shrinks by the same factor until it fits, and grows back to full size when there's room. Wrapping would stack the stats onto extra lines and take that height from the stage.
 */
export function StatRow({
  stats,
  size = "default",
}: {
  stats: readonly Stat[];
  size?: keyof typeof STAT_SIZES;
}) {
  const sizes = STAT_SIZES[size];
  const rowRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(1);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const row = rowRef.current;
    const content = contentRef.current;
    if (!row || !content) return;

    const fit = () => {
      const available = row.clientWidth;
      const width = content.getBoundingClientRect().width;
      if (!available || !width) return;
      const current = scaleRef.current;
      // width / current is the stats' full-size width. Leave a pixel spare.
      const next = Math.max(
        0.1,
        Math.min(1, (current * Math.max(available - 1, 1)) / width)
      );
      // Shrink whenever it overflows, but grow back only for a real gain, so text that doesn't scale exactly linearly can't make it flicker.
      if (width > available || next > current * 1.01) {
        scaleRef.current = next;
        setScale(next);
      }
    };

    fit();
    // Refit on the next frame instead of inside the callback, so the resize a refit causes doesn't trip the browser's ResizeObserver loop error.
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    });
    observer.observe(row);
    observer.observe(content);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={rowRef}
      style={{
        display: "flex",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
        borderTop: `1px solid ${color.border}`,
      }}
    >
      <div
        ref={contentRef}
        style={{
          display: "flex",
          flex: "none",
          gap: sizes.gap * scale,
          padding: `${sizes.padY * scale}px ${sizes.padX * scale}px`,
          whiteSpace: "nowrap",
        }}
      >
        {stats.map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div
              style={{
                ...type.label,
                fontSize: sizes.label * scale,
                lineHeight: 1.2,
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                ...type.value,
                fontSize: sizes.value * scale,
                lineHeight: 1.2,
                color: s.color ?? color.ink,
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Shown when a plugin has received no data yet — i.e. the student hasn't run
 * their code. Every plugin needs one; a blank pane reads as broken.
 */
export function EmptyState({ message }: { message: string }) {
  const style: CSSProperties = {
    ...type.body,
    color: color.inkMuted,
    textAlign: "center",
    maxWidth: 280,
    padding: space.lg,
    border: `1px dashed ${color.border}`,
    borderRadius: radius.lg,
    background: color.surfaceRaised,
  };
  return <div style={style}>{message}</div>;
}
