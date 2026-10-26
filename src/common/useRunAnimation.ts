import { useEffect, useState } from "react";

/**
 * Milliseconds since `owner` appeared, counting up to `durationMs` and then
 * holding there. A plugin passes whatever identifies one run's result (its
 * state, or the array a message delivered) and draws its animation at the
 * returned time.
 *
 * A new owner restarts from 0, and reads as 0 on its very first frame, so a
 * new run never flashes the previous run's finished picture. Pass `null`
 * while there is nothing to animate. With prefers-reduced-motion, the time
 * jumps straight to `durationMs`.
 */
export function useRunAnimation(owner: unknown, durationMs: number): number {
  const [anim, setAnim] = useState<{ owner: unknown; t: number }>({
    owner: null,
    t: 0,
  });

  useEffect(() => {
    if (owner == null) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setAnim({ owner, t: durationMs });
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(now - start, durationMs);
      setAnim({ owner, t });
      if (t < durationMs) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [owner, durationMs]);

  return owner != null && anim.owner === owner ? anim.t : 0;
}

/** Fraction of the way from `start` to `start + length`, clamped to 0–1. */
export const progressBetween = (t: number, start: number, length: number) =>
  length <= 0 ? (t >= start ? 1 : 0) : Math.min(Math.max((t - start) / length, 0), 1);

export const easeInOut = (p: number) =>
  p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
