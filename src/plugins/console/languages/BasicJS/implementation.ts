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
      sendMessage({ input: inputMessage });
      return new Promise<string>((res) => {
        const unsubscribe = onMessage((message: any) => {
          res(message.text);
          unsubscribe();
        });
      });
    },
  });
};

export default createExports;
