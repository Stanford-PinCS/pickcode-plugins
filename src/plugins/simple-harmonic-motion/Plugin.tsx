import { useEffect, useRef, useState } from "react";
import Component from "./Component";
import State from "./state";

function makeState() {
  const state = new State();
  state.init();
  return state;
}

export const Plugin = () => {
  const [pluginState] = useState(makeState);
  const pluginStateRef = useRef(pluginState);

  useEffect(() => {
    const onWindowMessage = ({ data }: MessageEvent<any>) => {
      if (data.type === "start") {
        pluginStateRef.current.reset();
      } else if (data.type === "message") {
        pluginStateRef.current.onMessage(data.message);
      }
    };

    window.addEventListener("message", onWindowMessage);
    return () => window.removeEventListener("message", onWindowMessage);
  }, []);

  return <Component state={pluginState} />;
};

export default Plugin;
