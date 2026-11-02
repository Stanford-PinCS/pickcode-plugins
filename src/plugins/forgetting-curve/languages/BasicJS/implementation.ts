import { Message } from "../../messages";

/** Student code may hand us a list (or a Python list proxy) of numbers. */
function toNumbers(input: unknown, message: string): number[] {
    if (
        input == null ||
        typeof input === "string" ||
        typeof (input as Iterable<unknown>)[Symbol.iterator] !== "function"
    ) {
        throw new Error(message);
    }
    return Array.from(input as Iterable<unknown>, (v) => {
        if (typeof v !== "number" || !Number.isFinite(v)) throw new Error(message);
        return v;
    });
}

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        /**
         * Draws a forgetting curve. `days` and `retentions` are matching lists
         * (retention from 0 to 1 at each day), `studyDays` lists the review
         * days, and `threshold` (0 to 1) is where the dashed "remembered"
         * line goes.
         */
        showMemory: (days: unknown, retentions: unknown, studyDays: unknown, threshold: unknown) => {
            const dayList = toNumbers(days, "showMemory expects a list of days as its first input.");
            const values = toNumbers(
                retentions,
                "showMemory expects a list of retention values from 0 to 1 as its second input."
            );
            const reviews = toNumbers(studyDays, "showMemory expects a list of review days as its third input.");
            if (dayList.length < 2 || dayList.length !== values.length) {
                throw new Error("showMemory needs the same number of days and retention values, at least 2 of each.");
            }
            if (values.some((v) => v < 0 || v > 1)) {
                throw new Error("Every retention value should be from 0 to 1.");
            }
            if (typeof threshold !== "number" || !(threshold > 0 && threshold < 1)) {
                throw new Error("showMemory expects a threshold between 0 and 1, like 0.5.");
            }
            sendMessage({ type: "showMemory", days: dayList, retentions: values, studyDays: reviews, threshold });
        },
    });
};

export default createExports;
