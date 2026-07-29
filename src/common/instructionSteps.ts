/**
 * Splits an instructions.md file into one step per `##` heading.
 *
 * The `#` title at the top becomes the first step, so the intro paragraph
 * isn't stranded. Everything after a `##` belongs to that step until the
 * next one. HTML comments are stripped.
 *
 * This is why AGENTS.md fixes the heading structure: the same markdown
 * renders correctly whether it's paginated or read straight through.
 */

export interface InstructionStep {
  title: string;
  body: string;
}

export function parseSteps(markdown: string): InstructionStep[] {
  const cleaned = markdown.replace(/<!--[\s\S]*?-->/g, "");
  const steps: InstructionStep[] = [];

  let title = "";
  let buffer: string[] = [];
  let started = false;

  const flush = () => {
    if (!started) return;
    const body = buffer.join("\n").trim();
    if (title || body) steps.push({ title, body });
  };

  for (const line of cleaned.split("\n")) {
    const h2 = /^##\s+(.+)$/.exec(line);
    const h1 = /^#\s+(.+)$/.exec(line);

    if (h2) {
      flush();
      title = h2[1].trim();
      buffer = [];
      started = true;
    } else if (h1 && !started) {
      title = h1[1].trim();
      buffer = [];
      started = true;
    } else if (started) {
      buffer.push(line);
    }
  }
  flush();

  return steps;
}
