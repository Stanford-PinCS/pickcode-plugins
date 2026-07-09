const createExports = (sendMessage) => {
    return Promise.resolve({
        xmin: 0,
        xmax: 4,
        drawCurve: () => sendMessage({ type: "drawCurve" }),
        setColor: (color) => sendMessage({ type: "setColor", color }),
        drawRect: (x, width, height) => sendMessage({ type: "drawRect", x, width, height }),
        showArea: (area) => sendMessage({ type: "showArea", area }),
    });
};
export default createExports;
