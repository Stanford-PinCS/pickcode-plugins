# PinCS Plugin Style Guide

`AGENTS.md` has the rules. This is why they're the rules, plus the parts that
need judgement rather than enforcement.

## The problem this solves

Plugins were written at different times with different AI assistants and no
shared reference. The architecture stayed consistent — everyone kept the
`state` / `Component` / `messages` / `Plugin` split — but everything visual
drifted, because there was nothing to anchor to. Each plugin invented its own
palette, typography, and chart scaffolding from scratch.

The fix isn't a document nobody reads. It's `_template/` and
`shared/tokens.ts`: make the correct thing the easiest thing to copy.

## Color

The plugin pane sits directly beside the code editor inside the PinCS site
shell, which is cream and plum. A dark, neon plugin pane isn't a style
preference — it's a visible seam in the product.

- `surface` `#fdf4ee` — matches the site background
- `ink` `#4a2a38` — primary text
- `accent` `#d6446b` — emphasis and interaction
- `series[]` — categorical data, in order

Series colors are ordered. The primary data series is always `series[0]`, so a
student comparing two plugins sees "the thing I made" in the same color in
both. Reference and target lines use `color.reference`, never a series color —
predicted values and measured values should never look alike.

Colors are checked for contrast on `surface` and remain distinguishable in
grayscale, which matters for the colorblind students in any given class more
than it does for aesthetics.

## Typography

Two faces, two jobs. `font.ui` (Outfit, matching the site) for labels and
prose. `font.data` (a monospace) for every number.

Numbers use `fontVariantNumeric: "tabular-nums"` because most of these plugins
update a readout continuously. Proportional digits make the value jitter
horizontally as it changes, which is distracting when the whole point is to
watch a number converge.

## Layout

The plugin owns the output pane and nothing else. It does not draw a title, a
border, or outer chrome, and it never assumes a viewport width — the site
renders it at `max-w-[1200px]` beside the editor, and that will change.

Structure is always: `PluginSurface` > `PluginStage` (the visual) >
`StatRow` (the numbers). Stats go at the bottom because the visual is the point
and the numbers are the confirmation.

## Charts

Shared scaffolding exists because charting code is where drift compounds
fastest. `niceStep` was written once in coin-flip and was good; it's now in
`shared/chart.ts` so the next chart doesn't get a slightly different version.

Axes start at zero unless there's a reason not to. Students read magnitude off
these charts, and a truncated axis exaggerates differences. If a plugin needs a
non-zero minimum, that's a conversation in review, not a default.

## Writing for students

The audience is middle and high schoolers. Voice matters as much as visuals —
inconsistent tone reads as sloppy even when the UI is uniform.

- Second person, active voice. "Change `total_flips` and run it again," not
  "The `total_flips` variable may be modified."
- One idea per step. If a step has an "and" in it, it's two steps.
- Name things by what the student does, not how the system works. They flip
  coins; they don't dispatch a `plotLine` message.
- Empty states are instructions, not apologies. "Run your code to see the
  results" tells them what to do; "No data available" doesn't.
- Errors from `exports.ts` are read by a student who just made a mistake. Say
  what's wrong and what to do: "`plot_series` expects a list of numbers."

## Open questions for the team

Two decisions should be made before migrating the remaining plugins, because
they're cheap now and painful later:

**Instructions per language or per plugin?** The manifest currently puts
`instructionsUrl` at the plugin level while `implUrl` sits under a language key.
That means one instructions file shared across languages. Given the
`languages/` folders, per-language instructions may be wanted eventually.

**Should the manifest be generated?** It's hand-edited today, which is how a
duplicate `electric-field` key got committed. Generating it from the filesystem
at build time makes that class of bug impossible and removes the need to
remember an `instructionsUrl` entry when adding a plugin.

## Migration order

1. `shared/` and `_template/` land first, with no behavior changes. (This PR.)
2. `coin-flip` migrates as the reference — see the worked example.
3. Remaining plugins migrate individually, one PR each, so a visual regression
   is traceable to one plugin.
4. Add a lint rule banning hex literals inside `plugins/` once migration is
   done, so this doesn't happen again.
