// Runs every plugin's starter code and solution code the way the site does, in JavaScript and in Python, and checks each plugin's last instruction step against its solution.
//
// Usage: npm run check-plugins [plugin-id ...]   (no ids: every plugin that has a solutions/ folder)
//
// JavaScript: prefix + "\n" + code + "\n" + suffix runs as one AsyncFunction whose parameters are implementation.ts's exports, as in the site's JSWorker.
// Python: prefix, code and suffix run one after another in the same globals with the local python3, as in the site's PyWorker. Each export is a snake_case function that hands its arguments to the real implementation.ts in this process, so its checks and error messages are the ones students see.
// Every message a run sends goes through the plugin's State.onMessage, so a message State can't handle fails the run.

import { spawn } from "child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdtempSync } from "fs";
import { tmpdir } from "os";
import { dirname, join } from "path";
import { createInterface } from "readline";
import { fileURLToPath, pathToFileURL } from "url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const pluginsDir = join(rootDir, "src", "plugins");
const RUN_TIMEOUT_MS = 20000;

type Exports = Record<string, unknown>;
type Language = "BasicJS" | "Python";

interface RunResult {
    ok: boolean;
    messages: unknown[];
    error?: string;
}

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (...args: string[]) => (...args: unknown[]) => Promise<unknown>;

/** The site's camelCase → snake_case rule (PyWorker.camelToSnakeCase). */
function camelToSnakeCase(name: string): string {
    if ([...name].every((c) => c === c.toUpperCase())) return name;
    let snake = "";
    [...name].forEach((c, i) => {
        const lower = c.toLowerCase();
        snake += c !== lower && i !== 0 ? "_" + lower : lower;
    });
    return snake;
}

function readIfExists(path: string): string {
    return existsSync(path) ? readFileSync(path, "utf8") : "";
}

async function loadExports(plugin: string, messages: unknown[]): Promise<Exports> {
    const implPath = join(pluginsDir, plugin, "languages", "BasicJS", "implementation.ts");
    const mod = await import(pathToFileURL(implPath).href);
    const createExports = mod.default as (send: (m: unknown) => void, on: (h: (m: unknown) => void) => () => void) => Promise<Exports> | Exports;
    return (await createExports((m) => messages.push(m), () => () => {})) ?? {};
}

/** Feeds every message to a fresh State, like the plugin iframe does. Returns an error string, "skip: …" when the State needs a browser to start, or undefined when State handled them all. */
async function checkState(plugin: string, messages: unknown[]): Promise<string | undefined> {
    const statePath = join(pluginsDir, plugin, "state.ts");
    if (!existsSync(statePath)) return undefined;
    let state: { init?: () => void; onMessage: (m: unknown) => void };
    try {
        const mod = await import(pathToFileURL(statePath).href);
        const StateClass = (mod.default ?? mod.State) as new () => typeof state;
        state = new StateClass();
        state.init?.();
    } catch (e) {
        return `skip: State can't start outside a browser (${(e as Error).message})`;
    }
    for (const m of messages) {
        try {
            state.onMessage(m);
        } catch (e) {
            return `State.onMessage threw on ${JSON.stringify(m).slice(0, 200)}: ${(e as Error).message}`;
        }
    }
    return undefined;
}

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} took longer than ${RUN_TIMEOUT_MS / 1000}s`)), RUN_TIMEOUT_MS);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** Waits while timers the run started keep sending messages (the site's worker also stays alive for them), until none arrive for SETTLE_MS or SETTLE_MAX_MS passes. */
async function settle(messages: unknown[]): Promise<void> {
    const SETTLE_MS = 400;
    const SETTLE_MAX_MS = 15000;
    const start = Date.now();
    let seen = -1;
    while (seen !== messages.length && Date.now() - start < SETTLE_MAX_MS) {
        seen = messages.length;
        await new Promise((r) => setTimeout(r, SETTLE_MS));
    }
}

async function runJs(plugin: string, codePath: string): Promise<RunResult> {
    const dir = join(pluginsDir, plugin, "languages", "BasicJS", "starter-code");
    const prefix = readIfExists(join(dir, "prefix.js"));
    const suffix = readIfExists(join(dir, "suffix.js"));
    const messages: unknown[] = [];
    const exports = await loadExports(plugin, messages);
    const params = Object.entries(exports);
    const originalLog = console.log;
    console.log = () => {};
    try {
        const fn = new AsyncFunction(...params.map(([name]) => name), prefix + "\n" + readFileSync(codePath, "utf8") + "\n" + suffix);
        await withTimeout(fn(...params.map(([, value]) => value)), "the JavaScript run");
        await settle(messages);
        return { ok: true, messages };
    } catch (e) {
        return { ok: false, messages, error: (e as Error).message };
    } finally {
        console.log = originalLog;
    }
}

const PY_DRIVER = String.raw`
import json, os, sys, traceback
_to_node = os.fdopen(3, "w", buffering=1)
_from_node = os.fdopen(4, "r")

def _camel(key):
    if key.upper() == key:
        return key
    out, up = "", False
    for i, c in enumerate(key):
        if c == "_" and i != 0:
            up = True
        elif up:
            out += c.upper(); up = False
        else:
            out += c.lower()
    return out

def _to_js(v):
    if isinstance(v, (list, tuple, range)):
        return [_to_js(x) for x in v]
    if isinstance(v, dict):
        return {(_camel(k) if isinstance(k, str) else k): _to_js(x) for k, x in v.items()}
    if callable(v):
        raise TypeError("check-plugin-code can't pass a Python function to a plugin export")
    return v

def _export(name):
    def call(*args, **kwargs):
        args = (*args, *kwargs.values())
        _to_node.write(json.dumps({"name": name, "args": [_to_js(a) for a in args]}) + "\n")
        reply = json.loads(_from_node.readline())
        if "error" in reply:
            raise Exception(reply["error"])
        return reply.get("value")
    return call

spec = json.load(open(sys.argv[1]))
g = {"__name__": "__main__"}
for py_name, js_name in spec["exports"].items():
    g[py_name] = _export(js_name)
for label, path in spec["parts"]:
    try:
        exec(compile(open(path).read(), label, "exec"), g)
    except Exception:
        sys.stderr.write(traceback.format_exc())
        sys.exit(1)
`;

async function runPython(plugin: string, codePath: string, workDir: string): Promise<RunResult> {
    const dir = join(pluginsDir, plugin, "languages", "Python", "starter-code");
    const messages: unknown[] = [];
    const exports = await loadExports(plugin, messages);
    const pyNames: Record<string, string> = {};
    for (const [name, value] of Object.entries(exports)) {
        if (typeof value === "function") pyNames[camelToSnakeCase(name)] = name;
    }
    const parts = [["prefix.py", join(dir, "prefix.py")], [codePath.split("/").pop()!, codePath], ["suffix.py", join(dir, "suffix.py")]].filter(([, p]) => existsSync(p));
    const specPath = join(workDir, `${plugin}-${Date.now()}.json`);
    writeFileSync(specPath, JSON.stringify({ exports: pyNames, parts }));
    const driverPath = join(workDir, "driver.py");
    writeFileSync(driverPath, PY_DRIVER);

    const child = spawn("python3", ["-I", driverPath, specPath], { stdio: ["ignore", "pipe", "pipe", "pipe", "pipe"] });
    const toPy = child.stdio[4] as NodeJS.WritableStream;
    let stderr = "";
    child.stderr!.on("data", (d) => (stderr += d));
    child.stdout!.on("data", () => {});
    const calls = createInterface({ input: child.stdio[3] as NodeJS.ReadableStream });
    calls.on("line", async (line) => {
        const { name, args } = JSON.parse(line) as { name: string; args: unknown[] };
        try {
            const value = await (exports[name] as (...a: unknown[]) => unknown)(...args);
            toPy.write(JSON.stringify({ value: value ?? null }) + "\n");
        } catch (e) {
            toPy.write(JSON.stringify({ error: (e as Error).message }) + "\n");
        }
    });
    try {
        const code = await withTimeout(new Promise<number | null>((resolve) => child.on("close", resolve)), "the Python run");
        if (code !== 0) {
            const lines = stderr.trim().split("\n");
            const where = lines.filter((l) => /File "[^"/]+\.py", line/.test(l)).pop()?.trim();
            return { ok: false, messages, error: [where, lines[lines.length - 1]].filter(Boolean).join(" | ") };
        }
        await settle(messages);
        return { ok: true, messages };
    } catch (e) {
        child.kill();
        return { ok: false, messages, error: (e as Error).message };
    }
}

/** Lines of the code blocks in the last "## Step" section that are missing from the solution, per fence language. */
function checkLastStep(plugin: string): { lang: string; missing: string[] }[] {
    const text = readIfExists(join(pluginsDir, plugin, "instructions.md"));
    const sections = text.split(/^## /m);
    const steps = sections.filter((s) => /^Step \d+/.test(s));
    if (steps.length === 0) return [];
    const last = steps[steps.length - 1];
    const out: { lang: string; missing: string[] }[] = [];
    for (const [lang, file] of [["js", "solutionCode.js"], ["python", "solutionCode.py"]]) {
        const solutionPath = join(pluginsDir, plugin, "solutions", file);
        if (!existsSync(solutionPath)) continue;
        const solutionLines = new Set(readFileSync(solutionPath, "utf8").split("\n").map((l) => l.trim()));
        const blocks = [...last.matchAll(new RegExp("```" + lang + "\\n([\\s\\S]*?)```", "g"))].map((m) => m[1]);
        const missing = blocks.flatMap((b) => b.split("\n").map((l) => l.trim()).filter((l) => l && !solutionLines.has(l)));
        out.push({ lang, missing });
    }
    return out;
}

async function main() {
    const requested = process.argv.slice(2);
    const plugins = requested.length > 0 ? requested : readdirSync(pluginsDir).filter((p) => existsSync(join(pluginsDir, p, "solutions"))).sort();
    const workDir = mkdtempSync(join(tmpdir(), "check-plugin-code-"));
    let failures = 0;
    let runs = 0;

    for (const plugin of plugins) {
        const base = join(pluginsDir, plugin);
        if (!existsSync(base)) {
            console.log(`✗ ${plugin}: no such plugin`);
            failures++;
            continue;
        }
        const languages: [Language, string, string][] = [];
        if (existsSync(join(base, "languages", "BasicJS", "starter-code", "main.js"))) languages.push(["BasicJS", join(base, "languages", "BasicJS", "starter-code", "main.js"), join(base, "solutions", "solutionCode.js")]);
        if (existsSync(join(base, "languages", "Python", "starter-code", "main.py"))) languages.push(["Python", join(base, "languages", "Python", "starter-code", "main.py"), join(base, "solutions", "solutionCode.py")]);

        for (const [language, mainPath, solutionPath] of languages) {
            for (const [label, codePath] of [["main", mainPath], ["solution", solutionPath]]) {
                if (!existsSync(codePath)) {
                    console.log(`✗ ${plugin} ${language} ${label}: missing ${codePath.slice(base.length + 1)}`);
                    failures++;
                    continue;
                }
                runs++;
                const result = language === "BasicJS" ? await runJs(plugin, codePath) : await runPython(plugin, codePath, workDir);
                let error = result.error;
                if (!error && result.messages.length === 0) error = "ran but sent no message to the plugin, so the pane stays empty";
                let note = "";
                if (!error) {
                    const stateError = await checkState(plugin, result.messages);
                    if (stateError?.startsWith("skip: ")) note = `, ${stateError.slice("skip: ".length)}`;
                    else error = stateError;
                }
                if (error) failures++;
                console.log(`${error ? "✗" : "✓"} ${plugin} ${language} ${label}: ${error ?? `${result.messages.length} message(s)${note}`}`);
            }
        }

        for (const { lang, missing } of checkLastStep(plugin)) {
            if (missing.length > 0) {
                failures++;
                console.log(`✗ ${plugin} instructions: last step's ${lang} lines missing from the solution:\n    ${missing.join("\n    ")}`);
            } else {
                console.log(`✓ ${plugin} instructions: last step's ${lang} code is in the solution`);
            }
        }
    }

    console.log(`\n${runs} runs, ${failures} failure(s)`);
    process.exit(failures > 0 ? 1 : 0);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
