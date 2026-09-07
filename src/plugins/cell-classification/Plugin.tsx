// Imports are written for src/plugins/<name>/, where this file gets copied.
// They will show as unresolved here. That is expected — do not "fix" them.
// (There is expected to be error lines under "../../common/plugin")

import { plugin } from "../../common/plugin";
import Component from "./Component";
import State from "./state";

/**
 * Wiring only. Every plugin's Plugin.tsx is these four lines with different
 * imports. If you need to add anything here, it belongs in state.ts (logic)
 * or Component.tsx (presentation).
 */
export default plugin(Component, State);
