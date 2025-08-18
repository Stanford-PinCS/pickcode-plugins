import { FromRuntimeMessage } from "../../messages";

const createExports = (sendMessage: (message: FromRuntimeMessage) => void) => {
    return Promise.resolve({
        drawLine: (x1: number, y1: number, x2: number, y2: number) => {
            sendMessage({ drawLine: { x1, y1, x2, y2 } });
        },
        drawPoint: (x: number, y: number) => {
            sendMessage({ drawPoint: { x, y } });
        },
        drawCircle: (x: number, y: number, radius: number) => {
            sendMessage({ drawCircle: { x, y, radius } });
        },
        setColor: (color: string) => {
            sendMessage({ setColor: { color } });
        },
        drawVector: (x1: number, y1: number) => {
            sendMessage({ drawVector: { x1, y1 } });
        },
        drawText: (text: string, x: number, y: number) => {
            sendMessage({ drawText: { text, x, y } });
        },
    });
};

export default createExports;
