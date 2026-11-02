import { FromRuntimeMessage } from "../../messages";

/**
 * Compute the true stoichiometric result for the Haber process:
 *   N₂ + 3H₂ → 2NH₃
 */
function computeTrueValues(n2: number, h2: number) {
    const nh3_from_n2 = n2 * 2;        // max NH₃ if only N₂ limits
    const nh3_from_h2 = h2 * (2 / 3);  // max NH₃ if only H₂ limits

    const true_nh3 = Math.min(nh3_from_n2, nh3_from_h2);

    // Treat amounts that differ only by floating-point rounding as equal,
    // so an exact 1 : 3 ratio like 2 and 6 always reads as "None".
    const tolerance = 1e-9 * Math.max(1, nh3_from_n2, nh3_from_h2);
    let true_limiting: string;
    if (nh3_from_n2 < nh3_from_h2 - tolerance) {
        true_limiting = "n2";
    } else if (nh3_from_h2 < nh3_from_n2 - tolerance) {
        true_limiting = "h2";
    } else {
        true_limiting = "None";
    }

    // Stoichiometry: 1 mol N₂ → 2 mol NH₃, so N₂ consumed = NH₃ / 2
    //                3 mol H₂ → 2 mol NH₃, so H₂ consumed = NH₃ * 3/2
    const n2_consumed = true_nh3 / 2;
    const h2_consumed = true_nh3 * 3 / 2;
    const n2_remaining = n2 - n2_consumed;
    const h2_remaining = h2 - h2_consumed;

    return { true_nh3, true_limiting, n2_consumed, h2_consumed, n2_remaining, h2_remaining };
}

let runCounter = 0;

// "neither" (what the lesson teaches) and "None" (older lessons) both mean
// that no reactant runs out first.
const normalizeLimiting = (s: string): string => {
    const t = s.trim().toLowerCase();
    return t === "neither" ? "none" : t;
};
const sameLimiting = (answer: string, truth: string): boolean =>
    normalizeLimiting(answer) === normalizeLimiting(truth);

type StudentResultObject = {
    h2_reactant_amount?: number;
    n2_reactant_amount?: number;
    nh3_product_made?: number;
    limiting_reactant?: string;
};

const requireAmount = (name: string, value: unknown): number => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new Error(`reactGases: ${name} must be a number of moles, like 6.`);
    }
    if (value < 0) {
        throw new Error(`reactGases: ${name} can't be negative. You gave ${value}.`);
    }
    if (value > 1000) {
        throw new Error(`reactGases: ${name} is too big for this reactor. Use 1000 mol or less.`);
    }
    return value;
};

const createExports = (
    sendMessage: (message: FromRuntimeMessage) => void
) => {
    return Promise.resolve({
        /**
         * The starter code's one visible call. Reacts `h2` and `n2` mol of gas,
         * asks the student's function which reactant runs out first, and marks
         * that answer against the true limiting reactant.
         *
         * @example reactGases(6, 3, (h2, n2) => "h2");
         */
        reactGases: (
            h2: number,
            n2: number,
            findLimiting: (h2: number, n2: number) => unknown
        ) => {
            const input_h2 = requireAmount("h2", h2);
            const input_n2 = requireAmount("n2", n2);
            if (typeof findLimiting !== "function") {
                throw new Error(
                    "reactGases: the third value must be your findLimiting function. Pass it by name: reactGases(h2, n2, findLimiting)."
                );
            }
            const answer = findLimiting(input_h2, input_n2);
            if (typeof answer !== "string") {
                throw new Error(
                    'reactGases: findLimiting needs to return "h2", "n2", or "neither" (in quotes). Check every path has a return line.'
                );
            }
            runCounter++;
            const trueVals = computeTrueValues(input_n2, input_h2);
            sendMessage({
                run_id: runCounter,
                input_n2,
                input_h2,
                true_nh3: trueVals.true_nh3,
                true_limiting: trueVals.true_limiting,
                n2_consumed: trueVals.n2_consumed,
                h2_consumed: trueVals.h2_consumed,
                n2_remaining: trueVals.n2_remaining,
                h2_remaining: trueVals.h2_remaining,
                student_limiting: answer.trim(),
                limiting_correct:
                    sameLimiting(answer, trueVals.true_limiting),
            });
        },

        proceed: (resulting_nh3: () => StudentResultObject | [number, number, number, string]) => {
            runCounter++;
            // Default fallback inputs (used if student function throws)
            // Mb throw in an error next time
            let input_h2 = 0;
            let input_n2 = 0;
            let student_nh3 = 0;
            let student_limiting = "???";

            try {
                // Preferred flow: student code calls proceed(resulting_nh3),
                // then we invoke their function directly with no forced inputs.
                const result = resulting_nh3();

                if (Array.isArray(result) && result.length >= 4) {
                    // Backward-compatible support for legacy array return shape.
                    input_h2 = Number(result[0]) || 0;
                    input_n2 = Number(result[1]) || 0;
                    student_nh3 = Number(result[2]) || 0;
                    student_limiting = String(result[3]) || "???";
                } else if (result && typeof result === "object") {
                    // Current starter code returns an object with named fields.
                    const obj = result as StudentResultObject;
                    input_h2 = Number(obj.h2_reactant_amount) || 0;
                    input_n2 = Number(obj.n2_reactant_amount) || 0;
                    student_nh3 = Number(obj.nh3_product_made) || 0;
                    student_limiting = String(obj.limiting_reactant || "???");
                }
            } catch (error) {
                console.error("Error calling student function:", error);
                student_limiting = "Error";
            }

            // Compute the TRUE answer from the student's actual inputs
            const trueVals = computeTrueValues(input_n2, input_h2);

            // Check correctness (tolerance for floating point)
            const nh3_correct = Math.abs(student_nh3 - trueVals.true_nh3) < 0.01;
            const limiting_correct =
                student_limiting.toLowerCase() === trueVals.true_limiting.toLowerCase();

            sendMessage({
                run_id: runCounter,
                input_n2,
                input_h2,
                true_nh3: trueVals.true_nh3,
                true_limiting: trueVals.true_limiting,
                n2_consumed: trueVals.n2_consumed,
                h2_consumed: trueVals.h2_consumed,
                n2_remaining: trueVals.n2_remaining,
                h2_remaining: trueVals.h2_remaining,
                student_nh3,
                student_limiting,
                nh3_correct,
                limiting_correct,
            });
        },
    });
};

export default createExports;
