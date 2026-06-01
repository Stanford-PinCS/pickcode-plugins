import { Message } from "../../messages";

const createExports = (sendMessage: (message: Message) => void) => {
    let particleIdCounter = 0;

    return Promise.resolve({
        /**
         * Places a charged particle in the electric field simulation.
         *
         * @param x - Horizontal position, 0.0 (left) to 1.0 (right)
         * @param y - Vertical position, 0.0 (top) to 1.0 (bottom)
         * @param q - Charge value. Positive values (e.g. +1) = red cation,
         *            negative values (e.g. -1) = blue anion. Magnitude scales the field strength.
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