import type { Term, TermSummary } from "./terms";

/** Where recognized terms and Wikipedia summaries come from: the site's API on site pages, the page around the plugin inside a plugin iframe. */
export interface TermSource {
  recognize(text: string): Promise<Term[]>;
  summary(title: string): Promise<TermSummary | null>;
  /** Opens the full article in a new tab. A sandboxed plugin iframe can't open windows itself, so it asks the page. */
  open(url: string): void;
}

const REQUEST = "pincs-terms-request";
const RESPONSE = "pincs-terms-response";
const RECOGNIZE_TIMEOUT_MS = 60_000;
const SUMMARY_TIMEOUT_MS = 15_000;
const WIKIPEDIA_ARTICLE = /^https:\/\/en\.wikipedia\.org\/wiki\/[^\s]+$/;

/** Caches each lookup for the page's lifetime, but drops a failed one so the next mount retries it. */
function memoize<T>(load: (key: string) => Promise<T | undefined>, fallback: T) {
  const cache = new Map<string, Promise<T>>();
  return (key: string): Promise<T> => {
    let result = cache.get(key);
    if (!result) {
      result = load(key).then(
        (value) => {
          if (value === undefined) cache.delete(key);
          return value ?? fallback;
        },
        () => {
          cache.delete(key);
          return fallback;
        }
      );
      cache.set(key, result);
    }
    return result;
  };
}

/** Calls the site's API directly. basePath is the site's NEXT_PUBLIC_APP_BASE_PATH. */
export function apiTermSource(basePath: string): TermSource {
  return {
    recognize: memoize<Term[]>(async (text) => {
      const res = await fetch(`${basePath}/api/terms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return undefined;
      const json = await res.json();
      return Array.isArray(json.terms) ? json.terms : [];
    }, []),
    summary: memoize<TermSummary | null>(async (title) => {
      const res = await fetch(`${basePath}/api/terms/summary?title=${encodeURIComponent(title)}`);
      if (!res.ok) return undefined;
      return (await res.json()).summary ?? null;
    }, null),
    open(url) {
      window.open(url, "_blank", "noopener,noreferrer");
    },
  };
}

type FrameRequest =
  | { op: "recognize"; text: string }
  | { op: "summary"; title: string }
  | { op: "open"; url: string };

/** Inside a plugin iframe: asks the page around the plugin, which answers through answerFrameRequests. Null when the plugin isn't inside a page, so it shows no terms. */
export function frameTermSource(): TermSource | null {
  if (typeof window === "undefined" || window.parent === window) return null;
  let nextId = 1;
  const pending = new Map<number, (result: unknown) => void>();
  window.addEventListener("message", (e) => {
    const data = e.data;
    if (e.source !== window.parent || data?.type !== RESPONSE) return;
    pending.get(data.id)?.(data.result);
  });

  const ask = <T,>(request: FrameRequest, timeoutMs: number) =>
    new Promise<T | undefined>((resolve) => {
      const id = nextId++;
      const done = (result: unknown) => {
        clearTimeout(timer);
        pending.delete(id);
        resolve(result as T | undefined);
      };
      const timer = setTimeout(() => done(undefined), timeoutMs);
      pending.set(id, done);
      window.parent.postMessage({ type: REQUEST, id, ...request }, "*");
    });

  return {
    recognize: memoize<Term[]>((text) => ask<Term[]>({ op: "recognize", text }, RECOGNIZE_TIMEOUT_MS), []),
    summary: memoize<TermSummary | null>((title) => ask<TermSummary | null>({ op: "summary", title }, SUMMARY_TIMEOUT_MS), null),
    open(url) {
      window.parent.postMessage({ type: REQUEST, id: 0, op: "open", url }, "*");
    },
  };
}

/** On a site page: answers term requests from plugin iframes inside it, using source. Pass recognize: false where content is being written, so every draft doesn't cost a model call. Returns a cleanup function. */
export function answerFrameRequests(source: TermSource, options: { recognize: boolean }): () => void {
  const onMessage = async (e: MessageEvent) => {
    const data = e.data;
    if (data?.type !== REQUEST || !isChildFrame(e.source)) return;
    const frame = e.source as Window;
    const reply = (result: unknown) => frame.postMessage({ type: RESPONSE, id: data.id, result }, "*");
    if (data.op === "recognize" && typeof data.text === "string") {
      reply(options.recognize ? await source.recognize(data.text) : []);
    } else if (data.op === "summary" && typeof data.title === "string") {
      reply(await source.summary(data.title));
    } else if (data.op === "open" && typeof data.url === "string" && WIKIPEDIA_ARTICLE.test(data.url)) {
      source.open(data.url);
    }
  };
  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}

function isChildFrame(source: MessageEventSource | null): boolean {
  if (!source) return false;
  for (let i = 0; i < window.frames.length; i++) {
    if (window.frames[i] === source) return true;
  }
  return false;
}
