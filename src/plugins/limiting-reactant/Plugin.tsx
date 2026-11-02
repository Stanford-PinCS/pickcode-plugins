import { plugin } from "../../common/plugin";
import Component from "./Component";
import State from "./state";

/** Wiring only: logic lives in state.ts, presentation in Component.tsx. */
export default plugin(Component, State);
