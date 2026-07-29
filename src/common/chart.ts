/**
 * Chart scaffolding shared by every plotting plugin.
 * Extracted from coin-flip so axes, ticks, and padding are identical everywhere.
 */

export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Standard plot padding. Left is wide enough for 4-character tick labels. */
export const PAD: Padding = { top: 20, right: 28, bottom: 46, left: 54 };

/** Standard viewBox. Plugins scale to their container; they never assume pixels. */
export const VIEW = { width: 540, height: 380 } as const;

/**
 * Round a range up to a human-friendly tick interval (1, 2, 5, 10, 20, 50...).
 * Aims for roughly `divisions` ticks across the axis.
 */
export function niceStep(max: number, divisions = 5): number {
  if (max <= 0) return 1;
  const rough = max / divisions;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const options = [1, 2, 5, 10].map((m) => m * mag);
  return options.find((s) => s >= rough) ?? mag * 10;
}

/** Evenly spaced tick values from 0 to max inclusive. */
export function ticks(max: number, divisions = 5): number[] {
  const step = niceStep(max, divisions);
  const out: number[] = [];
  for (let v = 0; v <= max + step * 1e-9; v += step) out.push(v);
  return out;
}

export interface Scales {
  /** Data x -> SVG x */
  sx: (x: number) => number;
  /** Data y -> SVG y (inverted, origin bottom-left) */
  sy: (y: number) => number;
  plotWidth: number;
  plotHeight: number;
  pad: Padding;
}

/**
 * Build linear scales for a plot with the given data domain.
 * Domains are [0, max] — if you need a non-zero minimum, say so in review first,
 * because truncated axes mislead students about magnitude.
 */
export function makeScales(
  xMax: number,
  yMax: number,
  view = VIEW,
  pad = PAD
): Scales {
  const plotWidth = view.width - pad.left - pad.right;
  const plotHeight = view.height - pad.top - pad.bottom;
  return {
    sx: (x) => pad.left + (xMax === 0 ? 0 : (x / xMax) * plotWidth),
    sy: (y) =>
      pad.top + plotHeight - (yMax === 0 ? 0 : (y / yMax) * plotHeight),
    plotWidth,
    plotHeight,
    pad,
  };
}

/** Turn a numeric series into an SVG polyline `points` string. */
export function polylinePoints(
  values: readonly number[],
  scales: Scales,
  xOf: (index: number) => number = (i) => i + 1
): string {
  return values.map((y, i) => `${scales.sx(xOf(i))},${scales.sy(y)}`).join(" ");
}
