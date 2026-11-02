import { Message } from "../../messages";

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        /**
         * Draws one bar per face. `totalRolls` is optional; when given, the
         * chart replays exactly that many rolls instead of guessing the count
         * from the percentages.
         */
        showBars: (
            percentages: ArrayLike<number> | Iterable<number>,
            totalRolls?: number
        ) => {
            sendMessage({
                type: "showBars",
                percentages: Array.from(percentages),
                ...(typeof totalRolls === "number" && totalRolls > 0
                    ? { totalRolls }
                    : {}),
            });
        },

        showTarget: (value: number) => {
            sendMessage({ type: "showTarget", value });
        },
    });
};

export default createExports;
