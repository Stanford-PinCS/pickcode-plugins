export type FromRuntimeMessage = {
  drawLine?: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    id?: string;
  };
  drawPoint?: {
    x: number;
    y: number;
    id?: string;
  };
  drawCircle?: {
    x: number;
    y: number;
    radius: number;
    filled?: boolean;
    id?: string;
  };
  drawVector?: {
    x: number;
    y: number;
    id?: string;
  };
  drawText?: {
    text: string;
    x: number;
    y: number;
    id?: string;
  };
  moveBy?: {
    id: string;
    xChange: number;
    yChange: number;
  };
  moveTo?: {
    id: string;
    x: number;
    y: number;
  };
  delete?: {
    id: string;
  };
  setColor?: {
    color: string;
  };
  clear?: boolean;
  grid?: {
    on: boolean;
    gridSize?: number;
    tickSize?: number;
  };
  minSize?: number;
};

export type ToRuntimeMessage = {};
