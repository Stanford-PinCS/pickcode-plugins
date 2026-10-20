import type { Term } from "./term";

// Finding key terms in text: every occurrence of every spelling, as whole words, ignoring case, longest spelling first.

/** A piece of text: plain, or one occurrence of a term. */
export type TermPiece = string | { text: string; term: Term };

type Matcher = { re: RegExp; byForm: Map<string, Term> };

// Built once per term list; callers hand out the same array until the terms change.
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
