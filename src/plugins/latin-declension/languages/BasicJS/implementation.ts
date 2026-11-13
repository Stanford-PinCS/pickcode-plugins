import { Message } from "../../messages";

/** Student code may hand us a list or tuple of strings. */
function toStrings(input: unknown, fnName: string, argName: string): string[] {
  if (
    input == null ||
    typeof input === "string" ||
    typeof (input as Iterable<unknown>)[Symbol.iterator] !== "function"
  ) {
    throw new Error(`${fnName} expects ${argName} to be a list of words.`);
  }
  return Array.from(input as Iterable<unknown>, (v) => String(v));
}

const createExports = (sendMessage: (message: Message) => void) => {
  return Promise.resolve({
    drawSentence: (words: unknown, endings: unknown, roles: unknown) => {
      const w = toStrings(words, "show_sentence", "your words");
      const e = toStrings(endings, "show_sentence", "the endings");
      const r = toStrings(roles, "show_sentence", "the roles");
      if (w.length === 0) {
        throw new Error("show_sentence needs at least one word to show.");
      }
      if (w.length !== e.length || w.length !== r.length) {
        throw new Error("show_sentence got lists of different lengths.");
      }
      sendMessage({ type: "drawSentence", words: w, endings: e, roles: r });
    },
  });
};

export default createExports;
