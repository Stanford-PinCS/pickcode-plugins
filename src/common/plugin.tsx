import { useEffect, useState } from "react";
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

    useEffect(() => {
      // Forward messages from the window to the plugin component.
      const onWindowMessage = ({ data }: MessageEvent<any>) => {
        if (data.type === "start") {
          setPluginState(makeState());
        } else if (data.type === "message" && pluginState.onMessage) {
          pluginState.onMessage(data.message as any);
        } else if (data.type === "log" && pluginState.onLog) {
          pluginState.onLog(data as any);
        }
      };
      window.addEventListener("message", onWindowMessage);
      return () => window.removeEventListener("message", onWindowMessage);
    }, [pluginState]);

    return <Component state={pluginState} />;
  };
