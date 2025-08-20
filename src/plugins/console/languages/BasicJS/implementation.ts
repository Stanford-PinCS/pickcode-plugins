import { FromRuntimeMessage } from "../../messages";

const createExports = (
  sendMessage: (message: FromRuntimeMessage) => void,
  onMessage: Function
) => {
  // define funcionts for I/O messaging
  function sendOutput(output: string) {
    sendMessage({ output });
  }
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
    print: (output: string) => {
      sendOutput(output);
    },
    input: (inputMessage: string) => {
      return getInput(inputMessage);
    },
    // JavaScript version
    console: {
      log: (output: string) => {
        sendOutput(output);
      },
    },
    prompt: (inputMessage: string) => {
      return getInput(inputMessage);
    },
  });
};

export default createExports;
