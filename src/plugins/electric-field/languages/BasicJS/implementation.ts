import { Message } from "../../messages";

type ChargeSpec = { x: number; y: number; charge: number };

const isNumber = (v: unknown): v is number =>
    typeof v === "number" && Number.isFinite(v);

const createExports = (sendMessage: (message: Message) => void) => {
    let particleIdCounter = 0;

    return Promise.resolve({
        /**
         * Places every charge in a list, like
         * [{x: 0.35, y: 0.5, charge: 1}, {x: 0.65, y: 0.5, charge: -1}].
         * Checks the whole list first, so a mistake places nothing.
         */
        placeCharges: (charges: unknown) => {
            if (!Array.isArray(charges)) {
                throw new Error(
                    "charges should be a list, like [{x: 0.5, y: 0.5, charge: 1}]."
                );
            }
            const list = Array.from(charges as unknown[]);
            const checked: ChargeSpec[] = list.map((item, i) => {
                const n = i + 1;
                if (typeof item !== "object" || item === null) {
                    throw new Error(
                        `Charge number ${n} should look like {x: 0.5, y: 0.5, charge: 1}.`
                    );
                }
                const { x, y, charge } = item as { x?: unknown; y?: unknown; charge?: unknown };
                if (!isNumber(x) || x < 0 || x > 1) {
                    throw new Error(`Charge number ${n} needs an x between 0 and 1.`);
                }
                if (!isNumber(y) || y < 0 || y > 1) {
                    throw new Error(`Charge number ${n} needs a y between 0 and 1.`);
                }
                if (!isNumber(charge) || charge === 0) {
                    throw new Error(
                        `Charge number ${n} needs a charge that isn't 0, like 1 or -1.`
                    );
                }
                return { x, y, charge };
            });
            for (const c of checked) {
                sendMessage({
                    type: "addParticle",
                    id: particleIdCounter++,
                    x: c.x,
                    y: c.y,
                    q: c.charge,
                });
            }
        },

        /**
         * Places a charged particle in the electric field simulation.
         *
         * @param x - Horizontal position, 0.0 (left) to 1.0 (right)
         * @param y - Vertical position, 0.0 (top) to 1.0 (bottom)
         * @param q - Charge value. Positive values (e.g. +1) draw pink,
         *            negative values (e.g. -1) draw teal. Magnitude scales the field strength.
         *
         * @example
         * // Two opposite charges side by side (electric dipole)
         * createParticle(0.35, 0.5, +1);
         * createParticle(0.65, 0.5, -1);
         *
         * @example
         * // Four charges at the corners of a square
         * createParticle(0.3, 0.3, +2);
         * createParticle(0.7, 0.3, -2);
         * createParticle(0.3, 0.7, -2);
         * createParticle(0.7, 0.7, +2);
         */
        createParticle: (x: number, y: number, q: number) => {
            if (x < 0 || x > 1) throw new Error("x must be between 0 and 1");
            if (y < 0 || y > 1) throw new Error("y must be between 0 and 1");
            if (q === 0) throw new Error("charge q must be non-zero");

            sendMessage({
                type: "addParticle",
                id: particleIdCounter++,
                x,
                y,
                q,
            });
        },

        /**
         * Removes all particles from the simulation, clearing the field.
         *
         * @example
         * clearParticles();
         */
        clearParticles: () => {
            sendMessage({ type: "clearParticles" });
        },

        /**
         * Resets the entire simulation to its initial blank state.
         *
         * @example
         * reset();
         */
        reset: () => {
            sendMessage({ type: "reset" });
        },
    });
};

export default createExports;