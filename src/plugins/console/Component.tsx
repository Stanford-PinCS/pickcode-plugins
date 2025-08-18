import { observer } from "mobx-react-lite";
import React, { JSX, JSXElementConstructor, useEffect, useState } from "react";
import Terminal, { ColorMode, TerminalOutput } from "react-terminal-ui";
import State from "./state";

const Component = observer(({ state }: { state: State | undefined }) => {
  const [terminalLineData, setTerminalLineData] = useState<JSX.Element[]>([]);
  const [waitingForInput, setWaitingForInput] = useState(false);

  const addLine = (line: string) => {
    setTerminalLineData([
      ...terminalLineData,
      <TerminalOutput key={terminalLineData.length}>{line}</TerminalOutput>,
    ]);
  };

  useEffect(() => {
    if (state?.history && state.history.length > 0) {
      let latestMessage = state.history[state.history.length - 1];
      if ("output" in latestMessage) {
        addLine(latestMessage.output);
      } else {
        addLine(latestMessage.input);
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
      prompt={waitingForInput ? ">>>" : "---"}
      height="100%"
      onInput={(terminalInput) => {
        if (waitingForInput) {
          addLine(">>> " + terminalInput);
          state?.sendUserInput(terminalInput);
          setWaitingForInput(false);
        }
      }}
    >
      {terminalLineData}
    </Terminal>
  );
});

export default Component;
