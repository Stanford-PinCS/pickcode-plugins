import { GibbsLabel, Message } from "../../messages";

function toNumbers(input: unknown, what: string): number[] {
    if (input == null || typeof (input as Iterable<unknown>)[Symbol.iterator] !== "function") {
        throw new Error(`showGibbs expects ${what} to be a list of numbers.`);
    }
    return Array.from(input as Iterable<unknown>, (v, i) => {
        if (typeof v !== "number" || !Number.isFinite(v)) {
            throw new Error(`showGibbs: item ${i + 1} of ${what} is not a number.`);
        }
        return v;
    });
}

function toLabels(input: unknown): GibbsLabel[] {
    if (input == null || typeof (input as Iterable<unknown>)[Symbol.iterator] !== "function") {
        throw new Error("showGibbs expects labels to be a list.");
    }
    return Array.from(input as Iterable<unknown>, (v) => {
        const label = typeof v === "string" ? v.trim().toLowerCase() : "";
        if (label !== "spontaneous" && label !== "nonspontaneous" && label !== "not spontaneous") {
            throw new Error('showGibbs expects each label to be "spontaneous" or "nonspontaneous".');
        }
        return label;
    });
}

/**
 * ΔG = ΔH − TΔS is a straight line in T, so where two neighboring points
 * have opposite signs, the crossing between them is exact.
 */
function findCrossover(temperatures: number[], deltaGs: number[]): number | null {
    const points = temperatures
        .map((t, i) => ({ t, g: deltaGs[i] }))
        .sort((a, b) => a.t - b.t);
    for (let i = 0; i < points.length; i++) {
        if (points[i].g === 0) return points[i].t;
        const next = points[i + 1];
        if (next && points[i].g * next.g < 0) {
            const { t, g } = points[i];
            return t + ((0 - g) * (next.t - t)) / (next.g - g);
        }
    }
    return null;
}

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        /**
         * Draws one temperature sweep. The hidden plotPoint helper collects
         * the points the student's loop sends, and this draws them all.
         */
        showGibbs: (temperatures: unknown, deltaGs: unknown, labels: unknown) => {
            const temps = toNumbers(temperatures, "temperatures");
            const gs = toNumbers(deltaGs, "deltaGs");
            const kinds = toLabels(labels);
            if (temps.length === 0 || gs.length !== temps.length || kinds.length !== temps.length) {
                throw new Error("showGibbs expects lists of temperatures, deltaGs, and labels of the same length.");
            }

            sendMessage({
                type: "showGibbs",
                temperatures: temps,
                deltaGs: gs,
                labels: kinds,
                // At exactly ΔG = 0 the reaction is at equilibrium, so either label is accepted.
                correct: gs.map((g, i) => g === 0 || (g < 0) === (kinds[i] === "spontaneous")),
                crossoverK: findCrossover(temps, gs),
            });
        },
    });
};

export default createExports;
