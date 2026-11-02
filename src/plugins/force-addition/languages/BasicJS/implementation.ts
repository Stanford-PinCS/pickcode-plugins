import { DrawForceMessage } from "../../messages";

type ForceComponents = {
    x: number;
    y: number;
};

const isForce = (value: unknown): value is ForceComponents => {
    if (typeof value !== "object" || value === null) return false;
    const { x, y } = value as { x?: unknown; y?: unknown };
    return (
        typeof x === "number" &&
        Number.isFinite(x) &&
        typeof y === "number" &&
        Number.isFinite(y)
    );
};

const createExports = (sendMessage: (message: DrawForceMessage) => void) => {
    return Promise.resolve({
        drawForce: (force: ForceComponents, color: string) => {
            let forceArrow = { ...force, color };
            sendMessage({ forceToDraw: forceArrow });
        },

        /**
         * Draws every force in `forces`, then hands a copy of the list to the
         * student's `sumForces` and draws the net force it returns.
         */
        drawForces: (forces: unknown, sumForces: unknown) => {
            if (!Array.isArray(forces)) {
                throw new Error(
                    "forces should be a list, like [{x: 10, y: 10}, {x: -15, y: -5}]."
                );
            }
            const list = Array.from(forces as unknown[]);
            list.forEach((force, i) => {
                if (!isForce(force)) {
                    throw new Error(
                        `Force number ${i + 1} should look like {x: 10, y: 10}, with a number for x and for y.`
                    );
                }
            });
            if (typeof sumForces !== "function") {
                throw new Error("drawForces needs your sumForces function as its second input.");
            }

            for (const force of list as ForceComponents[]) {
                sendMessage({
                    forceToDraw: { x: force.x, y: force.y, color: "force", role: "force" },
                });
            }

            const copy = (list as ForceComponents[]).map((f) => ({ x: f.x, y: f.y }));
            const net: unknown = sumForces(copy);
            if (!isForce(net)) {
                throw new Error(
                    "sumForces should return the net force as {x: ..., y: ...}, with a number for x and for y."
                );
            }
            sendMessage({
                forceToDraw: { x: net.x, y: net.y, color: "net", role: "net" },
            });
        },
    });
};

export default createExports;
