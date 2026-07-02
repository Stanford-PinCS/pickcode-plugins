/**
 * NOTE: THIS FILE IS DEPRECATED.
 * It is highly likely that this file is out of date and does not contain
 * full functionality. If you wish to use/edit this file, you should confirm
 * with @pseay or @tmaster628 before starting your work.
 */
export {};

let pyodide: any = null;
let pyodideReady: Promise<any> | null = null;
let configuredCode: string | null = null;
const messageSubscribers: { [key: symbol]: (message: any) => void } = {};

function ensurePyodide() {
  if (!pyodideReady) {
    pyodideReady = import(
      /* @vite-ignore */
      "https://cdn.jsdelivr.net/pyodide/v0.28.2/full/pyodide.mjs"
    ).then(({ loadPyodide }) =>
      loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.28.2/full/",
      })
    );
  }
  return pyodideReady;
}

const subscribeToMessages = (onMessage: (message: any) => void) => {
  const key = Symbol();
  messageSubscribers[key] = onMessage;
  return () => {
    delete messageSubscribers[key];
  };
};

async function importString(str: string) {
  const blob = new Blob([str], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  try {
    return await import(/* @vite-ignore */ url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function camelToSnakeCase(camelCase: string): string {
  if ([...camelCase].every((char) => char === char.toUpperCase())) {
    return camelCase;
  }
  let snake = "";
  [...camelCase].forEach((char, index) => {
    const lower = char.toLowerCase();
    if (char !== lower && index !== 0) {
      snake += "_" + lower;
    } else {
      snake += lower;
    }
  });
  return snake;
}

function snakeToCamelCase(snakeCase: string): string {
  if ([...snakeCase].every((char) => char === char.toUpperCase())) {
    return snakeCase;
  }
  let camel = "";
  let snaking = false;
  [...snakeCase].forEach((char, index) => {
    if (char === "_" && index !== 0) {
      snaking = true;
    } else if (snaking) {
      camel += char.toUpperCase();
      snaking = false;
    } else {
      camel += char.toLowerCase();
    }
  });
  return camel;
}

function convertPyToJS(value: any): any {
  if (!(value instanceof Object)) return value;
  if ("toJs" in value) value = value.toJs();
  if (!(value instanceof Map)) return value;
  const obj: any = {};
  for (const [key, val] of value) {
    if (typeof key === "string") {
      obj[snakeToCamelCase(key)] = convertPyToJS(val);
    } else {
      obj[key] = convertPyToJS(val);
    }
  }
  return obj;
}

function convertJStoPy(value: any): any {
  if (typeof value === "object" && value !== null) {
    const keys = Object.keys(value);
    if (keys.length > 0) {
      const newObj: Record<any, any> = {};
      for (const key of keys) {
        if (typeof key === "string") {
          newObj[camelToSnakeCase(key)] = convertJStoPy(value[key]);
        } else {
          newObj[key] = convertJStoPy(value[key]);
        }
      }
      return newObj;
    }
    return value;
  }
  if (typeof value === "function") {
    return async (...args: any[]) => {
      args = args.map(convertPyToJS);
      return await value(...args);
    };
  }
  return value;
}

async function configurePyodide(pyOrPromise: any, implementationCode: string) {
  const py = await pyOrPromise;
  const moduleCode = await importString(implementationCode);
  const exports =
    (await moduleCode.default(
      (contents: any) => {
        postMessage({ type: "module", contents });
      },
      subscribeToMessages
    )) || {};

  for (const [name, implementation] of Object.entries(exports)) {
    const pyImplementation = convertJStoPy(implementation);
    const snakeName = camelToSnakeCase(name);
    if (typeof pyImplementation === "function") {
      py.globals.set("__internal__" + snakeName, pyImplementation);
      py.runPython(
        `
import pyodide.ffi
def ${snakeName}(*args, **kwargs):
    args = (*args, *kwargs.values())
    return pyodide.ffi.run_sync(__internal__${snakeName}(*args))
`
      );
    } else {
      py.globals.set(snakeName, pyImplementation);
    }
  }

  py.setStdout({
    batched: (msg: string) => {
      postMessage({ type: "console", contents: { type: "log", message: msg } });
    },
  });
  py.setStderr({
    batched: (msg: string) => {
      postMessage({ type: "console", contents: { type: "log", message: msg } });
    },
  });

  configuredCode = implementationCode;
  return py;
}

const handleMessage = async (message: any) => {
  switch (message.type) {
    case "startPy": {
      const ready = ensurePyodide();
      if (configuredCode !== message.moduleCode) {
        pyodide = await configurePyodide(ready, message.moduleCode);
      } else if (!pyodide) {
        pyodide = await ready;
      }
      try {
        await pyodide.runPythonAsync(message.userCode);
      } catch (e: any) {
        postMessage({
          type: "console",
          contents: { type: "log", message: e?.message ?? String(e) },
        });
      }
      break;
    }
    case "module": {
      Object.getOwnPropertySymbols(messageSubscribers).forEach((key) => {
        messageSubscribers[key](message.contents);
      });
      break;
    }
  }
};

self.onmessage = (event) => {
  if (!event.data?.type) return;
  void handleMessage(event.data);
};
