// Spring Lab — message types between worker (student code) and main thread.
// Two commands only; the worker accumulates a queue and ships everything in run().

export type SpringMethod = "static" | "dynamic";

export type DataRow = {
  m: number;       // mass in kg
  x?: number;      // static displacement in m (optional; only present for static rows)
  T?: number;      // averaged period in s (optional; only present for dynamic rows)
};

export type ModelInputs = {
  method: SpringMethod;
  masses?: number[];            // allowed masses in kg; activeMass must come from this list
  rows: DataRow[];
  activeMass: number;        // which mass to animate on screen, in kg
};

export type ModelDisplay = {
  showEquilibriumLine?: boolean;
};

export type Model = {
  inputs: ModelInputs;
  display: ModelDisplay;
};

// Pre-computed quantities the core layer hands to the renderer.
// IMPORTANT: this NEVER contains ground-truth k. Renderer uses simulationK
// (a separate, plugin-internal field) to drive the animation.
export type Derived = {
  rowCount: number;
  massRange: [number, number] | null;
  xRange: [number, number] | null;
  TRange: [number, number] | null;
  // Plugin-internal: opaque to student code. Set in core, read by renderer.
  simulationK: number;
  amplitude: number;
};

export type Phase = "idle" | "configured" | "playing" | "done";

// ---- Messages ----

export type ConfigureSimulationCommand = {
  type: "ConfigureSimulation";
  model: Model;
  derived: Derived;
};

export type StartAnimationCommand = {
  type: "StartAnimation";
};

export type Command = ConfigureSimulationCommand | StartAnimationCommand;
