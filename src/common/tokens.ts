import type { CSSProperties } from "react";

/**
 * The only place colors, spacing, and type are defined.
 * No plugin may contain a raw hex value. If you need a color
 * that isn't here, add it here first and say why in the PR.
 */

export const color = {
  /** Page background of the plugin pane. Matches the PinCS site shell. */
  surface: "#ffffff",
  /** Raised panels, chart plot areas, stat cards. */
  surfaceRaised: "#fffdfb",
  border: "#ecd9cc",

  /** Primary text. */
  ink: "#4a2a38",
  /** Axis labels, captions, anything secondary. */
  inkMuted: "#8a6b78",

  /** Interactive + primary emphasis. */
  accent: "#d6446b",
  accentSoft: "#fbeaf0",

  /**
   * Categorical data series, in order. Index 0 is the primary series.
   * Tested for contrast on `surface` and distinguishable in grayscale.
   */
  series: ["#d6446b", "#2f7d8c", "#b3701c", "#6b4a9e"] as const,

  /** Reference lines, targets, expected values. */
  reference: "#b3701c",

  grid: "rgba(74, 42, 56, 0.10)",
  axis: "rgba(74, 42, 56, 0.32)",
} as const;

/** 4px base scale. Use these, not arbitrary pixel values. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  xl: 32,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 14,
} as const;

export const font = {
  ui: "Avenir, Helvetica, sans-serif",
  data: "'IBM Plex Mono', ui-monospace, monospace",
} as const;

export const type = {
  /** Small uppercase caption above a value. */
  label: {
    fontFamily: font.ui,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: color.inkMuted,
  } satisfies CSSProperties,

  /** Large numeric readout. */
  value: {
    fontFamily: font.data,
    fontSize: 22,
    fontWeight: 600,
    color: color.ink,
    fontVariantNumeric: "tabular-nums",
  } satisfies CSSProperties,

  /** Axis tick text. */
  tick: {
    fontFamily: font.data,
    fontSize: 11,
    fill: color.inkMuted,
  } satisfies CSSProperties,

  /** Axis name, e.g. "Number of Flips". */
  axisTitle: {
    fontFamily: font.ui,
    fontSize: 12,
    fontWeight: 600,
    fill: color.inkMuted,
  } satisfies CSSProperties,

  /** Body copy inside the plugin pane. Rare — most prose lives in instructions.md. */
  body: {
    fontFamily: font.ui,
    fontSize: 14,
    lineHeight: 1.5,
    color: color.ink,
  } satisfies CSSProperties,
} as const;
