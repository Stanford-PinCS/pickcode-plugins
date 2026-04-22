export type SimulationResult = {
  v0: number;
  mu: number;
  r0: number;
  trueEscapeVelocity: number;
  studentPrediction: boolean | null; // what isEscaping(v0, mu, r0) returned; null if it errored
  studentFormulaCorrect: boolean;
  studentFormulaError: boolean;
  trajectory: { x: number; y: number }[];
  escapes: boolean;
};
