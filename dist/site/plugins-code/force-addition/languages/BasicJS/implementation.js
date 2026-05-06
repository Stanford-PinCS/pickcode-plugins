const createExports = (sendMessage) => {
    return Promise.resolve({
        drawForce: (force, color) => {
            let forceArrow = { ...force, color };
            sendMessage({ forceToDraw: forceArrow });
        },
    });
};
export default createExports;
