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

  @action
  public onLog = ({
    logType,
    message,
  }: {
    logType: "log" | "error";
    message: string;
  }) => {
    if (logType == "error") {
      this.history.push({ error: message });
    } else {
      this.history.push({ output: message });
    }
  };

  public sendUserInput(message: string) {
    this.sendMessage({ input: message });
  }
}

export default State;
