import { Message } from "../../messages";

/** Number of subshells the diagram knows (1s through 7p). */
const SUBSHELL_COUNT = 19;

function toWholeNumber(value: unknown, message: string): number {
    const n = Number(value);
    if (typeof value === "boolean" || !Number.isInteger(n)) {
        throw new Error(message);
    }
    return n;
}

/** Student code may hand us a list (or Python list proxy) of [subshell, count] pairs. */
function toPlacements(input: unknown): { subshell: number; count: number }[] {
    const error =
        "showAtom expects a list of [subshell, count] pairs, like [[0, 2], [1, 2]].";
    if (
        input == null ||
        typeof (input as Iterable<unknown>)[Symbol.iterator] !== "function"
    ) {
        throw new Error(error);
    }
    return Array.from(input as Iterable<unknown>, (pair) => {
        if (
            pair == null ||
            typeof (pair as Iterable<unknown>)[Symbol.iterator] !== "function"
        ) {
            throw new Error(error);
        }
        const [subshell, count] = Array.from(pair as Iterable<unknown>);
        const s = toWholeNumber(subshell, error);
        const c = toWholeNumber(count, error);
        if (s < 0 || s >= SUBSHELL_COUNT) {
            throw new Error(
                `showAtom: subshell ${s} doesn't exist. Use 0 (1s) up to ${SUBSHELL_COUNT - 1} (7p).`
            );
        }
        if (c < 0) {
            throw new Error("showAtom: a subshell can't hold a negative number of electrons.");
        }
        return { subshell: s, count: c };
    });
}

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        /**
         * Draws the orbital diagram for an atom, filling it electron by
         * electron in the order the placements list gives.
         *
         * @param atomicNumber - Number of electrons in the neutral atom (1-118)
         * @param placements   - [subshell, count] pairs, one per loop pass
         */
        showAtom: (atomicNumber: unknown, placements: unknown) => {
            const z = toWholeNumber(
                atomicNumber,
                "atomicNumber should be a whole number from 1 to 118, like 6 for carbon."
            );
            if (z < 1 || z > 118) {
                throw new Error(
                    "atomicNumber should be a whole number from 1 to 118, like 6 for carbon."
                );
            }
            sendMessage({
                type: "showAtom",
                atomicNumber: z,
                placements: toPlacements(placements),
            });
        },
    });
};

export default createExports;
