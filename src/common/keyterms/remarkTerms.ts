import { markAttributes, TERM_STYLE_CSS } from "./mark";
import { splitByTerms } from "./match";
import type { Term } from "./term";

type MdNode = {
  type: string;
  value?: string;
  children?: MdNode[];
  data?: Record<string, unknown>;
};

/** A remark plugin for react-markdown that marks key terms in the text with the same attributes as lesson text's marks (markAttributes). Code and link text are left alone. */
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
