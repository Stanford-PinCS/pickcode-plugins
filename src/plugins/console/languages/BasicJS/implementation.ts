import { FromRuntimeMessage } from "../../messages";

const createExports = (
  sendMessage: (message: FromRuntimeMessage) => void,
  onMessage: Function
) => {
  // Define input function to mimick getting a console input via messaging the plugin.
  function getInput(input: string) {
    const promise = new Promise<string>((res) => {
      const unsubscribe = onMessage((message: any) => {
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
    input: (inputMessage: string) => {
      return getInput(inputMessage);
    },
    // JavaScript version
    prompt: (inputMessage: string) => {
      return getInput(inputMessage);
    },
  });
};

export default createExports;
