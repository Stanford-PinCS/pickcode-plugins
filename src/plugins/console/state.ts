import { action, observable } from "mobx";
import { FromRuntimeMessage, ToRuntimeMessage } from "./messages";

export class State {
  @observable
  accessor terminalLineData: { line: string; error: boolean }[] = [];

  @observable
  accessor inputMessage: string = "---";

  @observable
  accessor waitingForInput: boolean = false;

  public addLine(line: string, error = false) {
    this.terminalLineData = [
      ...this.terminalLineData,
      {
        line,
        error,
      },
    ];
  }

  private sendMessage = (_message: ToRuntimeMessage) => {};

  public init = (sendMessage: (message: ToRuntimeMessage) => void) => {
    this.sendMessage = sendMessage;
  };

  @action
  public onMessage = (message: FromRuntimeMessage) => {
    // Messages from the code.
    if ("output" in message) {
      // Just write it to the console.
      this.addLine(message.output);
    } else if ("input" in message) {
      // Wait for user input.
      let messageLines = message.input.split("\n");
      for (let i = 0; i < messageLines.length - 1; i++) {
        this.addLine(messageLines[i]);
      }
      this.inputMessage = messageLines[messageLines.length - 1] || ">";
      this.waitingForInput = true;
    } else {
      // Error message - write it in red.
      this.addLine(message.error, true);
    }
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
      this.addLine(message, true);
    } else {
      this.addLine(message);
    }
  };

  public sendUserInput(message: string) {
    this.sendMessage({ input: message });
  }
}

export default State;
