# Multi-language plugins (JavaScript + Python)

This guide explains how to support multiple coding languages in a single plugin.

## Key idea

For each language, students need starter code, but plugin implementation can be shared:

- starter code shown to students
- plugin runtime implementation loaded by the execution engine (usually BasicJS for both runtimes)

In this repo's local sandbox, Python can reuse `BasicJS` implementation automatically via the runtime bridge.

## Folder structure

For a plugin named `my-plugin`:

```text
src/plugins/my-plugin/
  Component.tsx
  state.ts
  messages.ts
  Plugin.tsx
  languages/
    BasicJS/
      implementation.ts
      starter-code/
        main.js
    Python/
      starter-code/
        main.py
```

## What each file does

- `languages/BasicJS/implementation.ts`
  - Defines functions available to JavaScript student code.
  - Compiled to `implementation.js` during build.
- `languages/Python/implementation.js` (optional)
  - Optional override if Python behavior truly differs from JS behavior.
  - By default, Python can use `languages/BasicJS/implementation.ts` through the bridge.
- `starter-code/main.js` and `starter-code/main.py`
  - Student-facing examples for each language.
  - Should call the same conceptual plugin APIs (with language-appropriate naming).

## Naming conventions across languages

Keep the same semantic API across languages:

- JavaScript: `drawLine`, `showGrid`, `setColor`
- Python: `draw_line`, `show_grid`, `set_color`

The Python runtime bridge converts names and message payload keys between `camelCase` and `snake_case`.

## Implementation pattern

Default pattern is one implementation (`BasicJS`) shared across JS and Python:

```js
const createExports = (sendMessage, onMessage) =>
  Promise.resolve({
    doThing: (value) => {
      sendMessage({ type: "thing", value });
    },
  });

export default createExports;
```

In Python starter code, students call `do_thing(...)` and the runtime bridge maps to `doThing`.

## Adding Python support to an existing JS plugin

1. Create `languages/Python/`.
2. Add `languages/Python/starter-code/main.py`.
3. Keep message schema (`messages.ts`) shared between languages.
4. (Optional) add `languages/Python/implementation.js` only for Python-specific behavior.
5. Build and test:
   - `npm run build`
   - local sandbox route (if using sandbox): `/sandbox/<plugin-name>`

## Common pitfalls

- Forgetting that Python can already use BasicJS implementation; unnecessary duplicate implementations.
- Returning different message shapes between JS and Python implementations.
- Mismatched naming (`drawLine` vs `draw_line`) without bridge awareness.
- Missing starter file causing dev fallback HTML to appear in editor.
- Reusing editor localStorage keys across plugins (can make one plugin's code appear in another).

## Sandbox behavior notes (local development)

In the local sandbox (`/sandbox/:pluginName`):

- Python mode prefers `languages/Python/implementation.js` if present.
- If that file is missing, Python mode falls back to `languages/BasicJS/implementation.js`.
- Starter code is language-specific (`main.js` vs `main.py`), but missing starter files are ignored if dev fallback HTML is returned.
- Editor state is scoped by plugin + language in localStorage:
  - `codeText:<pluginName>:<language>`
  - This prevents starter/user code from one plugin leaking into another plugin.

## Practical recommendation

When converting a plugin:

1. Keep `BasicJS/implementation.ts` as the single source of truth.
2. Add/maintain `Python/starter-code/main.py`.
3. Keep runtime message payloads identical.
4. Add `Python/implementation.js` only if Python needs custom behavior.
5. Validate both languages before opening PR.

## Copy/paste templates

Use these as a starting point for a new dual-language plugin (shared implementation first).

### JavaScript starter (`languages/BasicJS/starter-code/main.js`)

```js
function solve() {
  // TODO: student code
  doThing(1);
}

solve();
```

### Python starter (`languages/Python/starter-code/main.py`)

```python
def solve():
    # TODO: student code
    do_thing(1)

solve()
```

### JavaScript implementation (`languages/BasicJS/implementation.ts`)

```ts
import { FromRuntimeMessage } from "../../messages";

const createExports = (
  sendMessage: (message: FromRuntimeMessage) => void,
  onMessage: (onMessage: (message: any) => void) => () => void
) => {
  return Promise.resolve({
    doThing: (value: number) => {
      sendMessage({ type: "thing", value });
    },
  });
};

export default createExports;
```

### Optional Python override (`languages/Python/implementation.js`)

```js
const createExports = (sendMessage, onMessage) => {
  return Promise.resolve({
    // Python students call this as do_thing(...)
    doThing: (value) => {
      sendMessage({ type: "thing", value });
    },
  });
};

export default createExports;
```

### Suggested `messages.ts` shape

```ts
export type FromRuntimeMessage = { type: "thing"; value: number };
```
