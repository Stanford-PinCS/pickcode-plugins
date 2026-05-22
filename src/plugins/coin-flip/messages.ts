export type Message =
    | { type: "plotLine"; points: number[] }
    | { type: "showTarget"; value: number };
