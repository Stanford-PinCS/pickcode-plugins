const createExports = (sendMessage) => {
    return Promise.resolve({
        drawVector: (magnitude, angle) => {
            sendMessage({ drawVector: { magnitude, angle } });
        },
        drawComponents: (xComponent, yComponent) => {
            sendMessage({ drawComponents: { xComponent, yComponent } });
        },
    });
};
export default createExports;
