import { useEffect, useState } from "react";
import type { Term } from "./terms";
import type { TermSource } from "./sources";

const NO_TERMS: Term[] = [];

/** The terms recognized in a piece of content: none until they arrive, and none without a source. The same array comes back until the terms change. */
export function useTerms(text: string, source: TermSource | null): Term[] {
  const [result, setResult] = useState<{ text: string; terms: Term[] } | null>(null);

  useEffect(() => {
    if (!source || !text.trim()) return;
    let cancelled = false;
    source.recognize(text).then((terms) => {
      if (!cancelled) setResult({ text, terms });
    });
    return () => {
      cancelled = true;
    };
  }, [text, source]);

  return result && result.text === text && result.terms.length ? result.terms : NO_TERMS;
}
