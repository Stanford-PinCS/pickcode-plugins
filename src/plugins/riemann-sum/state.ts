import { action, observable } from "mobx";
import { Message } from "./messages";

interface Rect {
    x: number;
    width: number;
    height: number;
    color: string;
}

export class State {
    @observable accessor rects: Rect[] = [];
    @observable accessor curveVisible: boolean = false;
    @observable accessor currentColor: string = "orange";
    @observable accessor area: number = 0;

    public init = () => {};

    @action
    public onMessage = (m: Message) => {
        switch (m.type) {
            case "drawCurve":
                this.curveVisible = true;
                break;
            case "setColor":
                this.currentColor = m.color;
                break;
            case "drawRect":
                this.rects.push({
                    x: m.x,
                    width: m.width,
                    height: m.height,
                    color: this.currentColor,
                });
                break;
            case "showArea":
                this.area = m.area;
                break;
        }
    };
}

export default State;
