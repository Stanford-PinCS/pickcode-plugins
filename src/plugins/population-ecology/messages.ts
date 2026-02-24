export type Message =
    | { type: "addPopulation"; initialSize: number; growthRate: number; dayDuration: number; label: string }
    | { type: "addCustomPopulation"; populations: number[]; dayDuration: number }
    | { type: "tick"; day: number; population: number }
    | { type: "reset" };