import { FromRuntimeMessage } from "../../messages";

const createExports = (sendMessage: (message: FromRuntimeMessage) => void) => {
  return Promise.resolve({
    drawLine: (x1: number, y1: number, x2: number, y2: number, id?: string) => {
      sendMessage({ drawLine: { x1, y1, x2, y2, id } });
    },
    drawPoint: (x: number, y: number, id?: string) => {
      sendMessage({ drawPoint: { x, y, id } });
    },
    drawCircle: (
      x: number,
      y: number,
      radius: number,
      filled?: boolean,
      id?: string
    ) => {
      sendMessage({ drawCircle: { x, y, radius, filled, id } });
    },
    drawVector: (x: number, y: number, id?: string) => {
      sendMessage({ drawVector: { x, y, id } });
    },
    drawText: (text: string, x: number, y: number, id?: string) => {
      sendMessage({ drawText: { text, x, y, id } });
    },
    drawRectangle: (
      x: number,
      y: number,
      w: number,
      h: number,
      filled: boolean,
      id?: string
    ) => {
      sendMessage({ drawRectangle: { x, y, w, h, filled, id } });
    },
    drawTriangle: (
      x: number,
      y: number,
      sideLength: number,
      filled?: boolean,
      id?: string
    ) => {
      sendMessage({ drawTriangle: { x, y, sideLength, filled, id } });
    },
    // The following commands allow the user to move certain drawables.
    moveBy: (id: string, xChange: number, yChange: number) => {
      sendMessage({ moveBy: { id, xChange, yChange } });
    },
    moveTo: (id: string, x: number, y: number) => {
      sendMessage({ moveTo: { id, x, y } });
    },
    // The following allows the user to delete certain drawables.
    delete: (id: string) => {
      sendMessage({ delete: { id } });
    },
    // The following are basic commands that apply to the canvas settings.
    setColor: (color: string) => {
      sendMessage({ setColor: { color } });
    },
    clear: () => {
      sendMessage({ clear: true });
    },
    resize: (minSize: number) => {
      sendMessage({ minSize });
    },
    showGrid: (gridSize?: number, tickSize?: number) => {
      sendMessage({ grid: { on: true, gridSize, tickSize } });
    },
    hideGrid: () => {
      sendMessage({ grid: { on: false } });
    },
  });
};

export default createExports;
