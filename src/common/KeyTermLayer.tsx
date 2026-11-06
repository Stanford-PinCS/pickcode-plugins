import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { color, font, radius } from "./tokens";
import { isWikipediaArticle } from "./keyTerms";
import { readMark, TERM_CLASS } from "./keyTermMarks";

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

const OPEN_DELAY_MS = 150;
const CLOSE_DELAY_MS = 200;
const TAP_SLOP_PX = 10;
const GAP_PX = 6;
const EDGE_PX = 8;
const POPUP_ID = "pincs-term-popup";

// The first layer in a document handles every term in it; any other stays idle.
let layersMounted = 0;

type Opened = { el: HTMLElement; term: string; definition: string; url: string | null };

function readTerm(el: HTMLElement): Opened | null {
  const mark = readMark(el);
  return mark && { el, ...mark };
}

/** The popup for key terms: hovering, focusing or tapping one shows its definition. Mount one per document; it finds terms by event delegation, so lesson text rendered as static HTML works too. */
export function KeyTermLayer({ openArticle }: { openArticle: ArticleOpener }) {
  const [active, setActive] = useState(false);
  const [opened, setOpened] = useState<Opened | null>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  // Bumped when the page scrolls or resizes, so an open popup follows its term instead of closing: focusing a term below the fold scrolls it into view, and that mustn't close the popup the focus just opened.
  const [layoutTick, setLayoutTick] = useState(0);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const linkRef = useRef<HTMLAnchorElement | null>(null);
  const openedRef = useRef<Opened | null>(null);
  // The term keyboard focus is returning to from the popup's link, which shouldn't reopen the popup as it takes focus.
  const quietFocus = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    openedRef.current = opened;
  }, [opened]);

  useEffect(() => {
    if (layersMounted > 0) return;
    layersMounted++;
    setActive(true);
    return () => {
      layersMounted--;
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let frame = 0;
    let down: { x: number; y: number } | null = null;

    const termAt = (target: EventTarget | null) =>
      target instanceof Element ? target.closest<HTMLElement>(`.${TERM_CLASS}`) : null;
    const inPopup = (target: EventTarget | null) =>
      target instanceof Node && !!popupRef.current?.contains(target);
    const cancel = () => clearTimeout(timer);
    const after = (ms: number, run: () => void) => {
      cancel();
      timer = setTimeout(run, ms);
    };
    const show = (el: HTMLElement) => {
      cancel();
      setOpened((current) => (current?.el === el ? current : readTerm(el)));
    };
    const toggle = (el: HTMLElement) => {
      cancel();
      setOpened((current) => (current?.el === el ? null : readTerm(el)));
    };
    const hide = () => {
      cancel();
      setOpened(null);
    };

    const onPointerOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const el = termAt(e.target);
      if (el) after(OPEN_DELAY_MS, () => show(el));
      else if (inPopup(e.target)) cancel();
    };
    const onPointerOut = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const from = termAt(e.target);
      if (!from && !inPopup(e.target)) return;
      if ((from && termAt(e.relatedTarget) === from) || inPopup(e.relatedTarget)) return;
      after(CLOSE_DELAY_MS, hide);
    };
    const onPointerDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY };
      if (!termAt(e.target) && !inPopup(e.target)) hide();
    };
    // Touch screens have no hover, so a tap opens and closes the popup.
    const onPointerUp = (e: PointerEvent) => {
      const start = down;
      down = null;
      if (e.pointerType === "mouse" || !start) return;
      const el = termAt(e.target);
      if (el && Math.hypot(e.clientX - start.x, e.clientY - start.y) <= TAP_SLOP_PX) toggle(el);
    };
    const onFocusIn = (e: FocusEvent) => {
      const el = termAt(e.target);
      if (!el) return;
      if (quietFocus.current === el) {
        quietFocus.current = null;
        return;
      }
      show(el);
    };
    // Focus moving between a term and its popup keeps the popup; leaving both closes it.
    const onFocusOut = (e: FocusEvent) => {
      if (!termAt(e.target) && !inPopup(e.target)) return;
      const to = e.relatedTarget;
      if (inPopup(to) || (openedRef.current && termAt(to) === openedRef.current.el)) return;
      after(CLOSE_DELAY_MS, hide);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") return hide();
      const el = termAt(e.target);
      if (!el) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle(el);
      } else if (e.key === "Tab" && !e.shiftKey && openedRef.current?.el === el && linkRef.current) {
        // The popup sits at the end of the page, where Tab would never reach it, so Tab steps into its link.
        e.preventDefault();
        cancel();
        linkRef.current.focus();
      }
    };
    const onScrollOrResize = (e: Event) => {
      if (inPopup(e.target) || frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setLayoutTick((tick) => tick + 1);
      });
    };

    document.addEventListener("pointerover", onPointerOver);
    document.addEventListener("pointerout", onPointerOut);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      cancel();
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerout", onPointerOut);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [active]);

  useEffect(() => {
    if (!opened) return;
    opened.el.setAttribute("aria-describedby", POPUP_ID);
    return () => opened.el.removeAttribute("aria-describedby");
  }, [opened]);

  // Below the term, or above it when there's no room below; kept inside the viewport and moved with the term when the page scrolls. A term scrolled out of sight closes its popup.
  useLayoutEffect(() => {
    const popup = popupRef.current;
    if (!opened || !popup) return setPosition(null);
    if (!opened.el.isConnected) return setOpened(null);
    const term = opened.el.getBoundingClientRect();
    const viewport = document.documentElement;
    if (term.bottom < 0 || term.top > viewport.clientHeight) return setOpened(null);
    const box = popup.getBoundingClientRect();
    const left = Math.max(EDGE_PX, Math.min(term.left, viewport.clientWidth - box.width - EDGE_PX));
    const below = term.bottom + GAP_PX;
    const above = term.top - GAP_PX - box.height;
    const fitsBelow = below + box.height <= viewport.clientHeight - EDGE_PX;
    setPosition({ left, top: fitsBelow || above < EDGE_PX ? below : above });
  }, [opened, layoutTick]);

  if (!active || !opened) return null;

  return createPortal(
    <div
      ref={popupRef}
      id={POPUP_ID}
      role="tooltip"
      style={{
        ...POPUP_STYLE,
        left: position?.left ?? 0,
        top: position?.top ?? 0,
        visibility: position ? "visible" : "hidden",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{opened.term}</div>
      <div>{opened.definition}</div>
      {opened.url && (
        <div style={{ marginTop: 8, fontSize: 12, color: color.inkMuted }}>
          <a
            ref={linkRef}
            href={opened.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault();
              openArticle(opened.url!);
            }}
            // Tab, Shift+Tab and Escape take focus back to the term. Tab and Escape also close the popup, so the next Tab moves on from the term.
            onKeyDown={(e) => {
              if (e.key !== "Tab" && e.key !== "Escape") return;
              e.preventDefault();
              if (e.key === "Escape" || !e.shiftKey) {
                quietFocus.current = opened.el;
                setOpened(null);
              }
              opened.el.focus();
            }}
            style={{ color: color.accent, textDecoration: "underline" }}
          >
            From Wikipedia
          </a>
          {" · CC BY-SA 4.0"}
        </div>
      )}
    </div>,
    document.body
  );
}

const POPUP_STYLE: CSSProperties = {
  position: "fixed",
  zIndex: 2147483000,
  boxSizing: "border-box",
  width: "max-content",
  maxWidth: `min(320px, calc(100vw - ${EDGE_PX * 2}px))`,
  // A long definition scrolls inside the popup instead of running off the page.
  maxHeight: `min(320px, calc(100vh - ${EDGE_PX * 2}px))`,
  overflowY: "auto",
  padding: "10px 12px",
  background: color.surface,
  color: color.ink,
  border: `1px solid ${color.border}`,
  borderRadius: radius.md,
  fontFamily: font.ui,
  fontSize: 14,
  fontWeight: 400,
  lineHeight: 1.45,
  textAlign: "left",
  whiteSpace: "pre-line",
};
