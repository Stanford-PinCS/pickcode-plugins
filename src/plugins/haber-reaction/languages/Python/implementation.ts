import { FromRuntimeMessage } from "../../messages";

const createExports = (
    sendMessage: (message: FromRuntimeMessage) => void
    // onMessage: (onMessage: (message: ToRuntimeMessage) => void) => () => void
) => {
    return Promise.resolve({
        proceed: async (resulting_nh3: any) => {
            try {
                // Test with some example inputs
                const testN2 = 5;
                const testH2 = 10;
                
                console.log("proceed called with:", resulting_nh3);
                console.log("Type:", typeof resulting_nh3);
                console.log("Is function:", typeof resulting_nh3 === 'function');
                console.log("Has call:", resulting_nh3 && typeof resulting_nh3.call === 'function');
                console.log("Has apply:", resulting_nh3 && typeof resulting_nh3.apply === 'function');
                
                // Call the function - Python functions come through as callable proxies
                // Pyodide converts Python functions to JavaScript functions automatically
                let result;
                try {
                    if (typeof resulting_nh3 === 'function') {
                        result = resulting_nh3(testN2, testH2);
                    } else {
                        // Try calling it anyway - Pyodide proxies are often callable
                        result = resulting_nh3(testN2, testH2);
                    }
                } catch (callError) {
                    console.error("Error calling function:", callError);
                    throw callError;
                }
                
                // Await in case it's a promise
                result = await Promise.resolve(result);
                
                console.log("Result from resulting_nh3:", result, "Type:", typeof result, "IsArray:", Array.isArray(result));
                
                // Handle both array and tuple-like returns from Python
                let nh3_made: number, n2_left: number, h2_left: number, limiting: string;
                
                if (Array.isArray(result)) {
                    [nh3_made, n2_left, h2_left, limiting] = result;
                } else if (result && typeof result === 'object') {
                    // Handle tuple-like object from Python (might be a Map or object with numeric keys)
                    // Try to access as array first
                    if ('0' in result || '1' in result) {
                        nh3_made = Number(result[0] ?? result['0'] ?? 0);
                        n2_left = Number(result[1] ?? result['1'] ?? 0);
                        h2_left = Number(result[2] ?? result['2'] ?? 0);
                        limiting = String(result[3] ?? result['3'] ?? "");
                    } else {
                        // Try named properties
                        nh3_made = Number(result.nh3_made ?? result.nh3Made ?? 0);
                        n2_left = Number(result.n2_left ?? result.n2Left ?? 0);
                        h2_left = Number(result.h2_left ?? result.h2Left ?? 0);
                        limiting = String(result.limiting ?? "");
                    }
                } else {
                    // Fallback
                    console.warn("Unexpected result type:", result);
                    nh3_made = 0;
                    n2_left = testN2;
                    h2_left = testH2;
                    limiting = "Error";
                }
                
                console.log("Sending message:", { nh3_made, n2_left, h2_left, limiting });
                
                sendMessage({
                    nh3_made,
                    n2_left,
                    h2_left,
                    limiting,
                });
            } catch (error) {
                console.error("Error in proceed:", error);
                sendMessage({
                    nh3_made: 0,
                    n2_left: 0,
                    h2_left: 0,
                    limiting: "Error",
                });
            }
        },
    });
};

export default createExports;
