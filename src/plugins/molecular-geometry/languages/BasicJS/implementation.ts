import { Message } from "../../messages";

function toWholeNumber(value: unknown, name: string, min: number, max: number): number {
    const n = Number(value);
    if (typeof value === "boolean" || !Number.isInteger(n) || n < min || n > max) {
        throw new Error(`${name} should be a whole number from ${min} to ${max}.`);
    }
    return n;
}

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        /**
         * Draws a central atom with its electron domains, lets the domains
         * push apart into their VSEPR positions, and labels the result with
         * the shape name the student's code chose.
         *
         * @param bondingPairs - Bonded atoms around the central atom (2-6)
         * @param lonePairs    - Lone pairs on the central atom (0-4)
         * @param shape        - The shape name the student's getShape returned
         */
        showMolecule: (bondingPairs: unknown, lonePairs: unknown, shape: unknown) => {
            const bp = toWholeNumber(bondingPairs, "bondingPairs", 2, 6);
            const lp = toWholeNumber(lonePairs, "lonePairs", 0, 4);
            if (bp + lp > 6) {
                throw new Error(
                    "bondingPairs + lonePairs should be 6 or less. A central atom with more than 6 electron domains is very rare."
                );
            }
            if (typeof shape !== "string") {
                throw new Error(
                    `showMolecule expects the shape as text in quotes, like "linear", but got ${String(shape)}.`
                );
            }
            sendMessage({ type: "showMolecule", bondingPairs: bp, lonePairs: lp, shape });
        },
    });
};

export default createExports;
