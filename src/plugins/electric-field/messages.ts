export type Message =
    | { type: "addParticle"; id: number; x: number; y: number; q: number }
    | { type: "clearParticles" }
    | { type: "reset" };