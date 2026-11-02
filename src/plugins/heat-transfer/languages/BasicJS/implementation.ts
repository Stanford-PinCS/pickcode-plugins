import { Message } from "../../messages";

/**
 * The boundary between student code and the plugin. The student's while loop
 * calls the visible helper `recordTemps` (in prefix.js / prefix.py) once per
 * pass; the hidden suffix then hands everything to `showCalorimeter`.
 */

const MAX_PASSES = 100000;

function toPositive(input: unknown, name: string, example: string, max: number): number {
  if (typeof input !== "number" || !Number.isFinite(input) || input <= 0 || input > max) {
    throw new Error(`${name} should be a number above 0 and at most ${max}, like ${example}.`);
  }
  return input;
}

function toTemps(input: unknown, name: string): number[] {
  if (input == null || typeof (input as Iterable<unknown>)[Symbol.iterator] !== "function") {
    throw new Error(`showCalorimeter expects ${name} to be a list of temperatures.`);
  }
  return Array.from(input as Iterable<unknown>, (v) => {
    if (typeof v !== "number" || !Number.isFinite(v)) {
      throw new Error(`${name} should only hold numbers (temperatures in °C).`);
    }
    return v;
  });
}

const createExports = (sendMessage: (message: Message) => void) => {
  return Promise.resolve({
    /**
     * Draws the calorimeter and the temperature graph from the temperatures
     * recorded at each pass of the student's loop.
     */
    showCalorimeter: (
      metalMass: unknown,
      metalC: unknown,
      waterMass: unknown,
      waterC: unknown,
      metalTemps: unknown,
      waterTemps: unknown
    ) => {
      const mMetal = toPositive(metalMass, "metalMass", "50", 10000);
      const cMetal = toPositive(metalC, "metalC", "0.385", 10);
      const mWater = toPositive(waterMass, "waterMass", "100", 10000);
      const cWater = toPositive(waterC, "waterC", "4.18", 10);
      const metal = toTemps(metalTemps, "metalTemps");
      const water = toTemps(waterTemps, "waterTemps");
      if (metal.length < 1 || metal.length !== water.length || metal.length > MAX_PASSES + 1) {
        throw new Error("showCalorimeter needs one metal and one water temperature for every pass.");
      }
      if (metal[0] < 0 || metal[0] > 200) {
        throw new Error("metalTemp should start between 0 and 200 °C, like 90.");
      }
      if (water[0] < 0 || water[0] > 100) {
        throw new Error("waterTemp should start between 0 and 100 °C so the water stays liquid, like 20.");
      }
      sendMessage({
        type: "showCalorimeter",
        metalMass: mMetal,
        metalC: cMetal,
        waterMass: mWater,
        waterC: cWater,
        metalTemps: metal,
        waterTemps: water,
      });
    },
  });
};

export default createExports;
