import { isTerm, type Term } from "./term";

// A plugin's key terms live at the end of its instructions file, in an HTML comment that markdown renderers don't show.
const OPENER = "<!-- pincs-key-terms";
const BLOCK = /(?:\n\n)?<!-- pincs-key-terms\n([\s\S]*?)\n?-->\n?$/;

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
