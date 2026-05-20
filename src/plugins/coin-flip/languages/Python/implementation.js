const createExports = (sendMessage) =>
    Promise.resolve({
        plotLine: (points) => {
            sendMessage({ type: "plotLine", points: Array.from(points) });
        },

        showTarget: (value) => {
            sendMessage({ type: "showTarget", value });
        },
    });

export default createExports;
