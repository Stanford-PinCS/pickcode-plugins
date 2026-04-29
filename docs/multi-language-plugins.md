# Multi-language plugins (JavaScript + Python)

This guide explains how to support multiple coding languages in a single plugin.

## Key idea

For each language, you need both:

- starter code shown to students
- plugin runtime implementation loaded by the execution engine

Starter code alone is not enough.

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
      implementation.js
      starter-code/
        main.py
```

## What each file does

- `languages/BasicJS/implementation.ts`
  - Defines functions available to JavaScript student code.
  - Compiled to `implementation.js` during build.
- `languages/Python/implementation.js`
  - Defines functions available to Python student code through the Python runtime bridge.
  - Kept as JavaScript because the Python runtime imports JS modules and exposes their exports to Python.
- `starter-code/main.js` and `starter-code/main.py`
  - Student-facing examples for each language.
  - Should call the same conceptual plugin APIs (with language-appropriate naming).

## Naming conventions across languages

Keep the same semantic API across languages:

- JavaScript: `drawLine`, `showGrid`, `setColor`
- Python: `draw_line`, `show_grid`, `set_color`

The Python runtime bridge converts names and message payload keys between `camelCase` and `snake_case`.

## Minimal implementation pattern

Both JS and Python implementations should export a default factory:

```js
const createExports = (sendMessage, onMessage) =>
  Promise.resolve({
    doThing: (value) => {
      sendMessage({ type: "thing", value });
    },
  });

export default createExports;
```

In Python starter code, students call `do_thing(...)` if they are writing Python.

## Adding Python support to an existing JS plugin

1. Create `languages/Python/`.
2. Add `languages/Python/implementation.js` (mirror JS behavior).
3. Add `languages/Python/starter-code/main.py`.
4. Keep message schema (`messages.ts`) shared between languages.
5. Build and test:
   - `npm run build`
   - local sandbox route (if using sandbox): `/sandbox/<plugin-name>`

## Common pitfalls

- Only adding `main.py` starter code (no Python implementation).
- Returning different message shapes between JS and Python implementations.
- Mismatched naming (`drawLine` vs `draw_line`) without bridge awareness.
- Missing starter file causing dev fallback HTML to appear in editor.

## Practical recommendation

When converting a plugin:

1. Start by copying existing `BasicJS/implementation.ts` logic into `Python/implementation.js`.
2. Keep runtime message payloads identical.
3. Translate only student-facing function names and starter code syntax.
4. Validate both languages before opening PR.

## Copy/paste templates

Use these as a starting point for a new dual-language plugin.

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

### Python implementation (`languages/Python/implementation.js`)

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
