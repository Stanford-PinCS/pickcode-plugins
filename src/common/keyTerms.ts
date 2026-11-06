// Key terms: what one is, where a plugin stores its list, and finding them in text. A lesson stores its list on its first slide and a plugin at the end of its instructions; lesson text on the site and plugin instructions inside the plugin iframe both read it.

/** A key term the author confirmed: what to underline, and what its popup says. */
export type Term = {
  /** The term's name, shown as the popup's heading. */
  term: string;
  /** Every spelling of it in the text, such as singular and plural. Matching ignores case. */
  forms: string[];
  /** The popup's text: filled in from Wikipedia when extracted, and the author can rewrite it. */
  definition: string;
  /** The Wikipedia article the definition came from, as the Key terms editor shows it. */
  wikiTitle?: string;
  /** That article's address, for the popup's link. */
  url?: string;
};

/** True for a well-formed term, as stored in a lesson or in a plugin's instructions. */
export function isTerm(value: unknown): value is Term {
  const t = value as Term;
  return (
    typeof t === "object" &&
    t !== null &&
    typeof t.term === "string" &&
    typeof t.definition === "string" &&
    Array.isArray(t.forms) &&
    t.forms.every((form) => typeof form === "string") &&
    (t.wikiTitle === undefined || typeof t.wikiTitle === "string") &&
    (t.url === undefined || typeof t.url === "string")
  );
}

const WIKIPEDIA_ARTICLE = /^https:\/\/en\.wikipedia\.org\/wiki\/[^\s]+$/;

/** True for an English Wikipedia article URL, the only kind of link a popup shows or opens: a lesson's JSON can be edited by hand, so a stored url can't be trusted to be one. */
export function isWikipediaArticle(url: unknown): url is string {
  return typeof url === "string" && WIKIPEDIA_ARTICLE.test(url);
}

// A plugin's key terms live at the end of its instructions file, in an HTML comment that markdown renderers don't show.
const OPENER = "<!-- pincs-key-terms";
// CRLF line endings (a Windows checkout) and blank lines or spaces after the block (an editor's final newline) still read as the block.
const BLOCK = /(?:\r?\n){0,2}<!-- pincs-key-terms[ \t]*\r?\n([\s\S]*?)\r?\n?-->\s*$/;

/** Splits instructions into what students read and the key terms stored after it. */
export function readTermsBlock(markdown: string): { body: string; terms: Term[] } {
  const match = markdown.match(BLOCK);
  if (!match) return { body: markdown, terms: [] };
  let terms: Term[] = [];
  try {
    const parsed = JSON.parse(match[1]);
    if (Array.isArray(parsed)) terms = parsed.filter(isTerm);
  } catch {
    // A hand-edited block that no longer parses just means no key terms.
  }
  return { body: markdown.slice(0, match.index), terms };
}

/** The instructions with these key terms stored at the end, replacing whatever was stored before. No terms, no block. */
export function writeTermsBlock(markdown: string, terms: Term[]): string {
  const { body } = readTermsBlock(markdown);
  if (!terms.length) return body;
  // "-->" inside a definition would end the comment early, so it's escaped; JSON.parse turns it back.
  const json = JSON.stringify(terms, null, 2).replace(/-->/g, "--\\u003e");
  return `${body}\n\n${OPENER}\n${json}\n-->\n`;
}

// Finding key terms in text: every occurrence of every spelling, as whole words, ignoring case, longest spelling first.

/** A piece of text: plain, or one occurrence of a term. */
export type TermPiece = string | { text: string; term: Term };

type Matcher = { re: RegExp; byForm: Map<string, Term> };

// A form's words can be split by any run of whitespace in the text, such as the line break in a hard-wrapped "moment of\ninertia", so forms are compared with their whitespace collapsed.
const normalize = (form: string) => form.trim().replace(/\s+/g, " ").toLowerCase();

// Built once per term list; callers hand out the same array until the terms change.
const matchers = new WeakMap<Term[], Matcher | null>();

function matcherFor(terms: Term[]): Matcher | null {
  const known = matchers.get(terms);
  if (known !== undefined) return known;
  const byForm = new Map<string, Term>();
  for (const term of terms) {
    for (const form of term.forms) {
      const key = normalize(form);
      if (key && !byForm.has(key)) byForm.set(key, term);
    }
  }
  // Longest first, so "moment of inertia" wins over "inertia".
  const alternatives = [...byForm.keys()]
    .sort((a, b) => b.length - a.length)
    .map((form) =>
      form
        .split(" ")
        .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("\\s+"),
    );
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
    const term = matcher.byForm.get(normalize(word));
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
