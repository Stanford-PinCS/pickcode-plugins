const createExports = (sendMessage) => {
    return Promise.resolve({
        drawLine: (line) => sendMessage(line), //sendMessage will send the userwritten function to state.ts
        // Simple functions that shift existing lines
        addSupply: (amount) => {
            // Shift supply curve (line 0) to the right
            sendMessage({ type: "shift", lineIndex: 0, amount: amount });
        },
        addDemand: (amount) => {
            // Shift demand curve (line 1) to the right
            sendMessage({ type: "shift", lineIndex: 1, amount: amount });
        },
        addDrought: (severity) => {
            // Shift supply curve (line 0) to the left (negative amount)
            sendMessage({
                type: "shift",
                lineIndex: 0,
                amount: -severity * 10,
            });
        },
        // Generic shift function for any line
        shiftLine: (lineIndex, amount) => {
            sendMessage({ type: "shift", lineIndex, amount });
        },
        setPrice: (price) => {
            sendMessage({ price: price - 1 }); //sets the coordinate system to have the origin be at (-1, -1)
        },
        setQuantity: (quantity) => {
            sendMessage({ quantity: quantity - 1 }); //sets the coordinate system to have the origin be at (-1, -1)
        },
        draw: () => {
            sendMessage({ type: "draw" });
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
