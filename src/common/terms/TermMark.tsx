import type { ReactNode } from "react";
import { TERM_CLASS, TERM_STYLE, type Term } from "./terms";

/** One occurrence of a key term in the text. It carries its popup's content, which TermLayer reads when it opens. */
export function TermMark({ term, children }: { term: Term; children: ReactNode }) {
  return (
    <span
      className={TERM_CLASS}
      data-term={term.term}
      data-definition={term.definition}
      data-url={term.url || undefined}
      tabIndex={0}
      style={TERM_STYLE}
    >
      {children}
    </span>
  );
}
