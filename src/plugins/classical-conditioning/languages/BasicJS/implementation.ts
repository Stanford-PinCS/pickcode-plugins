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
        const n = typeof v === "boolean" ? (v ? 1 : 0) : Number(v);
        if (typeof v === "string" || !Number.isFinite(n)) throw new Error(message);
        return n;
    });
}

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        /**
         * Draws the conditioning trials. `foodPresent` has a 1 for each trial
         * where food followed the bell and a 0 for a bell-only trial;
         * `strengths` is the bell-food strength (0 to 100) after each trial.
         */
        showTrials: (foodPresent: unknown, strengths: unknown) => {
            const food = toNumbers(
                foodPresent,
                "showTrials expects a list of 1s and 0s, one per trial (1 means food came after the bell)."
            ).map((f) => (f ? 1 : 0));
            const values = toNumbers(
                strengths,
                "showTrials expects a list of strengths, one number per trial."
            );
            if (food.length === 0 || food.length !== values.length) {
                throw new Error(
                    "showTrials needs the same number of food entries and strengths, and at least one trial."
                );
            }
            if (values.some((v) => v < 0 || v > 100)) {
                throw new Error("Every strength should be between 0 and 100.");
            }
            sendMessage({ type: "showTrials", foodPresent: food, strengths: values });
        },
    });
};

export default createExports;
