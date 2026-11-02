import { Message } from "../../messages";

function toNumber(value: unknown, message: string): number {
    const n = Number(value);
    if (typeof value === "boolean" || value === null || !Number.isFinite(n)) {
        throw new Error(message);
    }
    return n;
}

/** Student code may hand us a list (or Python list proxy) of numbers. */
function toNumbers(input: unknown, name: string): number[] {
    if (
        input == null ||
        typeof input === "string" ||
        typeof (input as Iterable<unknown>)[Symbol.iterator] !== "function"
    ) {
        throw new Error(`showPiston expects ${name} to be a list of numbers.`);
    }
    return Array.from(input as Iterable<unknown>, (v, i) =>
        toNumber(v, `showPiston: item ${i} of ${name} is not a number.`)
    );
}

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        /**
         * Animates a piston squeezing a gas through a list of volumes, with a
         * pressure gauge and a P vs. V graph of the given pressures.
         *
         * @param moles     - Amount of gas, n (mol), above 0 and at most 5
         * @param celsius   - Temperature in °C, above -273.15
         * @param volumes   - Volumes in L, one per step (at least 2)
         * @param pressures - Pressure in atm at each volume
         */
        showPiston: (
            moles: unknown,
            celsius: unknown,
            volumes: unknown,
            pressures: unknown
        ) => {
            const n = toNumber(moles, "moles should be a number, like 1.");
            if (n <= 0 || n > 5) {
                throw new Error("moles should be more than 0 and at most 5, like 1.");
            }
            const c = toNumber(celsius, "celsius should be a number, like 25.");
            if (c <= -273.15 || c > 1000) {
                throw new Error(
                    "celsius should be above -273.15 (absolute zero) and at most 1000."
                );
            }
            const v = toNumbers(volumes, "volumes");
            const p = toNumbers(pressures, "pressures");
            if (v.length < 2 || v.length !== p.length) {
                throw new Error(
                    "showPiston needs at least 2 volumes and one pressure for each volume."
                );
            }
            if (v.some((x) => x <= 0)) {
                throw new Error("showPiston: every volume should be more than 0 L.");
            }
            if (p.some((x) => x < 0)) {
                throw new Error("showPiston: a pressure can't be negative.");
            }
            sendMessage({ type: "showPiston", moles: n, celsius: c, volumes: v, pressures: p });
        },
    });
};

export default createExports;
