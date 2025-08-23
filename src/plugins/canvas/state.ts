import { action, observable } from "mobx";
import { FromRuntimeMessage, ToRuntimeMessage } from "./messages";

type Line = {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  id?: string;
};

type Point = {
  type: "point";
  x: number;
  y: number;
  color: string;
  id?: string;
};

type Circle = {
  type: "circle";
  x: number;
  y: number;
  radius: number;
  color: string;
  filled?: boolean;
  id?: string;
};

type Vector = {
  type: "vector";
  x: number;
  y: number;
  color: string;
  id?: string;
};

type Text = {
  type: "text";
  text: string;
  x: number;
  y: number;
  color: string;
  id?: string;
};

export type Drawable = Line | Point | Circle | Vector | Text;

export class State {
  @observable
  accessor drawables: Drawable[] = [];

  @observable
  accessor changeCount: number = 0;

  @observable
  accessor currentColor: string = "black";

  @observable
  accessor showGrid: boolean = false; // Do not show the grid by default.

  @observable
  accessor minSize = 10; // The canvas will be no smaller than minSize x minSize units

  @observable
  accessor unitsPerGridLine = 1; // How often the grid lines are.

  private sendMessage = (_message: ToRuntimeMessage) => {};

  public init = (sendMessage: (message: ToRuntimeMessage) => void) => {
    this.sendMessage = sendMessage;
  };

  @action
  public onMessage = (m: FromRuntimeMessage) => {
    if (m.drawLine) {
      this.drawables.push({
        type: "line",
        ...m.drawLine,
        color: this.currentColor,
      });
    } else if (m.drawPoint) {
      this.drawables.push({
        type: "point",
        ...m.drawPoint,
        color: this.currentColor,
      });
    } else if (m.drawCircle) {
      this.drawables.push({
        type: "circle",
        ...m.drawCircle,
        color: this.currentColor,
      });
    } else if (m.drawVector) {
      this.drawables.push({
        type: "vector",
        ...m.drawVector,
        color: this.currentColor,
      });
    } else if (m.drawText) {
      this.drawables.push({
        type: "text",
        ...m.drawText,
        color: this.currentColor,
      });
    } else if (m.moveBy) {
      const { id, xChange, yChange } = m.moveBy;
      this.drawables.forEach((drawable) => {
        if (drawable?.id == id) {
          // Shift drawable by the change amount.
          if (drawable.type == "line") {
            drawable.x1 += xChange;
            drawable.x2 += xChange;
            drawable.y1 += yChange;
            drawable.y2 += yChange;
          } else {
            drawable.x += xChange;
            drawable.y += yChange;
          }
        }
      });
    } else if (m.moveTo) {
      const { id, x, y } = m.moveTo;
      this.drawables.forEach((drawable) => {
        if (drawable?.id == id) {
          if (drawable.type == "line") {
            // Move starting position of line.
            drawable.x2 = drawable.x2 - drawable.x1 + x;
            drawable.x1 = x;
            drawable.y2 = drawable.y2 - drawable.y1 + y;
            drawable.y1 = y;
          } else {
            // Move position to (x, y).
            drawable.x = x;
            drawable.y = y;
          }
        }
      });
    } else if (m.delete) {
      const { id } = m.delete;
      this.drawables = this.drawables.filter((drawable) => {
        return drawable.id !== id;
      });
    } else if (m.setColor) {
      this.currentColor = m.setColor.color;
    } else if (m.clear) {
      this.drawables = [];
    } else if (m.grid) {
      if (m.grid.on) {
        // Turn on the grid.
        this.showGrid = true;
        // Update values if given.
        if (m.grid.gridSize) this.minSize = m.grid.gridSize;
        if (m.grid.tickSize) this.unitsPerGridLine = m.grid.tickSize;
      } else {
        // Turn off the grid.
        this.showGrid = false;
      }
    } else if (m.minSize) {
      this.minSize = m.minSize;
    } else {
      return;
    }
    this.changeCount += 1;
  };

  public send = (m: ToRuntimeMessage) => {
    this.sendMessage(m);
  };
}

export default State;
