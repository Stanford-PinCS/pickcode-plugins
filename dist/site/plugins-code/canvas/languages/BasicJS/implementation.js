const createExports = (sendMessage) => {
    return Promise.resolve({
        drawLine: (x1, y1, x2, y2, id) => {
            sendMessage({ drawLine: { x1, y1, x2, y2, id } });
        },
        drawPoint: (x, y, id) => {
            sendMessage({ drawPoint: { x, y, id } });
        },
        drawCircle: (x, y, radius, filled, id) => {
            sendMessage({ drawCircle: { x, y, radius, filled, id } });
        },
        drawVector: (x, y, id) => {
            sendMessage({ drawVector: { x, y, id } });
        },
        drawText: (text, x, y, id) => {
            sendMessage({ drawText: { text, x, y, id } });
        },
        drawRectangle: (x, y, w, h, filled, id) => {
            sendMessage({ drawRectangle: { x, y, w, h, filled, id } });
        },
        drawTriangle: (x, y, sideLength, filled, id) => {
            sendMessage({ drawTriangle: { x, y, sideLength, filled, id } });
        },
        // The following commands allow the user to move certain drawables.
        moveBy: (id, xChange, yChange) => {
            sendMessage({ moveBy: { id, xChange, yChange } });
        },
        moveTo: (id, x, y) => {
            sendMessage({ moveTo: { id, x, y } });
        },
        // The following allows the user to delete certain drawables.
        deleteId: (id) => {
            sendMessage({ delete: { id } });
        },
        // The following are basic commands that apply to the canvas settings.
        setColor: (color) => {
            sendMessage({ setColor: { color } });
        },
        clear: () => {
            sendMessage({ clear: true });
        },
        resize: (minSize) => {
            sendMessage({ minSize });
        },
        showGrid: (gridSize, tickSize) => {
            sendMessage({ grid: { on: true, gridSize, tickSize } });
        },
        hideGrid: () => {
            sendMessage({ grid: { on: false } });
        },
    });
};
export default createExports;
