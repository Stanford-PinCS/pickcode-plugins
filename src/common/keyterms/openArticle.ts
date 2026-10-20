// Opening a key term's Wikipedia article from its popup: directly on site pages, and through the page around it inside a sandboxed plugin iframe, which can't open windows.

/** Opens a Wikipedia article in a new tab. */
export type ArticleOpener = (url: string) => void;

const MESSAGE = "pincs-terms-open";
const WIKIPEDIA_ARTICLE = /^https:\/\/en\.wikipedia\.org\/wiki\/[^\s]+$/;

/** On a site page: opens the article directly. */
export const openArticle: ArticleOpener = (url) => {
  window.open(url, "_blank", "noopener,noreferrer");
};

/** Inside a plugin iframe: asks the page around it to open the article. A plugin opened on its own opens it directly. */
export const openArticleFromFrame: ArticleOpener = (url) => {
  if (window.parent !== window) window.parent.postMessage({ type: MESSAGE, url }, "*");
  else openArticle(url);
};

/** On a site page: opens the Wikipedia articles that plugin iframes inside it ask for. Returns a cleanup function. */
export function openArticlesForFrames(): () => void {
  const onMessage = (e: MessageEvent) => {
    const data = e.data;
    if (data?.type !== MESSAGE || typeof data.url !== "string" || !WIKIPEDIA_ARTICLE.test(data.url)) return;
    if (isChildFrame(e.source)) openArticle(data.url);
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
