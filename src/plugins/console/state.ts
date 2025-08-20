import { action, observable } from "mobx";
import { FromRuntimeMessage, ToRuntimeMessage } from "./messages";

export class State {
  @observable
  accessor history: FromRuntimeMessage[] = [];

  private sendMessage = (_message: ToRuntimeMessage) => {};

  public init = (sendMessage: (message: ToRuntimeMessage) => void) => {
    this.sendMessage = sendMessage;
  };

  @action
  public onMessage = (m: FromRuntimeMessage) => {
    this.history.push(m);
  };

  public sendUserInput(message: string) {
    this.sendMessage({ input: message });
  }
}

export default State;
