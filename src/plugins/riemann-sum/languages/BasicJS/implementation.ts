import { Message } from "../../messages";

const createExports = (sendMessage: (message: Message) => void) => {
    return Promise.resolve({
        xmin: 0,
        xmax: 4,

        drawCurve: () => sendMessage({ type: "drawCurve" }),

        setColor: (color: string) => sendMessage({ type: "setColor", color }),

        drawRect: (x: number, width: number, height: number) =>
            sendMessage({ type: "drawRect", x, width, height }),

        showArea: (area: number) => sendMessage({ type: "showArea", area }),
    });
};

export default createExports;
