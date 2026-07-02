import type { Command, Model, ModelDisplay, ModelInputs } from "../../messages";

const G = 9.81;
const SIM_K_TRUE = 12.5;
const SIM_SPRING_MASS = 0.02;
const SIM_AMPLITUDE = 0.03;
const NOISE_SIGMA_X = 0.0008;
const NOISE_SIGMA_T = 0.03;
const DEFAULT_MASSES = [0.1, 0.15, 0.2, 0.25, 0.3];

function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng: () => number): number {
  const u1 = Math.max(rng(), 1e-12);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function cleanDisplacement(m: number): number {
  return (m * G) / SIM_K_TRUE;
}

function cleanPeriod(m: number): number {
  return 2 * Math.PI * Math.sqrt((m + SIM_SPRING_MASS / 3) / SIM_K_TRUE);
}

function range(arr: number[]): [number, number] | null {
  return arr.length === 0 ? null : [Math.min(...arr), Math.max(...arr)];
}

function buildReport(inputs: ModelInputs) {
  const rows = inputs.rows ?? [];
  const masses = rows.map((r) => r.m).filter((v) => Number.isFinite(v));
  const xs = rows
    .map((r) => r.x)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  const Ts = rows
    .map((r) => r.T)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));

  return {
    rowCount: rows.length,
    massRange: range(masses),
    xRange: range(xs),
    TRange: range(Ts),
    simulationK: SIM_K_TRUE,
    amplitude: SIM_AMPLITUDE,
  };
}

type CreateModelArgs = {
  inputs: ModelInputs;
  display?: ModelDisplay;
};

const createExports = (sendMessage: (message: Command) => void) => {
  const rngStatic = makeRng(0xa5a5);
  const rngDynamic = makeRng(0x5a5a);
  let runCalled = false;

  function measureDisplacement(mass: number): number {
    if (!Number.isFinite(mass) || mass <= 0) {
      throw new Error("measureDisplacement: mass must be a positive number in kg");
    }
    const noisy = cleanDisplacement(mass) + NOISE_SIGMA_X * gaussian(rngStatic);
    return Math.round(noisy * 10000) / 10000;
  }

  function measurePeriod(mass: number): number {
    if (!Number.isFinite(mass) || mass <= 0) {
      throw new Error("measurePeriod: mass must be a positive number in kg");
    }
    const noisyT = cleanPeriod(mass) + NOISE_SIGMA_T * gaussian(rngDynamic);
    return Math.round(noisyT * 1000) / 1000;
  }

  function measurePeriod10(mass: number): number {
    if (!Number.isFinite(mass) || mass <= 0) {
      throw new Error("measurePeriod10: mass must be a positive number in kg");
    }
    const noisyT = cleanPeriod(mass) + (NOISE_SIGMA_T * gaussian(rngDynamic)) / 10;
    return Math.round(noisyT * 1000) / 1000;
  }

  function createModel(args: CreateModelArgs): Model {
    if (!args || !args.inputs) {
      throw new Error("createModel: missing inputs");
    }
    const { method, masses = DEFAULT_MASSES, rows, activeMass } = args.inputs;
    if (method !== "static" && method !== "dynamic") {
      throw new Error('createModel: method must be "static" or "dynamic"');
    }
    if (!Array.isArray(rows)) {
      throw new Error("createModel: rows must be an array");
    }
    if (!Number.isFinite(activeMass) || activeMass <= 0) {
      throw new Error("createModel: activeMass must be a positive number in kg");
    }
    if (!Array.isArray(masses) || masses.length === 0) {
      throw new Error("createModel: masses must be a non-empty array");
    }
    const hasActiveMass = masses.some(
      (mass) => Number.isFinite(mass) && Math.abs(mass - activeMass) < 1e-9
    );
    if (!hasActiveMass) {
      throw new Error(
        "createModel: activeMass must be one of the masses in the masses array. Add it there first."
      );
    }
    return {
      inputs: { method, masses: masses.slice(), rows: rows.slice(), activeMass },
      display: { showEquilibriumLine: true, ...(args.display ?? {}) },
    };
  }

  function preview(model: Model) {
    const d = buildReport(model.inputs);
    return {
      derived: {
        rowCount: d.rowCount,
        massRange: d.massRange,
        xRange: d.xRange,
        TRange: d.TRange,
      },
    };
  }

  function run(model: Model): void {
    if (runCalled) {
      throw new Error("springLab.run() can only be called once per program.");
    }
    runCalled = true;
    sendMessage({ type: "ConfigureSimulation", model, derived: buildReport(model.inputs) });
    sendMessage({ type: "StartAnimation" });
  }

  return Promise.resolve({
    springLab: {
      measureDisplacement,
      measurePeriod,
      measurePeriod10,
      createModel,
      preview,
      run,
    },
  });
};

export default createExports;
