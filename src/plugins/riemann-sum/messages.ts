export type Message =
    | { type: "drawCurve" }
    | { type: "setColor"; color: string }
    | { type: "drawRect"; x: number; width: number; height: number }
    | { type: "showArea"; area: number };
