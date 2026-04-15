const createExports = (sendMessage, onMessage) => {
    // Define input function to mimick getting a console input via messaging the plugin.
    function getInput(input) {
        const promise = new Promise((res) => {
            const unsubscribe = onMessage((message) => {
                res(message.input);
                unsubscribe();
            });
        });
        sendMessage({ input });
        return promise;
    }
    // Return user functions.
    return Promise.resolve({
        // Python version
        input: (inputMessage) => {
            return getInput(inputMessage);
        },
        // JavaScript version
        prompt: (inputMessage) => {
            return getInput(inputMessage);
        },
    });
};
export default createExports;
