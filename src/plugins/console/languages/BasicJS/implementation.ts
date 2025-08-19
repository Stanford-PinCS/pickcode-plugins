import { FromRuntimeMessage } from "../../messages";

const createExports = (
  sendMessage: (message: FromRuntimeMessage) => void,
  onMessage: Function
) => {
  return Promise.resolve({
    writeOutput: (output: string) => {
      sendMessage({ output });
    },
    getInput: async (inputMessage: string) => {
      const promise = new Promise<string>((res) => {
        const unsubscribe = onMessage((message: any) => {
          res(message.input);
          unsubscribe();
        });
      });
      sendMessage({ input: inputMessage });
      return promise;
    },
  });
};

export default createExports;
