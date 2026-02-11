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

    const n2_consumed = true_nh3 / 2;
    const h2_consumed = true_nh3 * 3 / 2;
    const n2_remaining = n2 - n2_consumed;
    const h2_remaining = h2 - h2_consumed;

    return { true_nh3, true_limiting, n2_consumed, h2_consumed, n2_remaining, h2_remaining };
}

const createExports = (
    sendMessage: (message: FromRuntimeMessage) => void
) => {
    return Promise.resolve({
        proceed: async (resulting_nh3: any) => {
            const testN2 = 5;
            const testH2 = 10;

            // Compute the TRUE answer from stoichiometry
            const trueVals = computeTrueValues(testN2, testH2);

            // Call the student's function and extract their answer
            let student_nh3 = 0;
            let student_limiting = "???";
            try {
                let result;
                if (typeof resulting_nh3 === 'function') {
                    result = resulting_nh3(testN2, testH2);
                } else {
                    // Pyodide proxies may be callable but not typeof 'function'
                    result = resulting_nh3(testN2, testH2);
                }
                result = await Promise.resolve(result);

                // Handle array or tuple-like returns from Python
                if (Array.isArray(result) && result.length >= 4) {
                    student_nh3 = Number(result[2]) || 0;
                    student_limiting = String(result[3]) || "???";
                } else if (result && typeof result === 'object') {
                    if ('0' in result || '1' in result) {
                        student_nh3 = Number(result[2] ?? result['2'] ?? 0);
                        student_limiting = String(result[3] ?? result['3'] ?? "???");
                    }
                }
            } catch (error) {
                console.error("Error calling student function:", error);
                student_limiting = "Error";
            }

            // Check correctness
            const nh3_correct = Math.abs(student_nh3 - trueVals.true_nh3) < 0.01;
            const limiting_correct =
                student_limiting.toLowerCase() === trueVals.true_limiting.toLowerCase();

            sendMessage({
                input_n2: testN2,
                input_h2: testH2,
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
