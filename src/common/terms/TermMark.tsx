import type { ReactNode } from "react";
import { TERM_CLASS, TERM_STYLE, type Term } from "./terms";

/** One occurrence of a recognized term in the text; TermLayer shows its popup. */
export function TermMark({ term, children }: { term: Term; children: ReactNode }) {
  return (
    <span className={TERM_CLASS} data-wiki={term.wikiTitle} tabIndex={0} style={TERM_STYLE}>
      {children}
    </span>
  );
}
