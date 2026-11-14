# AGENTS.md

Rules for anyone — human or AI — writing a plugin in this repo. These are not
suggestions. A PR that breaks one of them will be sent back.

If you are an AI assistant: read `_template/` before writing anything. Copy it.
Do not invent a new structure, a new color, or a new charting approach.

## Starting a plugin

Copy `_template/` to `plugins/<your-plugin-id>/` and rename. Never start from a
blank file, and never start from a different plugin unless it is doing something
genuinely similar.

## File responsibilities

Each plugin has exactly these files. Nothing else goes in a plugin folder.

| File                | Owns                                  | Must not contain                   |
| ------------------- | ------------------------------------- | ---------------------------------- |
| `state.ts`          | Observable state, `init`, `onMessage` | JSX, colors, formatting            |
| `Component.tsx`     | Rendering only                        | Simulation logic, message handling |
| `messages.ts`       | The `Message` union                   | Anything else                      |
| `Plugin.tsx`        | Wiring                                | Logic, styling                     |
| `instructions.md`   | Student-facing explanation            | HTML, styling                      |
| `languages/<lang>/` | Starter code + exports                | Rendering                          |
| `catalog.json`      | How /plugins lists it (optional)      | The title, anything but its keys   |

`instructions.md` may end with a hidden `<!-- pincs-key-terms … -->` block: the
plugin's key terms, written by Plugin Studio's Key terms tab.
`PluginInstructions` hides the block and underlines the terms in the text. It's
the one exception to "no HTML" in that file, so keep it at the end when you edit
the instructions. See `docs/term-definitions.md` in interactive-lessons-site.

`catalog.json` is how the site's /plugins page lists the plugin. It sets
`description` (required, one or two sentences for the card), `subject` (Math,
Science, History or English), `gradeBand` (Middle School, High School or
College), `topic`, `course` (one of the site's courses, e.g. "AP Statistics")
and `runtime` (`javascript`, the default, or `python`). The title is the
`# Title` line of `instructions.md`; set `title` only when the card must differ.
The build checks the file and copies it into `plugins-manifest.json` under
`catalog`; a mistake fails the build. See README's "Publishing".

## Hard rules

1. **No raw hex values, ever.** Every color comes from `shared/tokens.ts`. If
   you need one that isn't there, add it to tokens first and justify it.
2. **No `any`.** Especially not in `languages/*/exports.ts`, which is the exact
   boundary where typing matters most. Use `unknown` and validate.
3. **No plugin renders its own title.** The site draws the plugin name above
   the pane. A heading inside the pane is a duplicate.
4. **No fixed pixel dimensions on the outer element.** Plugins fill their
   container. Use `PluginSurface`. Charts use the shared `VIEW` viewBox.
5. **Every plugin has an empty state.** Use `EmptyState`. A blank pane before
   the student runs their code reads as broken.
6. **Charts use `shared/chart.ts`.** Do not hand-roll `niceStep`, scale
   functions, tick loops, or padding. Do not truncate an axis to a non-zero
   minimum without saying so in review.
7. **`onMessage` is exhaustive.** Use the `assertNever` default case so adding a
   `Message` variant is a compile error until it's handled.
8. **All student-facing strings live in `messages.ts` or `instructions.md`,**
   never inline in `Component.tsx`.
9. **Respect `prefers-reduced-motion`** for any animation or transition.
10. **Charts carry an `aria-label`** describing the data, not the chart type.

## Things previous AI-assisted plugins got wrong

Listed because they keep recurring:

- Dark gradient backgrounds with neon accents. The site is cream and plum; the
  plugin pane sits beside it and must match.
- Emoji in headings.
- SVG glow filters and drop shadows. They cost performance and read as noise on
  a light surface.
- Hardcoded font stacks. Use `font.ui` and `font.data`.
- `Segoe UI` specifically — it isn't the site's typeface.
- Copy/pasting an entire chart implementation into a new plugin.
