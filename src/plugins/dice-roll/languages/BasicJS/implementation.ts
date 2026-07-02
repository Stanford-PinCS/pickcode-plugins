import { Message } from "../../messages";

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        showBars: (percentages: any) => {
            sendMessage({
                type: "showBars",
                percentages: Array.from(percentages),
            });
        },

        showTarget: (value: number) => {
            sendMessage({ type: "showTarget", value });
        },
    });
};

export default createExports;
