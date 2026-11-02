import { Planet } from "../../messages";

const createExports = (sendMessage: (message: Planet) => void) => {
    return Promise.resolve({
        addPlanet: (planet: Planet) => sendMessage(planet),

        /**
         * Puts one planet in orbit at each radius in `planetRadii`, named
         * "Planet 1", "Planet 2", ... in list order. `orbitSpeed(radius)` is the
         * student's function: it returns how fast that planet goes around.
         */
        buildSolarSystem: (planetRadii: unknown, orbitSpeed: unknown) => {
            const radii =
                planetRadii != null && typeof planetRadii === "object"
                    ? Array.from(planetRadii as ArrayLike<unknown>)
                    : [];
            if (radii.length === 0) {
                throw new Error(
                    "buildSolarSystem expects a list of radii, like [500, 1000, 1500]."
                );
            }
            if (typeof orbitSpeed !== "function") {
                throw new Error(
                    "buildSolarSystem expects your orbitSpeed function as its second input."
                );
            }
            radii.forEach((radius, i) => {
                if (typeof radius !== "number" || !isFinite(radius)) {
                    throw new Error(
                        `Every radius in planetRadii must be a number. Item ${i + 1} is ${String(radius)}.`
                    );
                }
                const speed = (orbitSpeed as (r: number) => unknown)(radius);
                if (typeof speed !== "number" || !isFinite(speed)) {
                    throw new Error(
                        `orbitSpeed(${radius}) should return a number, but it returned ${String(speed)}.`
                    );
                }
                sendMessage({
                    name: `Planet ${i + 1}`,
                    radius,
                    speed,
                    // Empty: the pane colors planets by their place in the list.
                    color: "",
                    size: 100,
                });
            });
        },
    });
};

export default createExports;
