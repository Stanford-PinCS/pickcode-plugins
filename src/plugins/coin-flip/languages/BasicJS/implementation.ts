import { Message } from "../../messages";

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        plotLine: (points: any) => {
            sendMessage({ type: "plotLine", points: Array.from(points) });
        },

        showTarget: (value: number) => {
            sendMessage({ type: "showTarget", value });
        },
    });
};

export default createExports;
