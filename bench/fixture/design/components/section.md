---
name: Section
status: built
figma: '4:547'
figma_version: '2420007015776322844'
approved_by: 'Yassine Bakiri'
story: 'Components/Section'
---

# Section

## Purpose

One band of the page, delimited by a raster line at its top: a title with its lead beside it, then wide content under them, on the page's width, no wider than `size/column` (976). Every section of `flows.yml`'s view `landing` but the top bar and the hero is one.

Amended 2026-11-09 (round 2, approved at the design gate the same day, the designer: "gate is passed"; built in code the same day), drawn by the designer in Figma: the content at `size/column` (before, `size/content-max`, 1200); the title beside the text (before, above it), in a fixed column so every section's text starts at the same place; stacked under 1024px; the wide blocks (steps, diagram, chart, commands) the column's full width under the title and its lead.

## Anatomy

| Part    | Figma layer                                                          | Required |
| ------- | -------------------------------------------------------------------- | -------- |
| Section | the component's root: its top hairline is the raster line            | yes      |
| Inner   | `Inner`: the content's column                                        | yes      |
| Head    | `Head`: the title and the lead                                       | yes      |
| Title   | `Title` (text)                                                       | yes      |
| Lead    | `Lead`: a slot, the section's text (paragraphs), beside the title    | yes      |
| Content | `Content`: a slot, the wide blocks, under the head                   | with `Wide` |

## Properties

| Property | Values | Default      | Figma     | Code                              |
| -------- | ------ | ------------ | --------- | --------------------------------- |
| Title    | text   | How it works | `Title`   | `heading` (an attribute)          |
| Lead     | —      | —            | `Lead` (slot) | the children with `slot="lead"` (a named slot) |
| Content  | —      | —            | `Content` (slot) | the other children (the default slot) |
| Wide     | on, off | off         | `Wide` (boolean: shows `Content`) | none: shown when it has children |
| Viewport | Desktop, Tablet, Mobile | Desktop | `Viewport` (variant) | none: the CSS (Tablet from 768px, Desktop from 1024px) |
| Statement | on, off | off | `Statement` (variant: True, False) | `statement` (a boolean attribute) |

## States

None. On scroll (code, with anime.js: decided at the design gate, 2026-11-08): when its title is a quarter of the way up the viewport (the title's top past 75% of the viewport's height, from the top; the designer, 2026-11-09: as soon as the section entered, the title came in too early, still under the fold), its title is split into characters (anime.js `splitText`) that rise into place from below their line one after another, over `duration/slow`; then its content fades in over `duration/base`. A statement has no title to split: its text fades in over `duration/slow`, at the same point (its top a quarter of the way up). Nothing moves when the person asks for reduced motion. (The rise and the order are the agent's proposal, to confirm when it runs in Storybook: Figma cannot show it.)

## Layout

- Section: above the hero, which stays behind the page: the sections pass over it as the page scrolls (layer 1; the hero 0, the fencer 2). A slide (the designer, 2026-11-09): as tall as its content (a statement: at least the screen's height, code: `100svh`; Figma: the frame's screen, see Deviations); it sticks when its top reaches the screen's top, or, taller than the screen, when its end reaches the screen's bottom, its content scrolling with the page until then; the next section slides over it (the same layer, later on top), and the footer over the last. Vertical, fills the page's width, hug height above its minimum; padding `space/24` top and bottom, `space/16` left and right; its top border a hairline; centres its inner column.
- Narrow (Figma: the `Mobile` variant; code: under 768px, the tablet-portrait breakpoint): padding `space/6` left and right (approved 2026-11-09).
- Inner: vertical, fills the section up to `size/column`; gap `space/12` between the head and the content.
- Head (Desktop, from 1024px): horizontal, fills the column; gap `space/32`; aligned at the top. `Title` in a fixed column of 304 (wraps on two lines when long: "One source for every decision"); `Lead` fills the rest (544 at 976), its top padding `space/4`, so its first line sits lower against the title's (the designer in Figma, 2026-11-09; before, `space/2`).
- Head (Tablet, 768px to under 1024px; Mobile): vertical, gap `space/12`: the title, then the lead, both filling the column.
- Lead and Content: vertical, fill the column, gap `space/6` between their children.
- Tablet (Figma: the `Tablet` variant; code: from 768px to under 1024px): the Desktop padding, the head stacked.
- Statement (the designer, 2026-11-09): no title shown; full-screen, its content centred in the screen's height (only the statements: "Maybe only the section with the statement should be fullscreen"); a line may break where the copy says, on Desktop only (Figma: in the desktop frame alone; code: a `<br class="wide">`, hidden under 1024px by the page); the lead alone, its text centred in the column (centred lines), set as a title is (Tokens). The section's padding, raster line and column as the others; `Content` and `Wide` as the others (unused by "The problem").

## Tokens

- Section: fill `surface/page`; top border `line-width/hairline` in `line/raster`.
- Title: `font/family-display`, `font-size/h2`, `font/weight-display`, `text/default`.
- Statement's text: `font/family-display`, `font-size/h2` (`font-size/h3` under 768px: the designer, 2026-11-09, nine lines at 40 on a phone), `font/weight-display`, the font's own line height (as the title), `text/muted` (as the body text: kept at the gate, 2026-11-09), centred.

## Content

The lead: the section's paragraphs before its first wide block (code: `<p slot="lead">`). Text in the content (code: the default slot's paragraphs and lists; Figma: text layers in the slot), the lead's text the same: `font/family`, `font-size/body`, `font/weight-text`, `line-height/body` (140%), `text/muted` (the designer, 2026-11-09; before, `text/default` at the font's own line height). Paragraphs `space/6` apart. Code and output: Command. A process: Diagram. A measure: Chart.

A title of a few plain words ("How it works", "Get started"), in sentence case, no full stop.

## Accessibility

A `section` labelled by its title, an `h2`; a statement has no visible title, the section labelled by its `heading` (`aria-label`), its text a paragraph; the scroll animation never hides content from someone who cannot see it move (it starts visible without script, and is off with `prefers-reduced-motion`).

## Do and do not

- Do not draw other lines inside the section to fake more sections: one raster line per band.

## Used in

`flows.yml`, view `landing`: the problem, one source for every decision, less context, how it works, new project or old one, any agent or model, shown working, enforced or advice, get started.

## Deviations

- The narrow layout starts under 768px, the tablet-portrait breakpoint (the designer at the gate, 2026-11-09; before, Steps stacked under 600px, `size/content-max` ÷ 2), written in the CSS: no token holds a breakpoint, and a media query could not read one. 768px and wider is `Desktop`.
- The title's column, 304, has no token (`design/issues.md`, "Sizes without tokens").
- In Figma, a statement's minimum height is the frame's screen (900 on the desktop frame, 1024 on the tablet's, 844 on the phone's): a device size, no token; and Figma shows the layout, not the sticking, which is the code's (Storybook, Pages/Landing).
