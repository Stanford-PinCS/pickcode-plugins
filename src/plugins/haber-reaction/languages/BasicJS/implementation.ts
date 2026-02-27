import { FromRuntimeMessage } from "../../messages";

/**
 * Compute the true stoichiometric result for the Haber process:
 *   N₂ + 3H₂ → 2NH₃
 */
function computeTrueValues(n2: number, h2: number) {
    const nh3_from_n2 = n2 * 2;        // max NH₃ if only N₂ limits
    const nh3_from_h2 = h2 * (2 / 3);  // max NH₃ if only H₂ limits

    const true_nh3 = Math.min(nh3_from_n2, nh3_from_h2);

    let true_limiting: string;
    if (nh3_from_n2 < nh3_from_h2) {
        true_limiting = "n2";
    } else if (nh3_from_h2 < nh3_from_n2) {
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

type StudentResultObject = {
    h2_reactant_amount?: number;
    n2_reactant_amount?: number;
    nh3_product_made?: number;
    limiting_reactant?: string;
};

const createExports = (
    sendMessage: (message: FromRuntimeMessage) => void
) => {
    return Promise.resolve({
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
