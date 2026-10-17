import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { TERM_CLASS, TERM_WIKI_ATTR, type TermSummary } from "./terms";
import type { TermSource } from "./sources";

const OPEN_DELAY_MS = 150;
const CLOSE_DELAY_MS = 200;
const TAP_SLOP_PX = 10;
const GAP_PX = 6;
const EDGE_PX = 8;
const POPUP_ID = "pincs-term-popup";

// The first layer in a document handles every term in it; any other stays idle.
let layersMounted = 0;

type Opened = { el: HTMLElement; title: string };

/** The popup for recognized terms: hovering, focusing or tapping one shows the start of its Wikipedia article. Mount one per document; it finds terms by event delegation, so lesson text rendered as static HTML works too. */
export function TermLayer({ source }: { source: TermSource }) {
  const [active, setActive] = useState(false);
  const [opened, setOpened] = useState<Opened | null>(null);
  // Keyed by title, so switching terms never shows the previous term's summary.
  const [loaded, setLoaded] = useState<{ title: string; summary: TermSummary | null } | null>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);

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
      const title = el.getAttribute(TERM_WIKI_ATTR);
      if (title) setOpened((current) => (current?.el === el ? current : { el, title }));
    };
    const toggle = (el: HTMLElement) => {
      cancel();
      const title = el.getAttribute(TERM_WIKI_ATTR);
      setOpened((current) => (current?.el === el || !title ? null : { el, title }));
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
      if (el) show(el);
    };
    const onFocusOut = (e: FocusEvent) => {
      if (termAt(e.target) && !inPopup(e.relatedTarget)) after(CLOSE_DELAY_MS, hide);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") return hide();
      const el = termAt(e.target);
      if (el && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        toggle(el);
      }
    };
    const onScroll = (e: Event) => {
      if (!inPopup(e.target)) hide();
    };

    document.addEventListener("pointerover", onPointerOver);
    document.addEventListener("pointerout", onPointerOut);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", hide);
    return () => {
      cancel();
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerout", onPointerOut);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", hide);
    };
  }, [active]);

  const title = opened?.title;
  useEffect(() => {
    if (!title) return;
    let cancelled = false;
    source.summary(title).then((summary) => {
      if (!cancelled) setLoaded({ title, summary });
    });
    return () => {
      cancelled = true;
    };
  }, [title, source]);
  const summary = opened && loaded?.title === opened.title ? loaded.summary : "loading";

  useEffect(() => {
    if (!opened) return;
    opened.el.setAttribute("aria-describedby", POPUP_ID);
    return () => opened.el.removeAttribute("aria-describedby");
  }, [opened]);

  // Below the term, or above it when there's no room below; kept inside the viewport.
  useLayoutEffect(() => {
    const popup = popupRef.current;
    if (!opened || !popup) return setPosition(null);
    if (!opened.el.isConnected) return setOpened(null);
    const term = opened.el.getBoundingClientRect();
    const box = popup.getBoundingClientRect();
    const viewport = document.documentElement;
    const left = Math.max(EDGE_PX, Math.min(term.left, viewport.clientWidth - box.width - EDGE_PX));
    const below = term.bottom + GAP_PX;
    const above = term.top - GAP_PX - box.height;
    const fitsBelow = below + box.height <= viewport.clientHeight - EDGE_PX;
    setPosition({ left, top: fitsBelow || above < EDGE_PX ? below : above });
  }, [opened, summary]);

  if (!active || !opened || summary === null) return null;

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
      {summary === "loading" ? (
        <span style={{ color: MUTED }}>Looking up {opened.title}…</span>
      ) : (
        <>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{summary.title}</div>
          <div>{summary.extract}</div>
          <div style={{ marginTop: 8, fontSize: 12, color: MUTED }}>
            <a
              href={summary.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                source.open(summary.url);
              }}
              style={{ color: "#2563eb", textDecoration: "underline" }}
            >
              From Wikipedia
            </a>
            {" · CC BY-SA 4.0"}
          </div>
        </>
      )}
    </div>,
    document.body
  );
}

const MUTED = "#64748b";

const POPUP_STYLE: CSSProperties = {
  position: "fixed",
  zIndex: 2147483000,
  boxSizing: "border-box",
  width: "max-content",
  maxWidth: `min(320px, calc(100vw - ${EDGE_PX * 2}px))`,
  padding: "10px 12px",
  background: "#ffffff",
  color: "#1e293b",
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.18)",
  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  fontSize: 14,
  fontWeight: 400,
  lineHeight: 1.45,
  textAlign: "left",
  whiteSpace: "normal",
};
