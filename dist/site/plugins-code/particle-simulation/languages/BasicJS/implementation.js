const createExports = (sendMessage) => {
    return Promise.resolve({
        addParticles: (numParticles, temperature, color) => {
            const message = {
                numParticles,
                temperature,
                color,
            };
            console.log("addParticles called:", message);
            sendMessage(message);
        },
    });
};
export default createExports;
