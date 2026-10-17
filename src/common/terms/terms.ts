// Recognized terms, shared by lesson text on the site and plugin instructions inside the plugin iframe: the data format, the matcher, and how a term looks.

/** A term recognized in a lesson or a plugin's instructions, with the English Wikipedia article for the sense it's used in. */
export type Term = {
  /** The term's name. */
  term: string;
  /** Every spelling of it in the content, such as singular and plural. Matching ignores case. */
  forms: string[];
  wikiTitle: string;
};

/** The start of a Wikipedia article, as the popup shows it. */
export type TermSummary = { title: string; extract: string; url: string };

/** A piece of text: plain, or one occurrence of a term. */
export type TermPiece = string | { text: string; term: Term };

/** TermLayer finds terms by this class, which is what lets lesson text rendered as static HTML share the popup. */
export const TERM_CLASS = "pincs-term";
/** Each term's Wikipedia article title, read by TermLayer. */
export const TERM_WIKI_ATTR = "data-wiki";

/** A quiet dotted underline, since every occurrence of every term is marked. */
export const TERM_STYLE = {
  textDecorationLine: "underline",
  textDecorationStyle: "dotted",
  textDecorationColor: "rgba(100, 116, 139, 0.9)",
  textDecorationThickness: "1.5px",
  textUnderlineOffset: "3px",
  cursor: "help",
} as const;

/** TERM_STYLE as a CSS declaration string, for markup built outside React. */
export const TERM_STYLE_CSS = Object.entries(TERM_STYLE)
  .map(([key, value]) => `${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}: ${value}`)
  .join("; ");

type Matcher = { re: RegExp; byForm: Map<string, Term> };

// Built once per term list; useTerms hands out the same array until the terms change.
const matchers = new WeakMap<Term[], Matcher | null>();

function matcherFor(terms: Term[]): Matcher | null {
  const known = matchers.get(terms);
  if (known !== undefined) return known;
  const byForm = new Map<string, Term>();
  for (const term of terms) {
    for (const form of term.forms) {
      const key = form.trim().toLowerCase();
      if (key && !byForm.has(key)) byForm.set(key, term);
    }
  }
  // Longest first, so "moment of inertia" wins over "inertia".
  const alternatives = [...byForm.keys()]
    .sort((a, b) => b.length - a.length)
    .map((form) => form.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  // The leading group stands in for a lookbehind, which older Safari doesn't support.
  const matcher = alternatives.length
    ? {
        re: new RegExp(`(^|[^\\p{L}\\p{N}_])(${alternatives.join("|")})(?=[^\\p{L}\\p{N}_]|$)`, "giu"),
        byForm,
      }
    : null;
  matchers.set(terms, matcher);
  return matcher;
}

/** Splits text into plain strings and term occurrences. Only whole words match, case is ignored, and the longest form wins. */
export function splitByTerms(text: string, terms: Term[]): TermPiece[] {
  const matcher = text && terms.length ? matcherFor(terms) : null;
  if (!matcher) return [text];
  const pieces: TermPiece[] = [];
  let last = 0;
  for (const match of text.matchAll(matcher.re)) {
    const word = match[2];
    const term = matcher.byForm.get(word.toLowerCase());
    if (!term) continue;
    const start = (match.index ?? 0) + match[1].length;
    if (start > last) pieces.push(text.slice(last, start));
    pieces.push({ text: word, term });
    last = start + word.length;
  }
  if (last === 0) return [text];
  if (last < text.length) pieces.push(text.slice(last));
  return pieces;
}
