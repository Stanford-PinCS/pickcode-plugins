export type Message =
    // totalRolls is optional: older lessons send only the percentages.
    | { type: "showBars"; percentages: number[]; totalRolls?: number }
    | { type: "showTarget"; value: number };
