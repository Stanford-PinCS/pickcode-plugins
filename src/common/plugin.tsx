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
    // Mirrors pluginState, but updated synchronously at the moment of the swap.
    //
    // The listener must NOT read pluginState from its closure. setPluginState
    // is batched, so the re-render (and this effect re-running with a fresh
    // closure) happens a microtask later — while a plugin that emits a burst
    // of messages in one tick delivers all of them before that. Reading the
    // closure meant message #1 reached the new state and #2..N were handed to
    // the old, discarded one, so a plugin that draws in a loop rendered only
    // its first message and the pane looked frozen.
    const visibleState = useRef<T>(pluginState);

    const reveal = (next: T) => {
      visibleState.current = next;
      pendingState.current = null;
      setPluginState(next);
    };

    // No dependencies: every piece of state the listener needs lives in a ref,
    // so it stays correct without being torn down and rebuilt per render.
    useEffect(() => {
      // Forward messages from the window to the plugin component.
      const onWindowMessage = ({ data }: MessageEvent<any>) => {
        if (data.type === "start") {
          pendingState.current = makeState();
          return;
        }

        // Everything below is addressed to the newest state, which is the
        // pending one if a run has started but not yet drawn anything.
        const target = pendingState.current ?? visibleState.current;

        if (data.type === "message") {
          target.onMessage(data.message as any);
          // First output of the new run — reveal it.
          if (pendingState.current) reveal(pendingState.current);
        } else if (data.type === "log" && target.onLog) {
          target.onLog(data as any);
        } else if (data.type === "finished" && pendingState.current) {
          // The run ended without drawing anything. Show the fresh (empty)
          // state anyway: holding the previous run's visual here would be a
          // lie about what this run produced.
          reveal(pendingState.current);
        }
      };
      window.addEventListener("message", onWindowMessage);
      return () => window.removeEventListener("message", onWindowMessage);
    }, []);

    return <Component state={pluginState} />;
  };
