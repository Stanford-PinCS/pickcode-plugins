const createExports = (sendMessage) => {
    return Promise.resolve({
        loadDialogue: (scenes) => {
            sendMessage({ scenes });
        },
    });
};
export default createExports;
