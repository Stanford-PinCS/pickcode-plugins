export type Message =
    | { type: "showBars"; percentages: number[] }
    | { type: "showTarget"; value: number };
