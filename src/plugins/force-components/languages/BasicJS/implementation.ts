import { FromRuntimeMessage } from "../../messages";

const isNumber = (v: unknown): v is number =>
    typeof v === "number" && Number.isFinite(v);

const createExports = (
    sendMessage: (message: FromRuntimeMessage) => void
) => {
    return Promise.resolve({
        drawVector: (magnitude: number, angle: number) => {
            sendMessage({ drawVector: { magnitude, angle } });
        },
        drawComponents: (xComponent: number, yComponent: number) => {
            sendMessage({ drawComponents: { xComponent, yComponent } });
        },

        /**
         * Draws the force, then calls the student's getComponents(magnitude,
         * angle) and draws the [xComponent, yComponent] it returns.
         */
        drawForceComponents: (
            magnitude: unknown,
            angle: unknown,
            getComponents: unknown
        ) => {
            if (!isNumber(magnitude)) {
                throw new Error("magnitude should be a number, like 100.");
            }
            if (!isNumber(angle)) {
                throw new Error("angle should be a number of degrees, like 35.");
            }
            if (typeof getComponents !== "function") {
                throw new Error(
                    "drawForceComponents needs your getComponents function as its third input."
                );
            }
            sendMessage({ drawVector: { magnitude, angle } });

            const result: unknown = getComponents(magnitude, angle);
            const parts =
                result !== null && typeof result === "object" && Symbol.iterator in result
                    ? Array.from(result as Iterable<unknown>)
                    : null;
            if (!parts || parts.length !== 2 || !isNumber(parts[0]) || !isNumber(parts[1])) {
                throw new Error(
                    "getComponents should return two numbers: [xComponent, yComponent]."
                );
            }
            sendMessage({
                drawComponents: { xComponent: parts[0], yComponent: parts[1] },
            });
        },
    });
};

export default createExports;
