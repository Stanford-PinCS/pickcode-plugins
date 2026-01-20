import { FromRuntimeMessage } from "../../messages";

const createExports = (
    sendMessage: (message: FromRuntimeMessage) => void
    // onMessage: (onMessage: (message: ToRuntimeMessage) => void) => () => void
) => {
    return Promise.resolve({
        proceed: (resulting_nh3: (n2: number, h2: number) => [number, number, number, string]) => {
            try {
                // Test with some example inputs
                const testN2 = 5;
                const testH2 = 10;
                
                const [nh3_made, n2_left, h2_left, limiting] = resulting_nh3(testN2, testH2);
                
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
