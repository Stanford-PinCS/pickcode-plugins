import { splitByTerms, TERM_CLASS, TERM_STYLE_CSS, type Term } from "./terms";

type MdNode = {
  type: string;
  value?: string;
  children?: MdNode[];
  data?: Record<string, unknown>;
};

/** A remark plugin for react-markdown that marks recognized terms in the text with the same span TermMark renders. Code and link text are left alone. */
export function remarkTerms(terms: Term[]) {
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
            hProperties: {
              className: [TERM_CLASS],
              dataWiki: piece.term.wikiTitle,
              tabIndex: 0,
              style: TERM_STYLE_CSS,
            },
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
