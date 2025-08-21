import { observer } from "mobx-react-lite";
import React, { JSX, JSXElementConstructor, useEffect, useState } from "react";
import Terminal, { ColorMode, TerminalOutput } from "react-terminal-ui";
import State from "./state";

const Component = observer(({ state }: { state: State | undefined }) => {
  const [terminalLineData, setTerminalLineData] = useState<JSX.Element[]>([]);

  useEffect(() => {
    if (state?.terminalLineData) {
      setTerminalLineData(
        state.terminalLineData.map((lineData, i) => {
          return (
            <TerminalOutput key={i + "#" + lineData.line}>
              <span className={lineData.error ? "text-red-500" : ""}>
                {lineData.line}
              </span>
            </TerminalOutput>
          );
        })
      );
    }
  }, [state?.terminalLineData.length]);

  return (
    <Terminal
      name="Console"
      colorMode={ColorMode.Dark}
      prompt={state?.inputMessage ?? "---"}
      height="100%"
      onInput={(terminalInput) => {
        if (!state) return;
        if (state.waitingForInput) {
          // Add to history and return to user code.
          state.addLine(state.inputMessage + " " + terminalInput);
          state.sendUserInput(terminalInput);
          // Reset.
          state.waitingForInput = false;
          state.inputMessage = "---";
        }
      }}
      TopButtonsPanel={() => null}
    >
      {terminalLineData}
    </Terminal>
  );
});

export default Component;
