export type Message =
    // One entry per trial, in order: 1 when food followed the bell, 0 when
    // the bell rang alone, and the strength (0 to 100) after that trial.
    | { type: "showTrials"; foodPresent: number[]; strengths: number[] };
