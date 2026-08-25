import { useEffect, useRef, useState } from "react";
import { PluginComponentBase } from "./PluginComponentBase";
import { PluginStateBase } from "./PluginStateBase";

export const plugin =
  <T extends PluginStateBase>(
    Component: PluginComponentBase<T>,
    State: new () => T
  ) =>
  () => {
    function makeState() {
      let state = new State();
      //@ts-ignore
      // Forward messages from the plugin component to the window.
      state.init((messageContent) => {
        const message = { type: "plugin", contents: messageContent };
        window.parent.postMessage(message, "*");
      });
      return state;
    }

    const [pluginState, setPluginState] = useState(makeState);

    // Double buffer.
    //
    // A run has to start from a clean state, or data from the previous run
    // bleeds into this one. But swapping the state in the moment "start"
    // arrives leaves the pane on its empty state until the student's code
    // produces its first message — a blank flash that reads as a crash, and
    // one that lasts seconds in Python while Pyodide boots.
    //
    // So "start" only *prepares* the next state; the visible one keeps
    // rendering the previous run until there is something new to show. The
    // swap happens on the first message of the new run, which is also the
    // moment that message must be delivered to the new state rather than the
    // old one.
    const pendingState = useRef<T | null>(null);

    useEffect(() => {
      // Forward messages from the window to the plugin component.
      const onWindowMessage = ({ data }: MessageEvent<any>) => {
        if (data.type === "start") {
          pendingState.current = makeState();
          return;
        }

        // Everything below is addressed to the newest state, which is the
        // pending one if a run has started but not yet drawn anything.
        const target = pendingState.current ?? pluginState;

        if (data.type === "message" && target.onMessage) {
          target.onMessage(data.message as any);
          // First output of the new run — reveal it.
          if (pendingState.current) {
            setPluginState(pendingState.current);
            pendingState.current = null;
          }
        } else if (data.type === "log" && target.onLog) {
          target.onLog(data as any);
        } else if (data.type === "finished" && pendingState.current) {
          // The run ended without drawing anything. Show the fresh (empty)
          // state anyway: holding the previous run's visual here would be a
          // lie about what this run produced.
          setPluginState(pendingState.current);
          pendingState.current = null;
        }
      };
      window.addEventListener("message", onWindowMessage);
      return () => window.removeEventListener("message", onWindowMessage);
    }, [pluginState]);

    return <Component state={pluginState} />;
  };
