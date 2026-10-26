// What a key term is. A lesson stores its list on its first slide and a plugin at the end of its instructions; lesson text on the site and plugin instructions inside the plugin iframe both read it.

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
