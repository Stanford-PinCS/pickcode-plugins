import { observer } from "mobx-react-lite";
import React, { JSX, JSXElementConstructor, useEffect, useState } from "react";
import Terminal, { ColorMode, TerminalOutput } from "react-terminal-ui";
import State from "./state";

const Component = observer(({ state }: { state: State | undefined }) => {
  const [terminalLineData, setTerminalLineData] = useState<JSX.Element[]>([]);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [inputMessage, setInputMessage] = useState("---");

  const addLine = (line: string) => {
    setTerminalLineData((curLines) => [
      ...curLines,
      <TerminalOutput key={curLines.length}>{line}</TerminalOutput>,
    ]);
  };

  useEffect(() => {
    if (state?.history && state.history.length > 0) {
      // Messages from the code.
      let latestMessage = state.history[state.history.length - 1];
      if ("output" in latestMessage) {
        // Just write it to the console.
        addLine(latestMessage.output);
      } else {
        // Wait for user input.
        let messageLines = latestMessage.input.split("\n");
        for (let i = 0; i < messageLines.length - 1; i++) {
          addLine(messageLines[i]);
        }
        setInputMessage(messageLines[messageLines.length - 1] || ">");
        setWaitingForInput(true);
      }
    } else if (state?.history.length == 0) {
      setTerminalLineData([]);
    }
  }, [state?.history.length]);

  return (
    <Terminal
      name="Console"
      colorMode={ColorMode.Dark}
      prompt={inputMessage}
      height="100%"
      onInput={(terminalInput) => {
        if (waitingForInput) {
          // Add to history and return to user code.
          addLine(inputMessage + " " + terminalInput);
          state?.sendUserInput(terminalInput);
          // Reset.
          setWaitingForInput(false);
          setInputMessage("---");
        }
      }}
    >
      {terminalLineData}
    </Terminal>
  );
});

export default Component;
