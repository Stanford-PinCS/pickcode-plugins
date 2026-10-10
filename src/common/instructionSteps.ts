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

/* ------------------------------------------------------------------ *
 * <Question> blocks
 *
 * A comprehension check the student answers inside the instructions,
 * written in instructions.md like this:
 *
 *   <Question>
 *   What happens to the proportion of heads as you add more flips?
 *   - [ ] It keeps swinging wildly no matter how many you add
 *   - [x] It settles closer and closer to 0.5
 *   - [ ] It climbs steadily toward 1
 *   > Each new flip is averaged in with all the previous ones, so one
 *   > flip moves the proportion less and less as the total grows.
 *   </Question>
 *
 * Prompt first, then the choices as a task list with `[x]` on the correct
 * one, then an optional `>` explanation revealed once they get it right.
 * The same syntax is understood by the PinCS site's lesson instructions
 * renderer (MarkdownRenderer.tsx), so a question written once renders the
 * same whether it appears in a plugin band or a lesson slide.
 * ------------------------------------------------------------------ */

/** One choice in a <Question>. Exactly one option per question is correct. */
export interface QuestionOption {
  text: string;
  correct: boolean;
}

export interface Question {
  prompt: string;
  options: QuestionOption[];
  /** Revealed after the student answers correctly. Optional. */
  explanation?: string;
}

/** A step body is prose with zero or more questions embedded in it. */
export type StepSegment =
  | { kind: "prose"; markdown: string }
  | { kind: "question"; question: Question };

/**
 * Matches one <Question>...</Question> block. A function, not a constant: a
 * /g regex carries `lastIndex` between uses, so a shared instance would skip
 * blocks depending on who scanned last. The PinCS site's MarkdownRenderer
 * calls this too, so the tag's syntax is defined in exactly one place.
 */
export const questionBlockPattern = () => /<question>([\s\S]*?)<\/question>/gi;
const OPTION_LINE = /^[-*]\s*\[([ xX])\]\s*(.+)$/;

/**
 * Parses the inside of a <Question> block.
 *
 * Returns null for a block that can't be graded — no prompt, fewer than two
 * choices, or no `[x]` marking the answer. Callers drop those rather than
 * render a broken card, so a malformed question never blocks the lesson.
 */
export function parseQuestion(inner: string): Question | null {
  const promptLines: string[] = [];
  const options: QuestionOption[] = [];
  const explanationLines: string[] = [];

  for (const rawLine of inner.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    const option = OPTION_LINE.exec(line);
    if (option) {
      options.push({
        text: option[2].trim(),
        correct: option[1].toLowerCase() === "x",
      });
    } else if (line.startsWith(">")) {
      explanationLines.push(line.replace(/^>\s?/, ""));
    } else if (options.length === 0) {
      // Prose before the first choice is the prompt. Prose *after* the
      // choices is ambiguous (prompt? explanation?), so it's ignored.
      promptLines.push(line);
    }
  }

  const prompt = promptLines.join(" ").trim();
  if (!prompt || options.length < 2) return null;
  if (!options.some((o) => o.correct)) return null;

  const explanation = explanationLines.join(" ").trim();
  return { prompt, options, explanation: explanation || undefined };
}

/**
 * Splits one step's body into prose and question segments, in order, so the
 * renderer can hand prose to the markdown renderer and questions to the
 * question card. Prose-only bodies come back as a single segment.
 */
export function parseStepBody(body: string): StepSegment[] {
  const segments: StepSegment[] = [];
  let cursor = 0;

  for (const match of body.matchAll(questionBlockPattern())) {
    const start = match.index ?? 0;
    const prose = body.slice(cursor, start).trim();
    if (prose) segments.push({ kind: "prose", markdown: prose });

    const question = parseQuestion(match[1]);
    if (question) segments.push({ kind: "question", question });

    cursor = start + match[0].length;
  }

  const trailing = body.slice(cursor).trim();
  if (trailing) segments.push({ kind: "prose", markdown: trailing });

  return segments;
}
