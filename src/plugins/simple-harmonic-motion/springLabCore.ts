// Spring Lab — pure physics core.
// All simulation lives here. No DOM, no MobX, no React.
// Every physics bug is here, by construction.

import type { Derived, Model, ModelInputs } from "./messages";

// ---------- Physical constants ----------

export const G = 9.81; // m/s^2

// Hidden ground truth used by the simulation layer.
// Never logged. Never returned to student code.
export const SIM_K_TRUE = 12.5;       // N/m
export const SIM_SPRING_MASS = 0.020; // kg, gives small bias on dynamic method

// Visual amplitude used during the SHM animation.
export const SIM_AMPLITUDE = 0.030;   // 3 cm — a "small" displacement

// Noise levels (used in implementation.ts, exported here so the values are
// in one place and tests can reference them).
export const NOISE_SIGMA_X = 0.0008;  // m  ~1 mm reading uncertainty
export const NOISE_SIGMA_T = 0.030;   // s  reaction-time spread on t/10

// ---------- Seeded PRNG (mulberry32) ----------
// Per-lab-instance seed → reproducible noise → pre-flight #4 satisfied.

export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller on top of the seeded PRNG.
export function gaussian(rng: () => number): number {
  const u1 = Math.max(rng(), 1e-12);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// ---------- Clean-physics helpers (used by implementation.ts) ----------

// Static equilibrium displacement under mass m. mg = kx → x = mg/k.
export function cleanDisplacement(m: number): number {
  return (m * G) / SIM_K_TRUE;
}

// SHM period with effective mass m + m_s/3.
// This is the small bias dynamic-method students will discover.
export function cleanPeriod(m: number): number {
  const mEff = m + SIM_SPRING_MASS / 3;
  return 2 * Math.PI * Math.sqrt(mEff / SIM_K_TRUE);
}

// ---------- Build derived report ----------

export function buildReport(inputs: ModelInputs): Derived {
  const rows = inputs.rows ?? [];
  const masses = rows.map((r) => r.m).filter((v) => Number.isFinite(v));
  const xs = rows
    .map((r) => r.x)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  const Ts = rows
    .map((r) => r.T)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));

  const range = (arr: number[]): [number, number] | null =>
    arr.length === 0 ? null : [Math.min(...arr), Math.max(...arr)];

  return {
    rowCount: rows.length,
    massRange: range(masses),
    xRange: range(xs),
    TRange: range(Ts),
    simulationK: SIM_K_TRUE,
    amplitude: SIM_AMPLITUDE,
  };
}

// ---------- Time → visual snapshot (the single source of truth) ----------

export type Snapshot = {
  // What's on screen at time `time`, in physical units (m).
  // Component just maps these to pixels.
  springTopY: number;       // y of fixed support (m, from canvas top, increasing down)
  massY: number;            // y of the mass center (m)
  equilibriumY: number;     // y of the static equilibrium for activeMass (m)
  naturalEndY: number;      // y of where the free end would be with no mass (m)
  oscDisplacement: number;  // signed displacement from equilibrium, m
  hudT: number;             // elapsed time since animation start, s
  hudPeriod: number;        // current SHM period for activeMass (s)
  hudOscCount: number;      // how many full oscillations have passed
};

// Layout constants in physical units (m). Renderer maps these to canvas px.
const SUPPORT_Y_M = 0.05;
const NATURAL_LEN_M = 0.30;

export function getSnapshotAtTime(
  inputs: ModelInputs,
  derived: Derived,
  time: number
): Snapshot {
  const m = Math.max(inputs.activeMass, 1e-6);
  const k = derived.simulationK;
  const A = derived.amplitude;

  // Static equilibrium: spring stretches by mg/k under mass m.
  const xEq = (m * G) / k;
  const equilibriumY = SUPPORT_Y_M + NATURAL_LEN_M + xEq;
  const naturalEndY = SUPPORT_Y_M + NATURAL_LEN_M;

  // Dynamic SHM around equilibrium. Same animation for both methods —
  // it's the same physical apparatus. HUD picks what to highlight.
  // Use effective mass for period to match the bias dynamic students would see.
  const mEff = m + SIM_SPRING_MASS / 3;
  const omega = Math.sqrt(k / mEff);
  const period = (2 * Math.PI) / omega;

  // Start at +A (mass pulled down a bit, then released, like the PDF says).
  const oscDisplacement = A * Math.cos(omega * time);
  const massY = equilibriumY + oscDisplacement;
  const oscCount = Math.max(0, Math.floor(time / period));

  return {
    springTopY: SUPPORT_Y_M,
    massY,
    equilibriumY,
    naturalEndY,
    oscDisplacement,
    hudT: time,
    hudPeriod: period,
    hudOscCount: oscCount,
  };
}
