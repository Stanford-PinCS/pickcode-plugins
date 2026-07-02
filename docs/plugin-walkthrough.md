# Plugin System Walkthrough

## Diagrams

![Code Editor Diagram](./code-editor-diagram.svg)

![Messages Diagram](./messages-diagram.svg)

## Overview

How the code editor, runtime, and plugin iframe fit together:

A plugin has **two sides**:

1. **Runtime** — the editor on the left; when the student hits Run, their code runs in a Web Worker (JavaScript) or equivalent (Python).
2. **Output** — your React UI in an **iframe** on the right.

**Plugin payloads** (the shapes you define in `messages.ts`) flow **one way: from student code (runtime/worker) to the iframe UI.** The implementation’s `sendMessage` posts from the worker to the host page, which `postMessage`s into the iframe so `state.onMessage` can update the UI.

## File Structure

```
src/plugins/your-plugin/
├── Component.tsx          # React UI (right side)
├── state.ts              # State management + message handlers
├── messages.ts           # Message type definitions
├── Plugin.tsx            # Plugin registration (usually don't edit)
└── languages/
    └── BasicJS/
        ├── implementation.ts    # Defines what functions students can use
        └── starter-code/
            └── main.js          # Initial code students see
```

## Data Flow Example

Let's trace what happens when a student writes `setValue("hello")`:

### 1. Student writes code (left side)

```javascript
// In starter-code/main.js or student's code
setValue("hello");
```

### 2. Implementation exposes the function

```typescript
// implementation.ts
const createExports = (sendMessage) => {
    return Promise.resolve({
        setValue: (value: any) => sendMessage({ setValue: value }),
        // ↑ This makes setValue() available to student code
    });
};
```

### 3. Message flows to State

```typescript
// state.ts - onMessage receives it
@action
public onMessage = (m: FromRuntimeMessage) => {
    this.value = m.setValue;  // Updates state: "hello"
};
```

### 4. Component re-renders

```tsx
// Component.tsx - automatically updates because state changed
const Component = observer(({ state }) => {
    return <div>Value: {state?.value}</div>;  // Shows "hello"
});
```

## Message Types

### FromRuntimeMessage (runtime → output)

- Student code (via the implementation’s `sendMessage`) sends these to update the iframe UI.
- Defined in `messages.ts` as `FromRuntimeMessage`.
- Handled in `state.ts` in `onMessage`.

## Key Concepts

### 1. Starter Code (`starter-code/main.js`)

- **What it is**: Initial code students see in the editor
- **Purpose**: Example showing how to use your plugin
- **Current issue**: Your haber-reaction plugin has the default `setValue(42);` but you're seeing `choose()` code

### 2. Implementation (`implementation.ts`)

- **What it is**: Defines what functions/variables are available to student code
- **Returns**: An object with functions that students can call
- **Example**: If you return `{ optimize: (fn) => {...} }`, students can call `optimize(myFunction)`

### 3. State (`state.ts`)

- **What it is**: Manages the plugin's data
- **onMessage**: Called when student code sends a message from the runtime into the iframe

### 4. Component (`Component.tsx`)

- **What it is**: React component that displays the output
- **Automatically updates**: Uses MobX `@observable` to react to state changes

## Example: Marginal Utility Plugin

Looking at `marginal-utility` as a reference:

### Starter Code

```javascript
// starter-code/main.js
function choose(mu_a, p_a, mu_b, p_b) {
    // Student writes logic here
}
optimize(choose)  // Calls the function exposed by implementation
```

### Implementation

```typescript
// implementation.ts
return Promise.resolve({
    optimize: (choose) => {
        // Runs the student's choose function multiple times
        // Sends results via sendMessage()
    }
});
```

### Messages

```typescript
// messages.ts
export type Message = string;  // Simple: just sends the choice
```

### State

```typescript
// state.ts
public onMessage = (m: Message) => {
    // Receives the choice string ("apple" or "banana")
    // Updates state to show the choice
};
```

