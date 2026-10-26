import { isWikipediaArticle } from "./term";

// Opening a key term's Wikipedia article from its popup: directly on site pages, and through the page around it inside a sandboxed plugin iframe, which can't open windows.

/** Opens a Wikipedia article in a new tab. Anything that isn't an English Wikipedia article is ignored. */
export type ArticleOpener = (url: string) => void;

const MESSAGE = "pincs-terms-open";
const OPENED = "pincs-terms-opened";
// How long a frame waits for the page around it to say it opened the article before opening it itself, well inside the click's user activation.
const ANSWER_MS = 300;

/** On a site page: opens the article directly. */
export const openArticle: ArticleOpener = (url) => {
  if (isWikipediaArticle(url)) window.open(url, "_blank", "noopener,noreferrer");
};

/** Inside a plugin iframe: asks the page around it to open the article, since a sandboxed frame can't. When nothing answers, as around a plugin opened on its own or in a page that doesn't open articles for frames, the frame opens it itself. */
export const openArticleFromFrame: ArticleOpener = (url) => {
  if (!isWikipediaArticle(url)) return;
  if (window.parent === window) return openArticle(url);
  const id = Math.random().toString(36).slice(2);
  let answered = false;
  const onAnswer = (e: MessageEvent) => {
    if (e.source === window.parent && e.data?.type === OPENED && e.data.id === id) answered = true;
  };
  window.addEventListener("message", onAnswer);
  window.parent.postMessage({ type: MESSAGE, url, id }, "*");
  setTimeout(() => {
    window.removeEventListener("message", onAnswer);
    if (!answered) openArticle(url);
  }, ANSWER_MS);
};

/** On a site page: opens the Wikipedia articles that plugin iframes inside it ask for, and tells the frame it did. Returns a cleanup function. */
export function openArticlesForFrames(): () => void {
  const onMessage = (e: MessageEvent) => {
    const data = e.data;
    if (data?.type !== MESSAGE || !isWikipediaArticle(data.url) || !isChildFrame(e.source)) return;
    openArticle(data.url);
    if (typeof data.id === "string") (e.source as Window).postMessage({ type: OPENED, id: data.id }, "*");
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
