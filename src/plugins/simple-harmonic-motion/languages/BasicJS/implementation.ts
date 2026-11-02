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
    const { weightForce } = args.inputs;
    return {
      inputs: {
        method,
        masses: masses.slice(),
        rows: rows.slice(),
        activeMass,
        ...(typeof weightForce === "number" ? { weightForce } : {}),
      },
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

  /**
   * The starter code's one visible call. Hangs `mass` (kg) on the spring,
   * pulls it down a little, and lets go. The spring stretches by
   * weight(mass) / k, so the student's weight function decides the stretch.
   * Returns the stretch in metres.
   *
   * @example hangMass(0.2, (m) => m * 9.81);
   */
  function hangMass(mass: number, weight: (mass: number) => number): number {
    if (typeof mass !== "number" || !Number.isFinite(mass) || mass <= 0) {
      throw new Error("hangMass: mass must be a positive number of kilograms, like 0.2.");
    }
    if (mass > 2) {
      throw new Error(`hangMass: ${mass} kg would overstretch this spring. Use a mass up to 2 kg.`);
    }
    if (typeof weight !== "function") {
      throw new Error("hangMass: the second value must be your weight function. Pass it by name: hangMass(mass, weight).");
    }
    const force = weight(mass);
    if (typeof force !== "number" || !Number.isFinite(force)) {
      throw new Error("hangMass: your weight function needs to return a number. Check that it has a return line.");
    }
    if (force <= 0) {
      throw new Error(`hangMass: your weight function returned ${force}. Weight pulls down, so it should be a positive number of newtons.`);
    }
    if (force > 25) {
      throw new Error(`hangMass: a weight of ${force} N would overstretch this spring. Keep it under 25 N.`);
    }
    run(
      createModel({
        inputs: { method: "static", masses: [mass], rows: [], activeMass: mass, weightForce: force },
      })
    );
    return force / SIM_K_TRUE;
  }

  return Promise.resolve({
    hangMass,
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
