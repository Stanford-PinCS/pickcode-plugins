/**
 * Every message the student's code can send to this plugin.
 */
export type Message = {
  type: "showCalorimeter";
  /** grams */
  metalMass: number;
  /** specific heat, J/(g·°C) */
  metalC: number;
  waterMass: number;
  waterC: number;
  /** Temperature at the start of every loop pass, then the final one, in °C. */
  metalTemps: readonly number[];
  waterTemps: readonly number[];
};
