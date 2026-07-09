const createExports = (sendMessage
// onMessage: (onMessage: (message: ToRuntimeMessage) => void) => () => void
) => {
    return Promise.resolve({
        setValue: (value) => sendMessage({ setValue: value }),
    });
};
export default createExports;
