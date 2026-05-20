const createExports = (sendMessage) =>
    Promise.resolve({
        showBars: (percentages) => {
            sendMessage({
                type: "showBars",
                percentages: Array.from(percentages),
            });
        },

        showTarget: (value) => {
            sendMessage({ type: "showTarget", value });
        },
    });

export default createExports;
