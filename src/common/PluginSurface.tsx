import type { CSSProperties, ReactNode } from "react";
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
  return (
    <div
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

/** Footer row of numeric readouts, pinned below the stage. */
export function StatRow({ stats }: { stats: readonly Stat[] }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: space.xl,
        padding: `${space.md}px ${space.lg}px ${space.lg}px`,
        borderTop: `1px solid ${color.border}`,
      }}
    >
      {stats.map((s) => (
        <div key={s.label} style={{ textAlign: "center", minWidth: 88 }}>
          <div style={{ ...type.label, marginBottom: space.xs }}>{s.label}</div>
          <div style={{ ...type.value, color: s.color ?? color.ink }}>
            {s.value}
          </div>
        </div>
      ))}
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
