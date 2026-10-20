/** How the popup opens a term's Wikipedia article: directly on site pages, and through the page around it inside a sandboxed plugin iframe, which can't open windows. */
export interface TermSource {
  open(url: string): void;
}

const OPEN = "pincs-terms-open";
const WIKIPEDIA_ARTICLE = /^https:\/\/en\.wikipedia\.org\/wiki\/[^\s]+$/;

const openTab = (url: string) => {
  window.open(url, "_blank", "noopener,noreferrer");
};

export const pageTermSource: TermSource = { open: openTab };

/** Inside a plugin iframe: asks the page around it to open the article. A plugin opened on its own opens it directly. */
export const frameTermSource: TermSource = {
  open(url) {
    if (window.parent !== window) window.parent.postMessage({ type: OPEN, url }, "*");
    else openTab(url);
  },
};

/** On a site page: opens the Wikipedia articles that plugin iframes inside it ask for. Returns a cleanup function. */
export function answerFrameRequests(): () => void {
  const onMessage = (e: MessageEvent) => {
    const data = e.data;
    if (data?.type !== OPEN || typeof data.url !== "string" || !WIKIPEDIA_ARTICLE.test(data.url)) return;
    if (isChildFrame(e.source)) openTab(data.url);
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
