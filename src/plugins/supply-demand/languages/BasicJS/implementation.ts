import {
    Line,
    ShiftCommand,
    Helper,
    Price,
    Quantity,
    Shift,
    Point,
    DrawCommand,
} from "../../messages";

const createExports = (
    sendMessage: (
        message:
            | Line
            | ShiftCommand
            | Helper
            | Price
            | Quantity
            | Shift
            | Point
            | DrawCommand
    ) => void
) => {
    return Promise.resolve({
        drawLine: (line: Line) => sendMessage(line), //sendMessage will send the userwritten function to state.ts

        // Simple functions that shift existing lines
        addSupply: (amount: number) => {
            // Shift supply curve (line 0) to the right
            sendMessage({ type: "shift", lineIndex: 0, amount: amount });
        },

        addDemand: (amount: number) => {
            // Shift demand curve (line 1) to the right
            sendMessage({ type: "shift", lineIndex: 1, amount: amount });
        },

        addDrought: (severity: number) => {
            // Shift supply curve (line 0) to the left (negative amount)
            sendMessage({
                type: "shift",
                lineIndex: 0,
                amount: -severity * 10,
            });
        },

        // Generic shift function for any line
        shiftLine: (lineIndex: number, amount: number) => {
            sendMessage({ type: "shift", lineIndex, amount });
        },

        setPrice: (price: number) => {
            sendMessage({ price: price - 1 }); //sets the coordinate system to have the origin be at (-1, -1)
        },
        setQuantity: (quantity: number) => {
            sendMessage({ quantity: quantity - 1 }); //sets the coordinate system to have the origin be at (-1, -1)
        },

        draw: () => {
            sendMessage({ type: "draw" });
        },

        /**
         * Draws the whole market in one call: shifts the supply and demand
         * curves, marks the student's guess, and shows the equilibrium.
         *
         * @param supplyShift   - How far to move supply (positive = right)
         * @param demandShift   - How far to move demand (positive = right)
         * @param guessPrice    - Price of the point to mark (0 to 2)
         * @param guessQuantity - Quantity of the point to mark (0 to 2)
         *
         * @example
         * showMarket(0, 0.4, 1.2, 1.2);
         */
        showMarket: (
            supplyShift: unknown,
            demandShift: unknown,
            guessPrice: unknown,
            guessQuantity: unknown
        ) => {
            const shifts = { supplyShift, demandShift };
            for (const [name, value] of Object.entries(shifts)) {
                if (typeof value !== "number" || !Number.isFinite(value)) {
                    throw new Error(`${name} must be a number, like 0 or 0.4.`);
                }
                if (Math.abs(value) > 1) {
                    throw new Error(`${name} must be between -1 and 1 so the curve stays on the graph.`);
                }
            }
            const guess = { guessPrice, guessQuantity };
            for (const [name, value] of Object.entries(guess)) {
                if (typeof value !== "number" || !Number.isFinite(value)) {
                    throw new Error(`${name} must be a number, like 1 or 1.25.`);
                }
                if (value < 0 || value > 2) {
                    throw new Error(`${name} must be between 0 and 2 so it fits on the graph.`);
                }
            }

            if (supplyShift !== 0) {
                sendMessage({ type: "shift", lineIndex: 0, amount: supplyShift as number });
            }
            if (demandShift !== 0) {
                sendMessage({ type: "shift", lineIndex: 1, amount: demandShift as number });
            }
            // The graph's origin sits at (-1, -1), as in setPrice / setQuantity.
            sendMessage({ price: (guessPrice as number) - 1 });
            sendMessage({ quantity: (guessQuantity as number) - 1 });
            sendMessage({ type: "draw" });
            sendMessage({ equilibrium: { x: 0, y: 0 } });
        },

        // Show equilibrium point and helper lines
        showEquilibrium: () => {
            // Calculate equilibrium point (this will be done in the component)
            // For now, send a placeholder helper message
            sendMessage({
                equilibrium: { x: 0, y: 0 }, // Will be calculated in component
                price: 0,
                quantity: 0,
            }); // Will be calculated in component
        },
    });
};

export default createExports;

//when the user types function such as addPlanet, it outlines how that code will be implemented
