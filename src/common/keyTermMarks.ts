import { color } from "./tokens";
import { isWikipediaArticle, splitByTerms, type Term } from "./keyTerms";

// How an occurrence of a key term is marked in the page. Lesson text (the site's TermMark) and plugin instructions (remarkTermMark) both write the mark with markAttributes, and KeyTermLayer reads it back with readMark, so the popup works the same on every mark.

/** KeyTermLayer finds marks by this class, which is what lets lesson text rendered as static HTML share the popup. */
export const TERM_CLASS = "pincs-term";

/** A quiet dotted underline, since every occurrence of every term is marked. */
export const TERM_STYLE = {
  textDecorationLine: "underline",
  textDecorationStyle: "dotted",
  textDecorationColor: color.inkMuted,
  textDecorationThickness: "1.5px",
  textUnderlineOffset: "3px",
  cursor: "help",
} as const;

/** TERM_STYLE as a CSS declaration string, for markup built outside React. */
export const TERM_STYLE_CSS = Object.entries(TERM_STYLE)
  .map(([key, value]) => `${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}: ${value}`)
  .join("; ");

/** The attributes that make an element a term's mark and carry what its popup shows. They work as React props and as remark's hProperties alike. */
export function markAttributes(term: Term) {
  return {
    className: TERM_CLASS,
    "data-term": term.term,
    "data-definition": term.definition,
    "data-url": isWikipediaArticle(term.url) ? term.url : undefined,
    tabIndex: 0,
  };
}

/** What a mark's popup shows, read back from the attributes markAttributes wrote. Null for an element with no definition. */
export function readMark(el: Element): { term: string; definition: string; url: string | null } | null {
  const definition = el.getAttribute("data-definition");
  if (!definition) return null;
  const url = el.getAttribute("data-url");
  return { term: el.getAttribute("data-term") ?? el.textContent ?? "", definition, url: isWikipediaArticle(url) ? url : null };
}

type MdNode = {
  type: string;
  value?: string;
  children?: MdNode[];
  data?: Record<string, unknown>;
};

/** A remark plugin for react-markdown that marks key terms in plugin instructions: the Markdown counterpart of the site's TermMark, which marks lesson text, and it writes the same mark (markAttributes). Code and link text are left alone. */
export function remarkTermMark(terms: Term[]) {
  return () => (tree: unknown) => {
    if (terms.length) markTerms(tree as MdNode, terms);
  };
}

function markTerms(node: MdNode, terms: Term[]) {
  if (!node.children) return;
  const children: MdNode[] = [];
  for (const child of node.children) {
    if (child.type === "text" && child.value) {
      for (const piece of splitByTerms(child.value, terms)) {
        if (typeof piece === "string") {
          if (piece) children.push({ type: "text", value: piece });
          continue;
        }
        children.push({
          type: "pincsTerm",
          children: [{ type: "text", value: piece.text }],
          data: {
            hName: "span",
            hProperties: { ...markAttributes(piece.term), style: TERM_STYLE_CSS },
          },
        });
      }
      continue;
    }
    if (child.type !== "link" && child.type !== "linkReference") markTerms(child, terms);
    children.push(child);
  }
  node.children = children;
}
