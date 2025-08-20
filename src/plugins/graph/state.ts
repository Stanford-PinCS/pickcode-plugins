import { action, observable } from "mobx";
import { FromRuntimeMessage, ToRuntimeMessage } from "./messages";

type Line = {
    type: "line";
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color: string;
};

type Point = {
    type: "point";
    x: number;
    y: number;
    color: string;
};

type Circle = {
    type: "circle";
    x: number;
    y: number;
    radius: number;
    color: string;
};

type Vector = {
    type: "vector";
    x1: number;
    y1: number;
    color: string;
};

type Text = {
    type: "text";
    text: string;
    x: number;
    y: number;
    color: string;
};

export type Drawable = Line | Point | Circle | Vector | Text;

export class State {
    @observable
    accessor drawables: Drawable[] = [];

    @observable
    accessor currentColor: string = "black";

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
        } else if (m.setColor) {
            this.currentColor = m.setColor.color;
        }
    };

    public send = (m: ToRuntimeMessage) => {
        this.sendMessage(m);
    };
}

export default State;
